<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\NutritionGuide;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class NutritionGuideController extends Controller
{
    /**
     * Listar as ementas e guias da equipa
     */
    public function index($teamId)
    {
    //PARA O ERRO 500: Se o Sanctum falhar ou a sessão cair, devolve JSON direto e não crasha!
    if (!Auth::check()) {
        return response()->json([
            'message' => 'Sessão expirada ou inválida. Por favor, faça login novamente.',
            'guias' => [],
            'pode_gerir' => false
        ], 401);
    }

    try {
        $userId = Auth::id();

        // 1. Validar cargo do utilizador logado nesta equipa específica
        $membroLogado = DB::table('team_user_roles')
            ->where('team_id', $teamId)
            ->where('user_id', $userId)
            ->first();

        $cargo = $membroLogado ? $membroLogado->cargo : 'Jogador';

        // Permitir que o Nutricionista, Treinador Principal ou Presidente vejam o formulário
        $podeGerir = in_array($cargo, ['Nutricionista', 'Treinador', 'Presidente', 'Preparador_Fisico']);

        // 2. Resgatar os guias nutricionais da equipa
        $guias = NutritionGuide::with(['criador:id,nome,apelido'])
            ->where('team_id', $teamId)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'guias' => $guias,
            'pode_gerir' => $podeGerir
        ], 200);

    } catch (\Exception $e) {
        return response()->json([
            'message' => 'Erro interno no servidor.',
            'error' => $e->getMessage()
        ], 500);
    }
    }

    /**
     * Publicar novo plano nutricional
     */
    public function store(Request $request, $teamId)
    {
        $request->validate([
            'titulo' => 'required|string|max:100',
            'conteudo_texto' => 'nullable|string',
            'anexo_url' => 'nullable|string|max:255',
            'tipo' => 'required|string|in:Diario,Pre-Jogo,Suplementacao,Recuperacao'
        ]);

        $guia = NutritionGuide::create([
            'team_id' => $teamId,
            'criador_id' => Auth::id(),
            'titulo' => $request->titulo,
            'conteudo_texto' => $request->conteudo_texto,
            'anexo_url' => $request->anexo_url,
            'tipo' => $request->tipo
        ]);

        return response()->json([
            'message' => 'Guia nutricional publicado!',
            'guia' => $guia->load('criador:id,nome,apelido')
        ], 201);
    }

    /**
     * Atualizar uma ementa existente
     */
    public function update(Request $request, $teamId, $id)
    {
        $guia = NutritionGuide::where('team_id', $teamId)->find($id);
        if (!$guia) {
            return response()->json(['message' => 'Guia nutricional não encontrado.'], 404);
        }

        $request->validate([
            'titulo' => 'required|string|max:100',
            'conteudo_texto' => 'nullable|string',
            'anexo_url' => 'nullable|string|max:255',
            'tipo' => 'required|string|in:Diario,Pre-Jogo,Suplementacao,Recuperacao'
        ]);

        $guia->update($request->all());

        return response()->json([
            'message' => 'Plano nutricional atualizado!',
            'guia' => $guia->load('criador:id,nome,apelido')
        ], 200);
    }

    /**
     * Remover ementa (SoftDelete)
     */
    public function destroy($teamId, $id)
    {
        $guia = NutritionGuide::where('team_id', $teamId)->find($id);
        if (!$guia) {
            return response()->json(['message' => 'Guia inexistente.'], 404);
        }

        $guia->delete();
        return response()->json(['message' => 'Plano nutricional removido.'], 200);
    }
}