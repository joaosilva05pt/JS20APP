<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Team;
use App\Models\ClubRole;

class CheckTeamAccess
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next)
    {
        $user = Auth::user();
        
        // 1. Capturar o ID da equipa dinamicamente a partir do URL da rota ({id} ou {team})
        $teamId = $request->route('id') ?? $request->route('team');

        if (!$teamId) {
            return response()->json(['message' => 'ID da equipa não fornecido na rota.'], 400);
        }

        // 2. Procurar a equipa para saber a que clube pertence
        $team = Team::find($teamId);
        if (!$team) {
            return response()->json(['message' => 'Equipa não encontrada.'], 404);
        }

        // --- VALIDAÇÃO A: É DIRIGENTE ATIVO DO CLUBE DONO DA EQUIPA? ---
        $isDirigente = ClubRole::where('user_id', $user->id)
                               ->where('club_id', $team->club_id)
                               ->where('ativo', true)
                               ->exists();

        if ($isDirigente) {
            return $next($request); // Porta aberta! É o chefe do clube.
        }

        // --- VALIDAÇÃO B: PERTENCE AO BALNEÁRIO / EQUIPA TÉCNICA / STAFF DESTA EQUIPA? ---
        $pertenceAEquipa = \DB::table('team_user_roles')
            ->where('team_id', $team->id)
            ->where('user_id', $user->id)
            ->exists();

        if ($pertenceAEquipa) {
            return $next($request); // Porta aberta! É jogador, treinador ou médico desta equipa.
        }

        // --- SE FALHAR AMBAS: ACESSO BLOQUEADO ---
        return response()->json([
            'message' => 'Acesso negado. Não tens permissões para ver ou alterar dados deste escalão.'
        ], 403);
    }
}