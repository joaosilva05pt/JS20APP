<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Event;
use App\Models\PlayerEvaluation;
use App\Models\MatchStat;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class DashboardAnalitycsController extends Controller
{
    public function getDashboardData($teamId)
    {
        $userId = Auth::id();

        // 1. Descobrir o clube do escalão
        $equipa = DB::table('teams')->where('id', $teamId)->first();
        if (!$equipa) {
            return response()->json(['message' => 'Equipa ou Escalão não encontrado.'], 404);
        }
        $clubId = $equipa->club_id;

        // 2. Verificar Corpo Diretivo (club_roles)
        $isDirecaoClub = DB::table('club_roles')
            ->where('club_id', $clubId)
            ->where('user_id', $userId)
            ->where('ativo', true)
            ->whereIn('cargo', ['Presidente', 'Vice-Presidente', 'Diretor Desportivo', 'Tesoureiro', 'Secretário', 'Vogal'])
            ->exists();

        // 3. Verificar cargo na equipa (team_user_roles)
        $userTeamRole = DB::table('team_user_roles')
            ->where('team_id', $teamId)
            ->where('user_id', $userId)
            ->first();

        // 4. Definição do Modo de Visualização
        $modo = 'jogador';
        if ($isDirecaoClub || ($userTeamRole && in_array($userTeamRole->cargo, ['Treinador', 'Treinador_Adjunto']))) {
            $modo = 'direcao';
        } elseif ($userTeamRole && $userTeamRole->cargo === 'Jogador') {
            $modo = 'jogador';
        } else {
            return response()->json(['message' => 'Acesso negado ao arquivo do clube.'], 403);
        }

        // Obter todos os jogadores
        $jogadoresIds = DB::table('team_user_roles')
            ->where('team_id', $teamId)
            ->where('cargo', 'Jogador')
            ->pluck('user_id')
            ->toArray();

        // ====================================================================
        // MODO JOGADOR: HISTÓRICO ATÓMICO CRONOLÓGICO
        // ====================================================================
        if ($modo === 'jogador') {
            $feedbacks = PlayerEvaluation::join('events', 'player_evaluations.evento_id', '=', 'events.id')
                ->where('player_evaluations.user_id', $userId)
                ->select(
                    'events.id as evento_id',
                    'events.titulo',
                    'events.tipo',
                    'events.data_inicio',
                    'player_evaluations.nota_principal',
                    'player_evaluations.nota_passe',
                    'player_evaluations.nota_remate',
                    'player_evaluations.nota_velocidade',
                    'player_evaluations.nota_tecnica',
                    'player_evaluations.nota_defesa',
                    'player_evaluations.nota_mental',
                    'player_evaluations.pontos_positivos',
                    'player_evaluations.pontos_negativos'
                )
                ->orderBy('events.data_inicio', 'asc') // 🔥 Ajustado para 'asc' para o gráfico do jogador evoluir da esquerda para a direita
                ->get()
                ->map(function($f) {
                    $stats = MatchStat::where('event_id', $f->evento_id)->where('user_id', Auth::id())->first();
                    return [
                        'evento_id' => $f->evento_id,
                        'titulo' => $f->titulo,
                        'tipo' => $f->tipo,
                        'data' => $f->data_inicio,
                        'nota_principal' => round($f->nota_principal, 2),
                        'notas' => [
                            'passe' => round($f->nota_passe, 2),
                            'remate' => round($f->nota_remate, 2),
                            'velocidade' => round($f->nota_velocidade, 2),
                            'tecnica' => round($f->nota_tecnica, 2),
                            'defesa' => round($f->nota_defesa, 2),
                            'mental' => round($f->nota_mental, 2),
                        ],
                        'estatisticas' => [
                            'golos' => $stats ? (int)$stats->golos : 0,
                            'assistencias' => $stats ? (int)$stats->assistencias : 0,
                            'minutos' => $stats ? (int)$stats->minutos_jogados : 0,
                        ],
                        'pontos_positivos' => $f->pontos_positivos,
                        'pontos_negativos' => $f->pontos_negativos
                    ];
                });

            return response()->json([
                'modo' => 'jogador',
                'meu_perfil' => [
                    'id' => $userId,
                    'nome_completo' => Auth::user()->nome . ' ' . Auth::user()->apelido,
                    'historico' => $feedbacks
                ]
            ], 200);
        }

        // ====================================================================
        // MODO DIREÇÃO/STAFF: DETALHE CRONOLÓGICO TOTAL
        // ====================================================================
        $sessoesAvaliadas = PlayerEvaluation::join('events', 'player_evaluations.evento_id', '=', 'events.id')
            ->whereIn('player_evaluations.user_id', $jogadoresIds)
            ->select('events.id', 'events.titulo', 'events.tipo', 'events.data_inicio')
            ->distinct()
            ->orderBy('events.data_inicio', 'desc')
            ->get();

        $atletasDados = User::whereIn('id', $jogadoresIds)
            ->select('id', 'nome', 'apelido', 'foto_perfil')
            ->get()
            ->map(function($jogador) {
                $historicoCompleto = PlayerEvaluation::join('events', 'player_evaluations.evento_id', '=', 'events.id')
                    ->where('player_evaluations.user_id', $jogador->id)
                    ->select(
                        'events.id as evento_id',
                        'events.titulo',
                        'events.tipo',
                        'events.data_inicio',
                        'player_evaluations.nota_principal',
                        'player_evaluations.nota_passe',
                        'player_evaluations.nota_remate',
                        'player_evaluations.nota_velocidade',
                        'player_evaluations.nota_tecnica',
                        'player_evaluations.nota_defesa',
                        'player_evaluations.nota_mental'
                    )
                    ->orderBy('events.data_inicio', 'asc') // Ajustado para 'asc' para alinhar a cronologia do ApexCharts
                    ->get()
                    ->map(function($ev) use ($jogador) {
                        $mStats = MatchStat::where('event_id', $ev->evento_id)->where('user_id', $jogador->id)->first();
                        return [
                            'evento_id' => $ev->evento_id,
                            'titulo' => $ev->titulo,
                            'tipo' => $ev->tipo,
                            'data' => $ev->data_inicio,
                            'nota_principal' => round($ev->nota_principal, 2),
                            'passe' => round($ev->nota_passe, 2),
                            'remate' => round($ev->nota_remate, 2),
                            'velocidade' => round($ev->nota_velocidade, 2),
                            'tecnica' => round($ev->nota_tecnica, 2),
                            'defesa' => round($ev->nota_defesa, 2),
                            'mental' => round($ev->nota_mental, 2),
                            'golos' => $mStats ? (int)$mStats->golos : 0,
                            'assistencias' => $mStats ? (int)$mStats->assistencias : 0,
                            'minutos' => $mStats ? (int)$mStats->minutos_jogados : 0,
                            'amarelos' => $mStats ? (int)$mStats->cartoes_amarelos : 0,
                            'vermelhos' => $mStats ? (int)$mStats->cartoes_vermelhos : 0,
                        ];
                    });

                return [
                    'id' => $jogador->id,
                    'nome_completo' => $jogador->nome . ' ' . $jogador->apelido,
                    'foto' => $jogador->foto_perfil,
                    'historico' => $historicoCompleto
                ];
            });

        return response()->json([
            'modo' => 'direcao',
            'sessoes' => $sessoesAvaliadas,
            'jogadores' => $atletasDados
        ], 200);
    }
}