<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Event;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class EventController extends Controller
{
    /**
     * Lista os eventos de uma determinada semana para o escalão ativo,
     * incluindo o estado de presença/justificação do utilizador logado,
     * as SUAS PERMISSÕES e a LISTA NEGRA de IDs lesionados.
     */
    public function getWeeklyCalendar(Request $request)
    {
        $request->validate([
            'team_id' => 'required|exists:teams,id',
            'week_offset' => 'nullable|integer'
        ]);

        $teamId = $request->input('team_id');
        $offset = (int) $request->input('week_offset', 0); 
        $userId = Auth::id();

        // =========================================================
        // 🕵️ DETETOR DE CARGO E PERMISSÕES
        // =========================================================
        $team = DB::table('teams')
            ->join('clubs', 'teams.club_id', '=', 'clubs.id')
            ->where('teams.id', $teamId)
            ->select('teams.*', 'clubs.nome as clube_nome')
            ->first();
        
        $teamRole = DB::table('team_user_roles')
            ->where('team_id', $teamId)
            ->where('user_id', $userId)
            ->first();

        $clubRole = null;
        if (!$teamRole && $team) {
            $clubRole = DB::table('club_roles')
                ->where('club_id', $team->club_id)
                ->where('user_id', $userId)
                ->where('ativo', true)
                ->first();
        }

        $cargoNome = 'Sem_Acesso';
        $podeEditar = false;     
        $podeResponder = false;  

        if ($teamRole) {
            $cargoNome = $teamRole->cargo;
            if (in_array($teamRole->cargo, ['Treinador', 'Treinador_Adjunto'])) {
                $podeEditar = true; 
            } else {
                $podeResponder = true; 
            }
        } elseif ($clubRole) {
            $cargoNome = $clubRole->cargo; 
        }

        // =========================================================
        // 📅 PESQUISA DE DATAS E EVENTOS
        // =========================================================
        $startOfWeek = Carbon::now()->startOfWeek()->addWeeks($offset)->toDateTimeString();
        $endOfWeek = Carbon::now()->endOfWeek()->addWeeks($offset)->toDateTimeString();

        $eventos = Event::where('team_id', $teamId)
            ->whereBetween('data_inicio', [$startOfWeek, $endOfWeek])
            ->orderBy('data_inicio', 'asc')
            ->get();

        $calendarioFormatado = $eventos->map(function ($evento) use ($userId) {
            $presenca = DB::table('attendance')
                ->where('event_id', $evento->id)
                ->where('user_id', $userId)
                ->first();

            $justificacao = null;
            if ($presenca) {
                $justificacao = DB::table('absence_justifications')
                    ->where('attendance_id', $presenca->id)
                    ->first();
            }

            return [
                'id' => $evento->id,
                'titulo' => $evento->titulo,
                'descricao' => $evento->descricao,
                'tipo' => $evento->tipo,
                'tipo_jogo' => $evento->tipo_jogo,
                'data_inicio' => $evento->data_inicio,
                'data_fim' => $evento->data_fim,
                'localizacao' => $evento->localizacao,
                'foco_tecnico' => $evento->foco_tecnico,
                'terminado' => (bool) $evento->terminado, 
                'reacao_jogador' => [
                    'tem_registo' => $presenca ? true : false,
                    'estado_presenca' => $presenca ? $presenca->estado : 'Pendente',
                    'minutos_atraso' => $presenca ? $presenca->minutos_atraso : 0,
                    'justificacao' => $justificacao ? [
                        'motivo' => $justificacao->motivo,
                        'estado_aprovacao' => $justificacao->estado_aprovacao,
                        'comentario_staff' => $justificacao->comentario_staff
                    ] : null
                ]
            ];
        });

        // LISTA NEGRA CLÍNICA: Procurar IDs de quem está na enfermaria neste preciso momento
        $idsLesionados = DB::table('medical_records')
            ->whereIn('estado_prontidao', ['Indisponivel', 'Limitado', 'Inapto'])
            ->whereNull('deleted_at')
            ->pluck('user_id')
            ->toArray();

        return response()->json([
            'semana_inicio' => Carbon::parse($startOfWeek)->format('Y-m-d'),
            'semana_fim' => Carbon::parse($endOfWeek)->format('Y-m-d'),
            'offset_atual' => $offset,
            'permissoes' => [
                'cargo_detetado' => $cargoNome,
                'pode_editar' => $podeEditar,
                'pode_responder' => $podeResponder
            ],
            'team' => [
                'id' => $team->id,
                'escalao' => $team->escalao,
                'clube_nome' => $team->clube_nome
            ],
            'eventos' => $calendarioFormatado,
            'ids_lesionados' => $idsLesionados
        ], 200);
    }

    /**
     * Ação do Jogador: Confirmar Presença
     */
    public function confirmarPresenca($eventId)
    {
        $evento = Event::findOrFail($eventId);

        DB::table('attendance')->updateOrInsert(
            ['event_id' => $evento->id, 'user_id' => Auth::id()],
            [
                'estado' => 'Presente',
                'minutos_atraso' => 0,
                'validado_por_staff' => false,
                'registado_em' => now()
            ]
        );

        return response()->json(['message' => 'Presença confirmada no balneário com sucesso!'], 200);
    }

    /**
     * Ação do Jogador: Recusar Compromisso
     */
    public function recusarComJustificacao(Request $request, $eventId)
    {
        $request->validate([
            'motivo' => 'required|string|max:1000',
            'anexo_url' => 'nullable|string|max:255'
        ]);

        $evento = Event::findOrFail($eventId);

        try {
            DB::transaction(function () use ($evento, $request) {
                DB::table('attendance')->updateOrInsert(
                    ['event_id' => $evento->id, 'user_id' => Auth::id()],
                    [
                        'estado' => 'Justificado',
                        'minutos_atraso' => 0,
                        'validado_por_staff' => false,
                        'registado_em' => now()
                    ]
                );

                $attendance = DB::table('attendance')
                    ->where('event_id', $evento->id)
                    ->where('user_id', Auth::id())
                    ->first();

                DB::table('absence_justifications')->updateOrInsert(
                    ['attendance_id' => $attendance->id],
                    [
                        'motivo' => $request->motivo,
                        'anexo_url' => $request->anexo_url ?? null,
                        'estado_aprovacao' => 'Pendente', 
                        'comentario_staff' => null,
                        'submetido_em' => now()
                    ]
                );
        });

            return response()->json(['message' => 'Pedido de ausência submetido para validação da equipa técnica.'], 200);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Erro ao processar a tua justificação.'], 500);
        }
    }

    /**
     * Ação do Treinador: Criar Novo Evento e Gerar Convocatória Inicial
     */
    public function store(Request $request, $id)
    {
        $isMister = DB::table('team_user_roles')
            ->where('team_id', $id)
            ->where('user_id', Auth::id())
            ->whereIn('cargo', ['Treinador', 'Treinador_Adjunto'])
            ->exists();

        if (!$isMister) {
            return response()->json(['message' => 'Acesso negado. Apenas a equipa técnica pode agendar eventos.'], 403);
        }

        $validated = $request->validate([
            'titulo' => 'required|string|max:100',
            'descricao' => 'nullable|string',
            'tipo' => 'required|string|in:Treino,Jogo,Estagio,Reuniao',
            'tipo_jogo' => 'required|string|in:Nao_Aplicavel,Oficial,Amigavel',
            'data_inicio' => 'required|date',
            'data_fim' => 'required|date|after:data_inicio',
            'localizacao' => 'nullable|string|max:255',
            'foco_tecnico' => 'nullable|string|max:100',
            'convocados' => 'required|array', 
            'convocados.*' => 'integer|exists:users,id' 
        ]);

        if ($validated['tipo'] === 'Jogo' && count($validated['convocados']) < 8) {
            return response()->json(['message' => 'Um Jogo requer a convocação de pelo menos 8 jogadores.'], 422);
        }

        $dataInicio = Carbon::parse($validated['data_inicio'])->toDateTimeString();
        
        // MOTOR CLÍNICO: Segunda linha de defesa no Backend contra frunces de rede
        $atletasBloqueados = $this->verificarAtletasLesionados($validated['convocados'], $dataInicio);
        
        if (!empty($atletasBloqueados)) {
            return response()->json([
                'message' => 'O Departamento Médico barrou a convocatória.',
                'error' => 'Os seguintes atletas estão indisponíveis na enfermaria: ' . implode(', ', $atletasBloqueados)
            ], 422);
        }

        try {
            DB::transaction(function () use ($id, $validated, $dataInicio) {
                $evento = Event::create([
                    'team_id' => $id,
                    'titulo' => $validated['titulo'],
                    'descricao' => $validated['descricao'],
                    'tipo' => $validated['tipo'],
                    'tipo_jogo' => $validated['tipo'] === 'Jogo' ? $validated['tipo_jogo'] : 'Nao_Aplicavel',
                    'data_inicio' => $dataInicio,
                    'data_fim' => Carbon::parse($validated['data_fim'])->toDateTimeString(),
                    'localizacao' => $validated['localizacao'],
                    'foco_tecnico' => $validated['foco_tecnico'],
                    'terminado' => false
                ]);

                $registosAssiduidade = [];
                $agora = now();

                foreach ($validated['convocados'] as $jogadorId) {
                    $registosAssiduidade[] = [
                        'event_id' => $evento->id,
                        'user_id' => $jogadorId,
                        'estado' => 'Pendente', 
                        'minutos_atraso' => 0,
                        'validado_por_staff' => false,
                        'registado_em' => $agora,
                        'created_at' => $agora,
                        'updated_at' => $agora
                    ];
                }

                DB::table('attendance')->insert($registosAssiduidade);
        });

            return response()->json(['message' => 'Evento e convocatória agendados com sucesso!'], 201);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erro interno ao gravar o evento na base de dados.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Ação do Treinador: Ver Detalhes e Folha de Presenças do Evento
     */
    public function getEventoDetalhes($eventId)
    {
        $evento = Event::findOrFail($eventId);

        $presencas = DB::table('attendance')
            ->join('users', 'attendance.user_id', '=', 'users.id')
            ->where('attendance.event_id', $eventId)
            ->select('users.id', 'users.nome', 'users.apelido', 'attendance.estado', 'attendance.minutos_atraso')
            ->get();

        $folha = [
            'pendentes' => $presencas->where('estado', 'Pendente')->values(),
            'confirmados' => $presencas->where('estado', 'Presente')->values(),
            'ausentes' => $presencas->whereIn('estado', ['Ausente', 'Justificado', 'Atrasado'])->values(),
        ];

        return response()->json([
            'evento' => $evento,
            'folha_presencas' => $folha,
            'total_convocados' => $presencas->count()
        ], 200);
    }

    /**
     * Ação do Treinador: Editar Evento e Convocatória
     */
    public function update(Request $request, $eventId)
    {
        $evento = Event::findOrFail($eventId);

        if ($evento->terminado) {
            return response()->json(['message' => 'Não podes editar um evento que já terminou.'], 403);
        }

        $validated = $request->validate([
            'titulo' => 'required|string|max:100',
            'descricao' => 'nullable|string',
            'tipo' => 'required|string|in:Treino,Jogo,Estagio,Reuniao',
            'tipo_jogo' => 'required|string|in:Nao_Aplicavel,Oficial,Amigavel',
            'data_inicio' => 'required|date',
            'data_fim' => 'required|date|after:data_inicio',
            'localizacao' => 'nullable|string|max:255',
            'foco_tecnico' => 'nullable|string|max:100',
            'convocados' => 'required|array',
            'convocados.*' => 'integer|exists:users,id'
        ]);

        if ($validated['tipo'] === 'Jogo' && count($validated['convocados']) < 8) {
            return response()->json(['message' => 'Um Jogo requer a convocação de pelo menos 8 jogadores.'], 422);
        }

        $dataInicio = Carbon::parse($validated['data_inicio'])->toDateTimeString();
        $atletasBloqueados = $this->verificarAtletasLesionados($validated['convocados'], $dataInicio);
        
        if (!empty($atletasBloqueados)) {
            return response()->json([
                'message' => 'Impossível atualizar convocatória.',
                'error' => 'Existem atletas no boletim clínico sem alta para esta data: ' . implode(', ', $atletasBloqueados)
            ], 422);
        }

        try {
            DB::transaction(function () use ($evento, $validated, $dataInicio) {
                $evento->update([
                    'titulo' => $validated['titulo'],
                    'descricao' => $validated['descricao'],
                    'tipo' => $validated['tipo'],
                    'tipo_jogo' => $validated['tipo'] === 'Jogo' ? $validated['tipo_jogo'] : 'Nao_Aplicavel',
                    'data_inicio' => $dataInicio,
                    'data_fim' => Carbon::parse($validated['data_fim'])->toDateTimeString(),
                    'localizacao' => $validated['localizacao'],
                    'foco_tecnico' => $validated['foco_tecnico']
                ]);

                $convocadosAtuais = DB::table('attendance')->where('event_id', $evento->id)->pluck('user_id')->toArray();
                $novosConvocados = $validated['convocados'];

                $remover = array_diff($convocadosAtuais, $novosConvocados);
                if (!empty($remover)) {
                    DB::table('attendance')->where('event_id', $evento->id)->whereIn('user_id', $remover)->delete();
                }

                $adicionar = array_diff($novosConvocados, $convocadosAtuais);
                if (!empty($adicionar)) {
                    $registosNovos = [];
                    $agora = now();
                    foreach ($adicionar as $jogadorId) {
                        $registosNovos[] = [
                            'event_id' => $evento->id,
                            'user_id' => $jogadorId,
                            'estado' => 'Pendente',
                            'registado_em' => $agora,
                            'created_at' => $agora,
                            'updated_at' => $agora
                        ];
                    }
                    DB::table('attendance')->insert($registosNovos);
                }
        });

            return response()->json(['message' => 'Evento e convocatória atualizados com sucesso!'], 200);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Erro interno ao atualizar o evento.'], 500);
        }
    }

    /**
     * Ação do Treinador: Finalizar Evento e Validar Presenças Finais
     */
    public function finalizarEvento(Request $request, $id)
    {
        $evento = Event::findOrFail($id);

        try {
            DB::transaction(function () use ($request, $evento) {
                $evento->update(['terminado' => true]);

                if ($request->has('presencas_finais')) {
                    foreach ($request->input('presencas_finais') as $jogadorPresenca) {
                        $estadoFinal = $jogadorPresenca['estado'];
                        if ($estadoFinal === 'Pendente') {
                            $estadoFinal = 'Ausente';
                        }

                        DB::table('attendance')
                            ->where('event_id', $evento->id)
                            ->where('user_id', $jogadorPresenca['id'])
                            ->update([
                                'estado' => $estadoFinal,
                                'validado_por_staff' => true, 
                                'updated_at' => now()
                            ]);
                    }
                }
            });

            return response()->json(['message' => 'Evento finalizado e presenças atualizadas com sucesso!'], 200);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erro ao finalizar o evento.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * NOVO MÉTODO OPERACIONAL: Apagar Evento por Completo
     * Remove o evento e limpa em cascata a tabela de assiduidade (attendance)
     */
    public function destroy($eventId)
    {
        $evento = Event::findOrFail($eventId);

        // 🛡️ Segurança básica: se o evento já foi finalizado/trancado, o Mister não deve poder apagar sem reabrir
        if ($evento->terminado) {
            return response()->json(['message' => 'Não podes eliminar um compromisso oficial que já foi finalizado e trancado.'], 403);
        }

        try {
            DB::transaction(function () use ($evento) {
                // 1. Limpar primeiro as folhas de presença dos convocados deste evento
                DB::table('attendance')->where('event_id', $evento->id)->delete();
                
                // 2. Apagar o evento principal do calendário
                $evento->delete();
            });

            return response()->json(['message' => 'Compromisso removido do cronograma semanal com sucesso.'], 200);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erro interno ao tentar eliminar o evento.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Auxiliar Clínico: Valida se algum atleta convocado está no estaleiro na data indicada
     */
    private function verificarAtletasLesionados(array $convocadosIds, $dataEvento)
    {
        $dataLimite = Carbon::parse($dataEvento)->toDateString();

        return DB::table('medical_records')
            ->join('users', 'medical_records.user_id', '=', 'users.id')
            ->whereIn('medical_records.user_id', $convocadosIds)
            ->whereDate('medical_records.data_inicio', '<=', $dataLimite) 
            ->whereIn('medical_records.estado_prontidao', ['Indisponivel', 'Limitado', 'Inapto']) 
            ->whereNull('medical_records.deleted_at') 
            ->select(DB::raw("CONCAT(users.nome, ' ', users.apelido) as nome_completo"))
            ->pluck('nome_completo')
            ->toArray();
    }
}