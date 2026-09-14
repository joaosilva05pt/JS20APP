<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\TacticalPlay;
use App\Models\TacticalFrame;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class PranchetaTaticaController extends Controller
{
    /**
     * Listar Jogadas Autorizadas para a Equipa
     */
    public function index($teamId)
    {
        $userId = Auth::id();

        // Detetar cargo para aplicar regras de visualização
        $userRole = DB::table('team_user_roles')
            ->where('team_id', $teamId)
            ->where('user_id', $userId)
            ->first();

        // Se for Direção Global do Clube (Presidente, Diretor), damos permissões de Treinador
        $isDirecaoGlobal = DB::table('club_roles')
            ->where('user_id', $userId)
            ->where('ativo', true)
            ->exists();

        $isStaff = $isDirecaoGlobal || ($userRole && in_array($userRole->cargo, ['Treinador', 'Treinador_Adjunto']));

        $query = TacticalPlay::with(['criador:id,nome,apelido'])
            ->where('team_id', $teamId);

        if (!$isStaff) {
            // Regra Tática para Jogador: Vê as "Publicadas" por todos E as suas próprias "Sugestões"
            $query->where(function($q) use ($userId) {
                $q->where('estado', 'Publicada')
                  ->orWhere(function($sub) use ($userId) {
                      $sub->where('estado', 'Sugestao')
                          ->where('criador_id', $userId);
                  });
            });
        } else {
            // Regra para Staff: Vê Tudo (Publicadas, Rascunhos e Sugestões de todos os atletas para aprovação)
            $query->whereIn('estado', ['Publicada', 'Rascunho', 'Sugestao']);
        }

        $jogadas = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'is_staff' => $isStaff,
            'jogadas' => $jogadas
        ], 200);
    }

    /**
     * Carregar os Detalhes e Todos os Frames de uma Jogada Específica
     */
    public function show($teamId, $playId)
    {
        $jogada = TacticalPlay::with('frames')
            ->where('team_id', $teamId)
            ->where('id', $playId)
            ->first();

        if (!$jogada) {
            return response()->json(['message' => 'Jogada não encontrada no arquivo.'], 404);
        }

        return response()->json($jogada, 200);
    }

    /**
     * Salvar / Criar ou Atualizar uma Jogada Completa
     */
    public function store(Request $request, $teamId)
    {
        $request->validate([
            'id' => 'nullable|integer', // 🔥 Detetar se veio de uma tática existente
            'titulo' => 'required|string|max:100',
            'categoria' => 'required|string|max:30',
            'estado' => 'required|string|max:30',
            'frames' => 'required|array', 
        ]);

        $userId = Auth::id();

        // Forçar estado "Sugestao" se for um jogador a criar
        $userRole = DB::table('team_user_roles')
            ->where('team_id', $teamId)
            ->where('user_id', $userId)
            ->first();

        $isStaff = $userRole && in_array($userRole->cargo, ['Treinador', 'Treinador_Adjunto']);
        $estadoFinal = $isStaff ? $request->estado : 'Sugestao';

        DB::beginTransaction();
        try {
            // 1. Criar Nova ou Atualizar Existente com base no ID recebido
            $play = TacticalPlay::updateOrCreate(
                [
                    'id' => $request->id,
                    'team_id' => $teamId
                ],
                [
                    'criador_id' => $userId, // Atualiza ou mantém quem gravou por último
                    'titulo' => $request->titulo,
                    'descricao' => $request->descricao,
                    'categoria' => $request->categoria,
                    'estado' => $estadoFinal
                ]
            );

            // 2. Se for uma ATUALIZAÇÃO, limpamos a matriz de pinos antiga para não duplicar coordenadas
            if ($request->id) {
                DB::table('tactical_frames')->where('play_id', $play->id)->delete();
            }

            // 3. Gravar a nova sequência de movimentos/frames
            foreach ($request->frames as $frame) {
                foreach ($frame['pinos'] as $pino) {
                    DB::table('tactical_frames')->insert([
                        'play_id' => $play->id,
                        'ordem_frame' => $frame['ordem_frame'],
                        'tipo_pino' => $pino['tipo_pino'],
                        'pino_identificador' => $pino['id_pino'],
                        'label' => $pino['label'] ?? null,
                        'coord_x' => $pino['x'],
                        'coord_y' => $pino['y'],
                        'acao_nota' => $frame['acao_nota'] ?? null,
                        'created_at' => now(),
                        'updated_at' => now()
                    ]);
                }
            }

            DB::commit();
            return response()->json(['message' => 'Estratégia processada com sucesso!', 'play_id' => $play->id], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erro ao processar a gravação tática.', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Eliminar do Dossier Tático com Limpeza em Cascade
     */
    public function destroy($teamId, $playId)
    {
        $userId = Auth::id();

        $userRole = DB::table('team_user_roles')
            ->where('team_id', $teamId)
            ->where('user_id', $userId)
            ->first();

        $isDirecaoGlobal = DB::table('club_roles')
            ->where('user_id', $userId)
            ->where('ativo', true)
            ->exists();

        $isStaff = $isDirecaoGlobal || ($userRole && in_array($userRole->cargo, ['Treinador', 'Treinador_Adjunto']));

        if (!$isStaff) {
            return response()->json(['message' => 'Acesso negado.'], 403);
        }

        $jogada = TacticalPlay::where('team_id', $teamId)->where('id', $playId)->first();
        
        if ($jogada) {
            // Apagar primeiro os frames dependentes da tabela secundária
            DB::table('tactical_frames')->where('play_id', $playId)->delete();
            
            // Agora sim, removemos a tática em segurança
            $jogada->delete();
            return response()->json(['message' => 'Jogada e movimentos removidos em total segurança.'], 200);
        }

        return response()->json(['message' => 'Erro ao remover. Artigo não encontrado.'], 404);
    }

    /**
     * Aprovar Sugestão de Jogador (Exclusivo da Equipa Técnico/Direção)
     */
    public function aprovarSugestao($teamId, $playId)
    {
        $userId = Auth::id();
        
        $isStaff = DB::table('team_user_roles')
            ->where('team_id', $teamId)
            ->where('user_id', $userId)
            ->whereIn('cargo', ['Treinador', 'Treinador_Adjunto'])
            ->exists() || DB::table('club_roles')->where('user_id', $userId)->where('ativo', true)->exists();

        if (!$isStaff) {
            return response()->json(['message' => 'Apenas o Mister ou a Direção podem validar sistemas táticos.'], 403);
        }

        $jogada = TacticalPlay::where('team_id', $teamId)->where('id', $playId)->first();
        if (!$jogada) {
            return response()->json(['message' => 'Jogada não encontrada.'], 404);
        }

        $jogada->update(['estado' => 'Publicada']);

        return response()->json(['message' => 'Sugestão validada! O quadro tático já está visível para todo o plantel.'], 200);
    }

    
}