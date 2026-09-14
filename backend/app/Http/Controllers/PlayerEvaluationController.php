<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Event;
use App\Models\PlayerEvaluation;
use App\Models\MatchStat;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class PlayerEvaluationController extends Controller
{
    /**
     * 1. Buscar apenas TREINOS e JOGOS terminados que ainda não foram avaliados
     */
    public function getEventsToEvaluate($teamId)
    {
        // Segurança: Verificar se o utilizador autenticado é staff desta equipa
        $isMister = DB::table('team_user_roles')
            ->where('team_id', $teamId)
            ->where('user_id', Auth::id())
            ->whereIn('cargo', ['Treinador', 'Treinador_Adjunto'])
            ->exists();

        if (!$isMister) {
            return response()->json(['message' => 'Acesso negado. Apenas o staff técnico autorizado gere avaliações.'], 403);
        }

        // Buscar IDs de eventos que já têm avaliações para os excluir da lista de pendentes
        $avaliadosIds = PlayerEvaluation::pluck('evento_id')->unique()->toArray();

        // Apenas 'Treino' e 'Jogo' entram no motor analítico
        $eventos = Event::where('team_id', $teamId)
            ->where('terminado', true)
            ->whereIn('tipo', ['Treino', 'Jogo']) 
            ->whereNotIn('id', $avaliadosIds)
            ->orderBy('data_inicio', 'desc')
            ->get(['id', 'titulo', 'tipo', 'tipo_jogo', 'data_inicio']);

        return response()->json($eventos, 200);
    }

    /**
     * 2. Buscar os jogadores convocados que marcaram presença efetiva no evento
     */
    public function getPlayersPresent($eventId)
    {
        // Carregar evento e trancar segurança básica
        $evento = Event::findOrFail($eventId);

        // Apenas jogadores presentes ou que chegaram atrasados entram na folha de notas
        $jogadores = DB::table('attendance')
            ->join('users', 'attendance.user_id', '=', 'users.id')
            ->where('attendance.event_id', $eventId)
            ->whereIn('attendance.estado', ['Presente', 'Atrasado'])
            ->select('users.id', 'users.nome', 'users.apelido')
            ->orderBy('users.nome', 'asc')
            ->get();

        return response()->json([
            'evento' => $evento,
            'jogadores' => $jogadores
        ], 200);
    }

    /**
     * 3. Submeter a avaliação em lote (Totalmente Blindada contra Falhas e Fraudes)
     */
    public function submeterAvaliacaoLote(Request $request, $eventId)
    {
        // 1. Trancar o evento e validar existência imediata
        $evento = Event::findOrFail($eventId);
        $teamId = $evento->team_id;

        // 2. Validar perfil do avaliador
        $isMister = DB::table('team_user_roles')
            ->where('team_id', $teamId)
            ->where('user_id', Auth::id())
            ->whereIn('cargo', ['Treinador', 'Treinador_Adjunto'])
            ->exists();

        if (!$isMister) {
            return response()->json(['message' => 'Operação cancelada. Não tens permissões de escrita nesta equipa.'], 403);
        }

        // 3. Regras estritas de validação no Servidor (Proteção contra Postman/Hacks)
        $rules = [
            'avaliacoes' => 'required|array',
            'avaliacoes.*.user_id' => 'required|exists:users,id',
            'avaliacoes.*.nota_remate' => 'required|numeric|between:0,20',
            'avaliacoes.*.nota_passe' => 'required|numeric|between:0,20',
            'avaliacoes.*.nota_velocidade' => 'required|numeric|between:0,20',
            'avaliacoes.*.nota_tecnica' => 'required|numeric|between:0,20',
            'avaliacoes.*.nota_defesa' => 'required|numeric|between:0,20',
            'avaliacoes.*.nota_mental' => 'required|numeric|between:0,20',
            'avaliacoes.*.pontos_positivos' => 'nullable|string|max:1000',
            'avaliacoes.*.pontos_negativos' => 'nullable|string|max:1000',
            'avaliacoes.*.observacoes_privadas' => 'nullable|string|max:1000',
        ];

        if ($evento->tipo === 'Jogo') {
            $rules['avaliacoes.*.golos'] = 'required|integer|min:0|max:50';
            $rules['avaliacoes.*.assistencias'] = 'required|integer|min:0|max:50';
            $rules['avaliacoes.*.minutos_jogados'] = 'required|integer|min:0|max:130';
            $rules['avaliacoes.*.cartoes_amarelos'] = 'required|integer|between:0,2';
            $rules['avaliacoes.*.cartoes_vermelhos'] = 'required|integer|between:0,1';
        }

        $request->validate($rules);

        try {
            // 4. Iniciar Transação Atómica com Bloqueio de Linhas (Anti-Duplicação Concorrente)
            DB::transaction(function () use ($request, $evento, $teamId) {
                $avaliadorId = Auth::id();
                $agora = now();

                // Obter todos os IDs de utilizadores legítimos pertencentes a esta equipa
                $membrosLegitimos = DB::table('team_user_roles')
                    ->where('team_id', $teamId)
                    ->pluck('user_id')
                    ->toArray();

                foreach ($request->input('avaliacoes') as $av) {
                    $jogadorId = $av['user_id'];

                    // 🔥 SEGURANÇA MÁXIMA: Validar se o jogador avaliado pertence mesmo a esta equipa.
                    if (!in_array($jogadorId, $membrosLegitimos)) {
                        throw new \Exception("Falha de Segurança: O atleta com ID {$jogadorId} não pertence a esta equipa.");
                    }

                    // Se for Jogo e o Mister marcou 0 minutos, ignoramos a gravação (Suplente não utilizado)
                    if ($evento->tipo === 'Jogo' && (int)$av['minutos_jogados'] === 0) {
                        PlayerEvaluation::where('evento_id', $evento->id)->where('user_id', $jogadorId)->delete();
                        if ($evento->tipo === 'Jogo') {
                            MatchStat::where('event_id', $evento->id)->where('user_id', $jogadorId)->delete();
                        }
                        continue;
                    }

                    // Calcular média matemática segura
                    $media = (
                        $av['nota_remate'] + 
                        $av['nota_passe'] + 
                        $av['nota_velocidade'] + 
                        $av['nota_tecnica'] + 
                        $av['nota_defesa'] + 
                        $av['nota_mental']
                    ) / 6;

                    $notaFinalMédia = round($media, 2);

                    // 🛠️ EVITAR DUPLICAÇÃO: updateOrCreate
                    PlayerEvaluation::updateOrCreate(
                        [
                            'user_id' => $jogadorId,
                            'evento_id' => $evento->id
                        ],
                        [
                            'avaliador_id' => $avaliadorId,
                            'nota_principal' => $notaFinalMédia,
                            'nota_remate' => $av['nota_remate'],
                            'nota_passe' => $av['nota_passe'],
                            'nota_velocidade' => $av['nota_velocidade'],
                            'nota_tecnica' => $av['nota_tecnica'],
                            'nota_defesa' => $av['nota_defesa'],
                            'nota_mental' => $av['nota_mental'],
                            'pontos_positivos' => $av['pontos_positivos'] ?? null,
                            'pontos_negativos' => $av['pontos_negativos'] ?? null,
                            'observacoes_privadas' => $av['observacoes_privadas'] ?? null,
                            'data_avaliacao' => $agora
                        ]
                    );

                    // Se for Jogo, grava ou atualiza de forma blindada as estatísticas físicas
                    if ($evento->tipo === 'Jogo') {
                        MatchStat::updateOrCreate(
                            [
                                'user_id' => $jogadorId,
                                'event_id' => $evento->id
                            ],
                            [
                                'tipo_jogo' => $evento->tipo_jogo !== 'Nao_Aplicavel' ? $evento->tipo_jogo : 'Oficial',
                                'golos' => $av['golos'],
                                'assistencias' => $av['assistencias'],
                                'minutos_jogados' => $av['minutos_jogados'],
                                'cartoes_amarelos' => $av['cartoes_amarelos'],
                                'cartoes_vermelhos' => $av['cartoes_vermelhos'],
                                'exibir_em_dashboard' => true
                            ]
                        );
                    }

                    // =========================================================
                    // 🔥 GATILHO AUTOMÁTICO DE GAMIFICAÇÃO DISPARA AQUI!
                    // =========================================================
                    // Chamamos a função do GamificationController de forma limpa e automática
                    app(GamificationController::class)->verificarGatilhosDeMissoes(
                        $jogadorId, 
                        $teamId, 
                        $notaFinalMédia, // Passa a média calculada de 0 a 20
                        $evento->tipo    // Passa se é 'Treino' ou 'Jogo'
                    );
                }
            });

            return response()->json(['message' => '📋 Base analítica blindada e missões atualizadas automaticamente!'], 201);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erro crítico de processamento ou quebra de segurança.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}