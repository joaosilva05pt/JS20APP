import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Sidebar.css';

export default function Sidebar() {
  const [user, setUser] = useState(null);
  const [clube, setClube] = useState(null);
  const [recentTeams, setRecentTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const carregarDadosNavegacao = async () => {
      try {
        const userRes = await fetch('http://localhost:8000/api/user', {
          headers: { 'Accept': 'application/json' },
          credentials: 'include'
        });
        
        if (userRes.ok) {
          const userData = await userRes.json();
          setUser(userData);

          const clubRes = await fetch('http://localhost:8000/api/meu-clube', {
            headers: { 'Accept': 'application/json' },
            credentials: 'include'
          });
          if (clubRes.ok) {
            const clubData = await clubRes.json();
            setClube(clubData);
          }

          const recentsRes = await fetch('http://localhost:8000/api/meu-balneario/recentes', {
            headers: { 'Accept': 'application/json' },
            credentials: 'include'
          });
          if (recentsRes.ok) {
            const recentsData = await recentsRes.json();
            setRecentTeams(recentsData);
          }
        }
      } catch (err) {
        console.error("Erro ao carregar dados da sidebar:", err);
      } finally {
        setLoading(false);
      }
    };

    carregarDadosNavegacao();
  }, []);

  const handleLogout = async () => {
    if (!window.confirm("Tens a certeza que queres terminar sessão?")) return;
    try {
      await fetch('http://localhost:8000/api/logout', {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        credentials: 'include'
      });
      navigate('/login');
      window.location.reload(); 
    } catch (err) {
      console.error("Erro ao fazer logout:", err);
    }
  };

  const isActive = (path) => location.pathname === path ? 'active' : '';

  if (loading) {
    return (
      <aside className="sidebar-container">
        <div className="sidebar-logo"><span className="text-red">JS20</span> APP</div>
        <div style={{ padding: '2rem', color: '#8b9bb4', fontSize: '0.85rem' }}>A carregar menu...</div>
      </aside>
    );
  }

  return (
    <aside className="sidebar-container">
      <div className="sidebar-top-section">
        <div className="sidebar-logo">
          <span className="text-red">JS20</span> APP
        </div>

        <nav className="sidebar-menu">
          <Link to="/dashboard" className={`sidebar-link ${isActive('/dashboard')}`}>
            🏠 Hub Central
          </Link>

          {/* EQUIPAS RECENTES */}
          {recentTeams.length > 0 && (
            <div className="sidebar-section-group">
              <span className="sidebar-section-title">⏱️ EQUIPAS RECENTES</span>
              <div className="sidebar-recent-list">
                {recentTeams.map(t => (
                  <Link 
                    key={t.id} 
                    to={`/equipa-gestao/${t.id}`} 
                    className={`sidebar-recent-link ${location.pathname === `/equipa-gestao/${t.id}` ? 'active' : ''}`}
                  >
                    ⚽ {t.escalao}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* MENU DIRIGENTES */}
          {user?.profissao_base === 'Dirigente' && (
            <div className="sidebar-section-group">
              <span className="sidebar-section-title">🛡️ DIREÇÃO</span>
              {clube ? (
                <>
                  <Link to={`/admin-club/${clube.id}`} className={`sidebar-link ${isActive(`/admin-club/${clube.id}`)}`}>
                    🛡️ O Meu Clube
                  </Link>
                  <Link to="/criar-equipa" className={`sidebar-link ${isActive('/criar-equipa')}`}>
                    ⚽ Criar Escalão
                  </Link>
                </>
              ) : (
                <Link to="/criar-clube" className={`sidebar-link ${isActive('/criar-clube')}`}>
                  🏢 Fundar Clube
                </Link>
              )}
            </div>
          )}

          {/* MENU TREINADORES */}
          {user?.profissao_base === 'Treinador' && clube && (
            <div className="sidebar-section-group">
              <span className="sidebar-section-title">📋 EQUIPA TÉCNICA</span>
              <Link to="/treinos-jogos" className={`sidebar-link ${isActive('/treinos-jogos')}`}>
                📅 Calendário / Eventos
              </Link>
              <Link to="/avaliacoes" className={`sidebar-link ${isActive('/avaliacoes')}`}>
                📊 Avaliações (0-20)
              </Link>
            </div>
          )}

          {/* MENU JOGADORES */}
          {user?.profissao_base === 'Jogador' && (
            <div className="sidebar-section-group">
              <span className="sidebar-section-title">🏃‍♂️ ATLETA</span>
              {clube ? (
                <>
                  <Link to="/o-meu-plantel" className={`sidebar-link ${isActive('/o-meu-plantel')}`}>
                    🏃‍♂️ Plantel
                  </Link>
                  <Link to="/as-minhas-notas" className={`sidebar-link ${isActive('/as-minhas-notas')}`}>
                    📈 Rendimento (0-20)
                  </Link>
                  <Link to="/missoes" className={`sidebar-link ${isActive('/missoes')}`}>
                    🎯 Missões / XP
                  </Link>
                  <Link to="/loja" className={`sidebar-link ${isActive('/loja')}`}>
                    🛍️ Loja do Clube
                  </Link>
                </>
              ) : (
                <Link to="/mercado" className={`sidebar-link ${isActive('/mercado')}`}>
                  🔍 Mercado Livres
                </Link>
              )}
            </div>
          )}

          {/* PERFIL */}
          <div className="sidebar-section-group" style={{ marginTop: '1.5rem' }}>
            <Link to="/perfil" className={`sidebar-link ${isActive('/perfil')}`}>
              👤 Perfil de Utilizador
            </Link>
          </div>
        </nav>
      </div>

      {/* FOOTER */}
      {user && (
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{user.nome ? user.nome.charAt(0).toUpperCase() : 'U'}</div>
            <div className="user-details">
              <span className="user-name">{user.nome}</span>
              <span className="user-role">{user.profissao_base}</span>
            </div>
          </div>
          <button onClick={handleLogout} className="sidebar-logout-btn" title="Terminar Sessão">
            🚪
          </button>
        </div>
      )}
    </aside>
  );
}