import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import './SidebarBalneario.css';

export default function SidebarBalneario() {
  const { id } = useParams();
  const location = useLocation();
  const [userRole, setUserRole] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregarRole = async () => {
      try {
        const userRes = await fetch('http://localhost:8000/api/user', { credentials: 'include' });
        if (userRes.ok) {
          const userData = await userRes.json();
          setUserRole(userData.profissao_base);
        }
      } catch (err) {
        console.error("Erro ao carregar permissões da sidebar:", err);
      } finally {
        setLoading(false);
      }
    };
    carregarRole();
  }, []);

  if (loading) return <aside className="ge-sidebar"><div className="ge-sidebar-brand">Carregando...</div></aside>;

  const mundosMenu = [
    { id: 'calendario', label: 'Calendário & Eventos', icon: '📅', path: `/equipa/${id}/calendario` },
    { id: 'avaliacoes', label: 'Avaliações (0-20)', icon: '📊', priority: true, path: `/equipa/${id}/avaliacoes` },
    { id: 'convocatorias', label: 'Convocatórias', icon: '📋', path: `/equipa/${id}/convocatorias` },
    { id: 'tatica', label: 'Prancheta Tática', icon: '📐', path: `/equipa/${id}/tatica` },
    { id: 'medico', label: 'Depto. Médico', icon: '🏥', path: `/equipa/${id}/medico` },
    { id: 'nutricao', label: 'Nutrição & Dieta', icon: '🍏', path: `/equipa/${id}/nutricao` },
    { id: 'loja', label: 'Missões & Loja XP', icon: '🎯', gold: true, path: `/equipa/${id}/loja` },
    { id: 'radar', label: 'Radar do Atleta', icon: '🔍', path: `/equipa/${id}/radar` },
    { id: 'comunicacao', label: 'Comunicação', icon: '📢', path: `/equipa/${id}/comunicacao` },
    { id: 'mural', label: 'Mural / Fórum', icon: '💬', path: `/equipa/${id}/mural` },
  ];

  const menuCompleto = [...mundosMenu];
  if (userRole === 'Dirigente') {
    menuCompleto.unshift(
      { id: 'membros_gestao', label: 'Gestão de Membros', icon: '👥', admin: true, path: `/equipa/${id}/membros` },
      { id: 'definicoes', label: 'Definições Escalão', icon: '⚙️', admin: true, path: `/equipa/${id}/definicoes` }
    );
  }

  const checkActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <aside className="ge-sidebar">
      <Link to={`/equipa-gestao/${id}`} className="ge-sidebar-brand-link">
        <div className="ge-sidebar-brand">
          <span className="text-red">JS20</span> BALNEÁRIO
        </div>
      </Link>

      <div className="ge-sidebar-section">
        <span className="section-title">🧭 DEPARTAMENTOS</span>
        <nav className="ge-sidebar-nav">
          {menuCompleto.map(m => (
            <Link
              key={m.id}
              to={m.path}
              className={`nav-item-link ${checkActive(m.path)} ${m.priority ? 'pri' : ''} ${m.gold ? 'gold' : ''} ${m.admin ? 'admin-btn' : ''}`}
            >
              <span>{m.icon} {m.label}</span>
            </Link>
          ))}
        </nav>
      </div>

      <Link to="/dashboard" className="sidebar-exit-btn">← Sair para o Hub Geral</Link>
    </aside>
  );
}