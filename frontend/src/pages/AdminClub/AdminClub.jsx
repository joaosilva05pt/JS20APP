import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './AdminClub.css';

export default function AdminClub() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('membros');
  const [membros, setMembros] = useState([]);
  const [userLogadoId, setUserLogadoId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Estados dos Membros
  const [showAddModal, setShowAddModal] = useState(false);
  const [novoMembro, setNovoMembro] = useState({ email: '', cargo: 'Vice-Presidente' });
  const [actionMessage, setActionMessage] = useState({ type: '', text: '' });

  const [showTransferModal, setShowTransferModal] = useState(false);
  const [sucessorId, setSucessorId] = useState('');

  const [showEditModal, setShowEditModal] = useState(false);
  const [membroEdit, setMembroEdit] = useState({ id: null, nome: '', cargo: '' });

  // Definições do Clube (Sincronizado com a tabela Premium de 2026)
  const [clubDetails, setClubDetails] = useState({ 
    nome: '', 
    sigla: '', 
    email_clube: '', 
    contacto_oficial: '', 
    pais: '', 
    localidade: '', 
    data_fundacao: '',
    emblema_url: '' 
  });
  const [clubMessage, setClubMessage] = useState({ type: '', text: '' });

  // Estado para capturar o ficheiro do novo emblema no upload
  const [novoEmblema, setNovoEmblema] = useState(null);

  // Estados: Dissolução do Clube
  const [showDissolveModal, setShowDissolveModal] = useState(false);
  const [nomeConfirmacao, setNomeConfirmacao] = useState('');
  const [dissolveError, setDissolveError] = useState('');

  // Estados: Convites
  const [convitesPendentes, setConvitesPendentes] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Puxar Convites Diretivos Pendentes
        const convitesRes = await fetch(`http://localhost:8000/api/clubs/${id}/convites`, {
          headers: { 'Accept': 'application/json' },
          credentials: 'include'
        });
        if (convitesRes.ok) {
          const convitesData = await convitesRes.json();
          setConvitesPendentes(convitesData);
        }

        // 2. Identificar o Utilizador Autenticado
        const userRes = await fetch('http://localhost:8000/api/user', {
          headers: { 'Accept': 'application/json' },
          credentials: 'include'
        });
        const userData = await userRes.json();
        setUserLogadoId(userData.id);

        // 3. Puxar Lista de Membros da Direção
        const membrosRes = await fetch(`http://localhost:8000/api/clubs/${id}/membros`, {
          headers: { 'Accept': 'application/json' },
          credentials: 'include'
        });

        if (membrosRes.ok) {
          const membrosData = await membrosRes.json();
          const ordemCargos = { 'Presidente': 1, 'Vice-Presidente': 2, 'Diretor Desportivo': 3, 'Tesoureiro': 4, 'Secretário': 5, 'Vogal': 6 };
          const membrosOrdenados = membrosData.sort((a, b) => {
            return (ordemCargos[a.cargo] || 99) - (ordemCargos[b.cargo] || 99);
          });
          setMembros(membrosOrdenados);
        } else {
          setError('Acesso negado ou erro ao carregar os membros.');
        }

        // 4. Puxar Ficha Técnica do Clube (Sincronizado com detalhesClube do backend)
        const clubRes = await fetch(`http://localhost:8000/api/clubs/${id}`, {
          headers: { 'Accept': 'application/json' },
          credentials: 'include'
        });
        if (clubRes.ok) {
          const clubData = await clubRes.json();
          setClubDetails({
            nome: clubData.nome || '',
            sigla: clubData.sigla || '',
            email_clube: clubData.email_clube || '',
            contacto_oficial: clubData.contacto_oficial || '',
            pais: clubData.pais || '',
            localidade: clubData.localidade || '',
            data_fundacao: clubData.data_fundacao ? clubData.data_fundacao.split('T')[0] : '',
            emblema_url: clubData.emblema_url ? `http://localhost:8000/storage/${clubData.emblema_url}` : ''
          });
        }

      } catch (err) {
        setError('Falha de conexão com o servidor.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const souPresidente = membros.some(m => m.user_id === userLogadoId && m.cargo === 'Presidente');

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setActionMessage({ type: '', text: '' });
    try {
      const response = await fetch(`http://localhost:8000/api/clubs/${id}/membros`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(novoMembro)
      });
      const data = await response.json();
      if (response.ok) {
        setActionMessage({ type: 'success', text: data.message });
        setTimeout(() => setShowAddModal(false), 1500);
        
        const convitesRes = await fetch(`http://localhost:8000/api/clubs/${id}/convites`, {
          headers: { 'Accept': 'application/json' },
          credentials: 'include'
        });
        if (convitesRes.ok) {
          const convitesData = await convitesRes.json();
          setConvitesPendentes(convitesData);
        }
      } else {
        setActionMessage({ type: 'error', text: data.message });
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: 'Erro de conexão.' });
    }
  };

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:8000/api/clubs/${id}/transferir-presidencia`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ novo_presidente_id: sucessorId })
      });
      const data = await response.json();
      if (response.ok) {
        alert(data.message);
        navigate('/dashboard'); 
      } else {
        setActionMessage({ type: 'error', text: data.message });
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: 'Erro de conexão.' });
    }
  };

  const handleRemoveMember = async (membroUserId, membroNome) => {
    if (!window.confirm(`Tens a certeza que queres destituir ${membroNome}?`)) return;
    try {
      const response = await fetch(`http://localhost:8000/api/clubs/${id}/membros/${membroUserId}`, {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' },
        credentials: 'include'
      });
      const data = await response.json();
      if (response.ok) {
        setMembros(membros.filter(m => m.user_id !== membroUserId));
        alert(data.message);
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert('Erro ao tentar remover o membro.');
    }
  };

  const handleEditCargoSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:8000/api/clubs/${id}/membros/${membroEdit.id}/cargo`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ novo_cargo: membroEdit.cargo })
      });
      const data = await response.json();
      if (response.ok) {
        setMembros(membros.map(m => m.user_id === membroEdit.id ? { ...m, cargo: data.cargo } : m));
        setShowEditModal(false);
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert('Erro ao atualizar cargo.');
    }
  };

  const handleCancelInvitation = async (invitationId) => {
    if (!window.confirm("Queres mesmo cancelar este convite?")) return;
    try {
      const response = await fetch(`http://localhost:8000/api/clubs/${id}/convites/${invitationId}`, {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' },
        credentials: 'include'
      });
      const data = await response.json();
      if (response.ok) {
        setConvitesPendentes(convitesPendentes.filter(c => c.id !== invitationId));
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert('Erro ao cancelar o convite.');
    }
  };

  const handleClubChange = (e) => {
    setClubDetails({ ...clubDetails, [e.target.name]: e.target.value });
  };

  const handleEmblemaChange = (e) => {
    setNovoEmblema(e.target.files[0]);
  };

  // Submissão para o método atualizarClube do ClubAdminController usando FormData
  const handleClubUpdate = async (e) => {
    e.preventDefault();
    setClubMessage({ type: '', text: '' });
    try {
      const dataPayload = new FormData();
      
      dataPayload.append('nome', clubDetails.nome);
      dataPayload.append('sigla', clubDetails.sigla);
      dataPayload.append('email_clube', clubDetails.email_clube);
      dataPayload.append('contacto_oficial', clubDetails.contacto_oficial);
      dataPayload.append('pais', clubDetails.pais);
      dataPayload.append('localidade', clubDetails.localidade);
      dataPayload.append('data_fundacao', clubDetails.data_fundacao);

      if (novoEmblema) {
        dataPayload.append('emblema', novoEmblema);
      }

      // Hack padrão do Laravel para simular PUT via FormData multipart
      dataPayload.append('_method', 'PUT');

      const response = await fetch(`http://localhost:8000/api/clubs/${id}`, {
        method: 'POST', 
        headers: {
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: dataPayload
      });

      const data = await response.json();

      if (response.ok) {
        setClubMessage({ type: 'success', text: data.message });
        if (data.club && data.club.emblema_url) {
          setClubDetails(prev => ({
            ...prev,
            emblema_url: `http://localhost:8000/storage/${data.club.emblema_url}`
          }));
        }
      } else {
        setClubMessage({ type: 'error', text: data.message || 'Erro ao atualizar dados.' });
      }
    } catch (err) {
      setClubMessage({ type: 'error', text: 'Erro de conexão.' });
    }
  };

  const handleDissolveSubmit = async (e) => {
    e.preventDefault();
    setDissolveError('');
    try {
      const response = await fetch(`http://localhost:8000/api/clubs/${id}/dissolver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ nome_confirmacao: nomeConfirmacao })
      });
      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        navigate('/dashboard'); 
      } else {
        setDissolveError(data.message);
      }
    } catch (err) {
      setDissolveError('Erro ao conectar com o servidor.');
    }
  };

  if (loading) return <div className="admin-loading-screen">A carregar painel de gestão...</div>;
  if (error) return <div className="admin-loading-screen error-state">{error}</div>;

  return (
    <div className="ac-dashboard-pane">
      
      <header className="ac-main-header">
        <div className="ac-header-title-area">
          <h2>Administração do Clube <span className="header-divider"> | </span> <span className="header-club-name">{activeTab === 'membros' ? 'Configurações' : 'Identidade'}</span></h2>
          
          <div className="ac-tab-navigation">
            <button 
              className={`ac-tab-trigger ${activeTab === 'membros' ? 'active' : ''}`}
              onClick={() => setActiveTab('membros')}
            >
              Direção e Staff
            </button>
            <button 
              className={`ac-tab-trigger ${activeTab === 'definicoes' ? 'active' : ''}`}
              onClick={() => setActiveTab('definicoes')}
            >
              Definições Gerais
            </button>
          </div>
        </div>
      </header>

      <div className="ac-workspace-body">
        
        {/* SEPARADOR 1: DIREÇÃO E STAFF */}
        {activeTab === 'membros' && (
          <div className="ac-tab-panel animate-fade-in">
            <div className="ac-section-intro-row">
              <div className="ac-intro-text">
                <h2>Estrutura Diretiva</h2>
                <p>Gere e atribui as funções administrativas oficiais da instituição.</p>
              </div>
              <div className="ac-intro-actions">
                {souPresidente && (
                  <button className="ac-btn-outline" onClick={() => setShowTransferModal(true)}>
                    Passar Testemunho
                  </button>
                )}
                <button className="ac-btn-filled-red" onClick={() => { setShowAddModal(true); setActionMessage({type:'', text:''}); }}>
                  + Adicionar Dirigente
                </button>
              </div>
            </div>

            <div className="ac-cards-grid">
              {membros.map((m) => (
                <div className="ac-member-card" key={m.id}>
                  {m.user?.foto_perfil ? (
                    <img 
                      src={`http://localhost:8000/storage/${m.user.foto_perfil}`} 
                      alt="Avatar" 
                      className="ac-member-avatar-img" 
                    />
                  ) : (
                    <div className="ac-member-avatar">
                      {m.user?.nome?.charAt(0).toUpperCase()}{m.user?.apelido?.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="ac-member-meta">
                    <h4>{m.user?.nome} {m.user?.apelido}</h4>
                    <span className="ac-member-email">{m.user?.email}</span>
                  </div>
                  <div className="ac-member-controls">
                    <span className={`ac-badge-role ${m.cargo === 'Presidente' ? 'president' : 'staff'}`}>
                      {m.cargo}
                    </span>
                    {souPresidente && m.user_id !== userLogadoId && (
                      <div className="ac-inline-actions">
                        <button 
                          className="ac-btn-action-edit"
                          onClick={() => { setMembroEdit({ id: m.user_id, nome: m.user.nome, cargo: m.cargo }); setShowEditModal(true); }}
                        >
                          Editar
                        </button>
                        <button 
                          className="ac-btn-action-remove"
                          onClick={() => handleRemoveMember(m.user_id, m.user.nome)}
                        >
                          Remover
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {convitesPendentes.length > 0 && (
              <div className="ac-invites-section">
                <h3>Convites Diretivos Pendentes ({convitesPendentes.length})</h3>
                <div className="ac-invites-grid">
                  {convitesPendentes.map(convite => (
                    <div key={convite.id} className="ac-invite-card">
                      <div className="ac-invite-details">
                        <strong>{convite.convidado ? `${convite.convidado.nome} ${convite.convidado.apelido}` : 'Utilizador Convidado'}</strong>
                        <span className="ac-invite-sub">{convite.convidado ? convite.convidado.email : ''}</span>
                        <span className="ac-badge-invite-role">{convite.cargo}</span>
                      </div>
                      <button onClick={() => handleCancelInvitation(convite.id)} className="ac-btn-revoke-invite">
                        Revogar Convite
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SEPARADOR 2: DEFINIÇÕES GERAIS */}
        {activeTab === 'definicoes' && (
          <div className="ac-tab-panel animate-fade-in">
            <div className="ac-section-intro-row">
              <div className="ac-intro-text">
                <h2>Definições do Clube</h2>
                <p>Atualiza os dados de identificação e localização da instituição desportiva.</p>
              </div>
            </div>

            {clubMessage.text && (
              <div className={`ac-global-alert ${clubMessage.type}`}>
                {clubMessage.text}
              </div>
            )}

            <div className="ac-split-settings-layout">
              <div className="ac-settings-column-form">
                <form onSubmit={handleClubUpdate} className="ac-premium-form-box" encType="multipart/form-data">
                  
                  {clubDetails.emblema_url && (
                    <div className="ac-emblema-preview-zone">
                      <img src={clubDetails.emblema_url} alt="Emblema Oficial" className="ac-emblema-settings-view" />
                    </div>
                  )}

                  {/* Nome Oficial do Clube e Sigla Desportiva */}
                  <div className="ac-form-row-twin">
                    <div className="ac-form-group" style={{ flex: 3 }}>
                      <label>Nome Oficial do Clube</label>
                      <input type="text" name="nome" value={clubDetails.nome} onChange={handleClubChange} required />
                    </div>
                    <div className="ac-form-group" style={{ flex: 1 }}>
                      <label>Sigla</label>
                      <input type="text" name="sigla" value={clubDetails.sigla} onChange={handleClubChange} maxLength={10} required />
                    </div>
                  </div>

                  {/* Contactos institucionais do Clube */}
                  <div className="ac-form-row-twin">
                    <div className="ac-form-group">
                      <label>Email do Clube</label>
                      <input type="email" name="email_clube" value={clubDetails.email_clube} onChange={handleClubChange} placeholder="Ex: secretaria@clube.com" />
                    </div>
                    <div className="ac-form-group">
                      <label>Contacto Oficial</label>
                      <input type="text" name="contacto_oficial" value={clubDetails.contacto_oficial} onChange={handleClubChange} placeholder="Ex: +351 282 000 000" />
                    </div>
                  </div>

                  <div className="ac-form-row-twin">
                    <div className="ac-form-group">
                      <label>País</label>
                      <input type="text" name="pais" value={clubDetails.pais} onChange={handleClubChange} required />
                    </div>
                    <div className="ac-form-group">
                      <label>Localidade</label>
                      <input type="text" name="localidade" value={clubDetails.localidade} onChange={handleClubChange} />
                    </div>
                  </div>

                  {/* Data de Fundação Oficial e Upload do Emblema */}
                  <div className="ac-form-row-twin">
                    <div className="ac-form-group">
                      <label>Data de Fundação Oficial</label>
                      <input type="date" name="data_fundacao" value={clubDetails.data_fundacao} onChange={handleClubChange} />
                    </div>
                    <div className="ac-form-group">
                      <label>Atualizar Emblema / Logo</label>
                      <input type="file" accept="image/*" onChange={handleEmblemaChange} className="pf-file-input" />
                    </div>
                  </div>

                  <button type="submit" className="ac-btn-save-settings">
                    Guardar Alterações do Clube
                  </button>
                </form>
              </div>

              <div className="ac-settings-column-danger">
                {souPresidente && (
                  <div className="ac-danger-zone-card">
                    <h3>Zona de Perigo Crítico</h3>
                    <p>
                      Ao dissolveres o clube, todas as equipas, plantéis ativos, avaliações (0-20) e históricos gerais serão eliminados de forma permanente. Esta ação não tem retorno.
                    </p>
                    <button 
                      type="button" 
                      className="ac-btn-dissolve-trigger"
                      onClick={() => { setShowDissolveModal(true); setNomeConfirmacao(''); setDissolveError(''); }}
                    >
                      Dissolver Instituição
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <button onClick={() => navigate('/dashboard')} className="ac-minimal-back-btn" style={{ marginTop: '3rem' }}>
        ← Voltar à Dashboard Principal
      </button>

      {/* Modals Inalterados */}
      {showAddModal && (
        <div className="ac-modal-overlay">
          <div className="ac-modal-window">
            <h3>Convidar para Corpo Diretivo</h3>
            <p className="ac-modal-subtext">O destinatário necessita de ter o perfil registado como "Dirigente".</p>
            {actionMessage.text && <div className={`ac-global-alert ${actionMessage.type}`}>{actionMessage.text}</div>}
            
            <form onSubmit={handleAddSubmit} className="ac-modal-form">
              <div className="ac-form-group">
                <label>Email Corporativo</label>
                <input type="email" value={novoMembro.email} onChange={(e) => setNovoMembro({...novoMembro, email: e.target.value})} placeholder="exemplo@js20.com" required />
              </div>
              <div className="ac-form-group">
                <label>Cargo de Destino</label>
                <select value={novoMembro.cargo} onChange={(e) => setNovoMembro({...novoMembro, cargo: e.target.value})}>
                  <option value="Vice-Presidente">Vice-Presidente</option>
                  <option value="Diretor Desportivo">Diretor Desportivo</option>
                  <option value="Tesoureiro">Tesoureiro</option>
                  <option value="Secretário">Secretário</option>
                  <option value="Vogal">Vogal</option>
                </select>
              </div>
              <div className="ac-modal-actions">
                <button type="button" className="ac-btn-modal-cancel" onClick={() => setShowAddModal(false)}>Cancelar</button>
                <button type="submit" className="ac-btn-modal-confirm success">Disparar Convite Oficial</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="ac-modal-overlay">
          <div className="ac-modal-window">
            <h3>Modificar Estatuto Administrativo</h3>
            <p className="ac-modal-subtext">Altera a função organizacional de <strong>{membroEdit.nome}</strong>.</p>
            
            <form onSubmit={handleEditCargoSubmit} className="ac-modal-form">
              <div className="ac-form-group">
                <label>Nova Atribuição de Cargo</label>
                <select value={membroEdit.cargo} onChange={(e) => setMembroEdit({...membroEdit, cargo: e.target.value})}>
                  <option value="Vice-Presidente">Vice-Presidente</option>
                  <option value="Diretor Desportivo">Diretor Desportivo</option>
                  <option value="Tesoureiro">Tesoureiro</option>
                  <option value="Secretário">Secretário</option>
                  <option value="Vogal">Vogal</option>
                </select>
              </div>
              <div className="ac-modal-actions">
                <button type="button" className="ac-btn-modal-cancel" onClick={() => setShowEditModal(false)}>Voltar</button>
                <button type="submit" className="ac-btn-modal-confirm security">Atualizar Cargo</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTransferModal && (
        <div className="ac-modal-overlay">
          <div className="ac-modal-window danger-alert-theme">
            <h3>⚠️ Cedência Abrupta de Presidência</h3>
            <p className="ac-modal-subtext">Ao confirmares, transferes a liderança e todos os privilégios totais. Ficarás listado como elemento do Staff.</p>
            
            <form onSubmit={handleTransferSubmit} className="ac-modal-form">
              <div className="ac-form-group">
                <label>Selecionar Sucessor de Direção</label>
                <select value={sucessorId} onChange={(e) => setSucessorId(e.target.value)} required>
                  <option value="">-- Escolhe um Líder Elegível --</option>
                  {membros.filter(m => m.user_id !== userLogadoId).map(m => (
                    <option key={m.user_id} value={m.user_id}>{m.user?.nome} {m.user?.apelido} ({m.cargo})</option>
                  ))}
                </select>
              </div>
              <div className="ac-modal-actions">
                <button type="button" className="ac-btn-modal-cancel" onClick={() => setShowTransferModal(false)}>Abortar</button>
                <button type="submit" className="ac-btn-modal-confirm danger">Efetuar Transferência Irreversível</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDissolveModal && (
        <div className="ac-modal-overlay">
          <div className="ac-modal-window critical-destruction-theme">
            <h3>💥 Destruição Total da Instituição</h3>
            <p className="ac-modal-subtext">Operação crítica. Para confirmares a dissolução definitiva, escreve o nome exato do clube (<strong>{clubDetails.nome}</strong>) no formulário:</p>
            
            {dissolveError && <div className="ac-global-alert error">{dissolveError}</div>}

            <form onSubmit={handleDissolveSubmit} className="ac-modal-form">
              <div className="ac-form-group">
                <input 
                  type="text" 
                  value={nomeConfirmacao} 
                  onChange={(e) => setNomeConfirmacao(e.target.value)} 
                  placeholder="Valida digitando o nome oficial aqui..."
                  required 
                />
              </div>
              <div className="ac-modal-actions">
                <button type="button" className="ac-btn-modal-cancel" onClick={() => setShowDissolveModal(false)}>Cancelar</button>
                <button 
                  type="submit" 
                  className="ac-btn-modal-confirm danger" 
                  disabled={nomeConfirmacao !== clubDetails.nome}
                >
                  Confirmar Dissolução Total
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}