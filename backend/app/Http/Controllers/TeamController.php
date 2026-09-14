<?php

namespace App\Http\Controllers;

use App\Models\Team;
use App\Models\ClubRole;
use App\Models\ClubInvitation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TeamController extends Controller
{
    /**
     * Criar um novo escalão/equipa dentro do clube
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        // 1. Procurar o clube onde o utilizador é dirigente ativo
        $cargo = ClubRole::where('user_id', $user->id)
                         ->where('ativo', true)
                         ->first();

        if (!$cargo) {
            return response()->json(['message' => 'Não tens autorização. Precisas de estar na direção de um clube.'], 403);
        }

        // 2. Validação dos dados enviados pelo React
        $validated = $request->validate([
            'escalao' => 'required|string|in:Sub-15,Sub-16,Sub-17,Sub-18,Sub-19,Sub-20,Sub-21,Sub-22,Sub-23,Senior',
            'genero' => 'required|string|in:Masculino,Feminino',
            'epoca_desportiva' => 'nullable|string|max:10'
        ]);

        // CÁLCULO DINÂMICO E AUTOMÁTICO DA ÉPOCA DESPORTIVA CORRENTE
        if (empty($validated['epoca_desportiva'])) {
            $anoAtual = (int)date('Y');
            $mesAtual = (int)date('n');
            
            // No desporto, a partir de Julho (mês 7) arranca oficialmente a nova época
            if ($mesAtual >= 7) {
                $validated['epoca_desportiva'] = $anoAtual . '/' . ($anoAtual + 1);
            } else {
                $validated['epoca_desportiva'] = ($anoAtual - 1) . '/' . $anoAtual;
            }
        }

        // 3. Lógica inteligente para o nome final (Adiciona M ou F)
        $sufixo = ($validated['genero'] === 'Feminino') ? 'F' : 'M';
        $escalaoFormatado = $validated['escalao'] . ' ' . $sufixo;

        // 4. Bloqueio de Segurança: A equipa já existe neste clube para esta época?
        $equipaJaExiste = Team::where('club_id', $cargo->club_id)
                              ->where('escalao', $escalaoFormatado)
                              ->where('epoca_desportiva', $validated['epoca_desportiva'])
                              ->exists();

        if ($equipaJaExiste) {
            return response()->json([
                'message' => "O escalão de {$escalaoFormatado} já existe no teu clube para a época {$validated['epoca_desportiva']}."
            ], 400);
        }

        try {
            // 5. Criar a Equipa com a nomenclatura unificada e a época correta
            $equipa = Team::create([
                'club_id' => $cargo->club_id,
                'criada_por_id' => $user->id,
                'escalao' => $escalaoFormatado,
                'genero' => $validated['genero'],
                'epoca_desportiva' => $validated['epoca_desportiva'],
                'arquivada' => false
            ]);

            return response()->json([
                'message' => "Escalão {$equipa->escalao} criado com sucesso para a época {$equipa->epoca_desportiva}!",
                'team' => $equipa
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erro interno ao criar a equipa.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Lista todas as equipas ativas do clube ao qual o utilizador pertence
     */
    public function listarEquipasDoMeuClube()
    {
        $user = Auth::user();
        
        $cargo = ClubRole::where('user_id', $user->id)
                         ->where('ativo', true)
                         ->first();
        
        if (!$cargo) {
            return response()->json([], 200);
        }

        $equipas = Team::where('club_id', $cargo->club_id)
                       ->where('arquivada', false)
                       ->orderBy('escalao', 'asc')
                       ->get();

        return response()->json($equipas, 200);
    }

    /**
     * Ver membros de uma equipa específica (Com dupla validação de isolamento)
     */
    public function verMembrosEquipa($id)
    {
        $team = Team::find($id);
        if (!$team) {
            return response()->json(['message' => 'Equipa não encontrada.'], 404);
        }

        // Garante que o utilizador tem um cargo ativo no mesmo clube desta equipa
        $hasAccess = ClubRole::where('user_id', Auth::id())
                             ->where('club_id', $team->club_id)
                             ->where('ativo', true)
                             ->exists();

        // Se não for dirigente/staff do clube, verifica se ele pelo menos está vinculado a ESTA equipa específica
        if (!$hasAccess) {
            $isVindicatedToTeam = \DB::table('team_user_roles')
                ->where('team_id', $id)
                ->where('user_id', Auth::id())
                ->exists();

            if (!$isVindicatedToTeam) {
                return response()->json(['message' => 'Acesso negado a este escalão.'], 403);
            }
        }

        $membros = \DB::table('team_user_roles')
            ->join('users', 'team_user_roles.user_id', '=', 'users.id')
            ->where('team_user_roles.team_id', $id)
            ->select('users.id as user_id', 'users.nome', 'users.apelido', 'team_user_roles.cargo', 'team_user_roles.numero_camisola')
            ->get();

        return response()->json([
            'membros' => $membros,
            'team' => $team
        ], 200);
    }

    /**
     * Listar equipas às quais o utilizador está diretamente associado
     */
    public function minhasEquipasVinculadas()
    {
        $user = Auth::user();

        $equipas = \DB::table('team_user_roles')
            ->join('teams', 'team_user_roles.team_id', '=', 'teams.id')
            ->where('team_user_roles.user_id', $user->id)
            ->select('teams.id', 'teams.escalao', 'teams.genero', 'teams.epoca_desportiva', 'team_user_roles.cargo')
            ->get();

        return response()->json($equipas, 200);
    }

    /**
     * Registar o histórico recente de visitas
     */
    public function registarVisita($id)
    {
        \DB::table('user_team_visits')->updateOrInsert(
            ['user_id' => Auth::id(), 'team_id' => $id],
            ['last_visited_at' => now()]
        );
        return response()->json(['status' => 'success']);
    }

    /**
     * Carregar as equipas visualizadas recentemente
     */
    public function minhasEquipasRecentes()
    {
        $user = Auth::user();
        
        $recentes = \DB::table('user_team_visits')
            ->join('teams', 'user_team_visits.team_id', '=', 'teams.id')
            ->where('user_team_visits.user_id', $user->id)
            ->orderBy('user_team_visits.last_visited_at', 'desc')
            ->limit(5)
            ->select('teams.id', 'teams.escalao', 'teams.genero')
            ->get();

        if ($recentes->isNotEmpty()) {
            return response()->json($recentes, 200);
        }

        if ($user->profissao_base === 'Dirigente') {
            $clube = ClubRole::where('user_id', $user->id)
                             ->where('ativo', true)
                             ->first();

            if ($clube) {
                $equipasClube = \DB::table('teams')
                    ->where('club_id', $clube->club_id)
                    ->limit(5)
                    ->select('id', 'escalao', 'genero')
                    ->get();
                    
                return response()->json($equipasClube, 200);
            }
        } 
        
        $equipasVinculadas = \DB::table('team_user_roles')
            ->join('teams', 'team_user_roles.team_id', '=', 'teams.id')
            ->where('team_user_roles.user_id', $user->id)
            ->limit(5)
            ->select('teams.id', 'teams.escalao', 'teams.genero')
            ->get();

        return response()->json($equipasVinculadas, 200);
    }

    /**
     * 👥 MOTOR INTERATIVO DE MEMBROS (100% BLINDADO E SEGURO)
     */

    public function editarMembroEquipa(Request $request, $id, $userId)
    {
        $team = Team::find($id);
        if (!$team) {
            return response()->json(['message' => 'Equipa não encontrada.'], 404);
        }

        $isDirigenteDoClube = ClubRole::where('user_id', Auth::id())
                                      ->where('club_id', $team->club_id)
                                      ->where('ativo', true)
                                      ->exists();

        if (!$isDirigenteDoClube) {
            return response()->json(['message' => 'Acesso Negado: Não és dirigente deste clube.'], 403);
        }

        $validated = $request->validate([
            'cargo' => 'required|string|in:Jogador,Treinador,Treinador_Adjunto,Departamento_Medico,Nutricionista,Staff_Equipa',
            'numero_camisola' => 'nullable|integer|min:1|max:99'
        ]);

        // 💡 BARREIRA DE GÉNERO NA EDIÇÃO
        if ($validated['cargo'] === 'Jogador') {
            $userAlvo = User::findOrFail($userId);
            if ($userAlvo->genero !== $team->genero) {
                return response()->json([
                    'message' => "Bloqueio de Inscrição: Este escalão é de género {$team->genero} e o perfil do atleta está registado como {$userAlvo->genero}."
                ], 400);
            }
        } else {
            $validated['numero_camisola'] = null;
        }

        \DB::table('team_user_roles')
            ->where('team_id', $id)
            ->where('user_id', $userId)
            ->update([
                'cargo' => $validated['cargo'],
                'numero_camisola' => $validated['numero_camisola'],
                'updated_at' => now()
            ]);

        return response()->json(['message' => 'Membro updated com sucesso!'], 200);
    }

    public function removerMembroEquipa($id, $userId)
    {
        $team = Team::find($id);
        if (!$team) {
            return response()->json(['message' => 'Equipa não encontrada.'], 404);
        }

        $isDirigenteDoClube = ClubRole::where('user_id', Auth::id())
                                      ->where('club_id', $team->club_id)
                                      ->where('ativo', true)
                                      ->exists();

        if (!$isDirigenteDoClube) {
            return response()->json(['message' => 'Acesso Negado.'], 403);
        }

        \DB::table('team_user_roles')->where('team_id', $id)->where('user_id', $userId)->delete();

        ClubInvitation::where('equipa_id', $id)
                      ->where('user_convidado_id', $userId)
                      ->delete();

        return response()->json(['message' => 'Membro removido e histórico de convites limpo!'], 200);
    }

    public function listarTeamConvitesPendentes($id)
    {
        $team = Team::find($id);
        if (!$team) {
            return response()->json(['message' => 'Equipa não encontrada.'], 404);
        }

        $isDirigenteDoClube = ClubRole::where('user_id', Auth::id())
                                      ->where('club_id', $team->club_id)
                                      ->where('ativo', true)
                                      ->exists();

        if (!$isDirigenteDoClube) {
            return response()->json(['message' => 'Acesso negado: Não és dirigente deste clube.'], 403);
        }

        $convites = ClubInvitation::with('convidado:id,nome,apelido,email')
                                    ->where('equipa_id', $id) 
                                    ->where('resposta_equipa', 'Pendente')
                                    ->get();

        return response()->json($convites, 200);
    }

    public function cancelarTeamConvite($id, $inviteId)
    {
        $team = Team::find($id);
        if (!$team) {
            return response()->json(['message' => 'Equipa não encontrada.'], 404);
        }

        $isDirigenteDoClube = ClubRole::where('user_id', Auth::id())
                                      ->where('club_id', $team->club_id)
                                      ->where('ativo', true)
                                      ->exists();

        if (!$isDirigenteDoClube) {
            return response()->json(['message' => 'Acesso negado: Não és dirigente deste clube.'], 403);
        }

        $convite = ClubInvitation::where('equipa_id', $id)
                                  ->where('id', $inviteId)
                                  ->where('resposta_equipa', 'Pendente')
                                  ->first();

        if (!$convite) {
            return response()->json(['message' => 'Convite do escalão não encontrado.'], 404);
        }

        $convite->delete();

        return response()->json(['message' => 'Convite de equipa cancelado com sucesso.'], 200);
    }
}