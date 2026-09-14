<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Team;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class RadarController extends Controller
{
    private function verificarAcessoRestrito($teamId)
    {
        $userId = Auth::id();
        $team = Team::find($teamId);

        if (!$team) return false;

        $isDirecao = DB::table('club_roles')
            ->where('club_id', $team->club_id)
            ->where('user_id', $userId)
            ->where('ativo', true)
            ->whereNull('deleted_at')
            ->exists();

        if ($isDirecao) return true;

        $isTreinador = DB::table('team_user_roles')
            ->where('team_id', $teamId)
            ->where('user_id', $userId)
            ->whereIn('cargo', ['Treinador', 'Diretor', 'Staff'])
            ->whereNull('deleted_at')
            ->exists();

        return $isTreinador;
    }

    public function obterDadosRadar(Request $request, $teamId)
    {
        if (!$this->verificarAcessoRestrito($teamId)) {
            return response()->json(['message' => 'Acesso estritamente reservado à Equipa Técnica e Direção.'], 403);
        }

        // ⏱️ FILTROS DE TEMPO VIA QUERY PARAMS
        $dataInicio = $request->query('data_inicio'); 
        $dataFim = $request->query('data_fim');       

        // Lógica reutilizável usando a coluna real do teu Model: e.data_inicio
        $aplicarFiltroData = function($query) use ($dataInicio, $dataFim) {
            if ($dataInicio) { $query->where('e.data_inicio', '>=', $dataInicio); }
            if ($dataFim) { $query->where('e.data_inicio', '<=', $dataFim); }
            return $query;
        };

        // --- 🛡️ SUBQUERY DISCIPLINAR ---
        $subDisciplinaQuery = DB::table('match_stats as ms')
            ->join('events as ev_d', 'ms.event_id', '=', 'ev_d.id')
            ->join('team_user_roles as tur_d', function($join) use ($teamId) {
                $join->on('ms.user_id', '=', 'tur_d.user_id')
                     ->where('tur_d.team_id', '=', $teamId)
                     ->where('tur_d.cargo', '=', 'Jogador')
                     ->whereNull('tur_d.deleted_at');
            })
            ->select(
                'ms.user_id',
                DB::raw('COALESCE(SUM(ms.cartoes_amarelos), 0) as total_amarelos'),
                DB::raw('COALESCE(SUM(ms.cartoes_vermelhos), 0) as total_vermelhos'),
                DB::raw('COALESCE(SUM(ms.minutos_jogados), 0) as minutes_totais')
            );
        if ($dataInicio) { $subDisciplinaQuery->where('ev_d.data_inicio', '>=', $dataInicio); }
        if ($dataFim) { $subDisciplinaQuery->where('ev_d.data_inicio', '<=', $dataFim); }
        $subDisciplina = $subDisciplinaQuery->groupBy('ms.user_id');

        // --- 1. TOP 10 TITULARES RECOMENDADOS ---
        $titularesQuery = DB::table('users as u')
            ->join('team_user_roles as tur', function($join) use ($teamId) {
                $join->on('u.id', '=', 'tur.user_id')
                     ->where('tur.team_id', '=', $teamId)
                     ->where('tur.cargo', '=', 'Jogador')
                     ->whereNull('tur.deleted_at');
            })
            ->join('player_evaluations as pe', 'u.id', '=', 'pe.user_id')
            ->join('events as e', 'pe.evento_id', '=', 'e.id')
            ->leftJoin('match_stats as ms', function($join) {
                $join->on('u.id', '=', 'ms.user_id')->on('pe.evento_id', '=', 'ms.event_id');
            });
        
        $titularesQuery = $aplicarFiltroData($titularesQuery);
        $titulares = $titularesQuery->select(
                'u.id', 'u.nome', 'u.apelido', 'u.foto_perfil',
                DB::raw('ROUND(AVG(pe.nota_principal), 1) as media_global'),
                DB::raw("
                    ROUND(
                        (AVG(CASE WHEN e.tipo = 'Treino' THEN pe.nota_principal END) * 0.3) + 
                        (COALESCE(AVG(CASE WHEN e.tipo = 'Jogo' AND e.tipo_jogo LIKE '%Oficial%' THEN pe.nota_principal END), 12) * 0.56) + 
                        (COALESCE(AVG(CASE WHEN e.tipo = 'Jogo' AND e.tipo_jogo LIKE '%Amigável%' THEN pe.nota_principal END), 12) * 0.14) +
                        (COALESCE(SUM(ms.golos + ms.assistencias), 0) * 0.1), 1
                    ) as indice_titularidade
                ")
            )
            ->groupBy('u.id', 'u.nome', 'u.apelido', 'u.foto_perfil')
            ->orderBy('indice_titularidade', 'desc')
            ->take(10)->get();

        // --- 2. COMPARAÇÃO TREINO VS JOGO ---
        $perfilCompetitivoQuery = DB::table('users as u')
            ->join('team_user_roles as tur', function($join) use ($teamId) {
                $join->on('u.id', '=', 'tur.user_id')
                     ->where('tur.team_id', '=', $teamId)
                     ->where('tur.cargo', '=', 'Jogador')
                     ->whereNull('tur.deleted_at');
            })
            ->join('player_evaluations as pe', 'u.id', '=', 'pe.user_id')
            ->join('events as e', 'pe.evento_id', '=', 'e.id');
        
        $perfilCompetitivoQuery = $aplicarFiltroData($perfilCompetitivoQuery);
        $perfilCompetitivo = $perfilCompetitivoQuery->select(
                'u.id', 'u.nome', 'u.apelido',
                DB::raw("ROUND(AVG(CASE WHEN e.tipo = 'Treino' THEN pe.nota_principal END), 1) as media_treino"),
                DB::raw("ROUND(AVG(CASE WHEN e.tipo = 'Jogo' THEN pe.nota_principal END), 1) as media_jogo")
            )
            ->groupBy('u.id', 'u.nome', 'u.apelido')->get()
            ->map(function ($atleta) {
                $mediaTreino = $atleta->media_treino ?? 0;
                $mediaJogo = $atleta->media_jogo ?? 0;
                $diff = $mediaJogo - $mediaTreino;
                $atleta->perfil = $diff > 0.8 ? 'Jogador de Domingo' : ($diff < -0.8 ? 'Leão de Treino' : 'Equilibrado');
                $atleta->diferencial = round($diff, 1);
                return $atleta;
            });

        // --- 3. CONSISTÊNCIA E REGULARIDADE ---
        $regularidadeQuery = DB::table('users as u')
            ->join('team_user_roles as tur', function($join) use ($teamId) {
                $join->on('u.id', '=', 'tur.user_id')
                     ->where('tur.team_id', '=', $teamId)
                     ->where('tur.cargo', '=', 'Jogador')
                     ->whereNull('tur.deleted_at');
            })
            ->join('player_evaluations as pe', 'u.id', '=', 'pe.user_id')
            ->join('events as e', 'pe.evento_id', '=', 'e.id');
        
        $regularidadeQuery = $aplicarFiltroData($regularidadeQuery);
        $regularidade = $regularidadeQuery->select(
                'u.id', 'u.nome', 'u.apelido',
                DB::raw('COUNT(pe.id) as total_notas'),
                DB::raw('ROUND(CAST(STDDEV(pe.nota_principal) AS NUMERIC), 2) as desvio_padrao')
            )
            ->groupBy('u.id', 'u.nome', 'u.apelido')
            ->having(DB::raw('COUNT(pe.id)'), '>=', 2)->get()
            ->map(function ($atleta) {
                $atleta->estatuto = $atleta->desvio_padrao <= 1.3 ? 'Super Regular' : 'Irregular (Picos de Forma)';
                return $atleta;
            })
            ->sortBy('desvio_padrao')->values();

        // --- 4. RISCO DISCIPLINAR REAL ---
        $agressividadeQuery = DB::table('users as u')
            ->join('team_user_roles as tur', function($join) use ($teamId) {
                $join->on('u.id', '=', 'tur.user_id')
                     ->where('tur.team_id', '=', $teamId)
                     ->where('tur.cargo', '=', 'Jogador')
                     ->whereNull('tur.deleted_at');
            })
            ->leftJoinSub($subDisciplina, 'disc', function($join) { $join->on('u.id', '=', 'disc.user_id'); })
            ->leftJoin('player_evaluations as pe', 'u.id', '=', 'pe.user_id')
            ->join('events as e', 'pe.evento_id', '=', 'e.id');
        
        $agressividadeQuery = $aplicarFiltroData($agressividadeQuery);
        $agressividade = $agressividadeQuery->select(
                'u.id', 'u.nome', 'u.apelido',
                DB::raw('COALESCE(disc.total_amarelos, 0) as amarelos'),
                DB::raw('COALESCE(disc.total_vermelhos, 0) as vermelhos'),
                DB::raw('ROUND(AVG(pe.nota_mental), 1) as estabilidade_mental')
            )
            ->groupBy('u.id', 'u.nome', 'u.apelido', 'disc.total_amarelos', 'disc.total_vermelhos')
            ->orderBy(DB::raw('(COALESCE(disc.total_amarelos, 0) * 2) + (COALESCE(disc.total_vermelhos, 0) * 5)'), 'desc')
            ->take(10)->get();

        // --- 5. ALERTA DE QUEBRA DE FORMA ---
        $subNotasRecentes = DB::table('player_evaluations')
            ->select('user_id', 'nota_principal', DB::raw('ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY data_avaliacao DESC, id DESC) as rn'));

        $mediaRecente = DB::table(DB::raw("({$subNotasRecentes->toSql()}) as rec"))
            ->select('user_id', DB::raw('AVG(nota_principal) as avg_recente'))
            ->where('rn', '<=', 2)->groupBy('user_id');

        $quebraFormaQuery = DB::table('users as u')
            ->join('team_user_roles as tur', function($join) use ($teamId) {
                $join->on('u.id', '=', 'tur.user_id')
                     ->where('tur.team_id', '=', $teamId)
                     ->where('tur.cargo', '=', 'Jogador')
                     ->whereNull('tur.deleted_at');
            })
            ->join('player_evaluations as pe', 'u.id', '=', 'pe.user_id')
            ->join('events as e', 'pe.evento_id', '=', 'e.id')
            ->joinSub($mediaRecente, 'mr', function($join) { $join->on('u.id', '=', 'mr.user_id'); });
        
        $quebraFormaQuery = $aplicarFiltroData($quebraFormaQuery);
        $quebraForma = $quebraFormaQuery->select(
                'u.id', 'u.nome', 'u.apelido',
                DB::raw('ROUND(AVG(pe.nota_principal), 1) as media_epoca'),
                DB::raw('ROUND(mr.avg_recente, 1) as media_recente'),
                DB::raw('ROUND(mr.avg_recente - AVG(pe.nota_principal), 1) as delta_tendencia')
            )
            ->groupBy('u.id', 'u.nome', 'u.apelido', 'mr.avg_recente')
            ->orderBy('delta_tendencia', 'asc')
            ->take(5)->get();

        // --- 6. RENDIMENTO PRODUTIVO POR 90 MINUTOS ---
        $produtividade90Query = DB::table('users as u')
            ->join('team_user_roles as tur', function($join) use ($teamId) {
                $join->on('u.id', '=', 'tur.user_id')
                     ->where('tur.team_id', '=', $teamId)
                     ->where('tur.cargo', '=', 'Jogador')
                     ->whereNull('tur.deleted_at');
            })
            ->join('match_stats as ms', 'u.id', '=', 'ms.user_id')
            ->join('events as e', 'ms.event_id', '=', 'e.id');
        
        $produtividade90Query = $aplicarFiltroData($produtividade90Query);
        $produtividade90 = $produtividade90Query->select(
                'u.id', 'u.nome', 'u.apelido',
                DB::raw('SUM(ms.minutos_jogados) as minutos_totais'),
                DB::raw('SUM(ms.golos + ms.assistencias) as acoes_totais'),
                DB::raw('ROUND(CASE WHEN SUM(ms.minutos_jogados) > 0 THEN (SUM(ms.golos + ms.assistencias)::numeric / SUM(ms.minutos_jogados)) * 90 ELSE 0 END, 2) as p90')
            )
            ->groupBy('u.id', 'u.nome', 'u.apelido')
            ->having(DB::raw('SUM(ms.minutos_jogados)'), '>=', 45)
            ->orderBy('p90', 'desc')
            ->take(5)->get();

        // --- 7. O TERMÓMETRO ---
        $termometroQuery = DB::table('users as u')
            ->join('team_user_roles as tur', function($join) use ($teamId) {
                $join->on('u.id', '=', 'tur.user_id')
                     ->where('tur.team_id', '=', $teamId)
                     ->where('tur.cargo', '=', 'Jogador')
                     ->whereNull('tur.deleted_at');
            })
            ->join('player_evaluations as pe', 'u.id', '=', 'pe.user_id')
            ->join('events as e', 'pe.evento_id', '=', 'e.id')
            ->join('match_stats as ms', function($join) { $join->on('u.id', '=', 'ms.user_id')->on('pe.evento_id', '=', 'ms.event_id'); });
        
        $termometroQuery = $aplicarFiltroData($termometroQuery);
        $termometro = $termometroQuery->select(
                'u.id', 'u.nome', 'u.apelido',
                DB::raw('ROUND(AVG(pe.nota_principal), 1) as media_pessoal_jogos'),
                DB::raw('ROUND(AVG(pe.nota_mental * 0.6 + pe.nota_tecnica * 0.4), 1) as indice_influencia')
            )
            ->groupBy('u.id', 'u.nome', 'u.apelido')
            ->orderBy('indice_influencia', 'desc')
            ->take(5)->get();

        // --- 8. MATRIZES DEFENSIVA E OFENSIVA ---
        $especialistasDefesaQuery = DB::table('users as u')
            ->join('team_user_roles as tur', function($join) use ($teamId) {
                $join->on('u.id', '=', 'tur.user_id')
                     ->where('tur.team_id', '=', $teamId)
                     ->where('tur.cargo', '=', 'Jogador')
                     ->whereNull('tur.deleted_at');
            })
            ->join('player_evaluations as pe', 'u.id', '=', 'pe.user_id')
            ->join('events as e', 'pe.evento_id', '=', 'e.id');
        
        $especialistasDefesaQuery = $aplicarFiltroData($especialistasDefesaQuery);
        $especialistasDefesa = $especialistasDefesaQuery->select(
                'u.id', 'u.nome', 'u.apelido',
                DB::raw('ROUND(AVG(pe.nota_defesa), 1) as defensivo'),
                DB::raw('ROUND(AVG(pe.nota_mental), 1) as mental'),
                DB::raw('ROUND(AVG(pe.nota_velocidade), 1) as velocidade'),
                DB::raw('ROUND((AVG(pe.nota_defesa) * 0.5) + (AVG(pe.nota_mental) * 0.3) + (AVG(pe.nota_velocidade) * 0.2), 1) as pontuacao_setorial')
            )
            ->groupBy('u.id', 'u.nome', 'u.apelido')->orderBy('pontuacao_setorial', 'desc')->take(5)->get();

        $especialistasAtaqueQuery = DB::table('users as u')
            ->join('team_user_roles as tur', function($join) use ($teamId) {
                $join->on('u.id', '=', 'tur.user_id')
                     ->where('tur.team_id', '=', $teamId)
                     ->where('tur.cargo', '=', 'Jogador')
                     ->whereNull('tur.deleted_at');
            })
            ->join('player_evaluations as pe', 'u.id', '=', 'pe.user_id')
            ->join('events as e', 'pe.evento_id', '=', 'e.id');
        
        $especialistasAtaqueQuery = $aplicarFiltroData($especialistasAtaqueQuery);
        $especialistasAtaque = $especialistasAtaqueQuery->select(
                'u.id', 'u.nome', 'u.apelido',
                DB::raw('ROUND(AVG(pe.nota_tecnica), 1) as tecnica'),
                DB::raw('ROUND(AVG(pe.nota_passe), 1) as passe'),
                DB::raw('ROUND(AVG(pe.nota_remate), 1) as remate'),
                DB::raw('ROUND((AVG(pe.nota_tecnica) * 0.4) + (AVG(pe.nota_passe) * 0.3) + (AVG(pe.nota_remate) * 0.3), 1) as pontuacao_setorial')
            )
            ->groupBy('u.id', 'u.nome', 'u.apelido')->orderBy('pontuacao_setorial', 'desc')->take(5)->get();

        // --- 9. O REI DAS ASSISTÊNCIAS VS PASSE ---
        $reisDoPasseQuery = DB::table('users as u')
            ->join('team_user_roles as tur', function($join) use ($teamId) {
                $join->on('u.id', '=', 'tur.user_id')
                     ->where('tur.team_id', '=', $teamId)
                     ->where('tur.cargo', '=', 'Jogador')
                     ->whereNull('tur.deleted_at');
            })
            ->join('player_evaluations as pe', 'u.id', '=', 'pe.user_id')
            ->join('events as e', 'pe.evento_id', '=', 'e.id')
            ->leftJoin('match_stats as ms', function($join) {
                $join->on('u.id', '=', 'ms.user_id')->on('pe.evento_id', '=', 'ms.event_id');
            });
        
        $reisDoPasseQuery = $aplicarFiltroData($reisDoPasseQuery);
        $reisDoPasse = $reisDoPasseQuery->select(
                'u.id', 'u.nome', 'u.apelido',
                DB::raw('ROUND(AVG(pe.nota_passe), 1) as media_nota_passe'),
                DB::raw('COALESCE(SUM(ms.assistencias), 0) as total_assistencias'),
                DB::raw('ROUND((AVG(pe.nota_passe) * 0.7) + (COALESCE(SUM(ms.assistencias), 0) * 0.3), 1) as indice_garçon')
            )
            ->groupBy('u.id', 'u.nome', 'u.apelido')->orderBy('indice_garçon', 'desc')->take(5)->get();

        // --- 10. EVOLUÇÃO TEMPORAL COLETIVA POR MÊS ---
        $evolucaoTemporalQuery = DB::table('player_evaluations as pe')
            ->join('events as e', 'pe.evento_id', '=', 'e.id')
            ->where('e.team_id', $teamId);
        
        $evolucaoTemporalQuery = $aplicarFiltroData($evolucaoTemporalQuery);
        $evolucaoTemporal = $evolucaoTemporalQuery->select(
                DB::raw("TO_CHAR(pe.data_avaliacao, 'YYYY-MM') as mes"),
                DB::raw('ROUND(AVG(pe.nota_principal), 1) as media_principal_mes'),
                DB::raw('ROUND(AVG(pe.nota_tecnica), 1) as media_tecnica_mes'),
                DB::raw('ROUND(AVG(pe.nota_mental), 1) as media_mental_mes')
            )
            ->groupBy(DB::raw("TO_CHAR(pe.data_avaliacao, 'YYYY-MM')"))->orderBy('mes', 'asc')->get();

        // --- 🚀 11. INDEX DE CAPITANIA & LIDERANÇA (Com Tranca Ativa Anti-Treinadores Fantasmas) ---
        $capitãesQuery = DB::table('users as u')
            ->join('team_user_roles as tur', function($join) use ($teamId) {
                $join->on('u.id', '=', 'tur.user_id')
                     ->where('tur.team_id', '=', $teamId)
                     ->where('tur.cargo', '=', 'Jogador')
                     ->whereNull('tur.deleted_at');
            })
            ->join('player_evaluations as pe', 'u.id', '=', 'pe.user_id')
            ->join('events as e', 'pe.evento_id', '=', 'e.id')
            ->leftJoinSub($subDisciplina, 'disc', function($join) { $join->on('u.id', '=', 'disc.user_id'); })
            // 🔥 TRANCA SUPREMA: Garante que o ID do jogador não pertence a NENHUM Treinador/Staff ativo neste team_id
            ->whereNotExists(function ($query) use ($teamId) {
                $query->select(DB::raw(1))
                    ->from('team_user_roles as staff_check')
                    ->whereColumn('staff_check.user_id', 'u.id')
                    ->where('staff_check.team_id', $teamId)
                    ->whereIn('staff_check.cargo', ['Treinador', 'Staff', 'Diretor'])
                    ->whereNull('staff_check.deleted_at');
            });
        
        $capitãesQuery = $aplicarFiltroData($capitãesQuery);
        $capitães = $capitãesQuery->select(
                'u.id', 'u.nome', 'u.apelido',
                DB::raw('ROUND(AVG(pe.nota_mental), 1) as estabilidade_mental'),
                DB::raw('COALESCE(disc.minutes_totais, 0) as minutos_acumulados'),
                DB::raw('COALESCE(disc.total_amarelos, 0) as amarelos'),
                DB::raw('COALESCE(disc.total_vermelhos, 0) as vermelhos'),
                DB::raw("ROUND((AVG(pe.nota_mental) * 0.5) + (LEAST(COALESCE(disc.minutes_totais, 0) / 90.0, 20.0) * 0.4) - (COALESCE(disc.total_amarelos, 0) * 0.5) - (COALESCE(disc.total_vermelhos, 0) * 2.0), 1) as indice_lideranca")
            )
            ->groupBy('u.id', 'u.nome', 'u.apelido', 'disc.minutes_totais', 'disc.total_amarelos', 'disc.total_vermelhos')
            ->orderBy('indice_lideranca', 'desc')->take(5)->get();

        // --- 🚀 12. FUNÇÃO INTERNA TOP ATRIBUTO INDIVIDUAL (Com Tranca Ativa Anti-Treinadores) ---
        $obterTopAtributo = function($atributo) use ($teamId, $aplicarFiltroData) {
            $q = DB::table('users as u')
                ->join('team_user_roles as tur', function($join) use ($teamId) {
                    $join->on('u.id', '=', 'tur.user_id')
                         ->where('tur.team_id', '=', $teamId)
                         ->where('tur.cargo', '=', 'Jogador')
                         ->whereNull('tur.deleted_at');
                })
                ->join('player_evaluations as pe', 'u.id', '=', 'pe.user_id')
                ->join('events as e', 'pe.evento_id', '=', 'e.id')
                // 🔥 TRANCA SUPREMA INTERNA
                ->whereNotExists(function ($query) use ($teamId) {
                    $query->select(DB::raw(1))
                        ->from('team_user_roles as staff_check')
                        ->whereColumn('staff_check.user_id', 'u.id')
                        ->where('staff_check.team_id', $teamId)
                        ->whereIn('staff_check.cargo', ['Treinador', 'Staff', 'Diretor'])
                        ->whereNull('staff_check.deleted_at');
                });
            $q = $aplicarFiltroData($q);
            return $q->select('u.id', 'u.nome', 'u.apelido', DB::raw("ROUND(AVG(pe.nota_{$atributo}), 1) as score"))
                ->groupBy('u.id', 'u.nome', 'u.apelido')->orderBy('score', 'desc')->take(5)->get();
        };

        // --- 13. RAIO-X COLETIVO ---
        $raioXColetivoQuery = DB::table('player_evaluations as pe')
            ->join('events as e', 'pe.evento_id', '=', 'e.id')
            ->where('e.team_id', $teamId);
        
        $raioXColetivoQuery = $aplicarFiltroData($raioXColetivoQuery);
        $raioXColetivo = $raioXColetivoQuery->select(
                DB::raw('ROUND(AVG(pe.nota_remate), 1) as remate'),
                DB::raw('ROUND(AVG(pe.nota_passe), 1) as passe'),
                DB::raw('ROUND(AVG(pe.nota_velocidade), 1) as velocidade'),
                DB::raw('ROUND(AVG(pe.nota_tecnica), 1) as tecnica'),
                DB::raw('ROUND(AVG(pe.nota_defesa), 1) as defesa'),
                DB::raw('ROUND(AVG(pe.nota_mental), 1) as mental')
            )->first();

        return response()->json([
            'recomendacao_titulares'    => $titulares,
            'perfil_competitivo'        => $perfilCompetitivo,
            'regularidade_consistencia' => $regularidade,
            'agressividade_disciplina'  => $agressividade,
            'quebra_forma'              => $quebraForma,
            'produtividade_90'          => $produtividade90,
            'termometro'                => $termometro,
            'especialistas_defesa'      => $especialistasDefesa,
            'especialistas_ataque'      => $especialistasAtaque,
            'reis_do_passe'             => $reisDoPasse,
            'evolucao_temporal'         => $evolucaoTemporal,
            'raio_x_coletivo'           => $raioXColetivo,
            'ranking_lideres'           => $capitães,
            'top_individuais' => [
                'remate'     => $obterTopAtributo('remate'),
                'passe'      => $obterTopAtributo('passe'),
                'velocidade' => $obterTopAtributo('velocidade'),
                'tecnica'    => $obterTopAtributo('tecnica'),
                'defesa'     => $obterTopAtributo('defesa'),
                'mental'     => $obterTopAtributo('mental'),
            ]
        ], 200);
    }
}