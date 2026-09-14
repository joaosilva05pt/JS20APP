import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SidebarBalneario from '../../components/SidebarBalneario/SidebarBalneario';
import './MembrosGestao.css';

export default function MembrosGestao() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Estados de dados
  const [membros, setMembros] = useState([]);
  const [convitesPendentes, setConvitesPendentes] = useState([]);
  const [equipaAtiva, setEquipaAtiva] = useState(null);
  const [clube, setClube] = useState(null);
  const [loading, setLoading] = useState(true);

  // Controlo da Aba Ativa: 'plantel' | 'convidar' | 'pendentes'
  const [activeTab, setActiveTab] = useState('plantel');

  // Estados para alterações locais da lista (Edição em linha)
  const [membrosEditados, setMembrosEditados] = useState({});

  // Estados do Formulário de Novo Convite
  const [emailInvite, setEmailInvite] = useState('');
  const [cargoInvite, setCargoInvite] = useState('Jogador');
  const [numeroCamisola, setNumeroCamisola] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loadingInvite, setLoadingInvite] = useState(false);

  const carregarDadosCompletos = async () => {
    try {
      // 1. Primeiro validamos o utilizador logado (passo obrigatório que dita o acesso)
      const userRes = await fetch('http://localhost:8000/api/user', { credentials: 'include' });
      const userData = await userRes.json();

      if (userData.profissao_base !== 'Dirigente') {
        alert("⚠️ Acesso Negado: Apenas a Direção pode gerir membros!");
        navigate(`/equipa-gestao/${id}`);
        return;
      }

      // 2. [OTIMIZAÇÃO PARALELA]: Dispara os 3 pedidos seguintes ao mesmo tempo!
      const [clubRes, membrosRes, pendentesRes] = await Promise.all([
        fetch('http://localhost:8000/api/meu-clube', { credentials: 'include' }),
        fetch(`http://localhost:8000/api/teams/${id}/membros`, { credentials: 'include' }),
        fetch(`http://localhost:8000/api/teams/${id}/team-invites-pendentes`, { credentials: 'include' })
      ]);

      // 3. Processa as respostas à medida que chegam em simultâneo
      if (clubRes.ok) setClube(await clubRes.json());
      
      if (membrosRes.ok) {
        const resData = await membrosRes.json();
        setMembros(resData.membros || []);
        if (resData.team) setEquipaAtiva(resData.team);
      }

      if (pendentesRes.ok) {
        const pendentesData = await pendentesRes.json();
        console.log("Convites recebidos do Laravel:", pendentesData);
        setConvitesPendentes(pendentesData);
      }

    } catch (err) {
      console.error("Erro ao carregar dados de gestão:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDadosCompletos();
  }, [id, navigate]);

  const handleLocalChange = (userId, campo, valor) => {
    setMembros(prev => prev.map(m => m.user_id === userId ? { ...m, [campo]: valor } : m));
    setMembrosEditados(prev => ({
      ...prev,
      [userId]: { ...prev[userId], [campo]: valor }
    }));
  };

  const handleGuardarAlteracoes = async (userId) => {
    const dadosAlterados = membrosEditados[userId];
    const membroOriginal = membros.find(m => m.user_id === userId);
    if (!dadosAlterados) return;

    try {
      const res = await fetch(`http://localhost:8000/api/teams/${id}/membros/${userId}/editar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          cargo: dadosAlterados.cargo !== undefined ? dadosAlterados.cargo : membroOriginal.cargo,
          numero_camisola: dadosAlterados.numero_camisola !== undefined ? dadosAlterados.numero_camisola : membroOriginal.numero_camisola
        })
      });

      if (res.ok) {
        alert("✨ Dados do ativo atualizados com sucesso!");
        setMembrosEditados(prev => {
          const cópia = { ...prev };
          delete cópia[userId];
          return cópia;
        });
      }
    } catch (err) {
      console.error("Erro ao atualizar membro:", err);
    }
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    setLoadingInvite(true);
    setMessage({ text: '', type: '' });

    try {
      const res = await fetch('http://localhost:8000/api/teams/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          team_id: id,
          email: emailInvite,
          cargo: cargoInvite,
          numero_camisola: cargoInvite === 'Jogador' ? numeroCamisola : null
        })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: data.message, type: 'success' });
        setEmailInvite('');
        setNumeroCamisola('');
        
        // Atualiza os dados imediatamente e redireciona para a aba de pendentes
        await carregarDadosCompletos();
        setActiveTab('pendentes');
      } else {
        setMessage({ text: data.message || 'Erro ao enviar convite.', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Erro de conexão.', type: 'error' });
    } finally {
      setLoadingInvite(false);
    }
  };

  const handleRemoverMembro = async (userId, nomeMembro) => {
    if (!window.confirm(`Tens a certeza que queres remover o(a) ${nomeMembro} deste escalão?`)) return;
    try {
      const res = await fetch(`http://localhost:8000/api/teams/${id}/membros/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        alert("Membro removido com sucesso!");
        setMembros(membros.filter(m => m.user_id !== userId));
      }
    } catch (err) {
      console.error("Erro ao remover membro:", err);
    }
  };

  const handleCancelarConvite = async (inviteId) => {
    if (!window.confirm("Queres mesmo cancelar e revogar este convite pendente?")) return;
    try {
        // URL atualizado para bater com a nova rota segura do Laravel
        const res = await fetch(`http://localhost:8000/api/teams/${id}/team-invites/${inviteId}`, {
        method: 'DELETE',
        credentials: 'include'
        });
        if (res.ok) {
        alert("Convite cancelado com sucesso.");
        setConvitesPendentes(convitesPendentes.filter(c => c.id !== inviteId));
        }
    } catch (err) {
        console.error("Erro ao cancelar convite:", err);
    }
    };

  if (loading) return <div className="ge-loading">A carregar o dossiê do plantel...</div>;

  return (
    <div className="ge-fullscreen-wrapper">
      <div className="ge-workspace">
        
        <SidebarBalneario />

        <main className="ge-content-pane">
          <div className="ge-header">
            <div>
              <h2>
                Gestão Desportiva <span className="header-divider"> | </span> 
                <span className="header-club-name">{equipaAtiva?.escalao} ({clube?.nome})</span>
              </h2>
              <p>Controla o estado do plantel, convoca novos ativos ou limpa registos pendentes.</p>
            </div>
          </div>

          {/* =========================================================
             SISTEMA DE NAVEGAÇÃO DE ABAS INTERNAS (TABS)
          ========================================================= */}
          <div className="membros-tabs-nav">
            <button 
              className={`tab-nav-btn ${activeTab === 'plantel' ? 'active' : ''}`} 
              onClick={() => setActiveTab('plantel')}
            >
              🏃‍♂️ Plantel Ativo ({membros.length})
            </button>
            <button 
              className={`tab-nav-btn ${activeTab === 'convidar' ? 'active' : ''}`} 
              onClick={() => setActiveTab('convidar')}
            >
              📩 Convidar Ativo
            </button>
            <button 
              className={`tab-nav-btn ${activeTab === 'pendentes' ? 'active' : ''}`} 
              onClick={() => setActiveTab('pendentes')}
            >
              ⏳ Convites Pendentes ({convitesPendentes.length})
            </button>
          </div>

          {/* =========================================================
             CONTEÚDO DINÂMICO DEPENDENDO DA ABA SELECIONADA
          ========================================================= */}
          <div className="tab-content-wrapper">
            
            {/* ABA 1: PLANTEL ATIVO */}
            {activeTab === 'plantel' && (
              <div className="ge-card full-tab-card">
                <h3>Plantel Vinculado ao Escalão</h3>
                <div className="membros-lista-container">
                  {membros.length === 0 ? (
                    <p className="no-data-text">Este escalão ainda não tem membros ativos.</p>
                  ) : (
                    membros.map(m => {
                      const foiAlterado = !!membrosEditados[m.user_id];
                      return (
                        <div key={m.user_id} className={`membro-row ${foiAlterado ? 'row-modified' : ''}`}>
                          <div className="membro-inline-select-box">
                            <select 
                              value={m.cargo} 
                              onChange={(e) => handleLocalChange(m.user_id, 'cargo', e.target.value)}
                              className="membro-inline-dropdown"
                            >
                              <option value="Jogador">Jogador</option>
                              <option value="Treinador">Treinador Principal</option>
                              <option value="Treinador_Adjunto">Treinador Adjunto</option>
                              <option value="Departamento_Medico">Dep. Médico</option>
                              <option value="Nutricionista">Nutricionista</option>
                              <option value="Staff_Equipa">Staff</option>
                            </select>
                          </div>

                          <div className="membro-data flex-name-field">
                            <span className="membro-nome">{m.nome}</span>
                          </div>

                          <div className="membro-inline-camisola-box">
                            {m.cargo === 'Jogador' ? (
                              <div className="camisola-input-wrapper">
                                <span className="camisola-hash">Nº</span>
                                <input 
                                  type="number" 
                                  value={m.numero_camisola || ''} 
                                  onChange={(e) => handleLocalChange(m.user_id, 'numero_camisola', e.target.value)}
                                  className="membro-inline-number-input"
                                  min="1" max="99" placeholder="--"
                                />
                              </div>
                            ) : (
                              <span className="camisola-placeholder-dash">—</span>
                            )}
                          </div>

                          <div className="membro-actions-cell">
                            {foiAlterado && (
                              <button onClick={() => handleGuardarAlteracoes(m.user_id)} className="membro-save-inline-btn" title="Guardar">💾</button>
                            )}
                            <button onClick={() => handleRemoverMembro(m.user_id, m.nome)} className="membro-delete-btn" title="Remover">🗑️</button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* ABA 2: FORMULÁRIO DE CONVITE */}
            {activeTab === 'convidar' && (
              <div className="ge-card full-tab-card center-form-box">
                <h3>Vincular Novo Ativo</h3>
                <p className="ge-card-desc">O utilizador receberá uma notificação no seu painel para aceitar o ingresso na equipa.</p>
                <form onSubmit={handleSendInvite} className="ge-form standard-max-width">
                  {message.text && (
                    <div className={`ge-alert ${message.type === 'success' ? 'ge-success' : 'ge-error'}`}>
                      {message.text}
                    </div>
                  )}
                  <div className="ge-group">
                    <label>E-mail do Convidado</label>
                    <input type="email" value={emailInvite} onChange={(e) => setEmailInvite(e.target.value)} placeholder="exemplo@js20.com" required />
                  </div>
                  <div className="ge-group">
                    <label>Cargo Desportivo</label>
                    <select value={cargoInvite} onChange={(e) => setCargoInvite(e.target.value)}>
                      <option value="Jogador">🏃‍♂️ Jogador</option>
                      <option value="Treinador">📋 Treinador Principal</option>
                      <option value="Treinador_Adjunto">🧠 Treinador Adjunto</option>
                      <option value="Departamento_Medico">🏥 Departamento Médico</option>
                      <option value="Nutricionista">🍏 Nutricionista</option>
                      <option value="Staff_Equipa">👕 Staff</option>
                    </select>
                  </div>
                  {cargoInvite === 'Jogador' && (
                    <div className="ge-group">
                      <label>Número de Camisola</label>
                      <input type="number" value={numeroCamisola} onChange={(e) => setNumeroCamisola(e.target.value)} placeholder="Ex: 10" min="1" max="99" />
                    </div>
                  )}
                  <button type="submit" className="ge-btn" disabled={loadingInvite}>
                    {loadingInvite ? 'A processar...' : 'Enviar Convite Oficial'}
                  </button>
                </form>
              </div>
            )}

            {/* ABA 3: CONVITES PENDENTES */}
            {activeTab === 'pendentes' && (
              <div className="ge-card full-tab-card">
                <h3>Convites Aguardando Resposta</h3>
                <div className="membros-lista-container">
                  {convitesPendentes.length === 0 ? (
                    <p className="no-data-text">Não existem convites pendentes de resposta para este escalão.</p>
                  ) : (
                    convitesPendentes.map(c => {
                      // Blindagem absoluta de mapeamento de strings do Eloquent
                      const nomeExibir = c.convidado 
                        ? `${c.convidado.nome || ''} ${c.convidado.apelido || ''} (${c.convidado.email || ''})`.trim()
                        : `Utilizador ID: ${c.user_convidado_id || 'N/A'}`;
                      
                      return (
                        <div key={c.id} className="membro-row pending-row">
                          <div className="pending-badge-status">⏳ PENDENTE</div>
                          <div className="membro-data">
                            <span className="membro-nome">{nomeExibir}</span>
                            <span className="membro-cargo-badge">
                              Cargo proposto: {c.cargo ? c.cargo.replace('_', ' ') : 'Jogador'}
                            </span>
                          </div>
                          <div className="membro-actions-cell">
                            <button 
                              onClick={() => handleCancelarConvite(c.id)} 
                              className="membro-delete-btn cancel-invite-btn" 
                              title="Cancelar Convite"
                            >
                              ❌ Cancelar
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

          </div>

          <button onClick={() => navigate(`/equipa-gestao/${id}`)} className="ge-back-to-hub-btn" style={{ marginTop: '2rem' }}>
            ← Voltar ao Painel Central
          </button>
        </main>
      </div>
    </div>
  );
}