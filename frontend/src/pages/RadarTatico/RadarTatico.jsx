import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import SidebarBalneario from '../../components/SidebarBalneario/SidebarBalneario';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, LineChart, Line, ScatterChart, Scatter, ZAxis
} from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import './RadarTatico.css';

export default function RadarTatico() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dados, setDados] = useState(null);
  const [exporting, setExporting] = useState(false);
  
  // ⏱️ ESTADOS DOS FILTROS TEMPORAIS
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  
  const dashboardRef = useRef(null);

  // EFECT RESPONSÁVEL POR PUXAR AS MÉDRICAS (Recarrega automaticamente ao mudar as datas)
  useEffect(() => {
    const puxarMetricas = async () => {
      setLoading(true);
      setError('');
      try {
        // Constrói os query parameters dinâmicos de tempo
        let url = `http://localhost:8000/api/teams/${id}/radar-analytics`;
        const params = new URLSearchParams();
        if (dataInicio) params.append('data_inicio', dataInicio);
        if (dataFim) params.append('data_fim', dataFim);
        if (params.toString()) url += `?${params.toString()}`;

        const res = await fetch(url, {
          method: 'GET',
          headers: { 
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        const data = await res.json();

        if (res.ok) {
          setDados(data);
        } else if (res.status === 403) {
          setError(data.message || '⚠️ Acesso Negado. Este painel é exclusivo da Staff / Direção.');
        } else {
          setError(data.message || 'Erro ao processar as métricas do plantel.');
        }
      } catch (err) {
        setError('Falha de comunicação de rede com a API.');
      } finally {
        setLoading(false);
      }
    };

    puxarMetricas();
  }, [id, dataInicio, dataFim]);

  const exportarPDF = async () => {
    if (!dashboardRef.current) return;
    setExporting(true);

    try {
      const elemento = dashboardRef.current;
      const canvas = await html2canvas(elemento, {
        scale: 2, 
        useCORS: true,
        backgroundColor: "#0f172a" 
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; 
      const pageHeight = 295; 
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Dossie_MatchDay_Equipa_${id}.pdf`);
    } catch (err) {
      console.error("Erro ao gerar o PDF técnico:", err);
    } finally {
      setExporting(false);
    }
  };

  if (loading && !dados) return <div className="ge-loading">A estruturar painel analítico multi-gráfico...</div>;

  // 📊 PARSERS DOS GRÁFICOS ORIGINAIS PRESERVADOS
  const dadosRaioX = dados?.raio_x_coletivo ? [
    { subject: 'Remate', Valor: parseFloat(dados.raio_x_coletivo.remate) || 0 },
    { subject: 'Passe', Valor: parseFloat(dados.raio_x_coletivo.passe) || 0 },
    { subject: 'Velocidade', Valor: parseFloat(dados.raio_x_coletivo.velocidade) || 0 },
    { subject: 'Técnica', Valor: parseFloat(dados.raio_x_coletivo.tecnica) || 0 },
    { subject: 'Defesa', Valor: parseFloat(dados.raio_x_coletivo.defesa) || 0 },
    { subject: 'Mental', Valor: parseFloat(dados.raio_x_coletivo.mental) || 0 },
  ] : [];

  const dadosCompetitivos = dados?.perfil_competitivo?.map(a => ({
    name: `${a.nome} ${a.apelido.charAt(0)}.`,
    Treino: parseFloat(a.media_treino) || 0,
    Jogo: parseFloat(a.media_jogo) || 0,
    Diferencial: parseFloat(a.diferencial) || 0
  })) || [];

  const dadosSetoriais = dados?.especialistas_defesa?.map((def, idx) => {
    const atk = dados.especialistas_ataque?.[idx] || { pontuacao_setorial: 0, nome: 'N/A' };
    return {
      name: `${def.nome} ${def.apelido.charAt(0)}.`,
      Defensivo: parseFloat(def.pontuacao_setorial) || 0,
      Ofensivo: parseFloat(atk.pontuacao_setorial) || 0
    };
  }) || [];

  const dadosConsistencia = dados?.regularidade_consistencia?.map(a => {
    const disc = dados.agressividade_disciplina?.find(d => d.id === a.id) || { amarelos: 0, vermelhos: 0 };
    return {
      name: `${a.nome} ${a.apelido.charAt(0)}.`,
      Desvio: parseFloat(a.desvio_padrao) || 0,
      RiscoCartoes: (disc.amarelos * 2) + (disc.vermelhos * 5),
      Estabilidade: parseFloat(disc.estabilidade_mental) || 0
    };
  }) || [];

  const dadosQuebra = dados?.quebra_forma?.map(a => ({
    name: `${a.nome} ${a.apelido.charAt(0)}.`,
    'Geral Época': parseFloat(a.media_epoca) || 0,
    'Últimos 2 Eventos': parseFloat(a.media_recente) || 0,
  })) || [];

  const dadosP90 = dados?.produtividade_90?.map(a => ({
    name: `${a.nome} ${a.apelido.charAt(0)}.`,
    'G/A por 90m': parseFloat(a.p90) || 0
  })) || [];

  const dadosReisDoPasse = dados?.reis_do_passe?.map(a => ({
    name: `${a.nome} ${a.apelido.charAt(0)}.`,
    'Índice Criativo': parseFloat(a.indice_garçon) || 0,
  })) || [];

  const dadosEvolucao = dados?.evolucao_temporal?.map(e => ({
    name: e.mes,
    'Nota Principal': parseFloat(e.media_principal_mes) || 0,
    'Nota Técnica': parseFloat(e.media_tecnica_mes) || 0,
    'Nota Mental': parseFloat(e.media_mental_mes) || 0,
  })) || [];

  return (
    <div className="ge-fullscreen-wrapper">
      <div className="ge-workspace">
        <SidebarBalneario />

        <main className="radar-main-content">
          
          {/* CONTROLADORES DE FILTRO DE DATA NO TOPO DO HEADER */}
          <div className="radar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2>📊 Radar Analítico Multi-Gráfico Premium</h2>
              <p>Laboratório Estatístico Avançado — Suite visual de suporte à decisão técnica.</p>
            </div>
            
            {/* ⏱️ FILTROS CALENDÁRIO */}
            <div className="radar-date-filters" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#1e293b', padding: '0.5rem 1rem', borderRadius: '8px' }}>
              <label style={{ fontSize: '0.8rem', color: '#9ca3af' }}>De:</label>
              <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} style={{ backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '0.3rem', borderRadius: '4px', fontSize: '0.85rem' }} />
              
              <label style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Até:</label>
              <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} style={{ backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '0.3rem', borderRadius: '4px', fontSize: '0.85rem' }} />

              {(dataInicio || dataFim) && (
                <button onClick={() => { setDataInicio(''); setDataFim(''); }} style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>Limpar</button>
              )}
            </div>
            
            <button 
              onClick={exportarPDF} 
              disabled={exporting}
              className="btn-exportar-pdf"
              style={{
                backgroundColor: exporting ? '#334155' : '#10b981',
                color: '#fff',
                border: 'none',
                padding: '0.65rem 1.2rem',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: exporting ? 'not-allowed' : 'pointer'
              }}
            >
              {exporting ? '⏳ A processar...' : '📥 Exportar Dossiê Match-Day'}
            </button>
          </div>

          {error ? (
            <div className="ge-alert-danger" style={{ margin: '1rem 0' }}>{error}</div>
          ) : (
            <div ref={dashboardRef} className="radar-grid-cards">
              
              {/* ==================== 🚀 NOVA SECÇÃO: ÍNDICE DE CAPITANIA & MATURIDADE ==================== */}
              <div className="radar-card full-width">
                <h3>👑 Perfil de Capitania & Maturidade de Balneário</h3>
                <p className="card-subtitle">Análise algorítmica para identificação de líderes de grupo naturais</p>
                <div className="card-calculation-box purple-border">
                  <span>💡 <strong>Cálculo de Liderança:</strong> 50% Estabilidade Mental (Notas 0-20) + 40% Regularidade de Minutos Completos - Penalizações por Cartões Amarelos (-0.5) e Vermelhos (-2.0).</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                  {dados?.ranking_lideres?.map((cap, index) => (
                    <div key={cap.id} className="attr-box" style={{ borderLeft: '3px solid #a78bfa', padding: '0.6rem' }}>
                      <span className="attr-label" style={{ color: '#a78bfa', fontWeight: 'bold' }}>#{index + 1} {cap.nome}</span>
                      <small style={{ display: 'block', color: '#9ca3af', margin: '3px 0' }}>Minutos: {cap.minutos_acumulados}' | 🟨 {cap.amarelos} 🟥 {cap.vermelhos}</small>
                      <span className="attr-value" style={{ fontSize: '1.1rem' }}>Índice: {cap.indice_lideranca}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ==================== 🚀 NOVA SECÇÃO: EXTREMOS DOS 6 ATRIBUTOS ==================== */}
              <div className="radar-card full-width" style={{ backgroundColor: '#0b1329' }}>
                <h3>⚡ Raio-X de Extremos (Top 5 Líderes por Atributo)</h3>
                <p className="card-subtitle">Os atletas com maior média absoluta de 0-20 em cada valência do sistema</p>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                  {dados?.top_individuais && Object.entries(dados.top_individuais).map(([atributo, lista]) => (
                    <div key={atributo} style={{ backgroundColor: '#111c44', padding: '0.8rem', borderRadius: '6px' }}>
                      <h5 style={{ textTransform: 'uppercase', color: '#38bdf8', fontSize: '0.8rem', marginBottom: '0.5rem', borderBottom: '1px solid #1e293b', paddingBottom: '3px' }}>🎯 TOP {atributo}</h5>
                      {lista?.map((player, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', margin: '4px 0' }}>
                          <span style={{ color: '#f1f5f9' }}>{idx + 1}. {player.nome} {player.apelido.charAt(0)}.</span>
                          <strong style={{ color: '#38bdf8' }}>{player.score}</strong>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* ==================== SECÇÃO 1: TITULARES PONDERADOS ==================== */}
              <div className="radar-card full-width visual-split">
                <div className="split-list-side">
                  <h3>🛡️ Os 10 de Campo Recomendados(Ponderado Oficial vs Amigável)</h3>
                  <div className="card-calculation-box blue-border">
                    <span>💡 <strong>Fórmula do Algoritmo:</strong> 30% Média Treino + 56% Média Jogo Oficial (Peso de 80% nos jogos) + 14% Média Jogo Amigável (Peso de 20% nos jogos) + 10% Bónus Estatístico (Golos/Assis).</span>
                  </div>
                  <div className="titulares-list">
                    {dados?.recomendacao_titulares?.map((jogador, index) => (
                      <div key={jogador.id} className="titular-row">
                        <span className="player-rank">#{index + 1}</span>
                        <p className="player-name">{jogador.nome} {jogador.apelido}</p>
                        <div className="player-stats">
                          <span>Época: <strong>{jogador.media_global}</strong></span>
                          <span className="stat-badge-index">Score: <strong>{jogador.indice_titularidade}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="split-chart-side">
                  <h4>📊 Gráfico 1: Curva de Aptidão Ponderada do Plantel</h4>
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={dados?.recomendacao_titulares?.map(j => ({ name: j.nome, Score: parseFloat(j.indice_titularidade) }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} />
                      <YAxis domain={[0, 20]} stroke="#9ca3af" />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }} />
                      <Line type="monotone" dataKey="Score" stroke="#3b82f6" strokeWidth={3} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* ==================== FILTRO: REIS DO PASSE VS ASSISTÊNCIAS ==================== */}
              <div className="radar-card full-width visual-split">
                <div className="split-list-side">
                  <h3>👑 Os Reis do Passe e Visão de Jogo</h3>
                  <div className="card-calculation-box blue-border">
                    <span>💡 <strong>Fórmula Garçon:</strong> 70% da Média da Nota de Passe obtida + 30% do Peso de Assistências Reais registradas na match_stats.</span>
                  </div>
                  <div className="radar-scroll-list">
                    {dados?.reis_do_passe?.map(atleta => (
                      <div key={atleta.id} className="profile-row">
                        <div>
                          <p className="player-name">{atleta.nome} {atleta.apelido}</p>
                          <small style={{ color: '#9ca3af' }}>Nota Passe: {atleta.media_nota_passe} | Assistências: {atleta.total_assistencias}</small>
                        </div>
                        <span className="stat-badge-index" style={{ color: '#38bdf8' }}>Score: {atleta.indice_garçon}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="split-chart-side">
                  <h4>📊 Gráfico A: Distribuição de Potencial Criativo</h4>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={dadosReisDoPasse}>
                      <CartesianGrid stroke="#334155" />
                      <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} />
                      <YAxis domain={[0, 20]} stroke="#9ca3af" />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', color: '#fff' }} />
                      <Bar dataKey="Índice Criativo" fill="#38bdf8" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* ==================== FILTRO: EVOLUÇÃO TEMPORAL COLETIVA ==================== */}
              <div className="radar-card full-width visual-split">
                <div className="split-list-side">
                  <h3>📈 Evolução Temporal e Progressão de Métricas</h3>
                  <div className="card-calculation-box purple-border">
                    <span>💡 <strong>Métrica de Linha:</strong> Média aritmética das avaliações do grupo consolidadas mês a mês para detetar picos ou quebras de assimilação tática.</span>
                  </div>
                  <div className="radar-scroll-list">
                    {dados?.evolucao_temporal?.map(ev => (
                      <div key={ev.mes} className="profile-row">
                        <p className="player-name">Calendário: {ev.mes}</p>
                        <small style={{ color: '#a78bfa' }}>Principal: {ev.media_principal_mes} | Téc: {ev.media_tecnica_mes} | Men: {ev.media_mental_mes}</small>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="split-chart-side">
                  <h4>📊 Gráfico B: Linha Histórica de Evolução Coletiva</h4>
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={dadosEvolucao}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} />
                      <YAxis domain={[0, 20]} stroke="#9ca3af" />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', color: '#fff' }} />
                      <Legend />
                      <Line type="monotone" dataKey="Nota Principal" stroke="#a78bfa" strokeWidth={2} />
                      <Line type="monotone" dataKey="Nota Técnica" stroke="#10b981" strokeWidth={2} />
                      <Line type="monotone" dataKey="Nota Mental" stroke="#f59e0b" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* ==================== SECÇÃO 2: ALERTAS DE QUEBRA DE FORMA ==================== */}
              <div className="radar-card full-width visual-split">
                <div className="split-list-side">
                  <h3>🚨 Monitorização de Quebra de Forma (Fadiga / Risco de Lesão)</h3>
                  <div className="card-calculation-box red-border">
                    <span>💡 <strong>Métrica de Fadiga:</strong> Média estrita dos últimos 2 eventos vs Média Geral de toda a época. Tendências negativas acentuadas exigem rotação médica preventiva.</span>
                  </div>
                  <div className="radar-scroll-list">
                    {dados?.quebra_forma?.map(atleta => (
                      <div key={atleta.id} className="profile-row">
                        <div>
                          <p className="player-name">{atleta.nome} {atleta.apelido}</p>
                          <small style={{ color: '#9ca3af' }}>Geral: {atleta.media_epoca} | Recente: {atleta.media_recente}</small>
                        </div>
                        <span className={`badge-profile ${atleta.delta_tendencia < -1.5 ? 'leão-de-treino' : 'equilibrado'}`}>
                          Variação: {atleta.delta_tendencia}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="split-chart-side">
                  <h4>📊 Gráfico 2: Desvio de Tendência Recente</h4>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={dadosQuebra}>
                      <CartesianGrid stroke="#334155" />
                      <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} />
                      <YAxis domain={[0, 20]} stroke="#9ca3af" />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', color: '#fff' }} />
                      <Legend />
                      <Bar dataKey="Geral Época" fill="#4b5563" />
                      <Bar dataKey="Últimos 2 Eventos" fill="#ef4444" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* ==================== SECÇÃO 3: PRODUTIVIDADE POR 90 MINUTOS ==================== */}
              <div className="radar-card full-width visual-split">
                <div className="split-list-side">
                  <h3>⏱️ Eficácia Produtiva por 90 Minutos Regulamentares</h3>
                  <div className="card-calculation-box yellow-border">
                    <span>💡 <strong>Métrica Otimizada:</strong> Total de minutos jogados dividido pelas ações diretas. Evita distorções de atletas com alta minutagem acumulada em relação a substitutos cirúrgicos.</span>
                  </div>
                  <div className="radar-scroll-list">
                    {dados?.produtividade_90?.map(atleta => (
                      <div key={atleta.id} className="profile-row">
                        <div>
                          <p className="player-name">{atleta.nome} {atleta.apelido}</p>
                          <small style={{ color: '#9ca3af' }}>Minutos Totais: {atleta.minutos_totais}'</small>
                        </div>
                        <span className="stat-badge-index" style={{ color: '#eab308' }}>
                          P90: {atleta.p90}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="split-chart-side">
                  <h4>📊 Gráfico 3: Rácio Volumétrico P90 por Atleta</h4>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={dadosP90}>
                      <CartesianGrid stroke="#334155" />
                      <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', color: '#fff' }} />
                      <Bar dataKey="G/A por 90m" fill="#eab308" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* ==================== SECÇÃO 4: O TERMÓMETRO DO PLANTEL ==================== */}
              <div className="radar-card">
                <h3>🌡️ O Termómetro (Índice de Influência)</h3>
                <div className="card-calculation-box purple-border">
                  <span>💡 <strong>Fórmula Estrutural:</strong> Cruzamento ponderado de 60% Rendimento Mental em compromissos setoriais + 40% Estabilidade Técnica Individual em campo.</span>
                </div>
                <div className="radar-scroll-list">
                  {dados?.termometro?.map(atleta => (
                    <div key={atleta.id} className="profile-row">
                      <p>{atleta.nome} {atleta.apelido}</p>
                      <span className="score-badge green" style={{ fontSize: '0.85rem' }}>
                        Fator: {atleta.indice_influencia}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ==================== SECÇÃO 5: TREINO VS JOGO ==================== */}
              <div className="radar-card">
                <h3>🎭 Diferencial Competitivo</h3>
                <div className="card-calculation-box yellow-border">
                  <span>💡 <strong>Métrica Comportamental:</strong> Subtração direta entre a média em jogos e a média em treinos semanais.</span>
                </div>
                <ResponsiveContainer width="100%" height={170}>
                  <BarChart data={dadosCompetitivos}>
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={9} />
                    <YAxis domain={[0, 20]} stroke="#9ca3af" />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', color: '#fff' }} />
                    <Bar dataKey="Treino" fill="#eab308" />
                    <Bar dataKey="Jogo" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* ==================== SECÇÃO 6: MATRIZES SETORIAIS ==================== */}
              <div className="radar-card full-width visual-split">
                <div className="split-list-side">
                  <h3>🧱 Matrizes Setoriais Combinação Nível 3</h3>
                  <div className="card-calculation-box purple-border">
                    <p style={{ marginBottom: '4px' }}>🛡️ <strong>Cálculo Contenção (DEF):</strong> 50% Nota Defesa + 30% Nota Mental + 20% Nota Velocidade</p>
                    <p>⚔️ <strong>Cálculo Criativo (ATK):</strong> 40% Nota Técnica + 30% Nota Passe + 30% Nota Remate</p>
                  </div>
                  <div className="radar-scroll-list">
                    <h5 style={{ color: '#3b82f6', fontSize: '0.8rem', margin: '0.5rem 0' }}>Top Blocos de Contenção</h5>
                    {dados?.especialistas_defesa?.slice(0, 3).map(a => (
                      <div key={a.id} className="mini-row-stats">
                        <small>{a.nome} {a.apelido}</small>
                        <strong style={{ color: '#3b82f6' }}>DEF: {a.pontuacao_setorial}</strong>
                      </div>
                    ))}
                    <h5 style={{ color: '#10b981', fontSize: '0.8rem', margin: '0.5rem 0' }}>Top Blocos Criativos</h5>
                    {dados?.especialistas_ataque?.slice(0, 3).map(a => (
                      <div key={a.id} className="mini-row-stats">
                        <small>{a.nome} {a.apelido}</small>
                        <strong style={{ color: '#10b981' }}>ATK: {a.pontuacao_setorial}</strong>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="split-chart-side">
                  <h4>📊 Gráfico 4: Distribuição de Forças Ofensiva vs Defensiva</h4>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={dadosSetoriais} layout="vertical">
                      <CartesianGrid stroke="#334155" />
                      <XAxis type="number" domain={[0, 20]} stroke="#9ca3af" />
                      <YAxis dataKey="name" type="category" stroke="#9ca3af" fontSize={10} />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', color: '#fff' }} />
                      <Legend />
                      <Bar dataKey="Defensivo" fill="#3b82f6" />
                      <Bar dataKey="Ofensivo" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* ==================== SECÇÃO 7: CONSISTÊNCIA & RISCO DISCIPLINAR REAL ==================== */}
              <div className="radar-card full-width visual-split">
                <div className="split-list-side">
                  <h3>🟥 Regularidade vs Risco Disciplinar Real</h3>
                  <div className="card-calculation-box red-border">
                    <p style={{ marginBottom: '4px' }}>📉 <strong>Desvio Padrão ($\sigma$):</strong> Mede a oscilação. Quanto menor for, mais previsível e estável é o atleta.</p>
                    <p>🚨 <strong>Peso Disciplinar:</strong> Isolado por subquery real (Amarelo = 2 pts | Vermelho = 5 pts), livre de produtos cartesianos.</p>
                  </div>
                  <div className="radar-scroll-list">
                    {dados?.regularidade_consistencia?.map(atleta => {
                      const disc = dados.agressividade_disciplina?.find(d => d.id === atleta.id) || { amarelos: 0, vermelhos: 0 };
                      return (
                        <div key={atleta.id} className="profile-row">
                          <div>
                            <p className="player-name">{atleta.nome} {atleta.apelido}</p>
                            <small style={{ color: '#ef4444' }}>🟨 {disc.amarelos} | 🟥 {disc.vermelhos} (SD: {atleta.desvio_padrao})</small>
                          </div>
                          <span className="badge-profile equilibrado">{atleta.estatuto}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="split-chart-side">
                  <h4>📊 Gráfico 5: Matriz de Dispersão (Estabilidade vs Cartões)</h4>
                  <ResponsiveContainer width="100%" height={240}>
                    <ScatterChart>
                      <CartesianGrid stroke="#334155" />
                      <XAxis type="number" dataKey="Desvio" name="Desvio Padrão" stroke="#9ca3af" label={{ value: 'Desvio (Estabilidade)', position: 'insideBottom', offset: -5, fill: '#9ca3af', fontSize: 10 }} />
                      <YAxis type="number" dataKey="RiscoCartoes" name="Peso Cartões" stroke="#9ca3af" label={{ value: 'Risco Disciplinar', angle: -90, position: 'insideLeft', fill: '#9ca3af', fontSize: 10 }} />
                      <ZAxis type="category" dataKey="name" name="Jogador" />
                      <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#1e293b', color: '#fff' }} />
                      <Scatter name="Plantel" data={dadosConsistencia} fill="#ef4444" />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* ==================== SECÇÃO 8: GEOMETRIA COLETIVA RAIO-X ==================== */}
              <div className="radar-card full-width visual-split">
                <div className="split-list-side">
                  <h3>🎯 Raio-X Coletivo do Grupo</h3>
                  <p className="card-subtitle">Médias aritméticas em tempo real do ecossistema de avaliações globais de 0-20</p>
                  <div className="attributes-radar-flex">
                    {dados?.raio_x_coletivo && Object.entries(dados.raio_x_coletivo).map(([attr, valor]) => (
                      <div key={attr} className="attr-box">
                        <span className="attr-label">{attr.toUpperCase()}</span>
                        <span className="attr-value">{valor || '0.0'}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="split-chart-side">
                  <h4>📊 Gráfico 6: Teia de Competências Globais</h4>
                  <ResponsiveContainer width="100%" height={260}>
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={dadosRaioX}>
                      <PolarGrid stroke="#334155" />
                      <PolarAngleAxis dataKey="subject" stroke="#9ca3af" fontSize={11} />
                      <PolarRadiusAxis angle={30} domain={[0, 20]} stroke="#475569" />
                      <Radar name="Média Coletiva" dataKey="Valor" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', color: '#fff' }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          )}
        </main>
      </div>
    </div>
  );
}