<?php

namespace App\Http\Controllers;

use App\Models\Club;
use App\Models\ClubRole;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage; 

class ClubController extends Controller
{
    /**
     * Criar um novo clube (Fundação)
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        // ==========================================
        // 1. BLOQUEIO DE SEGURANÇA: Apenas Dirigentes
        // ==========================================
        if ($user->profissao_base !== 'Dirigente') {
            return response()->json([
                'message' => 'Acesso negado. Apenas utilizadores com a profissão de Dirigente podem fundar clubes.'
            ], 403);
        }

        // ==========================================
        // 2. BLOQUEIO DE SEGURANÇA: Apenas 1 Clube por pessoa
        // ==========================================
        $jaTemClubeAtivo = ClubRole::where('user_id', $user->id)
                                   ->where('ativo', true)
                                   ->exists();

        if ($jaTemClubeAtivo) {
            return response()->json([
                'message' => 'Acesso negado. Já tens um cargo ativo num clube. Deves pedir a demissão antes de fundar uma nova instituição.'
            ], 403);
        }

        // ==========================================
        // 3. Validação dos dados (Atualizada com os novos campos e Imagem)
        // ==========================================
        $validated = $request->validate([
            'nome' => 'required|string|max:100|unique:clubs,nome',
            'sigla' => 'required|string|max:10',                      
            'email_clube' => 'nullable|email|max:100',              
            'contacto_oficial' => 'nullable|string|max:30',          
            'pais' => 'required|string|max:100',
            'localidade' => 'nullable|string|max:100',
            'data_fundacao' => 'nullable|date',
            'emblema' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048', 
        ]);

        try {
            // PROCESSAMENTO DO UPLOAD DO EMBLEMA
            $emblemaPath = null;
            if ($request->hasFile('emblema')) {
                // Guarda o emblema na pasta 'uploads/emblemas' dentro do disco público do Laravel
                $emblemaPath = $request->file('emblema')->store('uploads/emblemas', 'public');
            }

            // 4. Transação Atómica (Garante consistência absoluta)
            $club = DB::transaction(function () use ($validated, $user, $emblemaPath) {
                
                // A) Nasce o Clube com a ficha técnica premium completa
                $novoClube = Club::create([
                    'nome' => $validated['nome'],
                    'sigla' => strtoupper($validated['sigla']), // Garante a sigla sempre em maiúsculas (Ex: FCP)
                    'email_clube' => $validated['email_clube'] ?? null,
                    'contacto_oficial' => $validated['contacto_oficial'] ?? null,
                    'pais' => $validated['pais'],
                    'localidade' => $validated['localidade'] ?? null,
                    'data_fundacao' => $validated['data_fundacao'] ?? null,
                    'emblema_url' => $emblemaPath, // Caminho do ficheiro no disco indexado aqui
                    'criador_id' => $user->id,
                ]);

                // B) O Dirigente é nomeado Presidente
                ClubRole::create([
                    'club_id' => $novoClube->id,
                    'user_id' => $user->id,
                    'cargo' => 'Presidente',
                    'ativo' => true,
                ]);

                return $novoClube;
            });

            return response()->json([
                'message' => 'Clube fundado com sucesso! Parabéns, Presidente.',
                'club' => $club
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erro interno ao fundar o clube.', 
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Devolver o clube onde o utilizador tem cargo na direção (para o Dashboard)
     */
    public function meuClube()
    {
        $user = Auth::user();
        
        $cargo = ClubRole::with('club')
                        ->where('user_id', $user->id)
                        ->where('ativo', true)
                        ->first();

        if (!$cargo || !$cargo->club) {
            return response()->json(['message' => 'Ainda não pertences à direção de nenhum clube.'], 404);
        }

        return response()->json($cargo->club, 200);
    }
}