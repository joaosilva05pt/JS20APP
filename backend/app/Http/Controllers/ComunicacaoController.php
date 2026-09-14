<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Post;
use App\Models\PostComment;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ComunicacaoController extends Controller
{
    /**
     * Puxar o Feed Completo da Equipa (Com Comentários e Autores)
     */
    public function index($teamId)
    {
        $userId = Auth::id();

        // 1. Verificar se faz parte da Direção Global do Clube
        $isDirecaoGlobal = DB::table('club_roles')
            ->where('user_id', $userId)
            ->where('ativo', true)
            ->exists();

        // 2. Verificar se pertence à equipa específica
        $belongsToTeam = DB::table('team_user_roles')
            ->where('team_id', $teamId)
            ->where('user_id', $userId)
            ->exists();

        // Segurança de Balneário: Se não for da Direção e não for da equipa, fica fora
        if (!$isDirecaoGlobal && !$belongsToTeam) {
            return response()->json(['message' => 'Não tem autorização para aceder a esta comunicação interna.'], 403);
        }

        // Puxar posts ordenados pelos mais recentes, trazendo os autores dos posts e dos comentários
        $posts = Post::with([
                'autor:id,nome,apelido', 
                'comentarios.user:id,nome,apelido'
            ])
            ->where('team_id', $teamId)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($posts, 200);
    }

    /**
     * Lançar Novo Post no Feed
     */
    public function store(Request $request, $teamId)
    {
        $request->validate([
            'titulo' => 'required|string|max:150',
            'conteudo' => 'required|string',
            'tipo' => 'string|max:30',
            'imagem_url' => 'nullable|string'
        ]);

        $userId = Auth::id();

        $post = Post::create([
            'team_id' => $teamId,
            'autor_id' => $userId,
            'event_id' => $request->event_id ?? null,
            'titulo' => $request->titulo,
            'conteudo' => $request->conteudo,
            'imagem_url' => $request->imagem_url ?? null,
            'tipo' => $request->tipo ?? 'Noticia'
        ]);

        // Recarrega o post com a relação do autor para devolver ao Frontend na hora
        $post->load('autor:id,nome,apelido', 'comentarios');

        return response()->json($post, 201);
    }

    /**
     * Responder / Comentar num Post
     */
    public function storeComment(Request $request, $teamId, $postId)
    {
        $request->validate([
            'comentario' => 'required|string'
        ]);

        $comment = PostComment::create([
            'post_id' => $postId,
            'user_id' => Auth::id(),
            'comentario' => $request->comentario
        ]);

        // Carrega os dados do utilizador que comentou para atualizar o feed sem recarregar a página
        $comment->load('user:id,nome,apelido');

        return response()->json($comment, 201);
    }

    /**
     * Eliminar uma Publicação
     */
    public function destroy($teamId, $postId)
    {
        $userId = Auth::id();
        $post = Post::where('team_id', $teamId)->where('id', $postId)->first();

        if (!$post) {
            return response()->json(['message' => 'Publicação não encontrada.'], 404);
        }

        // Permitir apagar se for o próprio autor ou se for da Direção Global
        $isDirecaoGlobal = DB::table('club_roles')->where('user_id', $userId)->where('ativo', true)->exists();

        if ($post->autor_id !== $userId && !$isDirecaoGlobal) {
            return response()->json(['message' => 'Não tem permissão para remover esta publicação.'], 403);
        }

        $post->delete();

        return response()->json(['message' => 'Publicação removida com sucesso.'], 200);
    }
}