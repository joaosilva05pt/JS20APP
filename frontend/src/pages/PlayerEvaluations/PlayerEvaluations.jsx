import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SidebarBalneario from '../../components/SidebarBalneario/SidebarBalneario';
import './PlayerEvaluations.css';

export default function PlayerEvaluations() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [eventosPendentes, setEventosPendentes] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [eventoAtivo, setEventoAtivo] = useState(null);
  const [jogadoresPresenca, setJogadoresPresenca] = useState([]);
  const [notasForm, setNotasForm] = useState({});

  useEffect(() => {
    carregarEventosPendentes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const carregarEventosPendentes = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/teams/${id}/events-to-evaluate`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setEventosPendentes(data);
      }
    } catch (err) {
      setError('Erro de ligação ao buscar pautas pendentes.');
    } finally {
      setLoading(false);
    }
  };

  const lidarComSelecaoEvento = async (eventId) => {
    setSelectedEventId(eventId);
    if (!eventId) {
      setEventoAtivo(null);
      setJogadoresPresenca([]);
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      const res = await fetch(`http://localhost:8000/api/events/${eventId}/players-present`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setEventoAtivo(data.evento);
        setJogadoresPresenca(data.jogadores);

        const initialForm = {};
        data.jogadores.forEach(jog => {
          initialForm[jog.id] = {
            user_id: jog.id,
            nota_remate: 0,
            nota_passe: 0,
            nota_velocidade: 0,
            nota_tecnica: 0,
            nota_defesa: 0,
            nota_mental: 0,
            golos: 0,
            assistencias: 0,
            minutos_jogados: data.evento.tipo === 'Jogo' ? 90 : 0,
            cartoes_amarelos: 0,
            cartoes_vermelhos: 0,
            pontos_positivos: '',
            pontos_negativos: '',
            observacoes_privadas: ''
          };
        });
        setNotasForm(initialForm);
      }
    } catch (err) {
      setError('Erro ao carregar folha de presenças do servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleNotaChange = (userId, campo, valor) => {
    let valorFinal = valor;

    // Proteção estrita contra digitações incorretas superiores a 20 (ex: 154 por esquecimento de ponto)
    if (campo.startsWith('nota_')) {
      const num = parseFloat(valor);
      if (num > 20) valorFinal = 20;
      else if (num < 0 || isNaN(num)) valorFinal = 0;
      else valorFinal = num;
    }
    else if (['golos', 'assistencias', 'minutos_jogados', 'cartoes_amarelos', 'cartoes_vermelhos'].includes(campo)) {
      const num = parseInt(valor, 10);
      valorFinal = isNaN(num) || num < 0 ? 0 : num;
    }

    setNotasForm(prev => ({
      ...prev,
      [userId]: { ...prev[userId], [campo]: valorFinal }
    }));
  };

  const calcularMediaLocal = (jogadorForm) => {
    if (!jogadorForm) return '0.00';
    
    // Tratamento de Suplentes Não Utilizados para não sujar os relatórios locais
    if (eventoAtivo?.tipo === 'Jogo' && Number(jogadorForm.minutos_jogados) === 0) {
      return 'N/A';
    }

    const nRem = Number(jogadorForm.nota_remate) || 0;
    const nPas = Number(jogadorForm.nota_passe) || 0;
    const nVel = Number(jogadorForm.nota_velocidade) || 0;
    const nTec = Number(jogadorForm.nota_tecnica) || 0;
    const nDef = Number(jogadorForm.nota_defesa) || 0;
    const nMen = Number(jogadorForm.nota_mental) || 0;

    const soma = nRem + nPas + nVel + nTec + nDef + nMen;
    return (soma / 6).toFixed(2);
  };

  const handleGravarAvaliacoes = async (e) => {
    e.preventDefault();
    if (submitting) return; // ANTI-DOUBLE CLICK: Trava concorrência no cliente se houver lag

    setSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch(`http://localhost:8000/api/events/${selectedEventId}/evaluations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ avaliacoes: Object.values(notasForm) })
      });

      if (response.ok) {
        setSuccessMessage('✨ Dossiê desportivo blindado com sucesso na base de dados!');
        setEventoAtivo(null);
        setSelectedEventId('');
        setJogadoresPresenca([]);
        carregarEventosPendentes();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Erro ao processar a validação do lote de notas.');
      }
    } catch (err) {
      setError('Falha crítica de comunicação com o servidor desportivo.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && eventosPendentes.length === 0) return <div className="ge-loading">A abrir arquivo tático...</div>;

  return (
    <div className="ge-fullscreen-wrapper">
      <div className="ge-workspace">
        <SidebarBalneario />

        <main className="ge-content-pane">
          <div className="ge-header">
            <h2>Gestão de Rendimento <span className="header-divider">|</span> <span className="header-club-name">Notas 0-20</span></h2>
            <p>Atribuição de avaliações de evolução técnica e métricas estatísticas integradas.</p>
          </div>

          <div className="tab-content-wrapper">
            
            <div className="ge-card full-tab-card" style={{ marginBottom: '1.5rem' }}>
              <h3>Selecione uma Pauta Concluída</h3>
              <p className="ge-card-desc">Eventos terminados e validados pelo staff aguardando lançamento de notas.</p>
              
              <div className="ge-group standard-max-width">
                <select 
                  value={selectedEventId} 
                  onChange={(e) => lidarComSelecaoEvento(e.target.value)}
                  className="membro-inline-dropdown"
                  style={{ height: '45px', fontSize: '0.95rem' }}
                  disabled={submitting}
                >
                  <option value="">-- Escolha o Treino ou Jogo ({eventosPendentes.length}) --</option>
                  {eventosPendentes.map(ev => (
                    <option key={ev.id} value={ev.id}>
                      {ev.tipo === 'Jogo' ? '⚽' : '🏃‍♂️'} {ev.titulo} ({new Date(ev.data_inicio).toLocaleDateString('pt-PT', {day:'numeric', month:'short'})})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {error && <div className="ge-alert ge-error">{error}</div>}
            {successMessage && <div className="ge-alert ge-success">{successMessage}</div>}

            {eventoAtivo && jogadoresPresenca.length > 0 && (
              <form onSubmit={handleGravarAvaliacoes} className="ge-card full-tab-card animate-fade">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <div>
                    <h3 style={{ margin: 0 }}>Grelha de Lançamento: {eventoAtivo.titulo}</h3>
                    <p className="ge-card-desc" style={{ margin: 0 }}>Modificações protegidas por transação atómica em tempo real.</p>
                  </div>
                  <button type="submit" className="ce-btn-create-event" style={{ opacity: submitting ? 0.6 : 1 }} disabled={submitting}>
                    {submitting ? 'A encriptar e gravar...' : '💾 Finalizar & Submeter Pauta'}
                  </button>
                </div>

                <div className="eva-table-responsive">
                  <table className="eva-matrix-table">
                    <thead>
                      <tr>
                        <th>Jogador</th>
                        {eventoAtivo.tipo === 'Jogo' && (
                          <>
                            <th style={{ color: '#ef4444' }}>GOL</th>
                            <th style={{ color: '#eab308' }}>AST</th>
                            <th style={{ color: '#3b82f6' }}>MIN</th>
                            <th style={{ color: '#f59e0b' }}>🟨</th>
                            <th style={{ color: '#ef4444' }}>🟥</th>
                          </>
                        )}
                        <th>PAS</th>
                        <th>REM</th>
                        <th>VEL</th>
                        <th>TEC</th>
                        <th>DEF</th>
                        <th>MEN</th>
                        <th className="cell-highlight">MÉDIA</th>
                        <th>Relatório de Observações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jogadoresPresenca.map(jog => {
                        const jForm = notasForm[jog.id] || {};
                        const temZeroMinutos = eventoAtivo.tipo === 'Jogo' && (jForm.minutos_jogados === 0 || jForm.minutos_jogados === '0');

                        return (
                          <tr key={jog.id} className={temZeroMinutos ? 'eva-row-disabled' : ''}>
                            <td className="eva-player-cell">
                              <strong style={{ opacity: temZeroMinutos ? 0.4 : 1 }}>{jog.nome} {jog.apelido}</strong>
                              {temZeroMinutos && <span style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', fontWeight: 'bold' }}>🛑 SUPLENTE NÃO UTILIZADO</span>}
                            </td>

                            {eventoAtivo.tipo === 'Jogo' && (
                              <>
                                <td>
                                  <input type="number" min="0" max="50" disabled={temZeroMinutos} value={temZeroMinutos ? 0 : (jForm.golos || 0)} onChange={(e) => handleNotaChange(jog.id, 'golos', e.target.value)} className="eva-score-input" style={{ borderColor: '#ef4444' }} />
                                </td>
                                <td>
                                  <input type="number" min="0" max="50" disabled={temZeroMinutos} value={temZeroMinutos ? 0 : (jForm.assistencias || 0)} onChange={(e) => handleNotaChange(jog.id, 'assistencias', e.target.value)} className="eva-score-input" style={{ borderColor: '#eab308' }} />
                                </td>
                                <td>
                                  <input type="number" min="0" max="130" value={jForm.minutos_jogados ?? 90} onChange={(e) => handleNotaChange(jog.id, 'minutos_jogados', e.target.value)} className="eva-score-input" style={{ borderColor: '#3b82f6', width: '60px', background: '#1e293b' }} />
                                </td>
                                <td>
                                  <input type="number" min="0" max="2" disabled={temZeroMinutos} value={temZeroMinutos ? 0 : (jForm.cartoes_amarelos || 0)} onChange={(e) => handleNotaChange(jog.id, 'cartoes_amarelos', e.target.value)} className="eva-score-input" style={{ borderColor: '#f59e0b' }} />
                                </td>
                                <td>
                                  <input type="number" min="0" max="1" disabled={temZeroMinutos} value={temZeroMinutos ? 0 : (jForm.cartoes_vermelhos || 0)} onChange={(e) => handleNotaChange(jog.id, 'cartoes_vermelhos', e.target.value)} className="eva-score-input" style={{ borderColor: '#ef4444' }} />
                                </td>
                              </>
                            )}

                            <td><input type="number" min="0" max="20" step="0.5" disabled={temZeroMinutos} value={temZeroMinutos ? '' : (jForm.nota_passe ?? 0)} onChange={(e) => handleNotaChange(jog.id, 'nota_passe', e.target.value)} className="eva-score-input" /></td>
                            <td><input type="number" min="0" max="20" step="0.5" disabled={temZeroMinutos} value={temZeroMinutos ? '' : (jForm.nota_remate ?? 0)} onChange={(e) => handleNotaChange(jog.id, 'nota_remate', e.target.value)} className="eva-score-input" /></td>
                            <td><input type="number" min="0" max="20" step="0.5" disabled={temZeroMinutos} value={temZeroMinutos ? '' : (jForm.nota_velocidade ?? 0)} onChange={(e) => handleNotaChange(jog.id, 'nota_velocidade', e.target.value)} className="eva-score-input" /></td>
                            <td><input type="number" min="0" max="20" step="0.5" disabled={temZeroMinutos} value={temZeroMinutos ? '' : (jForm.nota_tecnica ?? 0)} onChange={(e) => handleNotaChange(jog.id, 'nota_tecnica', e.target.value)} className="eva-score-input" /></td>
                            <td><input type="number" min="0" max="20" step="0.5" disabled={temZeroMinutos} value={temZeroMinutos ? '' : (jForm.nota_defesa ?? 0)} onChange={(e) => handleNotaChange(jog.id, 'nota_defesa', e.target.value)} className="eva-score-input" /></td>
                            <td><input type="number" min="0" max="20" step="0.5" disabled={temZeroMinutos} value={temZeroMinutos ? '' : (jForm.nota_mental ?? 0)} onChange={(e) => handleNotaChange(jog.id, 'nota_mental', e.target.value)} className="eva-score-input" /></td>
                            
                            <td className="cell-highlight text-center font-bold" style={{ color: temZeroMinutos ? '#475569' : '#3b82f6' }}>
                              {calcularMediaLocal(jForm)}
                            </td>
                            
                            <td>
                              <div className="eva-feedback-box" style={{ opacity: temZeroMinutos ? 0.3 : 1 }}>
                                <input type="text" placeholder="👍 Aspetos Fortes..." disabled={temZeroMinutos} value={jForm.pontos_positivos || ''} onChange={(e) => handleNotaChange(jog.id, 'pontos_positivos', e.target.value)} className="eva-text-input" />
                                <input type="text" placeholder="👎 Défices a trabalhar..." disabled={temZeroMinutos} value={jForm.pontos_negativos || ''} onChange={(e) => handleNotaChange(jog.id, 'pontos_negativos', e.target.value)} className="eva-text-input" />
                                <input type="text" placeholder="🔒 Notas privadas de Gabinete..." disabled={temZeroMinutos} value={jForm.observacoes_privadas || ''} onChange={(e) => handleNotaChange(jog.id, 'observacoes_privadas', e.target.value)} className="eva-text-input private" />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </form>
            )}

            {eventoAtivo && jogadoresPresenca.length === 0 && (
              <div className="ge-card full-tab-card">
                <p className="no-data-text">⚠️ Sem quórum. Não existem registos de 'Presente' ou 'Atrasado' validados pela equipa técnica para este evento.</p>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}