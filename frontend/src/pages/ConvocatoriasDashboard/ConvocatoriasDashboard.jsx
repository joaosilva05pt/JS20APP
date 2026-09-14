import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import SidebarBalneario from '../../components/SidebarBalneario/SidebarBalneario';
import Chart from 'react-apexcharts';
import './ConvocatoriasDashboard.css';

export default function ConvocatoriasDashboard() {
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dadosDashboard, setDadosDashboard] = useState(null);

  const [activeTab, setActiveTab] = useState('coletivo'); 
  const [filtroTempo, setFiltroTempo] = useState('tudo'); 
  const [filtroTipoEvento, setFiltroTipoEvento] = useState('todos'); 
  const [sessaoEspecificaId, setSessaoEspecificaId] = useState('');

  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [playerAId, setPlayerAId] = useState('');
  const [playerBId, setPlayerBId] = useState('');

  useEffect(() => {
    carregarDadosAnaliticos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const carregarDadosAnaliticos = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`http://localhost:8000/api/teams/${id}/analytics-dashboard`, { 
        method: 'GET',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        credentials: 'include' 
      });

      if (res.ok) {
        const data = await res.json();
        setDadosDashboard(data);
        
        if (data.modo === 'direcao' && data.jogadores?.length > 0) {
          setSelectedPlayerId(data.jogadores[0].id.toString());
          if (data.jogadores.length > 1) {
            setPlayerAId(data.jogadores[0].id.toString());
            setPlayerBId(data.jogadores[1].id.toString());
          }
          if (data.sessoes?.length > 0) {
            setSessaoEspecificaId(data.sessoes[0].id.toString());
          }
        }
      } else {
        setError('Erro ao carregar os dados de rendimento.');
      }
    } catch (err) {
      setError('Falha de ligação ao servidor desportivo.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="ge-loading">A calibrar motor analítico temporal...</div>;
  if (error) return <div className="ge-alert ge-error">{error}</div>;
  if (!dadosDashboard) return <div className="ge-alert ge-error">Sem dados disponíveis.</div>;

  const obterCorNota = (nota) => {
    const n = parseFloat(nota);
    if (isNaN(n) || n === 0) return '#475569';
    if (n >= 16) return '#22c55e';
    if (n >= 10) return '#3b82f6';
    return '#ef4444';
  };

  const filtrarRegistos = (historico) => {
    if (!historico) return [];
    let filtrados = historico;

    if (filtroTipoEvento !== 'todos') {
      filtrados = filtrados.filter(h => h.tipo === filtroTipoEvento);
    }
    
    if (filtroTempo === 'sessao') {
      return filtrados.filter(h => h.evento_id.toString() === sessaoEspecificaId);
    }

    if (filtroTempo === 'tudo') return filtrados;

    const agora = new Date();
    const limiteDias = parseInt(filtroTempo, 10);
    
    return filtrados.filter(h => {
      const dataEvento = new Date(h.data);
      const diferencaTempo = agora.getTime() - dataEvento.getTime();
      const diferencaDias = Math.ceil(diferencaTempo / (1000 * 60 * 60 * 24));
      return diferencaDias <= limiteDias;
    });
  };

  const processarMetricasAtleta = (jogador) => {
    const inicial = { 
      geral: '0.00', passe: '0.00', remate: '0.00', velocidade: '0.00', tecnica: '0.00', defesa: '0.00', mental: '0.00', 
      golos: 0, assistencias: 0, minutos: 0, amarelos: 0, vermelhos: 0, golos_por_90: '0.00', assist_por_90: '0.00',
      jogos_disputados: 0, registosFiltrados: [] 
    };
    
    if (!jogador || !jogador.historico) return inicial;
    
    const itensFiltrados = filtrarRegistos(jogador.historico);
    const total = itensFiltrados.length;

    if (total === 0) return inicial;

    let somaGeral = 0, somaPasse = 0, somaRemate = 0, somaVel = 0, somaTec = 0, somaDef = 0, somaMen = 0;
    let tGolos = 0, tAssist = 0, tMinutos = 0, tAmarelos = 0, tVermelhos = 0;

    itensFiltrados.forEach(h => {
      somaGeral += parseFloat(h.nota_principal) || 0;
      somaPasse += parseFloat(h.passe || (h.notas && h.notas.passe)) || 0;
      somaRemate += parseFloat(h.remate || (h.notas && h.notas.remate)) || 0;
      somaVel += parseFloat(h.velocidade || (h.notas && h.notas.velocidade)) || 0;
      somaTec += parseFloat(h.tecnica || (h.notas && h.notas.tecnica)) || 0;
      somaDef += parseFloat(h.defesa || (h.notas && h.notas.defesa)) || 0;
      somaMen += parseFloat(h.mental || (h.notas && h.notas.mental)) || 0;
      tGolos += parseInt(h.golos) || 0;
      tAssist += parseInt(h.assistencias) || 0;
      tMinutos += parseInt(h.minutos) || 0;
      tAmarelos += parseInt(h.amarelos) || 0;
      tVermelhos += parseInt(h.vermelhos) || 0;
    });

    return {
      geral: (somaGeral / total).toFixed(2),
      passe: (somaPasse / total).toFixed(2),
      remate: (somaRemate / total).toFixed(2),
      velocidade: (somaVel / total).toFixed(2),
      tecnica: (somaTec / total).toFixed(2),
      defesa: (somaDef / total).toFixed(2),
      mental: (somaMen / total).toFixed(2),
      golos: tGolos,
      assistencias: tAssist,
      minutos: tMinutos,
      amarelos: tAmarelos,
      vermelhos: tVermelhos,
      golos_por_90: tMinutos > 0 ? ((tGolos * 90) / tMinutos).toFixed(2) : '0.00',
      assist_por_90: tMinutos > 0 ? ((tAssist * 90) / tMinutos).toFixed(2) : '0.00',
      jogos_disputados: total,
      registosFiltrados: itensFiltrados
    };
  };

  const chartThemeOptions = {
    chart: { background: 'transparent', toolbar: { show: false } },
    theme: { mode: 'dark' },
    stroke: { width: 2 }
  };

  // ====================================================================
  // MODO JOGADOR COMPLETAMENTE RESTAURADO COM GRÁFICOS E PONTOS
  // ====================================================================
  if (dadosDashboard.modo === 'jogador') {
    const meuAtleta = dadosDashboard.meu_perfil;
    const itemsFiltrados = filtrarRegistos(meuAtleta.historico);
    const metricasMedias = processarMetricasAtleta(meuAtleta);

    return (
      <div className="ge-fullscreen-wrapper">
        <div className="ge-workspace">
          <SidebarBalneario />
          <main className="ge-content-pane">
            
            <div className="dash-filter-bar ge-card">
              <span className="dash-filter-title">⏱️ PERÍODO:</span>
              <button className={`filter-chip ${filtroTempo === 'tudo' ? 'active' : ''}`} onClick={() => setFiltroTempo('tudo')}>Desde Início</button>
              <button className={`filter-chip ${filtroTempo === '2' ? 'active' : ''}`} onClick={() => setFiltroTempo('2')}>Últimos 2 Dias</button>
              <button className={`filter-chip ${filtroTempo === '5' ? 'active' : ''}`} onClick={() => setFiltroTempo('5')}>Últimos 5 Dias</button>
              <button className={`filter-chip ${filtroTempo === '30' ? 'active' : ''}`} onClick={() => setFiltroTempo('30')}>Último Mês</button>
              <button className={`filter-chip ${filtroTempo === '90' ? 'active' : ''}`} onClick={() => setFiltroTempo('90')}>Últimos 3 Meses</button>
              
              <span className="dash-filter-divider">|</span>
              <span className="dash-filter-title">🏃‍♂️ TIPO:</span>
              <select value={filtroTipoEvento} onChange={(e) => setFiltroTipoEvento(e.target.value)} className="dash-mini-dropdown">
                <option value="todos">Todos</option>
                <option value="Treino">Treinos</option>
                <option value="Jogo">Jogos Oficiais</option>
              </select>
            </div>

            <div className="ge-header" style={{ marginTop: '1rem' }}>
              <h2>O Teu Rendimento <span className="header-divider">|</span> <span className="header-club-name">{meuAtleta.nome_completo}</span></h2>
            </div>

            <div className="tab-content-wrapper">
              <div className="dash-individual-layout">
                <div className="ge-card">
                  <h3>Competências Técnico-Táticas no Período</h3>
                  <div className="dash-attributes-list">
                    {['passe', 'remate', 'velocidade', 'tecnica', 'defesa', 'mental'].map(attr => (
                      <div key={attr} className="dash-attr-row">
                        <span className="dash-attr-name">{attr.toUpperCase()}</span>
                        <div className="dash-progress-track">
                          <div className="dash-progress-fill" style={{ width: `${(parseFloat(metricasMedias[attr]) / 20) * 100}%`, backgroundColor: obterCorNota(metricasMedias[attr]) }}></div>
                        </div>
                        <span className="dash-attr-value" style={{ color: obterCorNota(metricasMedias[attr]) }}>{metricasMedias[attr]}</span>
                      </div>
                    ))}
                  </div>
                  <div className="dash-profile-footer-score">
                    <span>MÉDIA NO FILTRO ATIVO:</span>
                    <strong style={{ color: obterCorNota(metricasMedias.geral) }}>{metricasMedias.geral} / 20</strong>
                  </div>
                </div>

                <div className="ge-card">
                  <h3>Frequência & Eficácia Real (/90m)</h3>
                  <div className="dash-stats-grid">
                    <div className="dash-stat-box"><span>Minutos Efetuados</span><strong>{metricasMedias.minutos} Min</strong></div>
                    <div className="dash-stat-box"><span>Golos / 90 Min</span><strong style={{color: '#ef4444'}}>{metricasMedias.golos_por_90} ⚽</strong></div>
                    <div className="dash-stat-box"><span>Assistências / 90 Min</span><strong style={{color: '#eab308'}}>{metricasMedias.assist_por_90}</strong></div>
                    <div className="dash-stat-box"><span>Sessões Analisadas</span><strong>{metricasMedias.jogos_disputados} S</strong></div>
                  </div>
                </div>
              </div>

              {/* 📈 RESTAURADO: Gráfico de Tendência para o Atleta */}
              <div className="ge-card full-tab-card" style={{ marginTop: '1.5rem' }}>
                <h3>📈 Gráfico de Tendência de Rendimento Individual</h3>
                {metricasMedias.registosFiltrados.length < 2 ? (
                  <p className="no-data-text">Sessões insuficientes no filtro para traçar uma linha evolutiva.</p>
                ) : (
                  <Chart 
                    options={{
                      ...chartThemeOptions,
                      xaxis: { categories: metricasMedias.registosFiltrados.map(r => new Date(r.data).toLocaleDateString('pt-PT', {day:'numeric', month:'short'})) },
                      yaxis: { min: 0, max: 20 },
                      colors: ['#3b82f6']
                    }}
                    series={[{ name: 'Nota Principal', data: metricasMedias.registosFiltrados.map(r => r.nota_principal) }]}
                    type="line"
                    height={250}
                  />
                )}
              </div>

              {/* 📋 RESTAURADO: Tabela de Comentários / Pontos Positivos e Negativos do Atleta */}
              <div className="ge-card full-tab-card" style={{ marginTop: '1.5rem' }}>
                <h3>📋 Críticas Construtivas Filtradas</h3>
                <div className="eva-table-responsive" style={{ marginTop: '1rem' }}>
                  <table className="eva-matrix-table">
                    <thead>
                      <tr>
                        <th>Compromisso</th>
                        <th>Nota</th>
                        <th>👍 Aspetos Fortes</th>
                        <th>👎 A Evoluir</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itemsFiltrados.length === 0 ? (
                        <tr><td colSpan="4" className="no-data-text">Sem registos dentro do alcance temporal selecionado.</td></tr>
                      ) : (
                        itemsFiltrados.map((f, i) => (
                          <tr key={i}>
                            <td><strong>{f.titulo}</strong><span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b' }}>{new Date(f.data).toLocaleDateString('pt-PT')}</span></td>
                            <td className="font-bold" style={{ color: obterCorNota(f.nota_principal) }}>{f.nota_principal}</td>
                            <td>{f.pontos_positivos || '-'}</td>
                            <td>{f.pontos_negativos || '-'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </main>
        </div>
      </div>
    );
  }

  // ====================================================================
  // MODO DIREÇÃO / STAFF / PRESIDENTE
  // ====================================================================
  const { sessoes, jogadores } = dadosDashboard;

  const processarColetivoFiltrado = () => {
    let somaGeral = 0, totalGolos = 0, totalAssist = 0, contagemNotas = 0;
    let treinosAgrupados = {};

    jogadores.forEach(j => {
      const filtrados = filtrarRegistos(j.historico);
      filtrados.forEach(h => {
        somaGeral += parseFloat(h.nota_principal) || 0;
        contagemNotas++;
        totalGolos += parseInt(h.golos) || 0;
        totalAssist += parseInt(h.assistencias) || 0;

        if (h.tipo === 'Treino') {
          if (!treinosAgrupados[h.evento_id]) {
            treinosAgrupados[h.evento_id] = { titulo: h.titulo, data: h.data, soma: 0, qtd: 0 };
          }
          treinosAgrupados[h.evento_id].soma += parseFloat(h.nota_principal) || 0;
          treinosAgrupados[h.evento_id].qtd++;
        }
      });
    });

    const listaTreinos = Object.values(treinosAgrupados).map(t => ({
      titulo: t.titulo,
      data: new Date(t.data).toLocaleDateString('pt-PT', {day:'numeric', month:'short'}),
      media: (t.soma / t.qtd).toFixed(2)
    })).reverse().slice(0, 10);

    return {
      media_global: contagemNotas > 0 ? (somaGeral / contagemNotas).toFixed(2) : '0.00',
      total_golos: totalGolos,
      total_assistencias: totalAssist,
      historico_treinos: listaTreinos
    };
  };

  const coletivoFiltrado = processarColetivoFiltrado();
  const jogadorAtivo = jogadores.find(j => j.id.toString() === selectedPlayerId);
  const atletaA = jogadores.find(j => j.id.toString() === playerAId);
  const atletaB = jogadores.find(j => j.id.toString() === playerBId);

  const metricasIndividual = jogadorAtivo ? processarMetricasAtleta(jogadorAtivo) : null;
  const metricasA = atletaA ? processarMetricasAtleta(atletaA) : null;
  const metricasB = atletaB ? processarMetricasAtleta(atletaB) : null;

  return (
    <div className="ge-fullscreen-wrapper">
      <div className="ge-workspace">
        <SidebarBalneario />
        <main className="ge-content-pane">
          
          <div className="dash-filter-bar ge-card">
            <span className="dash-filter-title">⏱️ ALCANCE:</span>
            <button className={`filter-chip ${filtroTempo === 'tudo' ? 'active' : ''}`} onClick={() => setFiltroTempo('tudo')}>Histórico Total</button>
            <button className={`filter-chip ${filtroTempo === '2' ? 'active' : ''}`} onClick={() => setFiltroTempo('2')}>Últimos 2 Dias</button>
            <button className={`filter-chip ${filtroTempo === '5' ? 'active' : ''}`} onClick={() => setFiltroTempo('5')}>Últimos 5 Dias</button>
            <button className={`filter-chip ${filtroTempo === '30' ? 'active' : ''}`} onClick={() => setFiltroTempo('30')}>Último Mês</button>
            <button className={`filter-chip ${filtroTempo === '90' ? 'active' : ''}`} onClick={() => setFiltroTempo('90')}>Últimos 3 Meses</button>
            
            <span className="dash-filter-divider">|</span>
            <span className="dash-filter-title">🏃‍♂️ TIPO:</span>
            <select value={filtroTipoEvento} onChange={(e) => setFiltroTipoEvento(e.target.value)} className="dash-mini-dropdown">
              <option value="todos">Treinos & Jogos</option>
              <option value="Treino">Apenas Treinos</option>
              <option value="Jogo">Apenas Jogos Oficiais</option>
            </select>
            
            <span className="dash-filter-divider">|</span>
            <button className={`filter-chip ${filtroTempo === 'sessao' ? 'active' : ''}`} onClick={() => setFiltroTempo('sessao')}>🎯 Sessão</button>
            {filtroTempo === 'sessao' && sessoes?.length > 0 && (
              <select value={sessaoEspecificaId} onChange={(e) => setSessaoEspecificaId(e.target.value)} className="dash-mini-dropdown animate-fade">
                {sessoes.map(s => <option key={s.id} value={s.id}>{s.titulo}</option>)}
              </select>
            )}
          </div>

          <div className="ge-header" style={{ marginTop: '1rem' }}>
            <h2>Dossier de Gestão <span className="header-divider">|</span> <span className="header-club-name">Análise Temporal</span></h2>
          </div>

          <div className="membros-tabs-nav">
            <button className={`tab-nav-btn ${activeTab === 'coletivo' ? 'active' : ''}`} onClick={() => setActiveTab('coletivo')}>👥 Coletivo</button>
            <button className={`tab-nav-btn ${activeTab === 'individual' ? 'active' : ''}`} onClick={() => setActiveTab('individual')}>🏃‍♂️ Atletas (0-20)</button>
            <button className={`tab-nav-btn ${activeTab === 'comparador' ? 'active' : ''}`} onClick={() => setActiveTab('comparador')}>⚔️ Comparador</button>
          </div>

          <div className="tab-content-wrapper" style={{ marginTop: '1.5rem' }}>
            
            {/* ABA 1: COLETIVO */}
            {activeTab === 'coletivo' && (
              <div className="animate-fade">
                <div className="dash-grid-cards">
                  <div className="ge-card dash-stat-card">
                    <h4>Média no Período</h4>
                    <p className="dash-big-number" style={{ color: obterCorNota(coletivoFiltrado.media_global) }}>{coletivoFiltrado.media_global} <span className="dash-sub-text">/20</span></p>
                  </div>
                  <div className="ge-card dash-stat-card">
                    <h4>Golos no Período</h4>
                    <p className="dash-big-number" style={{ color: '#ef4444' }}>{coletivoFiltrado.total_golos} ⚽</p>
                  </div>
                  <div className="ge-card dash-stat-card">
                    <h4>Assistências no Período</h4>
                    <p className="dash-big-number" style={{ color: '#eab308' }}>{coletivoFiltrado.total_assistencias} 👟</p>
                  </div>
                </div>

                <div className="ge-card full-tab-card" style={{ marginTop: '1.5rem' }}>
                  <h3>Evolução Cronológica do Coletivo (Treinos)</h3>
                  <div className="dash-chart-bars-container">
                    {coletivoFiltrado.historico_treinos.map((t, idx) => (
                      <div key={idx} className="dash-chart-bar-column">
                        <div className="dash-bar-fill-wrapper">
                          <div className="dash-bar-fill" style={{ height: `${(t.media / 20) * 100}%`, backgroundColor: obterCorNota(t.media) }}>
                            <span className="dash-bar-label-pop">{t.media}</span>
                          </div>
                        </div>
                        <span className="dash-bar-date">{t.data}</span>
                        <span className="dash-bar-title" title={t.titulo}>{t.titulo.substring(0, 10)}...</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ABA 2: INDIVIDUAL STAFF */}
            {activeTab === 'individual' && (
              <div className="animate-fade">
                <div className="ge-card full-tab-card" style={{ marginBottom: '1.5rem' }}>
                  <label className="dash-select-label">Selecione o Atleta:</label>
                  <select value={selectedPlayerId} onChange={(e) => setSelectedPlayerId(e.target.value)} className="membro-inline-dropdown">
                    {jogadores.map(j => <option key={j.id} value={j.id.toString()}>{j.nome_completo}</option>)}
                  </select>
                </div>

                {jogadorAtivo && metricasIndividual && (
                  <div className="dash-individual-layout">
                    <div className="ge-card">
                      <h3>Radar no Alcance Temporal</h3>
                      {metricasIndividual.jogos_disputados === 0 ? (
                        <p className="no-data-text" style={{ padding: '2rem 0' }}>🛑 Atleta sem registos de presença no período.</p>
                      ) : (
                        <div className="dash-attributes-list">
                          {['passe', 'remate', 'velocidade', 'tecnica', 'defesa', 'mental'].map(attr => (
                            <div key={attr} className="dash-attr-row">
                              <span className="dash-attr-name">{attr.toUpperCase()}</span>
                              <div className="dash-progress-track">
                                <div className="dash-progress-fill" style={{ width: `${(parseFloat(metricasIndividual[attr]) / 20) * 100}%`, backgroundColor: obterCorNota(metricasIndividual[attr]) }}></div>
                              </div>
                              <span className="dash-attr-value" style={{ color: obterCorNota(metricasIndividual[attr]) }}>{metricasIndividual[attr]}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="dash-profile-footer-score">
                        <span>MÉDIA GERAL DISPONÍVEL:</span>
                        <strong style={{ color: obterCorNota(metricasIndividual.geral) }}>{metricasIndividual.geral} / 20</strong>
                      </div>
                    </div>

                    <div className="ge-card">
                      <h3>📈 Linha do Tempo & Tendência Cronológica</h3>
                      {metricasIndividual.registosFiltrados.length < 2 ? (
                        <p className="no-data-text" style={{ padding: '2rem 0' }}>Sessões insuficientes no período para traçar o gráfico.</p>
                      ) : (
                        <Chart 
                          key={selectedPlayerId}
                          options={{
                            ...chartThemeOptions,
                            xaxis: { categories: metricasIndividual.registosFiltrados.map(r => new Date(r.data).toLocaleDateString('pt-PT', {day:'numeric', month:'short'})) },
                            yaxis: { min: 0, max: 20 },
                            colors: ['#3b82f6']
                          }}
                          series={[{ name: 'Rendimento', data: metricasIndividual.registosFiltrados.map(r => r.nota_principal) }]}
                          type="line"
                          height={220}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ABA 3: COMPARADOR */}
            {activeTab === 'comparador' && (
              <div className="animate-fade">
                <div className="ge-card full-tab-card" style={{ marginBottom: '1.5rem' }}>
                  <div className="dash-comparador-selectors">
                    <select value={playerAId} onChange={(e) => setPlayerAId(e.target.value)} className="membro-inline-dropdown">
                      {jogadores.map(j => <option key={j.id} value={j.id.toString()}>🔵 Atleta A: {j.nome_completo}</option>)}
                    </select>
                    <div className="dash-vs-badge">VS</div>
                    <select value={playerBId} onChange={(e) => setPlayerBId(e.target.value)} className="membro-inline-dropdown">
                      {jogadores.map(j => <option key={j.id} value={j.id.toString()}>🟢 Atleta B: {j.nome_completo}</option>)}
                    </select>
                  </div>
                </div>

                {atletaA && atletaB && metricasA && metricasB && (
                  <div className="dash-individual-layout">
                    <div className="ge-card">
                      <h3>Radar de Competências Técnico-Táticas</h3>
                      <Chart 
                        key={`${playerAId}-${playerBId}`}
                        options={{
                          ...chartThemeOptions,
                          xaxis: { categories: ['PASSE', 'REMATE', 'VELOCIDADE', 'TÉCNICA', 'DEFESA', 'MENTAL'] },
                          yaxis: { max: 20, show: false },
                          colors: ['#3b82f6', '#22c55e']
                        }}
                        series={[
                          { name: atletaA.nome_completo, data: [parseFloat(metricasA.passe), parseFloat(metricasA.remate), parseFloat(metricasA.velocidade), parseFloat(metricasA.tecnica), parseFloat(metricasA.defesa), parseFloat(metricasA.mental)] },
                          { name: atletaB.nome_completo, data: [parseFloat(metricasB.passe), parseFloat(metricasB.remate), parseFloat(metricasB.velocidade), parseFloat(metricasB.tecnica), parseFloat(metricasB.defesa), parseFloat(metricasB.mental)] }
                        ]}
                        type="radar"
                        height={300}
                      />
                    </div>

                    <div className="ge-card">
                      <h3>Histórico Absoluto vs Rácio de Eficácia (/90 min)</h3>
                      <table className="dash-comparison-table">
                        <thead>
                          <tr>
                            <th className="text-right" style={{ color: '#3b82f6', width: '35%' }}>{metricasA.geral}</th>
                            <th className="text-center" style={{ color: '#8b9bb4', width: '30%' }}>MÉDIA COMPACTA</th>
                            <th className="text-left" style={{ color: '#22c55e', width: '35%' }}>{metricasB.geral}</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="text-right font-bold">{metricasA.minutos} m</td>
                            <td className="text-center cell-meta">MINUTOS TOTAIS</td>
                            <td className="text-left font-bold">{metricasB.minutos} m</td>
                          </tr>
                          <tr>
                            <td className="text-right font-bold">{metricasA.golos}</td>
                            <td className="text-center cell-meta">GOLOS TOTAIS ⚽</td>
                            <td className="text-left font-bold">{metricasB.golos}</td>
                          </tr>
                          <tr>
                            <td className="text-right font-bold">{metricasA.assistencias}</td>
                            <td className="text-center cell-meta">ASSISTÊNCIAS TOTAIS</td>
                            <td className="text-left font-bold">{metricasB.assistencias}</td>
                          </tr>
                          <tr style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                            <td className="text-right font-bold" style={{ color: '#3b82f6' }}>{metricasA.golos_por_90}</td>
                            <td className="text-center cell-meta" style={{ color: '#3b82f6', fontSize: '0.75rem' }}>🔥 GOLOS / 90 MIN</td>
                            <td className="text-left font-bold" style={{ color: '#22c55e' }}>{metricasB.golos_por_90}</td>
                          </tr>
                          <tr>
                            <td className="text-right font-bold" style={{ color: '#3b82f6' }}>{metricasA.assist_por_90}</td>
                            <td className="text-center cell-meta" style={{ color: '#3b82f6', fontSize: '0.75rem' }}>🔥 ASSIST / 90 MIN</td>
                            <td className="text-left font-bold" style={{ color: '#22c55e' }}>{metricasB.assist_por_90}</td>
                          </tr>
                          <tr>
                            <td className="text-right">{metricasA.amarelos} 🟨</td>
                            <td className="text-center cell-meta">CARTÕES AMARELOS</td>
                            <td className="text-left">{metricasB.amarelos} 🟨</td>
                          </tr>
                          <tr>
                            <td className="text-right">{metricasA.vermelhos} 🟥</td>
                            <td className="text-center cell-meta">CARTÕES VERMELHOS</td>
                            <td className="text-left">{metricasB.vermelhos} 🟥</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}