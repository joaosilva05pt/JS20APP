<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\UserPointsLog;
use App\Models\LevelsConfig;
use App\Models\UserPurchase;
use App\Models\ShopItem;
use App\Models\UserMission;
use App\Models\UserAchievement;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class GamificationController extends Controller
{
    /**
     * AUXILIAR: Calcula o saldo, XP acumulado de sempre e o Nível Atual do utilizador
     */
    private function calcularProgressoUtilizador($userId)
    {
        // 1. Somar todos os pontos ganhos (valores positivos no log)
        $xpTotalAcumulado = UserPointsLog::where('user_id', $userId)
            ->where('pontos', '>', 0)
            ->sum('pontos');

        // 2. Calcular o saldo disponível real (Ganhos menos o que já gastou na Loja)
        $pontosGanhos = $xpTotalAcumulado;
        $pontosGastos = UserPurchase::where('user_id', $userId)
            ->where('estado', '!=', 'Cancelado')
            ->sum('preco_pago');
            
        // Se houver deduções manuais no log de pontos, contabilizar também
        $deducoesLog = UserPointsLog::where('user_id', $userId)
            ->where('pontos', '<', 0)
            ->sum('pontos'); // Isto retorna um valor negativo

        $saldoAtual = ($pontosGanhos - $pontosGastos) + $deducoesLog;
        if ($saldoAtual < 0) $saldoAtual = 0;

        // 3. Determinar o nível atual com base no XP Total Acumulado (pontos de sempre)
        $nivelAtual = LevelsConfig::where('pontos_necessarios', '<=', $xpTotalAcumulado)
            ->orderBy('nivel_numero', 'desc')
            ->first();

        // Se a tabela de níveis estiver vazia, cria um fallback de segurança (Nível 1)
        if (!$nivelAtual) {
            $nivelAtual = (object)[
                'nivel_numero' => 1,
                'titulo_nivel' => 'Recruta',
                'pontos_necessarios' => 0,
                'descricao_recompensa' => 'Início da caminhada desportiva.'
            ];
        }

        // 4. Encontrar o próximo nível para a barra de progresso no React
        $proximoNivel = LevelsConfig::where('nivel_numero', '>', $nivelAtual->nivel_numero)
            ->orderBy('nivel_numero', 'asc')
            ->first();

        return [
            'saldo_atual' => (int)$saldoAtual,
            'xp_total' => (int)$xpTotalAcumulado,
            'nivel_atual' => $nivelAtual->nivel_numero,
            'titulo_nivel' => $nivelAtual->titulo_nivel,
            'recompensa_nivel' => $nivelAtual->descricao_recompensa,
            'pontos_proximo_nivel' => $proximoNivel ? $proximoNivel->pontos_necessarios : $xpTotalAcumulado,
            'proximo_titulo' => $proximoNivel ? $proximoNivel->titulo_nivel : 'Nível Máximo'
        ];
    }

    /**
     * Endpoint para carregar o Perfil de Gamificação Completo + Bónus Diário + Auto-Missões
     */
    public function getPerfilJogador(Request $request, $teamId)
    {
        $userId = Auth::id();
        $hoje = \Carbon\Carbon::today()->toDateString();

        // =========================================================
        // GATILHO 1: BÓNUS DIÁRIO DE LOGIN (TRANCADO PELO CREATED_AT)
        // =========================================================
        $jaGanhouBonusHoje = UserPointsLog::where('user_id', $userId)
            ->where('motivo', 'Login Diário Aplicação')
            ->whereDate('created_at', $hoje)
            ->exists();

        if (!$jaGanhouBonusHoje) {
            UserPointsLog::create([
                'user_id'         => $userId,
                'pontos'          => 10,
                'motivo'          => 'Login Diário Aplicação',
                'referencia_id'   => null,
                'referencia_tipo' => null
            ]);
        }

        // =========================================================
        // GATILHO 2: GARANTIR QUE AS MISSÕES APARECEM (AUTO-ATRIBUIR)
        // =========================================================
        $missoesCatalogo = \App\Models\Mission::all();

        foreach ($missoesCatalogo as $missao) {
            $jaTemAtribuida = UserMission::where('user_id', $userId)
                ->where('mission_id', $missao->id)
                ->exists();

            if (!$jaTemAtribuida) {
                $objetivoFinal = 1; 
                if ($missao->categoria === 'Assiduidade') $objetivoFinal = 5; 
                if ($missao->categoria === 'Nutrição') $objetivoFinal = 3;     

                UserMission::create([
                    'user_id'         => $userId,
                    'mission_id'      => $missao->id,
                    'estado'          => 'Em_Progresso',
                    'progresso_atual' => 0,
                    'objetivo_final'  => $objetivoFinal
                ]);
            }
        }

        // =========================================================
        // RETORNO DOS DADOS ATUALIZADOS PARA O REACT
        // =========================================================
        $dadosProgresso = $this->calcularProgressoUtilizador($userId);

        $historicoPontos = UserPointsLog::where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get();

        $conquistas = UserAchievement::where('user_id', $userId)
            ->where(function($query) use ($teamId) {
                $query->where('team_id', $teamId)->orWhereNull('team_id');
            })
            ->orderBy('data_conquista', 'desc')
            ->get();

        return response()->json([
            'progresso'        => $dadosProgresso,
            'historico_pontos' => $historicoPontos,
            'conquistas'       => $conquistas
        ], 200);
    }

   
    /**
     * =========================================================================
     * PARTE 2: MOTOR DA LOJA XP (LISTAGEM & TRANSAÇÃO DE COMPRA)
     * =========================================================================
     */

    /**
     * Listar todos os itens ativos na montra da loja
     */
    public function listarItensLoja()
    {
        $itens = ShopItem::where('ativo', true)
            ->orderBy('preco_pontos', 'asc')
            ->get();

        return response()->json($itens, 200);
    }

    /**
     * Processar a compra de um item da loja gastando pontos (XP)
     */
    public function comprarItem(Request $request, $teamId, $itemId)
    {
        $userId = Auth::id();

        // Usamos uma Transação DB para garantir que se o stock ou o saldo falharem a meio, nada é guardado por engano
        return DB::transaction(function () use ($userId, $itemId, $teamId) {
            
            // 1. Resgatar o item e bloquear a linha para evitar problemas de concorrência (Race Conditions)
            $item = ShopItem::lockForUpdate()->find($itemId);

            if (!$item || !$item->ativo) {
                return response()->json(['message' => 'Este artigo já não se encontra disponível na loja do clube.'], 404);
            }

            // 2. Verificar se há stock disponível (-1 significa stock ilimitado)
            if ($item->stock !== -1 && $item->stock <= 0) {
                return response()->json(['message' => 'O artigo esgotou! Aguarde que o staff reponha o stock.'], 400);
            }

            // 3. Calcular o progresso e saldo atual do atleta
            $progresso = $this->calcularProgressoUtilizador($userId);
            $saldoAtual = $progresso['saldo_atual'];

            // 4. Validar se o jogador tem "dinheiro" (pontos) suficiente
            if ($saldoAtual < $item->preco_pontos) {
                return response()->json([
                    'message' => 'Pontos insuficientes!',
                    'saldo_atual' => $saldoAtual,
                    'preco_item' => $item->preco_pontos,
                    'falta' => ($item->preco_pontos - $saldoAtual)
                ], 400);
            }

            // 5. Deduzir o stock se o item não for infinito
            if ($item->stock > 0) {
                $item->decrement('stock');
            }

            // 6. Criar o registo oficial de compra (Fatura)
            $compra = UserPurchase::create([
                'user_id' => $userId,
                'item_id' => $item->id,
                'preco_pago' => $item->preco_pontos,
                'estado' => 'Entregue' // Pode ser 'Pendente' caso queiras aprovação física do staff mais tarde
            ]);

            // 7. Registar no histórico de pontos do utilizador a saída (Gasto) com valor negativo
            UserPointsLog::create([
                'user_id' => $userId,
                'pontos' => -$item->preco_pontos, // Grava como número negativo para o extrato bancário
                'motivo' => "Compra na Loja: " . $item->nome,
                'referencia_id' => $compra->id,
                'referencia_tipo' => UserPurchase::class
            ]);

            // Recalcular saldo final após a compra para devolver ao React
            $novoProgresso = $this->calcularProgressoUtilizador($userId);

            return response()->json([
                'message' => "Comprado com sucesso! Desbloqueaste: {$item->nome}.",
                'saldo_restante' => $novoProgresso['saldo_atual'],
                'compra' => $compra->load('item')
            ], 201);
        });
    }

    /**
     * Listar o histórico de compras efetuadas pelo jogador logado
     */
    public function meuHistoricoCompras()
    {
        $compras = UserPurchase::with('item')
            ->where('user_id', Auth::id())
            ->orderBy('data_compra', 'desc')
            ->get();

        return response()->json($compras, 200);
    }

    /**
     * =========================================================================
     * PARTE 3: QUADRO DE MISSÕES (LISTAGEM & ATUALIZAÇÃO DE PROGRESSO)
     * =========================================================================
     */

    /**
     * Listar as missões do utilizador logado (Filtradas por equipa/clube)
     */
    public function minhasMissoes(Request $request, $teamId)
    {
        $userId = Auth::id();

        // Resgatar todas as missões atribuídas ao jogador, trazendo as regras do catálogo principal
        $missoes = UserMission::with('missao')
            ->where('user_id', $userId)
            ->get()
            ->map(function ($userMission) {
                // Calcular percentagem de conclusão para ajudar os gráficos do React
                $objetivo = $userMission->objetivo_final > 0 ? $userMission->objetivo_final : 1;
                $percentagem = ($userMission->progresso_atual / $objetivo) * 100;
                $userMission->percentagem_progresso = min(round($percentagem, 1), 100);
                return $userMission;
            });

        return response()->json($missoes, 200);
    }

    /**
     * Incrementar ou atualizar o progresso de uma missão (Lógica executada internamente ou pelo Staff)
     */
    public function atualizarProgressoMissao(Request $request, $teamId, $userMissionId)
    {
        $request->validate([
            'incremento' => 'required|integer|min:1'
        ]);

        return DB::transaction(function () use ($userMissionId, $request) {
            // 1. Procurar o vínculo da missão do utilizador
            $userMission = UserMission::with('missao')->lockForUpdate()->find($userMissionId);

            if (!$userMission) {
                return response()->json(['message' => 'Registo de missão não encontrado.'], 404);
            }

            if ($userMission->estado === 'Concluida') {
                return response()->json(['message' => 'Esta missão já foi totalmente superada e recompensada!'], 400);
            }

            // 2. Somar o progresso atual com o incremento ganho
            $novoProgresso = $userMission->progresso_atual + $request->incremento;
            
            // Não deixar ultrapassar o teto máximo definido para o objetivo
            if ($novoProgresso >= $userMission->objetivo_final) {
                $userMission->progresso_atual = $userMission->objetivo_final;
                $userMission->estado = 'Concluida';
                $userMission->data_conclusao = now();
                $userMission->save();

                // 🔥 RECOMPENSA AUTOMÁTICA: Lançar os pontos no extrato bancário do jogador!
                $missaoRegras = $userMission->missao;
                
                UserPointsLog::create([
                    'user_id' => $userMission->user_id,
                    'pontos' => $missaoRegras->pontos_recompensa,
                    'motivo' => "Missão Concluída: " . $missaoRegras->titulo,
                    'referencia_id' => $userMission->id,
                    'referencia_tipo' => UserMission::class
                ]);

                return response()->json([
                    'message' => "🏆 Missão Superada! Recompensa de {$missaoRegras->pontos_recompensa} XP atribuída!",
                    'missao' => $userMission
                ], 200);
            }

            // 3. Se ainda não atingiu o objetivo, apenas atualiza o progresso em progresso
            $userMission->progresso_atual = $novoProgresso;
            $userMission->save();

            return response()->json([
                'message' => 'Progresso atualizado com sucesso.',
                'missao' => $userMission
            ], 200);
        });
    }

    /**
     * =========================================================================
     * PARTE 4: PAINEL ADMINISTRATIVO (EXCLUSIVO MISTER / PRESIDENTE / STAFF)
     * =========================================================================
     */

    /**
     * Criar um novo item na Loja XP
     */
    public function criarItemLoja(Request $request)
    {
        $request->validate([
            'nome' => 'required|string|max:100',
            'descricao' => 'nullable|string',
            'preco_pontos' => 'required|integer|min:1',
            'tipo' => 'required|string|max:30',
            'stock' => 'required|integer', // -1 para ilimitado, ou valor real
            'imagem_url' => 'nullable|string|max:255'
        ]);

        $item = ShopItem::create([
            'nome' => $request->nome,
            'descricao' => $request->descricao,
            'preco_pontos' => $request->preco_pontos,
            'tipo' => $request->tipo,
            'stock' => $request->stock,
            'imagem_url' => $request->imagem_url,
            'ativo' => true
        ]);

        return response()->json([
            'message' => 'Novo artigo adicionado à Loja XP com sucesso!',
            'item' => $item
        ], 201);
    }

    /**
     * Criar uma nova missão no catálogo e vinculá-la a um jogador (ou plantel)
     */
    public function criarEAtribuirMissao(Request $request, $teamId)
    {
        $request->validate([
            'titulo' => 'required|string|max:100',
            'descricao' => 'nullable|string',
            'tipo' => 'required|string|in:Clube,Equipa,Individual',
            'categoria' => 'required|string|max:30', // Ex: Assiduidade, Técnico, Tático
            'pontos_recompensa' => 'required|integer|min:1',
            'repetivel' => 'required|boolean',
            'objetivo_final' => 'required|integer|min:1',
            'user_id' => 'required|exists:users,id' // ID do jogador que vai receber a missão
        ]);

        return DB::transaction(function () use ($request, $teamId) {
            // 1. Criar a diretriz da missão no catálogo global
            $missao = Mission::create([
                'titulo' => $request->titulo,
                'descricao' => $request->descricao,
                'tipo' => $request->tipo,
                'categoria' => $request->categoria,
                'pontos_recompensa' => $request->pontos_recompensa,
                'repetivel' => $request->repetivel
            ]);

            // 2. Vincular a missão ao jogador específico criando o rastreador de progresso
            $userMission = UserMission::create([
                'user_id' => $request->user_id,
                'mission_id' => $missao->id,
                'estado' => 'Em_Progresso',
                'progresso_atual' => 0,
                'objetivo_final' => $request->objetivo_final
            ]);

            return response()->json([
                'message' => 'Missão criada e atribuída com sucesso ao atleta!',
                'missao_catalogo' => $missao,
                'vinculo_jogador' => $userMission
            ], 201);
        });
    }

    /**
     * Atribuir um Troféu / Conquista de forma manual na vitrine do Jogador
     */
    public function atribuirConquistaManual(Request $request, $teamId)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'titulo' => 'required|string|max:100',
            'descricao' => 'nullable|string',
            'epoca' => 'required|string|max:10', // Ex: 2025/2026
            'categoria' => 'required|string|max:30', // Ex: Disciplina, Estatística, Liderança
            'tipo' => 'required|string|in:Trofeu,Medalha,Diploma',
            'raridade' => 'required|string|in:Bronze,Prata,Ouro,Platina',
            'icone_url' => 'nullable|string'
        ]);

        $conquista = UserAchievement::create([
            'user_id' => $request->user_id,
            'team_id' => $teamId,
            'titulo' => $request->titulo,
            'epoca' => $request->epoca,
            'descricao' => $request->descricao,
            'categoria' => $request->categoria,
            'tipo' => $request->tipo,
            'raridade' => $request->raridade,
            'icone_url' => $request->icone_url,
            'data_conquista' => now()
        ]);

        return response()->json([
            'message' => "🏆 Conquista de {$request->raridade} imortalizada no perfil do atleta!",
            'conquista' => $conquista
        ], 201);
    }

    /**
     * Atualizar dados ou repor stock de um item da loja
     */
    public function atualizarItemLoja(Request $request, $itemId)
    {
        $item = ShopItem::find($itemId);
        if (!$item) {
            return response()->json(['message' => 'Artigo não encontrado.'], 404);
        }

        $request->validate([
            'nome' => 'string|max:100',
            'descricao' => 'nullable|string',
            'preco_pontos' => 'integer|min:1',
            'tipo' => 'string|max:30',
            'stock' => 'integer',
            'ativo' => 'boolean'
        ]);

        $item->update($request->all());

        return response()->json([
            'message' => 'Artigo da loja atualizado com sucesso!',
            'item' => $item
        ], 200);
    }

    /**
     * Remover ou desativar um item da loja (SoftDelete)
     */
    public function desativarItemLoja($itemId)
    {
        $item = ShopItem::find($itemId);
        if (!$item) {
            return response()->json(['message' => 'Artigo inexistente.'], 404);
        }

        $item->delete(); // Aplica o SoftDelete guardado no modelo
        return response()->json(['message' => 'Artigo removido da loja com sucesso!'], 200);
    }

    /**
     * 🔥 GATILHO AUTOMÁTICO: Chamado sempre que o Mister lança notas de 0-20
     */
    public function verificarGatilhosDeMissoes($userId, $teamId, $notaObtida, $tipoEvento)
    {
        // 1. GATILHO PARA A MISSÃO: "Muralha Defensiva" (Nota >= 16)
        if ($notaObtida >= 16) {
            $userMission = \App\Models\UserMission::where('user_id', $userId)
                ->where('estado', 'Em_Progresso')
                ->whereHas('missao', function ($query) {
                    $query->where('titulo', 'Muralha Defensiva');
                })
                ->first();

            if ($userMission) {
                // Instancia um Request fake para bater no método de incremento que já criámos
                $requestFake = new Request(['incremento' => 1]);
                $this->atualizarProgressoMissao($requestFake, $teamId, $userMission->id);
            }
        }

        // 2. GATILHO PARA A MISSÃO: "Foco Absoluto" (Ir aos treinos)
        // Se o tipo de evento for Treino, incrementa 1 presença na barra de progresso (0/5)
        if ($tipoEvento === 'Treino') {
            $userMissionTreino = \App\Models\UserMission::where('user_id', $userId)
                ->where('estado', 'Em_Progresso')
                ->whereHas('missao', function ($query) {
                    $query->where('titulo', 'Foco Absoluto');
                })
                ->first();

            if ($userMissionTreino) {
                $requestFake = new Request(['incremento' => 1]);
                $this->atualizarProgressoMissao($requestFake, $teamId, $userMissionTreino->id);
            }
        }
    }

}