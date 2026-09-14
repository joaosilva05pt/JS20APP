<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ClubController;
use App\Http\Controllers\ClubAdminController;
use App\Http\Controllers\InvitationController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\TeamController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\PlayerEvaluationController;
use App\Http\Controllers\DashboardAnalitycsController;
use App\Http\Controllers\PranchetaTaticaController;
use App\Http\Controllers\ComunicacaoController;
use App\Http\Controllers\DeptoMedicoController;
use App\Http\Controllers\NutritionGuideController;
use App\Http\Controllers\GamificationController;
use App\Http\Controllers\TeamSettingsController;
use App\Http\Controllers\RadarController; 

// =========================================================
// ROTAS PÚBLICAS
// =========================================================
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// =========================================================
// ROTAS PROTEGIDAS (Apenas utilizadores logados)
// =========================================================
Route::middleware('auth:sanctum')->group(function () {
    
    // Rota para o React saber quem está logado
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Rota para fazer o Logout
    Route::post('/logout', [AuthController::class, 'logout']);

    // Gestão de Clubes (Básica)
    Route::post('/clubs', [ClubController::class, 'store']);
    Route::get('/meu-clube', [ClubController::class, 'meuClube']);

    // Administração Avançada do Clube
    Route::get('/clubs/{clubId}/membros', [ClubAdminController::class, 'listarMembros']);
    Route::post('/clubs/{clubId}/membros', [ClubAdminController::class, 'adicionarMembro']);
    Route::post('/clubs/{clubId}/transferir-presidencia', [ClubAdminController::class, 'transferirPresidencia']);
    Route::delete('/clubs/{clubId}/membros/{userId}', [ClubAdminController::class, 'removerMembro']);
    Route::put('/clubs/{clubId}/membros/{userId}/cargo', [ClubAdminController::class, 'atualizarCargo']);
    Route::get('/clubs/{clubId}/convites', [ClubAdminController::class, 'listarConvitesPendentes']);
    Route::delete('/clubs/{clubId}/convites/{invitationId}', [ClubAdminController::class, 'cancelarConvite']);
    Route::delete('/clubs/{clubId}/sair', [ClubAdminController::class, 'sairDoClube']);
    Route::get('/clubs/{clubId}', [ClubAdminController::class, 'detalhesClube']);
    Route::put('/clubs/{clubId}', [ClubAdminController::class, 'atualizarClube']);
    Route::post('/clubs/{clubId}/dissolver', [ClubAdminController::class, 'dissolverClube']);

    // Inbox de Convites do Utilizador
    Route::get('/convites', [InvitationController::class, 'meusConvites']);
    Route::post('/convites/{id}/aceitar', [InvitationController::class, 'aceitar']);
    Route::post('/convites/{id}/rejeitar', [InvitationController::class, 'rejeitar']);

    // Perfil do Utilizador
    Route::put('/perfil', [ProfileController::class, 'update']);

    // Gestão de Equipas (Estrutura e Convites)
    Route::post('/teams', [TeamController::class, 'store']);
    Route::post('/teams/invite', [InvitationController::class, 'enviarConviteEquipa']);
    
    // Listagens do Dashboard Geral
    Route::get('/meu-clube/equipas', [TeamController::class, 'listarEquipasDoMeuClube']);
    Route::get('/meu-balneario/equipas', [TeamController::class, 'minhasEquipasVinculadas']);
    Route::get('/meu-balneario/recentes', [TeamController::class, 'minhasEquipasRecentes']);

    // =========================================================
    // CALENDÁRIO & EVENTOS (Gestão de Balneário)
    // =========================================================
    // 1. Carregar a agenda da semana
    Route::get('/calendar/weekly', [EventController::class, 'getWeeklyCalendar']);
    
    // 2. Confirmar presença no evento
    Route::post('/events/{eventId}/confirm', [EventController::class, 'confirmarPresenca']);
    
    // 3. Submeter justificação de ausência
    Route::post('/events/{eventId}/justify', [EventController::class, 'recusarComJustificacao']);
    // 4. Criar um novo evento (Mister)
    Route::post('/teams/{id}/events', [EventController::class, 'store']);

    //sROTAS DE GESTÃO DO EVENTO (MISTER)
    Route::get('/events/{id}/detalhes', [EventController::class, 'getEventoDetalhes']);
    Route::put('/events/{id}', [EventController::class, 'update']);
    Route::patch('/events/{id}/finalizar', [EventController::class, 'finalizarEvento']);
    Route::delete('/events/{eventId}', [EventController::class, 'destroy']);

    // =========================================================
    // AVALIAÇÕES & RENDIMENTO (0-20 + MATCH STATS)
    // =========================================================
    Route::get('/teams/{id}/events-to-evaluate', [PlayerEvaluationController::class, 'getEventsToEvaluate']);
    Route::get('/events/{eventId}/players-present', [PlayerEvaluationController::class, 'getPlayersPresent']);
    Route::post('/events/{eventId}/evaluations', [PlayerEvaluationController::class, 'submeterAvaliacaoLote']);

    // =========================================================
    // CRITÉRIOS E AVALIAÇÕES DESPORTIVAS (MISTER)
    // =========================================================
    Route::get('/teams/{id}/events-to-evaluate', [PlayerEvaluationController::class, 'getEventsToEvaluate']);
    Route::get('/events/{eventId}/players-present', [PlayerEvaluationController::class, 'getPlayersPresent']);
    Route::post('/events/{eventId}/evaluations', [PlayerEvaluationController::class, 'submeterAvaliacaoLote']);

    Route::get('/teams/{id}/analytics-dashboard', [DashboardAnalitycsController::class, 'getDashboardData']);

    Route::get('/teams/{teamId}/tactical-plays', [PranchetaTaticaController::class, 'index']);
    Route::get('/teams/{teamId}/tactical-plays/{playId}', [PranchetaTaticaController::class, 'show']);
    Route::post('/teams/{teamId}/tactical-plays', [PranchetaTaticaController::class, 'store']);
    Route::patch('/teams/{teamId}/tactical-plays/{playId}/aprovar', [PranchetaTaticaController::class, 'aprovarSugestao']);
    Route::delete('/teams/{teamId}/tactical-plays/{playId}', [PranchetaTaticaController::class, 'destroy']);

    Route::get('/teams/{teamId}/posts', [ComunicacaoController::class, 'index']);
    Route::post('/teams/{teamId}/posts', [ComunicacaoController::class, 'store']);
    Route::post('/teams/{teamId}/posts/{postId}/comments', [ComunicacaoController::class, 'storeComment']);
    Route::delete('/teams/{teamId}/posts/{postId}', [ComunicacaoController::class, 'destroy']);

    Route::get('/teams/{teamId}/medical-records', [DeptoMedicoController::class, 'index']);
    Route::post('/teams/{teamId}/medical-records', [DeptoMedicoController::class, 'store']);
    Route::put('/teams/{teamId}/medical-records/{id}', [DeptoMedicoController::class, 'update']);

    Route::get('/teams/{teamId}/nutrition-guides', [NutritionGuideController::class, 'index']);
    Route::post('/teams/{teamId}/nutrition-guides', [NutritionGuideController::class, 'store']);
    Route::put('/teams/{teamId}/nutrition-guides/{id}', [NutritionGuideController::class, 'update']);
    Route::delete('/teams/{teamId}/nutrition-guides/{id}', [NutritionGuideController::class, 'destroy']);

    // =========================================================
    // MOTOR DE GAMIFICAÇÃO & LOJA XP (SISTEMA DE 0-20 E PONTOS)
    // =========================================================
    
    // 1. Rotas do Perfil do Atleta, Transações e Conquistas
    Route::get('/teams/{teamId}/gamification/profile', [GamificationController::class, 'getPerfilJogador']);
    Route::get('/teams/{teamId}/gamification/missions', [GamificationController::class, 'minhasMissoes']);
    Route::get('/teams/{teamId}/gamification/shop', [GamificationController::class, 'listarItensLoja']);
    Route::get('/gamification/my-purchases', [GamificationController::class, 'meuHistoricoCompras']);
    
    // 2. Rota de Ação Financeira (Comprar)
    Route::post('/teams/{teamId}/gamification/shop/{itemId}/buy', [GamificationController::class, 'comprarItem']);

    // 3. Painel Administrativo e Atribuições (Mister / Presidente / Staff)
    Route::post('/teams/{teamId}/gamification/admin/shop', [GamificationController::class, 'criarItemLoja']);
    Route::put('/gamification/admin/shop/{itemId}', [GamificationController::class, 'atualizarItemLoja']);
    Route::delete('/gamification/admin/shop/{itemId}', [GamificationController::class, 'desativarItemLoja']);
    
    Route::post('/teams/{teamId}/gamification/admin/missions', [GamificationController::class, 'criarEAtribuirMissao']);
    Route::patch('/teams/{teamId}/gamification/admin/missions/{userMissionId}/progress', [GamificationController::class, 'atualizarProgressoMissao']);
    Route::post('/teams/{teamId}/gamification/admin/achievements', [GamificationController::class, 'atribuirConquistaManual']);
    Route::post('/teams/{teamId}/gamification/donate', [GamificationController::class, 'doarPontosParaEquipa']);

    // Definições e Encerramento de Época do Escalão
    // Definições e Encerramento de Época por Staff do Clube
    Route::get('/teams/{teamId}/settings', [TeamSettingsController::class, 'getDefinicoesInfo']);
    Route::patch('/teams/{teamId}/settings/archive', [TeamSettingsController::class, 'arquivarEquipa']);

    // Rota da Central de Inteligência / Radar Tático
    Route::get('/teams/{teamId}/radar-analytics', [RadarController::class, 'obterDadosRadar']);



    // =========================================================
    // ROTAS DE CAMPO (Exigem validação de acesso ao Balneário)
    // =========================================================
    Route::middleware('team.access')->group(function () {
        
        // Historial de cliques inteligente
        Route::post('/teams/{id}/visit', [TeamController::class, 'registarVisita']);
        
        // Listagem de ativos no escalão
        Route::get('/teams/{id}/membros', [TeamController::class, 'verMembrosEquipa']);

        // 👥 MOTOR INTERATIVO DE MEMBROS (100% ALINHADO E PROTEGIDO COM {id})
        Route::put('/teams/{id}/membros/{userId}/editar', [TeamController::class, 'editarMembroEquipa']);
        Route::delete('/teams/{id}/membros/{userId}', [TeamController::class, 'removerMembroEquipa']);
        Route::get('/teams/{id}/team-invites-pendentes', [TeamController::class, 'listarTeamConvitesPendentes']);
        Route::delete('/teams/{id}/team-invites/{inviteId}', [TeamController::class, 'cancelarTeamConvite']);
        
        
    });

});