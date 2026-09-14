import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import SidebarBalneario from '../../components/SidebarBalneario/SidebarBalneario';
import './Loja.css';

export default function Loja() {
  const { id } = useParams(); // team_id

  // Estados de Controlo e Navegação
  const [abaAtiva, setAbaAtiva] = useState('loja'); // loja | missoes | conquistas
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Estados dos Dados (Vindo das 7 Tabelas do Backend)
  const [progresso, setProgresso] = useState(null);       // Nível, XP Total, Saldo Atual
  const [historicoPontos, setHistoricoPontos] = useState([]);// Extrato de pontos (user_points_log)
  const [conquistas, setConquistas] = useState([]);       // Vitrine de Troféus (user_achievements)
  const [itensLoja, setItensLoja] = useState([]);         // Montra ativa (shop_items)
  const [missoes, setMissoes] = useState([]);             // Desafios (user_missions + missions)

  // Carregar todos os dados de Gamificação em simultâneo
  const carregarDadosGamificacao = async () => {
    setLoading(true);
    setError('');
    try {
      // Executa os fetches em paralelo para melhor performance
      const [resPerfil, resLoja, resMissoes] = await Promise.all([
        fetch(`http://localhost:8000/api/teams/${id}/gamification/profile`, {
          method: 'GET',
          headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
          credentials: 'include'
        }),
        fetch(`http://localhost:8000/api/teams/${id}/gamification/shop`, {
          method: 'GET',
          headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
          credentials: 'include'
        }),
        fetch(`http://localhost:8000/api/teams/${id}/gamification/missions`, {
          method: 'GET',
          headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
          credentials: 'include'
        })
      ]);

      if (resPerfil.status === 401) {
        setError('Sessão expirada. Por favor, volte a fazer login.');
        return;
      }

      if (resPerfil.ok && resLoja.ok && resMissoes.ok) {
        const dataPerfil = await resPerfil.json();
        const dataLoja = await resLoja.json();
        const dataMissoes = await resMissoes.json();

        setProgresso(dataPerfil.progresso);
        setHistoricoPontos(dataPerfil.historico_points || dataPerfil.historico_pontos || []);
        setConquistas(dataPerfil.conquistas || []);
        setItensLoja(dataLoja || []);
        setMissoes(dataMissoes || []);
      } else {
        setError('Erro ao carregar o motor de pontos e recompensas.');
      }
    } catch (err) {
      setError('Falha de ligação ao servidor de gamificação.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDadosGamificacao();
  }, [id]);

  // 2. Função de Compra Direta na Loja
  const handleComprarItem = async (itemId, nomeItem, preco) => {
    if (progresso.saldo_atual < preco) {
      return alert(`Pontos insuficientes! Faltam ${preco - progresso.saldo_atual} XP para adquirires este item.`);
    }

    if (!window.confirm(`Desejas gastar ${preco} XP para desbloquear "${nomeItem}"?`)) return;

    try {
      const res = await fetch(`http://localhost:8000/api/teams/${id}/gamification/shop/${itemId}/buy`, {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      const data = await res.json();

      if (res.ok) {
        alert(data.message);
        carregarDadosGamificacao(); // Recarrega os saldos e stock atualizados
      } else {
        alert(data.message || 'Erro ao processar transação.');
      }
    } catch (err) {
      alert('Erro de rede ao comunicar com o refeitório da loja.');
    }
  };

  // 📐 Cálculo matemático para a largura em % da barra de progresso do nível
  const calcularPercentagemXP = () => {
    if (!progresso) return 0;
    const atual = progresso.xp_total;
    const proximo = progresso.pontos_proximo_nivel;
    if (atual >= proximo) return 100; // Nível Máximo alcançado
    return Math.min(Math.round((atual / proximo) * 100), 100);
  };

  if (loading) return <div className="ge-loading">A sintonizar tabelas de rendimento e XP...</div>;
  if (error) return <div className="ge-error-alert">{error}</div>;

  return (
    <div className="ge-fullscreen-wrapper">
      <div className="ge-workspace">
        <SidebarBalneario />

        <main className="loja-module-pane">
          <div className="loja-full-layout">

            {/* 👑 TOP STATUS CARD: PERFIL XP DO ATLETA */}
            {progresso && (
              <div className="ge-card loja-profile-header">
                <div className="profile-header-main">
                  <div className="level-badge-zone">
                    <div className="level-circle">NÍVEL <span>{progresso.nivel_atual}</span></div>
                    <div className="level-titles">
                      <h4>{progresso.titulo_nivel}</h4>
                      <p className="recompensa-txt">🎁 Bónus ativo: {progresso.recompensa_nivel || 'Nenhum'}</p>
                    </div>
                  </div>
                  
                  <div className="wallet-points-zone">
                    <span className="wallet-label">SALDO DISPONÍVEL</span>
                    <h2 className="wallet-amount">🪙 {progresso.saldo_atual} <span className="xp-unit">XP</span></h2>
                  </div>
                </div>

                <div className="profile-header-progress">
                  <div className="progress-labels">
                    <span>Progresso de Carreira ({progresso.xp_total} XP acumulados de sempre)</span>
                    <span>Próximo Nível: {progresso.proximo_titulo} ({progresso.pontos_proximo_nivel} XP)</span>
                  </div>
                  <div className="progress-bar-container">
                    <div className="progress-bar-fill" style={{ width: `${calcularPercentagemXP()}%` }}></div>
                  </div>
                </div>
              </div>
            )}

            {/* 🎛️ ABAS DE NAVEGAÇÃO DA ARENA */}
            <div className="loja-filter-bar">
              <button className={`filter-tab-btn ${abaAtiva === 'loja' ? 'active' : ''}`} onClick={() => setAbaAtiva('loja')}>
                🛒 Loja de Itens ({itensLoja.length})
              </button>
              <button className={`filter-tab-btn ${abaAtiva === 'missoes' ? 'active' : ''}`} onClick={() => setAbaAtiva('missoes')}>
                🎯 Quadro de Missões ({missoes.length})
              </button>
              <button className={`filter-tab-btn ${abaAtiva === 'conquistas' ? 'active' : ''}`} onClick={() => setAbaAtiva('conquistas')}>
                🏆 Galeria de Conquistas ({conquistas.length})
              </button>
            </div>

           


            {/* 📋 CONTEÚDO DINÂMICO DAS ABAS */}
            <div className="loja-content-section">
              
              {/* ==========================================
                  ABA 1: MONTRA DA LOJA (shop_items)
                 ========================================== */}
              {abaAtiva === 'loja' && (
                <div className="loja-items-grid">
                  {itensLoja.length === 0 ? (
                    <div className="ge-card no-data-card">
                      <p>🛍️ A loja do clube está vazia ou sem artigos ativos de momento.</p>
                    </div>
                  ) : (
                    itensLoja.map((item) => {
                      const esgotado = item.stock !== -1 && item.stock <= 0;
                      return (
                        <div key={item.id} className={`ge-card shop-item-card type-${item.tipo.toLowerCase()} ${esgotado ? 'item-esgotado' : ''}`}>
                          <div className="item-card-badge">{item.tipo.toUpperCase()}</div>
                          
                          <div className="item-card-image-zone">
                            {item.imagem_url ? (
                              <img src={item.imagem_url} alt={item.nome} />
                            ) : (
                              <div className="item-placeholder-icon">🎁</div>
                            )}
                            {esgotado && <div className="esgotado-overlay">ESGOTADO</div>}
                          </div>

                          <div className="item-card-info">
                            <h4>{item.nome}</h4>
                            <p className="item-description">{item.descricao}</p>
                            
                            <div className="item-stock-status">
                              {item.stock === -1 ? '⚡ Stock Ilimitado' : `📦 Stock: ${item.stock} un.`}
                            </div>

                            <div className="item-card-footer">
                              <span className="item-price">🪙 {item.preco_pontos} <small>XP</small></span>
                              <button
                                onClick={() => handleComprarItem(item.id, item.nome, item.preco_pontos)}
                                className={`ge-btn btn-buy-item ${esgotado ? 'disabled' : ''}`}
                                disabled={esgotado}
                              >
                                {esgotado ? 'Esgotado' : '🛒 Adquirir'}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* ==========================================
                  ABA 2: QUADRO DE MISSÕES (user_missions)
                 ========================================== */}
              {abaAtiva === 'missoes' && (
                <div className="loja-missions-list">
                  {missoes.length === 0 ? (
                    <div className="ge-card no-data-card">
                      <p>🎯 Não tens nenhuma missão ativa atribuída pelo Mister de momento.</p>
                    </div>
                  ) : (
                    missoes.map((um) => {
                      const concluida = um.estado === 'Concluida';
                      return (
                        <div key={um.id} className={`ge-card mission-row-card ${concluida ? 'mission-done' : ''}`}>
                          <div className="mission-row-header">
                            <div className="mission-title-block">
                              <span className={`mission-category-tag cat-${um.missao?.categoria?.toLowerCase()}`}>
                                {um.missao?.categoria || 'Geral'}
                              </span>
                              <h4>{um.missao?.titulo}</h4>
                            </div>
                            <span className="mission-reward">🏆 +{um.missao?.pontos_recompensa} XP</span>
                          </div>

                          <p className="mission-row-desc">{um.missao?.descricao}</p>

                          <div className="mission-progress-block">
                            <div className="mission-progress-meta">
                              <span>Progresso: <strong>{um.progresso_atual}</strong> / {um.objetivo_final}</span>
                              <span>{um.percentagem_progresso}%</span>
                            </div>
                            <div className="mission-progress-bar-bg">
                              <div 
                                className="mission-progress-bar-fill" 
                                style={{ width: `${um.percentagem_progresso}%` }}
                              ></div>
                            </div>
                          </div>

                          <div className="mission-row-footer">
                            <span>Tipo: {um.missao?.tipo}</span>
                            <span>Estado: <strong className={`status-${um.estado.toLowerCase()}`}>{um.estado.replace('_', ' ')}</strong></span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* ==========================================
                  ABA 3: VITRINE DE CONQUISTAS (user_achievements)
                 ========================================== */}
              {abaAtiva === 'conquistas' && (
                <div className="loja-achievements-showcase">
                  {conquistas.length === 0 ? (
                    <div className="ge-card no-data-card">
                      <p>🏆 A tua vitrine de troféus ainda está vazia. Dá tudo nos treinos (0-20) e jogos!</p>
                    </div>
                  ) : (
                    <div className="achievements-grid">
                      {conquistas.map((ac) => (
                        <div key={ac.id} className={`ge-card achievement-badge-card rarity-${ac.raridade.toLowerCase()}`}>
                          <div className="badge-medal-icon">
                            {ac.icone_url ? <img src={ac.icone_url} alt={ac.titulo} /> : '🏆'}
                          </div>
                          <span className="badge-rarity-label">{ac.raridade.toUpperCase()}</span>
                          <h4>{ac.titulo}</h4>
                          <p className="badge-desc">{ac.descricao}</p>
                          <div className="badge-card-footer">
                            <span>Época: {ac.epoca || '---'}</span>
                            <span>{new Date(ac.data_conquista || ac.created_at).toLocaleDateString('pt-PT')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* ==========================================
                EXTRATO DE CONTA: HISTÓRICO DE PONTOS (user_points_log)
               ========================================== */}
            <div className="loja-history-section">
              <div className="ge-card history-log-card">
                <h3>📋 Extrato de Rendimento (Histórico Recente de Pontos)</h3>
                <p className="history-subtitle">Consulta as entradas de missões/avaliações e as saídas de compras efetuadas</p>

                <div className="history-table-wrapper">
                  {historicoPontos.length === 0 ? (
                    <p className="empty-history-txt">Nenhum movimento registado na tua conta de XP.</p>
                  ) : (
                    <table className="ge-table history-table">
                      <thead>
                        <tr>
                          <th>Data</th>
                          <th>Motivo / Descrição</th>
                          <th style={{ textAlign: 'right' }}>Variação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historicoPontos.map((log) => {
                          const positivo = log.pontos > 0;
                          return (
                            <tr key={log.id} className={positivo ? 'row-positive' : 'row-negative'}>
                              <td>{new Date(log.data_ganho || log.created_at).toLocaleDateString('pt-PT')}</td>
                              <td>{log.motivo || 'Atribuição de pontos do sistema'}</td>
                              <td style={{ textAlign: 'right', fontWeight: 'bold' }} className={positivo ? 'txt-positive' : 'txt-negative'}>
                                {positivo ? `+${log.pontos}` : log.pontos} XP
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}