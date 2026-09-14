<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Team;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class TeamSettingsController extends Controller
{
    /**
     * Auxiliar: Valida se o utilizador logado é membro da Staff/Direção do CLUBE
     */
    private function verificarPermissaoAdministrativaClube($clubId)
    {
        $userId = Auth::id();
        
        // Verifica se o utilizador tem um cargo administrativo ativo no clube
        $clubRole = DB::table('club_roles')
            ->where('club_id', $clubId)
            ->where('user_id', $userId)
            ->where('ativo', true)
            ->whereNull('deleted_at')
            ->first();

        // Permite apenas cargos de gestão de topo do clube
        if (!$clubRole || !in_array($clubRole->cargo, ['Presidente', 'Diretor', 'Coordenador'])) {
            return false;
        }

        return true;
    }

    /**
     * Obter dados simplificados para visualização das definições
     */
    public function getDefinicoesInfo($teamId)
    {
        $team = Team::findOrFail($teamId);
        
        return response()->json([
            'escalao' => $team->escalao,
            'genero' => $team->genero,
            'epoca_desportiva' => $team->epoca_desportiva,
            'arquivada' => (bool)$team->arquivada
        ], 200);
    }

    /**
     * Encerrar / Arquivar Época (Ação exclusiva da Staff do Clube)
     */
    public function arquivarEquipa($teamId)
    {
        $team = Team::findOrFail($teamId);

        // Validamos usando o club_id guardado no modelo Team contra a tabela club_roles
        if (!$this->verificarPermissaoAdministrativaClube($team->club_id)) {
            return response()->json([
                'message' => 'Acesso negado. Apenas membros da Direção ou Staff do clube podem encerrar épocas.'
            ], 403);
        }

        if ($team->arquivada) {
            return response()->json(['message' => 'Esta época já se encontra encerrada e arquivada.'], 400);
        }

        $team->arquivada = true;
        $team->save();

        return response()->json([
            'message' => "⚔️ Época {$team->epoca_desportiva} encerrada oficialmente pela direção do clube!"
        ], 200);
    }
}