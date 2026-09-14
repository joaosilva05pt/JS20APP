<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ClubInvitation;
use App\Models\ClubRole;
use App\Models\User;
use App\Models\Team;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class InvitationController extends Controller
{
    /**
     * 1. Lista apenas os convites que estão REALMENTE ativos e pendentes para o utilizador
     */
    public function meusConvites()
    {
        $convites = ClubInvitation::with(['club:id,nome', 'remetente:id,nome,apelido', 'team:id,escalao,genero'])
            ->where('user_convidado_id', Auth::id())
            ->where(function($query) {
                // Se for convite de CLUBE, a resposta_clube tem de estar Pendente e não ser Rejeitado/Aceite
                $query->where(function($q) {
                    $q->whereNull('equipa_id')
                      ->where('resposta_clube', 'Pendente');
                })
                // Se for convite de EQUIPA, a resposta_equipa tem de estar Pendente
                ->orWhere(function($q) {
                    $q->whereNotNull('equipa_id')
                      ->where('resposta_equipa', 'Pendente');
                });
            })
            ->get();

        return response()->json($convites, 200);
    }

    /**
     * 2. CONVIDAR PARA ESCALÃO/EQUIPA: Com barreira de género inteligente para Jogadores
     */
    public function enviarConviteEquipa(Request $request)
    {
        $validated = $request->validate([
            'team_id' => 'required|exists:teams,id',
            'email' => 'required|email',
            'cargo' => 'required|string|in:Treinador,Treinador_Adjunto,Departamento_Medico,Nutricionista,Staff_Equipa,Jogador',
            'numero_camisola' => 'nullable|integer|min:1|max:99'
        ]);

        $team = Team::findOrFail($validated['team_id']);

        // Segurança 1: O utilizador logado é um dirigente ATIVO deste clube?
        $isDirigente = ClubRole::where('user_id', Auth::id())
                               ->where('club_id', $team->club_id)
                               ->where('ativo', true)
                               ->exists();

        if (!$isDirigente) {
            return response()->json(['message' => 'Acesso negado. Apenas dirigentes ativos.'], 403);
        }

        // Segurança 2: O convidado existe no sistema?
        $convidado = User::where('email', $validated['email'])->first();
        if (!$convidado) {
            return response()->json(['message' => 'Este e-mail não está associado a nenhuma conta na JS20 App.'], 404);
        }

        // A REGRA DE OURO: BARREIRA ESTRITA DE GÉNERO APENAS PARA JOGADORES
        if ($validated['cargo'] === 'Jogador' && $convidado->genero !== $team->genero) {
            return response()->json([
                'message' => "Operação Recusada: O escalão de destino é do género {$team->genero}, mas o atleta selecionado está registado como género {$convidado->genero}."
            ], 400);
        }

        // --- REGRA DE OURO 1: EXCLUSIVIDADE DE CLUBE ---
        // Verificar se ele já tem um cargo de direção noutro clube
        $jaEmOutroClubeDirecao = ClubRole::where('user_id', $convidado->id)
                                         ->where('ativo', true)
                                         ->where('club_id', '!=', $team->club_id)
                                         ->exists();

        // Verificar se ele já joga/treina noutro clube
        $jaEmOutroClubeEquipa = DB::table('team_user_roles')
            ->join('teams', 'team_user_roles.team_id', '=', 'teams.id')
            ->where('team_user_roles.user_id', $convidado->id)
            ->where('teams.club_id', '!=', $team->club_id)
            ->exists();

        if ($jaEmOutroClubeDirecao || $jaEmOutroClubeEquipa) {
            return response()->json(['message' => 'Este utilizador já está vinculado ativamente a outro clube. É necessário que ele se desvincule primeiro.'], 400);
        }

        // --- REGRA DE OURO 2: CARGO ÚNICO NA MESMA EQUIPA ---
        $jaTemCargoNestaEquipa = DB::table('team_user_roles')
            ->where('team_id', $team->id)
            ->where('user_id', $convidado->id)
            ->exists();

        if ($jaTemCargoNestaEquipa) {
            return response()->json(['message' => 'Este utilizador já possui uma função ativa neste escalão.'], 400);
        }

        // Anti-Spam de Convites Pendentes
        $jaConvidado = ClubInvitation::where('equipa_id', $team->id)
                                     ->where('user_convidado_id', $convidado->id)
                                     ->where('resposta_equipa', 'Pendente')
                                     ->exists();

        if ($jaConvidado) {
            return response()->json(['message' => 'Esse membro já tem um convite pendente para esta equipa.'], 400);
        }

        // Criar o convite
        ClubInvitation::create([
            'clube_id' => $team->club_id,
            'equipa_id' => $team->id,
            'user_convidado_id' => $convidado->id,
            'convidado_por_id' => Auth::id(),
            'resposta_clube' => 'Nao_Aplicavel',
            'resposta_equipa' => 'Pendente',
            'cargo' => $validated['cargo'],
            'numero_camisola' => $validated['cargo'] === 'Jogador' ? ($validated['numero_camisola'] ?? null) : null,
            'token_convite' => Str::random(40),
            'data_envio' => now()
        ]);

        return response()->json(['message' => 'Convite enviado com sucesso para o balneário!'], 201);
    }

    /**
     * 3. Aceita o convite (Trata Direção OU Equipa dinamicamente)
     */
    public function aceitar($id)
    {
        $convite = ClubInvitation::where('id', $id)
            ->where('user_convidado_id', Auth::id())
            ->first();

        if (!$convite) {
            return response()->json(['message' => 'Convite não encontrado.'], 404);
        }

        // CENÁRIO A: É um convite de DIREÇÃO
        if ($convite->equipa_id === null && $convite->resposta_clube === 'Pendente') {
            $jaTemClubeAtivo = ClubRole::where('user_id', Auth::id())->where('ativo', true)->exists();
            if ($jaTemClubeAtivo) {
                return response()->json([
                    'message' => 'Operação recusada. Já tens um cargo ativo na direção de um clube.'
                ], 400);
            }

            try {
                DB::transaction(function () use ($convite) {
                    $convite->update(['resposta_clube' => 'Aceite']);
                    ClubRole::create([
                        'club_id' => $convite->clube_id,
                        'user_id' => Auth::id(),
                        'cargo' => $convite->cargo,
                        'ativo' => true,
                    ]);
                });
                return response()->json(['message' => 'Bem-vindo à direção do clube!'], 200);
            } catch (\Exception $e) {
                return response()->json(['message' => 'Erro ao aceitar convite de direção.'], 500);
            }
        }

        // CENÁRIO B: É um convite de EQUIPA / BALNEÁRIO
        if ($convite->equipa_id !== null && $convite->resposta_equipa === 'Pendente') {
            try {
                DB::transaction(function () use ($convite) {
                    // Atualiza a resposta de campo
                    $convite->update(['resposta_equipa' => 'Aceite']);
                    
                    // Alimenta a tabela `team_user_roles`
                    DB::table('team_user_roles')->insert([
                        'team_id' => $convite->equipa_id,
                        'user_id' => Auth::id(),
                        'cargo' => $convite->cargo ?? 'Jogador', 
                        'numero_camisola' => $convite->numero_camisola ?? null
                    ]);
                });

                return response()->json(['message' => 'Entraste no balneário com sucesso! Prepara as chuteiras.'], 200);
            } catch (\Exception $e) {
                return response()->json(['message' => 'Erro ao processar a tua entrada na equipa.'], 500);
            }
        }

        return response()->json(['message' => 'Este convite já foi respondido ou é inválido.'], 400);
    }

    /**
     * 4. Rejeita o convite e limpa ambos os estados para garantir que desaparece do Dashboard
     */
    public function rejeitar($id)
    {
        $convite = ClubInvitation::where('id', $id)
            ->where('user_convidado_id', Auth::id())
            ->first();

        if (!$convite) {
            return response()->json(['message' => 'Convite não encontrado.'], 404);
        }

        // Se for um convite de Equipa (Balneário)
        if ($convite->equipa_id !== null) {
            $convite->update([
                'resposta_equipa' => 'Recusado',
                'resposta_clube' => 'Nao_Aplicavel'
            ]);
        } else {
            // Se for um convite institucional (Direção)
            $convite->update([
                'resposta_clube' => 'Rejeitado',
                'resposta_equipa' => 'Nao_Aplicavel'
            ]);
        }

        return response()->json(['message' => 'Convite rejeitado com sucesso.'], 200);
    }
}