<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage; // gerir a eliminação e armazenamento de ficheiros

class ProfileController extends Controller
{
    /**
     * Atualiza os dados pessoais do utilizador logado
     */
    public function update(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        // 1. Validação completa com os novos campos e regras de imagem
        $validated = $request->validate([
            'nome' => 'required|string|max:50',
            'apelido' => 'required|string|max:50',
            'email' => 'required|email|max:100|unique:users,email,' . $user->id,
            'genero' => 'required|string|in:Masculino,Feminino',
            'telemovel' => 'nullable|string|max:20|unique:users,telemovel,' . $user->id,
            'pais' => 'nullable|string|max:50',
            'localidade' => 'nullable|string|max:100',
            'foto_perfil' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048', // Max 2MB
        ]);

        try {
            // 2. Lógica inteligente de Upload de Imagem
            if ($request->hasFile('foto_perfil')) {
                // Se o utilizador já tinha uma foto registada no servidor, vamos apagá-la para poupar espaço
                if ($user->foto_perfil && Storage::disk('public')->exists($user->foto_perfil)) {
                    Storage::disk('public')->delete($user->foto_perfil);
                }

                // Guarda o novo ficheiro na pasta de uploads e atualiza o array de validação
                $validated['foto_perfil'] = $request->file('foto_perfil')->store('uploads/perfis', 'public');
            } else {
                // Se não enviou ficheiro nenhum, removemos o campo para o Laravel não tentar atualizar com null
                unset($validated['foto_perfil']);
            }

            // 3. Atualização em massa na base de dados
            $user->update($validated);

            return response()->json([
                'message' => 'O teu perfil foi atualizado com sucesso!',
                'user' => $user
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erro ao atualizar o perfil.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}