<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\MedicalRecord;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class DeptoMedicoController extends Controller
{
    public function index($teamId)
    {
        $userId = Auth::id();

        $membroLogado = DB::table('team_user_roles')
            ->where('team_id', $teamId)
            ->where('user_id', $userId)
            ->first();

        $cargo = $membroLogado ? $membroLogado->cargo : 'Jogador';
        $isCorpoMedico = in_array($cargo, ['Medico', 'Fisioterapeuta', 'Departamento_Medico']);
        
        $temAcessoPrivado = in_array($cargo, [
            'Presidente', 'Diretor_Desportivo', 'Treinador', 'Treinador_Adjunto', 'Preparador_Fisico', 'Medico', 'Fisioterapeuta', 'Departamento_Medico'
        ]);

        $jogadoresPlantel = DB::table('team_user_roles')
            ->join('users', 'team_user_roles.user_id', '=', 'users.id')
            ->where('team_user_roles.team_id', $teamId)
            ->where('team_user_roles.cargo', 'Jogador')
            ->select('users.id', 'users.nome', 'users.apelido')
            ->get();

        $query = MedicalRecord::with([
            'jogador:id,nome,apelido',
            'profissional:id,nome,apelido'
        ]);

        if (!$temAcessoPrivado) {
            $query->where('privado', false);
        }

        $boletins = $query->orderBy('data_inicio', 'desc')->get();

        return response()->json([
            'boletins' => $boletins,
            'jogadores_plantel' => $jogadoresPlantel,
            'is_corpo_medico' => $isCorpoMedico
        ], 200);
    }

    public function store(Request $request, $teamId)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'tipo_lesao' => 'required|string|max:100',
            'gravidade' => 'required|string|in:Leve,Moderada,Grave',
            'estado_prontidao' => 'required|string|in:Apto,Condicionado,Inapto',
            'data_inicio' => 'required|date',
            'data_regresso_prevista' => 'nullable|date',
            'notas_tratamento' => 'nullable|string',
            'privado' => 'required|boolean'
        ]);

        // Se o atleta já tiver ficha, atualiza. Se não, cria uma nova.
        $record = MedicalRecord::updateOrCreate(
            ['user_id' => $request->user_id],
            [
                'registado_por_id' => Auth::id(),
                'tipo_lesao' => $request->tipo_lesao,
                'gravidade' => $request->gravidade,
                'estado_prontidao' => $request->estado_prontidao,
                'data_inicio' => $request->data_inicio,
                'data_regresso_prevista' => $request->data_regresso_prevista,
                'notas_tratamento' => $request->notas_tratamento,
                'privado' => $request->privado
            ]
        );

        return response()->json(['message' => 'Ficha clínica processada com sucesso!', 'record' => $record], 201);
    }

    /**
     * ENDPOINT: Alterar diretamente uma ficha existente ou dar alta
     */
    public function update(Request $request, $teamId, $id)
    {
        $record = MedicalRecord::find($id);
        if (!$record) {
            return response()->json(['message' => 'Registo clínico não encontrado.'], 404);
        }

        // Atualiza os dados enviados pelo React e garante o ID do profissional ativo
        $dados = $request->all();
        $dados['registado_por_id'] = Auth::id(); 

        $record->update($dados);

        return response()->json([
            'message' => 'Registo clínico modificado com sucesso!', 
            'record' => $record->load(['jogador:id,nome,apelido', 'profissional:id,nome,apelido'])
        ], 200);
    }
}