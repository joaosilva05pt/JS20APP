import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  
  const [user, setUser] = useState(null);
  const [clube, setClube] = useState(null);
  const [convites, setConvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [equipas, setEquipas] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userResponse = await fetch('http://localhost:8000/api/user', {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          credentials: 'include'
        });

        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUser(userData);

          const clubResponse = await fetch('http://localhost:8000/api/meu-clube', {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            credentials: 'include'
          });

          if (clubResponse.ok) {
            const clubData = await clubResponse.json();
            setClube(clubData);
          }

          const convitesResponse = await fetch('http://localhost:8000/api/convites', {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            credentials: 'include'
          });
          
          if (convitesResponse.ok) {
            const convitesData = await convitesResponse.json();
            setConvites(convitesData);
          }

          const urlToken = userData.profissao_base === 'Dirigente' 
            ? 'http://localhost:8000/api/meu-clube/equipas' 
            : 'http://localhost:8000/api/meu-balneario/equipas';

          const equipasResponse = await fetch(urlToken, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            credentials: 'include'
          });

          if (equipasResponse.ok) {
            const equipasData = await equipasResponse.json();
            setEquipas(equipasData);
          }

        } else {
          navigate('/login');
        }
      } catch (err) {
        console.error("Erro de conexão", err);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleAceitarConvite = async (id) => {
    try {
      const res = await fetch(`http://localhost:8000/api/convites/${id}/aceitar`, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        credentials: 'include'
      });
      if (res.ok) {
        window.location.reload(); 
      } else {
        alert("Erro ao aceitar convite.");
      }
    } catch (err) {
      alert("Erro de conexão com o servidor.");
    }
  };

  const handleRejeitarConvite = async (id) => {
    try {
      const res = await fetch(`http://localhost:8000/api/convites/${id}/rejeitar`, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        credentials: 'include'
      });
      if (res.ok) {
        setConvites(convites.filter(c => c.id !== id));
      } else {
        alert("Erro ao rejeitar convite.");
      }
    } catch (err) {
      alert("Erro de conexão com o servidor.");
    }
  };

  const handleSairDoClube = async (clubId) => {
    if (!window.confirm(`Tens a certeza absoluta que queres abandonar a direção do clube?`)) return;
    try {
      const res = await fetch(`http://localhost:8000/api/clubs/${clubId}/sair`, {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' },
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        window.location.reload();
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert("Erro de conexão com o servidor ao tentar sair do clube.");
    }
  };

  if (loading) return <div className="db-loading-screen">A carregar o teu painel central...</div>;
  if (!user) return null;

  return (
    <div className="db-open-layout-container">
      
      {/* 💡 CORRIGIDO: Cabeçalho com alinhamento e separadores idênticos ao do Balneário */}
      <header className="db-open-header">
        <h2>Painel Central do Hub <span className="db-header-divider"> | </span> <span className="db-header-club-name">{clube ? clube.nome : 'JS20 APP'}</span></h2>
        <p>Estás no comando geral. Seleciona o teu espaço de trabalho administrativo ou desportivo.</p>
      </header>

      {/* Grelha de Ações e Equipas Totalmente Premium */}
      <div className="db-main-grid-layout">
        
        {/* CONVITES PENDENTES */}
        {convites.map((convite) => (
          <div key={convite.id} className="db-premium-card invite-theme">
            <div className="db-card-badge gold">NOVO CONVITE</div>
            <div className="db-card-icon">✉️</div>
            <h3>{convite.club?.nome || 'Convite Desportivo'}</h3>
            <p>
              Recebeste uma proposta de <strong>{convite.remetente?.nome}</strong> para o cargo de <strong>{convite.cargo?.replace('_', ' ')}</strong>.
            </p>
            <div className="db-invite-actions">
              <button onClick={() => handleAceitarConvite(convite.id)} className="db-btn-accept">Aceitar</button>
              <button onClick={() => handleRejeitarConvite(convite.id)} className="db-btn-reject">Rejeitar</button>
            </div>
          </div>
        ))}

        {/* DIRIGENTE SEM CLUBE */}
        {user.profissao_base === 'Dirigente' && !clube && (
          <Link to="/criar-clube" className="db-card-anchor">
            <div className="db-premium-card action-theme border-dashed">
              <div className="db-card-icon blue-text">🏗️</div>
              <h3 className="blue-text">Fundar Novo Clube</h3>
              <p>Cria o teu clube oficial, configura as bases da instituição e assume as rédeas do projeto.</p>
              <span className="db-action-link blue-text">Fundar Instituição &rarr;</span>
            </div>
          </Link>
        )}

        {/* CONTROLO INSTITUCIONAL DO DIRIGENTE */}
        {user.profissao_base === 'Dirigente' && clube && (
          <>
            <Link to={`/admin-club/${clube.id}`} className="db-card-anchor">
              <div className="db-premium-card admin-theme">
                <div className="db-card-badge red">DIREÇÃO E STAFF</div>
                <div className="db-card-icon">🛡️</div>
                <h3>{clube.nome}</h3>
                <p>Gere os cargos administrativos, convites de staff, e controla as definições da instituição.</p>
                <span className="db-action-link red-text">Abrir Administração &rarr;</span>
              </div>
            </Link>
            
            <Link to="/criar-equipa" className="db-card-anchor">
              <div className="db-premium-card action-theme border-dashed">
                <div className="db-card-icon blue-text">➕</div>
                <h3 className="blue-text">Criar Novo Escalão</h3>
                <p>Adiciona novos relvados e escalões desportivos (ex: Sub-19, Seniores) à tua estrutura.</p>
                <span className="db-action-link blue-text">Criar Escalão &rarr;</span>
              </div>
            </Link>

            <div className="db-premium-card danger-theme border-dashed-red" onClick={() => handleSairDoClube(clube.id)}>
              <div className="db-card-icon red-text">⚠️</div>
              <h3 className="red-text">Pedir Demissão</h3>
              <p>Abandona voluntariamente os teus cargos diretivos e de staff nesta instituição.</p>
              <span className="db-action-link red-text">Renunciar Cargo &rarr;</span>
            </div>
          </>
        )}

        {/* LISTAGEM REAL DAS EQUIPAS (LINHAGEM BALNEÁRIO COM GRADIENTES) */}
        {equipas.map((equipa) => (
          <Link to={`/equipa-gestao/${equipa.id}`} key={equipa.id} className="db-card-anchor">
            <div className="db-premium-card team-locker-theme">
              <div className="db-card-icon text-coral">⚽</div>
              <h3>{equipa.escalao}</h3>
              <span className="db-team-meta">
                {equipa.genero} • {equipa.epoca_desportiva} {equipa.cargo ? `(${equipa.cargo.replace('_', ' ')})` : ''}
              </span>
              <p>Entra no ecossistema de trabalho tático, avaliações (0-20), treinos e departamentos desportivos.</p>
              <span className="db-action-link text-coral">Abrir Balneário &rarr;</span>
            </div>
          </Link>
        ))}

        {/* ESTADO VAZIO */}
        {user.profissao_base !== 'Dirigente' && !clube && convites.length === 0 && equipas.length === 0 && (
          <div className="db-premium-card waiting-theme">
            <div className="db-card-icon">⏳</div>
            <h3>À procura de Balneário...</h3>
            <p>Atualmente não geres nem estás vinculado a nenhum plantel ativo no clube.</p>
            <Link to="/livres" className="db-action-link blue-text">Explorar Agentes Livres &rarr;</Link>
          </div>
        )}

      </div>
    </div>
  );
}