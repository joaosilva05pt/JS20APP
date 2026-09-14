<?php

namespace App\Http\Controllers;

use App\Models\ClubRole;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\ClubInvitation;
use Illuminate\Support\Str;
use App\Models\Club;
use Illuminate\Support\Facades\Storage; // essencial para gerir ficheiros no disco

class ClubAdminController extends Controller
{
    /**
     * 1. LISTAR A DIREÇÃO: Devolve quem trabalha no clube
     */
    public function listarMembros($clubId)
    {
        $authUserId = Auth::id();

        // Segurança de Acesso: O utilizador que está a pedir a lista tem de trabalhar neste clube
        $temPermissao = ClubRole::where('club_id', $clubId)
                                ->where('user_id', $authUserId)
                                ->where('ativo', true)
                                ->exists();

        if (!$temPermissao) {
            return response()->json(['message' => 'Acesso negado. Não pertences à direção deste clube.'], 403);
        }

        // Vai buscar os cargos ativos e junta os dados essenciais da tabela users (incluindo a foto_perfil se houver)
        $membros = ClubRole::with('user:id,nome,apelido,email,profissao_base,foto_perfil')
                           ->where('club_id', $clubId)
                           ->where('ativo', true)
                           ->orderBy('cargo') 
                           ->get();

        return response()->json($membros, 200);
    }

    /**
     * 2. CONVIDAR DIRIGENTE: Gera um convite oficial pendente
     */
    public function adicionarMembro(Request $request, $clubId)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'cargo' => 'required|string|max:50|not_in:Presidente' // Proíbe convidar para Presidente
        ]);

        // Qualquer membro ativo da direção pode enviar convites
        $membroAutorizado = ClubRole::where('club_id', $clubId)
                                    ->where('user_id', Auth::id())
                                    ->where('ativo', true)
                                    ->exists();

        if (!$membroAutorizado) {
            return response()->json(['message' => 'Apenas membros ativos da direção podem convidar.'], 403);
        }

        $novoMembro = User::where('email', $validated['email'])->first();

        if (!$novoMembro) {
            return response()->json(['message' => 'Nenhum utilizador encontrado com este email.'], 404);
        }

        if ($novoMembro->profissao_base !== 'Dirigente') {
            return response()->json(['message' => 'Apenas perfis do tipo Dirigente podem entrar na administração do clube.'], 400);
        }

        // Verifica se a pessoa já faz parte da direção
        $jaExiste = ClubRole::where('club_id', $clubId)
                            ->where('user_id', $novoMembro->id)
                            ->where('ativo', true)
                            ->exists();

        if ($jaExiste) {
            return response()->json(['message' => 'Esta pessoa já faz parte da direção ativa do clube.'], 400);
        }

        // Verifica se já existe um convite pendente para não duplicar
        $convitePendente = ClubInvitation::where('clube_id', $clubId)
                                         ->where('user_convidado_id', $novoMembro->id)
                                         ->where('resposta_clube', 'Pendente')
                                         ->exists();

        if ($convitePendente) {
            return response()->json(['message' => 'Este utilizador já tem um convite pendente para este clube.'], 400);
        }

        // Gera o convite na base de dados
        ClubInvitation::create([
            'clube_id' => $clubId,
            'user_convidado_id' => $novoMembro->id,
            'convidado_por_id' => Auth::id(),
            'cargo' => $validated['cargo'],
            'resposta_clube' => 'Pendente',
            'token_convite' => Str::random(40),
        ]);

        return response()->json([
            'message' => 'Convite enviado com sucesso! O utilizador deve aceitar no seu Dashboard.',
        ], 201);
    }

    /**
     * 3. PASSAGEM DE TESTEMUNHO: Mudar o Presidente
     */
    public function transferirPresidencia(Request $request, $clubId)
    {
        $validated = $request->validate([
            'novo_presidente_id' => 'required|exists:users,id'
        ]);

        $authUserId = Auth::id();

        // 1. Verifica se quem está a tentar passar a pasta é o verdadeiro Presidente
        $cargoAtual = ClubRole::where('club_id', $clubId)
                              ->where('user_id', $authUserId)
                              ->where('cargo', 'Presidente')
                              ->where('ativo', true)
                              ->first();

        if (!$cargoAtual) {
            return response()->json(['message' => 'Operação bloqueada. Apenas o Presidente em funções pode passar a pasta.'], 403);
        }

        // 2. Verifica se o escolhido já faz parte da direção atual
        $futuroPresidente = ClubRole::where('club_id', $clubId)
                                    ->where('user_id', $validated['novo_presidente_id'])
                                    ->where('ativo', true)
                                    ->first();

        if (!$futuroPresidente) {
            return response()->json(['message' => 'O novo Presidente tem de fazer parte da direção atual (ex: tem de ser Vice-Presidente primeiro).'], 400);
        }

        try {
            DB::transaction(function () use ($cargoAtual, $futuroPresidente) {
                // Passo A: Destituir o atual
                $cargoAtual->update([
                    'cargo' => 'Ex-Presidente',
                    'data_fim' => now(),
                    'ativo' => false 
                ]);

                // Passo B: Promover o sucessor
                $futuroPresidente->update([
                    'cargo' => 'Presidente',
                ]);
            });

            return response()->json(['message' => 'O testemunho foi passado. Já não és o Presidente deste clube.'], 200);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erro interno ao transferir a presidência.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 4. DESTITUIR MEMBRO: Apenas o Presidente pode remover pessoas da direção
     */
    public function removerMembro($clubId, $userId)
    {
        // 1. Verifica se quem está a executar a ação é o Presidente
        $presidente = ClubRole::where('club_id', $clubId)
                              ->where('user_id', Auth::id())
                              ->where('cargo', 'Presidente')
                              ->where('ativo', true)
                              ->first();

        if (!$presidente) {
            return response()->json(['message' => 'Apenas o Presidente pode destituir membros da direção.'], 403);
        }

        // 2. Impede o presidente de se "despedir" a si próprio por engano
        if (Auth::id() == $userId) {
            return response()->json(['message' => 'Não podes remover-te a ti próprio. Usa a transferência de presidência.'], 400);
        }

        // 3. Encontra o cargo ativo do membro a remover
        $membroRole = ClubRole::where('club_id', $clubId)
                              ->where('user_id', $userId)
                              ->where('ativo', true)
                              ->first();

        if (!$membroRole) {
            return response()->json(['message' => 'Membro não encontrado ou já inativo.'], 404);
        }

        // 4. "Despede" o membro
        $membroRole->update([
            'ativo' => false,
            'data_fim' => now()
        ]);

        return response()->json(['message' => 'Membro destituído com sucesso.'], 200);
    }

    /**
     * 5. ALTERAR CARGO: O Presidente atualiza a função de um membro
     */
    public function atualizarCargo(Request $request, $clubId, $userId)
    {
        $validated = $request->validate([
            'novo_cargo' => 'required|string|max:50|not_in:Presidente'
        ]);

        // 1. Confirma se quem pede é o Presidente
        $presidente = ClubRole::where('club_id', $clubId)
                              ->where('user_id', Auth::id())
                              ->where('cargo', 'Presidente')
                              ->where('ativo', true)
                              ->first();

        if (!$presidente) {
            return response()->json(['message' => 'Apenas o Presidente pode alterar os cargos da direção.'], 403);
        }

        // 2. Não permite que o Presidente altere o próprio cargo por aqui
        if (Auth::id() == $userId) {
            return response()->json(['message' => 'Para alterares o teu próprio cargo, deves usar a Transferência de Presidência.'], 400);
        }

        // 3. Encontra o membro a atualizar
        $membroRole = ClubRole::where('club_id', $clubId)
                              ->where('user_id', $userId)
                              ->where('ativo', true)
                              ->first();

        if (!$membroRole) {
            return response()->json(['message' => 'Membro não encontrado na direção ativa.'], 404);
        }

        // 4. Perfeito. Atualiza o cargo
        $membroRole->update([
            'cargo' => $validated['novo_cargo']
        ]);

        return response()->json([
            'message' => 'Cargo updated com sucesso!',
            'cargo' => $membroRole->cargo
        ], 200);
    }

    /**
     * 6. LER DADOS DO CLUBE: Devolve a informação base para preencher o formulário
     */
    public function detalhesClube($clubId)
    {
        // Verifica se pertence à direção
        $temPermissao = ClubRole::where('club_id', $clubId)
                                ->where('user_id', Auth::id())
                                ->where('ativo', true)
                                ->exists();

        if (!$temPermissao) {
            return response()->json(['message' => 'Acesso negado.'], 403);
        }

        $club = Club::findOrFail($clubId);
        return response()->json($club, 200);
    }

    /**
     * 7. ATUALIZAR CLUBE: Permite alterar nome, localidade, sigla e emblema oficial
     */
    public function atualizarClube(Request $request, $clubId)
    {
        $temPermissao = ClubRole::where('club_id', $clubId)
                                ->where('user_id', Auth::id())
                                ->where('ativo', true)
                                ->exists();

        if (!$temPermissao) {
            return response()->json(['message' => 'Apenas membros da direção podem editar o clube.'], 403);
        }

        // VALIDAÇÃO EXPANDIDA: Inclui os novos campos e a validação do ficheiro de imagem
        $validated = $request->validate([
            'nome' => 'required|string|max:100|unique:clubs,nome,' . $clubId,
            'sigla' => 'required|string|max:10',
            'email_clube' => 'nullable|email|max:100',
            'contacto_oficial' => 'nullable|string|max:30',
            'pais' => 'required|string|max:100',
            'localidade' => 'nullable|string|max:100',
            'data_fundacao' => 'nullable|date',
            'emblema' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048', // Max 2MB
        ]);

        $club = Club::findOrFail($clubId);

        try {
            // 💡 LÓGICA DE SUBSTITUIÇÃO DO EMBLEMA
            if ($request->hasFile('emblema')) {
                // Se o clube já tinha um cromo de emblema no disco, apaga-o para poupar armazenamento
                if ($club->emblema_url && Storage::disk('public')->exists($club->emblema_url)) {
                    Storage::disk('public')->delete($club->emblema_url);
                }

                // Armazena o novo e atualiza a propriedade do modelo
                $club->emblema_url = $request->file('emblema')->store('uploads/emblemas', 'public');
            }

            // Atualiza os campos de texto em massa na tabela
            $club->update([
                'nome' => $validated['nome'],
                'sigla' => strtoupper($validated['sigla']), // Força a sigla em caixa alta
                'email_clube' => $validated['email_clube'] ?? null,
                'contacto_oficial' => $validated['contacto_oficial'] ?? null,
                'pais' => $validated['pais'],
                'localidade' => $validated['localidade'] ?? null,
                'data_fundacao' => $validated['data_fundacao'] ?? null,
                'emblema_url' => $club->emblema_url // Grava o path correto
            ]);

            return response()->json([
                'message' => 'Definições do clube atualizadas com sucesso!',
                'club' => $club
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erro ao atualizar o perfil do clube.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 8. DISSOLVER CLUBE: Poder de veto absoluto com dupla verificação por texto
     */
    public function dissolverClube(Request $request, $clubId)
    {
        $request->validate([
            'nome_confirmacao' => 'required|string'
        ]);

        // 1. Verifica se quem está logado é o Presidente legítimo e ativo
        $presidente = ClubRole::where('club_id', $clubId)
                              ->where('user_id', Auth::id())
                              ->where('cargo', 'Presidente')
                              ->where('ativo', true)
                              ->first();

        if (!$presidente) {
            return response()->json(['message' => 'Apenas o Presidente em funções tem autoridade para dissolver o clube.'], 403);
        }

        $club = Club::findOrFail($clubId);

        // 2. Dupla validação de segurança no servidor
        if ($request->nome_confirmacao !== $club->nome) {
            return response()->json(['message' => 'O nome introduzido não corresponde ao nome exato do clube.'], 422);
        }

        try {
            // 3. Transação atómica para limpar o clube e libertar os profissionais
            DB::transaction(function () use ($club, $clubId) {
                // Elimina todos os cargos associados a este clube
                ClubRole::where('club_id', $clubId)->delete();

                // Elimina os convites pendentes criados por ou para este clube
                ClubInvitation::where('clube_id', $clubId)->delete();

                // Elimina a instituição da plataforma
                $club->delete();
            });

            return response()->json(['message' => 'O clube foi dissolvido com sucesso.'], 200);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erro interno ao dissolver a instituição.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 9. LISTAR CONVITES PENDENTES: Ver quem ainda não aceitou
     */
    public function listarConvitesPendentes($clubId)
    {
        $temPermissao = ClubRole::where('club_id', $clubId)
                                ->where('user_id', Auth::id())
                                ->where('ativo', true)
                                ->exists();

        if (!$temPermissao) {
            return response()->json(['message' => 'Acesso negado.'], 403);
        }

        // Vai buscar os convites pendentes e junta os dados de quem foi convidado
        $convites = ClubInvitation::with('convidado:id,nome,apelido,email')
                                  ->where('clube_id', $clubId)
                                  ->where('resposta_clube', 'Pendente')
                                  ->get();

        return response()->json($convites, 200);
    }

    /**
     * 10. CANCELAR CONVITE: Apagar um convite enviado antes de ser aceite
     */
    public function cancelarConvite($clubId, $invitationId)
    {
        $temPermissao = ClubRole::where('club_id', $clubId)
                                ->where('user_id', Auth::id())
                                ->where('ativo', true)
                                ->exists();

        if (!$temPermissao) {
            return response()->json(['message' => 'Acesso negado.'], 403);
        }

        $convite = ClubInvitation::where('clube_id', $clubId)
                                 ->where('id', $invitationId)
                                 ->where('resposta_clube', 'Pendente')
                                 ->first();

        if (!$convite) {
            return response()->json(['message' => 'Convite não encontrado ou já processado.'], 404);
        }

        $convite->delete();

        return response()->json(['message' => 'Convite cancelado com sucesso.'], 200);
    }

    /**
     * 11. SAIR DO CLUBE (Demissão Voluntária)
     */
    public function sairDoClube(Request $request, $clubId)
    {
        $userId = Auth::id();

        // Verifica o cargo do utilizador no clube
        $membroRole = ClubRole::where('club_id', $clubId)
                              ->where('user_id', $userId)
                              ->where('ativo', true)
                              ->first();

        if (!$membroRole) {
            return response()->json(['message' => 'Não tens um cargo ativo neste clube.'], 404);
        }

        // O Presidente não pode sair pelos seus próprios meios
        if ($membroRole->cargo === 'Presidente') {
            return response()->json(['message' => 'O Presidente não pode abandonar o barco. Deves passar o testemunho a outro membro ou dissolver o clube.'], 403);
        }

        // Remove o utilizador da direção
        $membroRole->delete();

        return response()->json(['message' => 'Pediste a demissão e saíste do clube com sucesso.'], 200);
    }
}