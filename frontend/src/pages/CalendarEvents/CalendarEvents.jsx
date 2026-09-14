import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SidebarBalneario from '../../components/SidebarBalneario/SidebarBalneario';
import './CalendarEvents.css';

export default function CalendarEvents() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Estados de Carregamento e Alertas
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState({ type: '', text: '' });

  // Controlo do Modo de Visualização Interna
  const [viewMode, setViewMode] = useState('dia'); // 'dia' | 'proximos_5'

  // Estados do Calendário e Permissões
  const [weekOffset, setWeekOffset] = useState(0);
  const [weekInfo, setWeekInfo] = useState({ inicio: '', fim: '' });
  const [eventos, setEventos] = useState([]);
  const [permissoes, setPermissoes] = useState({ cargo_detetado: 'A carregar...', pode_editar: false, pode_responder: false });
  const [selectedDate, setSelectedDate] = useState('');
  
  // LISTA NEGRA CLÍNICA ENVIADA PELO EVENTCONTROLLER
  const [idsLesionados, setIdsLesionados] = useState([]);
  
  // Dados do Plantel e Equipa Sincronizados
  const [plantel, setPlantel] = useState([]);
  const [equipaAtiva, setEquipaAtiva] = useState(null);

  // MODAL 1: Justificação (Atletas)
  const [showJustifyModal, setShowJustifyModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [justificacaoForm, setJustificacaoForm] = useState({ motivo: '', anexo_url: '' });

  // MODAL 2: Criar Evento (Mister)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    titulo: '', descricao: '', tipo: 'Treino', tipo_jogo: 'Nao_Aplicavel',
    data_inicio: '', data_fim: '', localizacao: '', foco_tecnico: '', convocados: []
  });

  // MODAL 3: Gerir Evento (Mister)
  const [showManageModal, setShowManageModal] = useState(false);
  const [activeTab, setActiveTab] = useState('detalhes');
  const [manageEventForm, setManageEventForm] = useState(null);
  
  // Lista linear de presenças para o Mister poder editar à mão (✓/❌) antes de trancar
  const [listaPresencasEditavel, setListaPresencasEditavel] = useState([]);

  // ------------------------------------------------------------------------
  // 1. CARREGAMENTO E SINCRONIZAÇÃO DE DADOS
  // ------------------------------------------------------------------------
  const carregarMundoCalendario = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`http://localhost:8000/api/calendar/weekly?team_id=${id}&week_offset=${weekOffset}`, { 
        credentials: 'include' 
      });

      if (response.ok) {
        const data = await response.json();
        setWeekInfo({ inicio: data.semana_inicio, fim: data.semana_fim });
        setEventos(data.eventos);
        setPermissoes(data.permissoes);
        
        if (data.ids_lesionados) {
          setIdsLesionados(data.ids_lesionados);
        }
        
        if (data.team) setEquipaAtiva(data.team);
        
        if (!selectedDate || weekOffset !== 0) {
          const hoje = new Date().toISOString().split('T')[0];
          if (weekOffset === 0 && hoje >= data.semana_inicio && hoje <= data.semana_fim) {
             setSelectedDate(hoje);
          } else {
             setSelectedDate(data.semana_inicio);
          }
        }
      } else {
        setError('Erro ao carregar o calendário.');
      }
    } catch (err) {
      setError('Falha de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarMundoCalendario();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, weekOffset]);

  const fetchPlantel = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/teams/${id}/membros`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setPlantel(data.membros.filter(m => m.cargo === 'Jogador'));
      }
    } catch (e) {
      console.error('Erro ao carregar plantel', e);
    }
  };

  // ------------------------------------------------------------------------
  // 2. MOTORES DE RESPOSTA PENSADOS EXCLUSIVAMENTE PARA JOGADORES
  // ------------------------------------------------------------------------
  const handleConfirmPresence = async (eventId) => {
    setActionMessage({ type: '', text: '' });
    try {
      const response = await fetch(`http://localhost:8000/api/events/${eventId}/confirm`, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        credentials: 'include'
      });
      const data = await response.json();
      if (response.ok) {
        setActionMessage({ type: 'success', text: data.message });
        carregarMundoCalendario();
      } else {
        setActionMessage({ type: 'error', text: data.message });
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: 'Erro ao confirmar presença.' });
    }
  };

  const handleJustifyAbsence = async (e) => {
    e.preventDefault();
    setActionMessage({ type: '', text: '' });
    try {
      const response = await fetch(`http://localhost:8000/api/events/${selectedEvent.id}/justify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(justificacaoForm)
      });
      const data = await response.json();
      if (response.ok) {
        setActionMessage({ type: 'success', text: data.message });
        setShowJustifyModal(false);
        setJustificacaoForm({ motivo: '', anexo_url: '' });
        carregarMundoCalendario();
      } else {
        setActionMessage({ type: 'error', text: data.message });
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: 'Erro ao submeter justificação.' });
    }
  };

  // ------------------------------------------------------------------------
  // 3. OPERAÇÕES DE CAMPO (TREINADORES)
  // ------------------------------------------------------------------------
  const openCreateModal = async () => {
    await fetchPlantel();
    setNewEvent({
      titulo: '', descricao: '', tipo: 'Treino', tipo_jogo: 'Nao_Aplicavel',
      data_inicio: `${selectedDate}T19:00`, data_fim: `${selectedDate}T21:00`, 
      localizacao: '', foco_tecnico: '', convocados: []
    });
    setShowCreateModal(true);
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setActionMessage({ type: '', text: '' });

    if (newEvent.tipo === 'Jogo' && newEvent.convocados.length < 8) {
       setActionMessage({ type: 'error', text: 'Para um Jogo, tens de convocar no mínimo 8 jogadores.' });
       return;
    }

    try {
      const response = await fetch(`http://localhost:8000/api/teams/${id}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newEvent)
      });
      const data = await response.json();
      if (response.ok) {
        setActionMessage({ type: 'success', text: data.message });
        setShowCreateModal(false);
        carregarMundoCalendario();
      } else {
        setActionMessage({ type: 'error', text: data.error ? `${data.message} ${data.error}` : data.message });
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: 'Erro ao agendar o evento.' });
    }
  };

  const openManageModal = async (evento) => {
    await fetchPlantel();
    try {
      const response = await fetch(`http://localhost:8000/api/events/${evento.id}/detalhes`, {
        headers: { 'Accept': 'application/json' },
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        
        const linearList = [
          ...data.folha_presencas.confirmados.map(p => ({ ...p, estado: 'Presente' })),
          ...data.folha_presencas.pendentes.map(p => ({ ...p, estado: 'Pendente' })),
          ...data.folha_presencas.ausentes.map(p => ({ ...p, estado: p.estado === 'Presente' || p.estado === 'Pendente' ? 'Ausente' : p.estado }))
        ];
        setListaPresencasEditavel(linearList);
        
        const todosConvocados = linearList.map(p => p.id);

        setManageEventForm({
          id: evento.id,
          titulo: evento.titulo,
          descricao: evento.descricao || '',
          tipo: evento.tipo,
          tipo_jogo: evento.tipo_jogo,
          data_inicio: evento.data_inicio.replace(' ', 'T').substring(0, 16),
          data_fim: evento.data_fim.replace(' ', 'T').substring(0, 16),
          localizacao: evento.localizacao || '',
          foco_tecnico: evento.foco_tecnico || '',
          terminado: evento.terminado,
          convocados: todosConvocados
        });

        setActiveTab('detalhes');
        setShowManageModal(true);
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: 'Erro ao carregar detalhes do evento.' });
    }
  };

  const handleAlterarEstadoJogadorMão = (jogadorId, novoEstado) => {
    setListaPresencasEditavel(prev => 
      prev.map(p => p.id === jogadorId ? { ...p, estado: novoEstado } : p)
    );
  };

  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    setActionMessage({ type: '', text: '' });

    if (manageEventForm.tipo === 'Jogo' && manageEventForm.convocados.length < 8) {
       setActionMessage({ type: 'error', text: 'Para um Jogo, deves manter no mínimo 8 jogadores na convocatória.' });
       return;
    }

    try {
      const response = await fetch(`http://localhost:8000/api/events/${manageEventForm.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(manageEventForm)
      });
      const data = await response.json();
      if (response.ok) {
        setActionMessage({ type: 'success', text: 'Evento atualizado com sucesso!' });
        setShowManageModal(false);
        carregarMundoCalendario();
      } else {
        setActionMessage({ type: 'error', text: data.error ? `${data.message} ${data.error}` : data.message });
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: 'Erro ao atualizar o evento.' });
    }
  };

  const handleFinalizeEvent = async () => {
    if (!window.confirm('Tens a certeza que queres dar o Apito Final? As presenças atuais serão guardadas e os dados trancados.')) return;
    try {
      const response = await fetch(`http://localhost:8000/api/events/${manageEventForm.id}/finalizar`, {
        method: 'PATCH',
        headers: { 
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ presencas_finais: listaPresencasEditavel })
      });
      if (response.ok) {
        setActionMessage({ type: 'success', text: 'Evento finalizado com sucesso!' });
        setShowManageModal(false);
        carregarMundoCalendario();
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: 'Erro ao finalizar o evento.' });
    }
  };

  // OPERAÇÃO TÁTICA: Pedido de remoção enviado ao destroy do Laravel
  const handleDeleteEvent = async () => {
    if (!window.confirm('⚠️ ALERTA: Tens a certeza que desejas apagar definitivamente este evento do calendário? Esta ação vai limpar todas as presenças associadas.')) return;
    setActionMessage({ type: '', text: '' });
    try {
      const response = await fetch(`http://localhost:8000/api/events/${manageEventForm.id}`, {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' },
        credentials: 'include'
      });
      const data = await response.json();
      if (response.ok) {
        setActionMessage({ type: 'success', text: data.message });
        setShowManageModal(false);
        carregarMundoCalendario();
      } else {
        setActionMessage({ type: 'error', text: data.message });
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: 'Erro de conexão ao tentar apagar o evento.' });
    }
  };

  // ------------------------------------------------------------------------
  // 4. HELPERS DE COMPOSIÇÃO DE LAYOUT
  // ------------------------------------------------------------------------
  const generateWeekDays = () => {
    if (!weekInfo.inicio) return [];
    let days = [];
    let start = new Date(weekInfo.inicio);
    for (let i = 0; i < 7; i++) {
      let currentDate = new Date(start);
      currentDate.setDate(start.getDate() + i);
      days.push({
        fullDate: currentDate.toISOString().split('T')[0],
        dayNumber: currentDate.getDate(),
        dayName: currentDate.toLocaleDateString('pt-PT', { weekday: 'short' }).charAt(0).toUpperCase()
      });
    }
    return days;
  };

  const weekDays = generateWeekDays();
  const eventosDoDia = eventos.filter(ev => ev.data_inicio.startsWith(selectedDate));
  
  const hojeString = new Date().toISOString().split('T')[0];
  const proximos5Eventos = [...eventos]
    .filter(ev => ev.data_inicio >= hojeString)
    .filter(ev => permissoes.pode_editar || ev.reacao_jogador?.tem_registo === true)
    .sort((a, b) => a.data_inicio.localeCompare(b.data_inicio))
    .slice(0, 5);

  const obterIconeTipo = (tipo) => {
    if (tipo === 'Jogo') return '⚽';
    if (tipo === 'Treino') return '🏃‍♂️';
    if (tipo === 'Estagio') return '🏋️‍♂️';
    return '🧠';
  };

  if (loading && eventos.length === 0) return <div className="ge-loading">A sincronizar cronograma do escalão...</div>;

  return (
    <div className="ge-fullscreen-wrapper">
      <div className="ge-workspace">
        <SidebarBalneario />

        <main className="ge-content-pane">
          
          {/* HEADER PRINCIPAL */}
          <div className="ge-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <h2>
                  Calendário Semanal <span className="header-divider"> | </span> 
                  <span className="header-club-name">{equipaAtiva?.escalao || 'Senior M'} ({equipaAtiva?.clube_nome || 'Portimonense SC'})</span>
                </h2>
                <p>
                  {permissoes.pode_editar && `📋 Painel Técnico (${permissoes.cargo_detetado}) — Controla as rotinas e presenças.`}
                  {permissoes.pode_responder && `🏃‍♂️ Área do Atleta (${permissoes.cargo_detetado}) — Responde e confirma presença.`}
                  {(!permissoes.pode_editar && !permissoes.pode_responder) && `🏢 Modo de Observação (${permissoes.cargo_detetado}) — Consulta o dossiê.`}
                </p>
              </div>
              
              {permissoes.pode_editar && (
                <button className="ce-btn-create-event" onClick={openCreateModal}>
                  + Novo Evento
                </button>
              )}
            </div>
          </div>

          {/* NAVEGAÇÃO DE ABAS INTERNAS DE VISUALIZAÇÃO */}
          <div className="membros-tabs-nav">
            <button className={`tab-nav-btn ${viewMode === 'dia' ? 'active' : ''}`} onClick={() => setViewMode('dia')}>
              📅 Ver por Dia
            </button>
            <button className={`tab-nav-btn ${viewMode === 'proximos_5' ? 'active' : ''}`} onClick={() => setViewMode('proximos_5')}>
              🔥 Próximos 5 Compromissos
            </button>
          </div>

          {actionMessage.text && (
            <div className={`ge-alert ${actionMessage.type === 'success' ? 'ge-success' : 'ge-error'}`} style={{ margin: '1rem 0 0 0' }}>
              {actionMessage.text}
            </div>
          )}

          {viewMode === 'dia' && (
            <div className="ce-apple-picker-container">
              <button className="ce-picker-nav" onClick={() => setWeekOffset(prev => prev - 1)}>&larr;</button>
              <div className="ce-apple-week">
                {weekDays.map(day => (
                  <div 
                    key={day.fullDate} 
                    className={`ce-apple-day ${selectedDate === day.fullDate ? 'active' : ''}`} 
                    onClick={() => setSelectedDate(day.fullDate)}
                  >
                    <span className="ce-day-name">{day.dayName}</span>
                    <span className="ce-day-number">{day.dayNumber}</span>
                  </div>
                ))}
              </div>
              <button className="ce-picker-nav" onClick={() => setWeekOffset(prev => prev + 1)}>&rarr;</button>
            </div>
          )}

          {/* CORPO DE TRABALHO CENTRAL */}
          <div className="tab-content-wrapper" style={{ marginTop: viewMode === 'proximos_5' ? '1.5rem' : '0' }}>
            {error && <div className="ge-alert ge-error">{error}</div>}

            <div className="ge-card full-tab-card">
              
              {/* VISTA 1: CRONOGRAMA DIÁRIO */}
              {viewMode === 'dia' && (
                <div className="ce-vertical-timeline">
                  <h3 className="ce-timeline-title">
                     {new Date(selectedDate).toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </h3>
                  
                  {eventosDoDia.length === 0 ? (
                    <p className="no-data-text">Não existem compromissos agendados para este dia.</p>
                  ) : (
                    <div className="ce-timeline-events">
                      {eventosDoDia.map(ev => {
                        const status = ev.reacao_jogador?.estado_presenca || 'Pendente';
                        const temRegisto = ev.reacao_jogador?.tem_registo;
                        const isNaoConvocado = !permissoes.pode_editar && !temRegisto;

                        return (
                          <div key={ev.id} className={`ce-timeline-row ${isNaoConvocado ? 'ghost-event' : ''}`}>
                            <div className="ce-time-column">
                              <span>{ev.data_inicio.split(' ')[1].substring(0, 5)}</span>
                            </div>
                            <div className={`ce-event-block type-${ev.tipo.toLowerCase()} ${ev.terminado ? 'event-locked' : ''}`}>
                              <div className="ce-event-info">
                                <h4>{obterIconeTipo(ev.tipo)} {ev.titulo} {ev.terminado && '🔒'}</h4>
                                <span className="ce-event-meta">{ev.tipo} {ev.localizacao && `• 📍 ${ev.localizacao}`}</span>
                              </div>
                              
                              <div className="ce-event-actions">
                                {isNaoConvocado ? (
                                  <span className="ce-ghost-badge">Opção Técnico</span>
                                ) : permissoes.pode_editar ? (
                                  <button className="ce-btn-manage-event" onClick={() => openManageModal(ev)}>Gerir</button>
                                ) : (
                                  status === 'Pendente' && !ev.terminado ? (
                                    <div className="ce-action-buttons">
                                      <button className="ce-btn-confirm" onClick={() => handleConfirmPresence(ev.id)}>✓ Confirmo</button>
                                      <button className="ce-btn-reject" onClick={() => { setSelectedEvent(ev); setShowJustifyModal(true); }}>✗ Faltar</button>
                                    </div>
                                  ) : (
                                    <div className={`ce-status-badge status-${status.toLowerCase()}`}>
                                       {status}
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* VISTA 2: PRÓXIMOS 5 COMPROMISSOS */}
              {viewMode === 'proximos_5' && (
                <div className="ce-vertical-timeline">
                  <h3 className="ce-timeline-title">Foco Desportivo a Curto Prazo</h3>
                  
                  {proximos5Eventos.length === 0 ? (
                    <p className="no-data-text">Sem compromissos agendados para os próximos dias.</p>
                  ) : (
                    <div className="ce-timeline-events">
                      {proximos5Eventos.map(ev => {
                        const dataFormatada = new Date(ev.data_inicio).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', weekday: 'short' });
                        const status = ev.reacao_jogador?.estado_presenca || 'Pendente';
                        const temRegisto = ev.reacao_jogador?.tem_registo;
                        const isNaoConvocado = !permissoes.pode_editar && !temRegisto;

                        return (
                          <div key={ev.id} className={`ce-timeline-row ${isNaoConvocado ? 'ghost-event' : ''}`}>
                            <div className="ce-time-column" style={{ width: '85px', fontSize: '0.85rem' }}>
                              <span style={{ display: 'block', color: '#fff' }}>{dataFormatada}</span>
                              <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>{ev.data_inicio.split(' ')[1].substring(0, 5)}</span>
                            </div>
                            <div className={`ce-event-block type-${ev.tipo.toLowerCase()} ${ev.terminado ? 'event-locked' : ''}`}>
                              <div className="ce-event-info">
                                <h4>{obterIconeTipo(ev.tipo)} {ev.titulo} {ev.terminado && '🔒'}</h4>
                                <span className="ce-event-meta">{ev.tipo} {ev.localizacao && `• 📍 ${ev.localizacao}`}</span>
                              </div>
                              <div className="ce-event-actions">
                                {isNaoConvocado ? (
                                  <span className="ce-ghost-badge">Opção Técnica</span>
                                ) : permissoes.pode_editar ? (
                                  <button className="ce-btn-manage-event" onClick={() => openManageModal(ev)}>Gerir</button>
                                ) : (
                                  <div className={`ce-status-badge status-${status.toLowerCase()}`}>{status}</div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </main>
      </div>

      {/* MODAL 1: JUSTIFICAR FALTA */}
      {showJustifyModal && (
        <div className="ce-modal-overlay">
          <div className="ce-modal-window">
            <h3>Justificar Ausência</h3>
            <p className="ce-modal-subtext">Estás a pedir dispensa para: <strong>{selectedEvent?.titulo}</strong>.</p>
            <form onSubmit={handleJustifyAbsence} className="ce-modal-form">
              <div className="ce-form-group">
                <label>Motivo da Ausência *</label>
                <textarea rows="4" value={justificacaoForm.motivo} onChange={(e) => setJustificacaoForm({...justificacaoForm, motivo: e.target.value})} required placeholder="Explica ao Mister o motivo..." />
              </div>
              <div className="ce-modal-actions">
                <button type="button" className="ce-btn-modal-cancel" onClick={() => setShowJustifyModal(false)}>Cancelar</button>
                <button type="submit" className="ce-btn-modal-confirm warning">Submeter ao Staff</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CRIAR EVENTO E CONVOCAR (MISTER) */}
      {showCreateModal && (
        <div className="ce-modal-overlay">
          <div className="ce-modal-window" style={{ maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3>Agendar Novo Evento</h3>
            <p className="ce-modal-subtext">Adiciona um novo compromisso à rotina da equipa.</p>
            
            <form onSubmit={handleCreateEvent} className="ce-modal-form">
              <div className="ce-form-row-twin">
                <div className="ce-form-group">
                  <label>Título / Nome do Evento *</label>
                  <input type="text" value={newEvent.titulo} onChange={(e) => setNewEvent({...newEvent, titulo: e.target.value})} required placeholder="Ex: Treino de Conjunto" />
                </div>
                <div className="ce-form-group">
                  <label>Tipo de Evento *</label>
                  <select value={newEvent.tipo} onChange={(e) => setNewEvent({...newEvent, tipo: e.target.value})}>
                    <option value="Treino">Treino de Campo</option>
                    <option value="Jogo">Jogo / Partida</option>
                    <option value="Estagio">Estágio / Ginásio</option>
                    <option value="Reuniao">Sessão Teórica (Vídeo)</option>
                  </select>
                </div>
              </div>

              {newEvent.tipo === 'Jogo' && (
                <div className="ce-form-group">
                  <label>Tipo de Partida</label>
                  <select value={newEvent.tipo_jogo} onChange={(e) => setNewEvent({...newEvent, tipo_jogo: e.target.value})}>
                    <option value="Nao_Aplicavel">Selecione...</option>
                    <option value="Oficial">Oficial (Campeonato/Taça)</option>
                    <option value="Amigavel">Jogo Amigável</option>
                  </select>
                </div>
              )}

              <div className="ce-form-row-twin">
                <div className="ce-form-group">
                  <label>Data e Hora de Início *</label>
                  <input type="datetime-local" value={newEvent.data_inicio} onChange={(e) => setNewEvent({...newEvent, data_inicio: e.target.value})} required />
                </div>
                <div className="ce-form-group">
                  <label>Data e Hora de Fim *</label>
                  <input type="datetime-local" value={newEvent.data_fim} onChange={(e) => setNewEvent({...newEvent, data_fim: e.target.value})} required />
                </div>
              </div>

              <div className="ce-form-row-twin">
                <div className="ce-form-group">
                  <label>Localização / Instalações</label>
                  <input type="text" value={newEvent.localizacao} onChange={(e) => setNewEvent({...newEvent, localizacao: e.target.value})} placeholder="Ex: Campo Sintético" />
                </div>
                <div className="ce-form-group">
                  <label>Foco Técnico (Opcional)</label>
                  <input type="text" value={newEvent.foco_tecnico} onChange={(e) => setNewEvent({...newEvent, foco_tecnico: e.target.value})} placeholder="Ex: Pressão Alta" />
                </div>
              </div>

              <div className="ce-form-group">
                <label>Notas / Recomendações</label>
                <textarea rows="2" value={newEvent.descricao} onChange={(e) => setNewEvent({...newEvent, descricao: e.target.value})} placeholder="Avisos importantes para o plantel..."></textarea>
              </div>

              <div className="ce-convocatoria-box">
                <h4>Convocatória Oficial ({newEvent.convocados.length} Selecionados)</h4>
                <div className="ce-convocatoria-actions">
                  <button type="button" onClick={() => setNewEvent({...newEvent, convocados: plantel.filter(p => !idsLesionados.includes(p.user_id)).map(p => p.user_id)})}>Selecionar Todos Disponíveis</button>
                  <button type="button" onClick={() => setNewEvent({...newEvent, convocados: []})}>Limpar Tudo</button>
                </div>
                <div className="ce-players-grid">
                  {plantel.map(jogador => {
                    const isLesionado = idsLesionados.includes(jogador.user_id);
                    return (
                      <label 
                        key={jogador.user_id} 
                        className={`ce-player-checkbox ${isLesionado ? 'ce-player-injured-disabled' : ''}`}
                        style={isLesionado ? { opacity: 0.4, color: '#ef4444', cursor: 'not-allowed' } : {}}
                      >
                        <input 
                          type="checkbox" 
                          checked={newEvent.convocados.includes(jogador.user_id)}
                          disabled={isLesionado} 
                          onChange={(e) => {
                            const updated = e.target.checked 
                              ? [...newEvent.convocados, jogador.user_id]
                              : newEvent.convocados.filter(id => id !== jogador.user_id);
                            setNewEvent({...newEvent, convocados: updated});
                          }}
                        />
                        {jogador.nome} {jogador.apelido} {isLesionado && "🤕 [Inapto]"}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="ce-modal-actions">
                <button type="button" className="ce-btn-modal-cancel" onClick={() => setShowCreateModal(false)}>Cancelar</button>
                <button type="submit" className="ce-btn-modal-confirm success">Agendar & Convocar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: GERIR EVENTO (MISTER) WITH TABS & DELETE FUNCTION */}
      {showManageModal && manageEventForm && (
        <div className="ce-modal-overlay">
          <div className="ce-modal-window" style={{ maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto' }}>
            
            <div className="ce-modal-header-tabs">
              <h3>{manageEventForm.terminado ? '🔒 Dossiê Trancado' : '⚙️ Painel Operacional'}</h3>
              <div className="ce-tabs">
                <button className={`ce-tab-btn ${activeTab === 'detalhes' ? 'active' : ''}`} onClick={() => setActiveTab('detalhes')}>Editar Detalhes</button>
                <button className={`ce-tab-btn ${activeTab === 'presencas' ? 'active' : ''}`} onClick={() => setActiveTab('presencas')}>Folha de Presenças</button>
              </div>
            </div>

            {/* ABA 1: DETALHES DO EVENTO */}
            {activeTab === 'detalhes' && (
              <form onSubmit={handleUpdateEvent} className="ce-modal-form mt-3">
                {manageEventForm.terminado && (
                  <div className="ge-alert ge-error" style={{ marginBottom: '1rem' }}>Este evento já foi dado como terminado. Dados protegidos.</div>
                )}
                
                <div className="ce-form-row-twin">
                  <div className="ce-form-group">
                    <label>Título</label>
                    <input type="text" value={manageEventForm.titulo} onChange={(e) => setManageEventForm({...manageEventForm, titulo: e.target.value})} required disabled={manageEventForm.terminado}/>
                  </div>
                  <div className="ce-form-group">
                    <label>Tipo</label>
                    <select value={manageEventForm.tipo} onChange={(e) => setManageEventForm({...manageEventForm, tipo: e.target.value})} disabled={manageEventForm.terminado}>
                      <option value="Treino">Treino de Campo</option>
                      <option value="Jogo">Jogo / Partida</option>
                      <option value="Estagio">Estágio / Ginásio</option>
                      <option value="Reuniao">Sessão Teórica (Vídeo)</option>
                    </select>
                  </div>
                </div>

                <div className="ce-form-row-twin">
                  <div className="ce-form-group">
                    <label>Início</label>
                    <input type="datetime-local" value={manageEventForm.data_inicio} onChange={(e) => setManageEventForm({...manageEventForm, data_inicio: e.target.value})} required disabled={manageEventForm.terminado}/>
                  </div>
                  <div className="ce-form-group">
                    <label>Fim</label>
                    <input type="datetime-local" value={manageEventForm.data_fim} onChange={(e) => setManageEventForm({...manageEventForm, data_fim: e.target.value})} required disabled={manageEventForm.terminado}/>
                  </div>
                </div>

                <div className="ce-convocatoria-box">
                  <h4>Ajustar Convocatória ({manageEventForm.convocados.length})</h4>
                  <div className="ce-players-grid">
                    {plantel.map(jogador => {
                       const isLesionado = idsLesionados.includes(jogador.user_id);
                       return (
                          <label 
                            key={jogador.user_id} 
                            className={`ce-player-checkbox ${isLesionado ? 'ce-player-injured-disabled' : ''}`}
                            style={isLesionado ? { opacity: 0.4, color: '#ef4444', cursor: 'not-allowed' } : {}}
                          >
                            <input 
                               type="checkbox" 
                               checked={manageEventForm.convocados.includes(jogador.user_id)}
                               disabled={manageEventForm.terminado || isLesionado} 
                               onChange={(e) => {
                                  const updated = e.target.checked 
                                    ? [...manageEventForm.convocados, jogador.user_id]
                                    : manageEventForm.convocados.filter(id => id !== jogador.user_id);
                                  setManageEventForm({...manageEventForm, convocados: updated});
                               }}
                            />
                            {jogador.nome} {jogador.apelido} {isLesionado && "🤕 [Inapto]"}
                          </label>
                       );
                    })}
                  </div>
                </div>

                {/* BOTÕES OPERACIONAIS DE EDIÇÃO */}
                <div className="ce-modal-actions" style={{ justifyContent: 'space-between' }}>
                  <div>
                    {!manageEventForm.terminado && (
                      <button type="button" className="ce-btn-modal-delete" onClick={handleDeleteEvent} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                        🗑️ Eliminar Evento
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="button" className="ce-btn-modal-cancel" onClick={() => setShowManageModal(false)}>Fechar</button>
                    {!manageEventForm.terminado && <button type="submit" className="ce-btn-modal-confirm success">Guardar Alterações</button>}
                  </div>
                </div>
              </form>
            )}

            {/* ABA 2: FOLHA DE PRESENÇAS INTERATIVA */}
            {activeTab === 'presencas' && (
              <div className="ce-presencas-view mt-3">
                <div className="ce-presenca-grupo confirmados" style={{ background: '#0f1523', padding: '1rem', borderRadius: '8px' }}>
                  <h4 style={{ color: '#3b82f6', margin: '0 0 1rem 0' }}>📋 Validar Assiduidade dos Convocados</h4>
                  <p className="ge-card-desc" style={{ marginTop: '-0.5rem' }}>O Mister tem a palavra final. Ajuste quem participou de facto antes de fechar o evento.</p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {listaPresencasEditavel.map(jogador => (
                      <div key={jogador.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#172033', padding: '0.6rem 1rem', borderRadius: '6px' }}>
                        <span style={{ color: '#fff', fontWeight: '600' }}>{jogador.nome} {jogador.apelido}</span>
                        
                        {manageEventForm.terminado ? (
                          <div className={`ce-status-badge status-${jogador.estado.toLowerCase()}`}>{jogador.estado}</div>
                        ) : (
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button 
                              type="button" 
                              onClick={() => handleAlterarEstadoJogadorMão(jogador.id, 'Presente')}
                              style={{ 
                                background: jogador.estado === 'Presente' ? '#22c55e' : 'rgba(34, 197, 94, 0.08)',
                                color: jogador.estado === 'Presente' ? '#fff' : '#22c55e',
                                border: '1px solid rgba(34, 197, 94, 0.2)', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600'
                              }}
                            >
                              ✓ Presente
                            </button>
                            <button 
                              type="button" 
                              onClick={() => handleAlterarEstadoJogadorMão(jogador.id, 'Ausente')}
                              style={{ 
                                background: jogador.estado === 'Ausente' ? '#ef4444' : 'rgba(239, 68, 68, 0.08)',
                                color: jogador.estado === 'Ausente' ? '#fff' : '#f87171',
                                border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600'
                              }}
                            >
                              ❌ Ausente
                            </button>
                            {jogador.estado !== 'Presente' && jogador.estado !== 'Ausente' && (
                              <div className="ce-status-badge status-pendente" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>{jogador.estado}</div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="ce-modal-actions mt-4" style={{ justifyContent: 'space-between' }}>
                  <button type="button" className="ce-btn-modal-cancel" onClick={() => setShowManageModal(false)}>Voltar</button>
                  
                  {!manageEventForm.terminado && (
                    <button type="button" className="ce-btn-modal-confirm warning" onClick={handleFinalizeEvent}>
                       🏁 Apito Final (Terminar Evento)
                    </button>
                  )}
                </div>
              </div>
            )}
            
          </div>
        </div>
      )}
    </div>
  );
}