import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import SidebarBalneario from '../../components/SidebarBalneario/SidebarBalneario';
import './GestaoEquipa.css';

export default function GestaoEquipa() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [userRole, setUserRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [equipaAtiva, setEquipaAtiva] = useState(null);
  const [clube, setClube] = useState(null); // Estado para armazenar o nome do clube

  useEffect(() => {
    const carregarEcossistemaCompleto = async () => {
      try {
        // 1. Validar utilizador
        const userRes = await fetch('http://localhost:8000/api/user', { credentials: 'include' });
        const userData = await userRes.json();
        setUserRole(userData.profissao_base);

        // 2. Buscar dados do clube para o cabeçalho
        const clubRes = await fetch('http://localhost:8000/api/meu-clube', { credentials: 'include' });
        if (clubRes.ok) {
          const clubData = await clubRes.json();
          setClube(clubData);
        }

        // 3. Registar clique para o histórico recente
        await fetch(`http://localhost:8000/api/teams/${id}/visit`, { method: 'POST', credentials: 'include' });

        // 4. Carregar dados da equipa
        const membrosRes = await fetch(`http://localhost:8000/api/teams/${id}/membros`, { credentials: 'include' });
        if (membrosRes.status === 403) {
          alert("⚠️ Segurança JS20: Não tens permissão para aceder a este escalão!");
          navigate('/dashboard');
          return;
        }

        if (membrosRes.ok) {
          const resData = await membrosRes.json();
          if (resData.team) {
            setEquipaAtiva(resData.team);
          }
        } else {
          navigate('/dashboard');
          return;
        }

      } catch (err) {
        console.error("Erro fatal ao carregar balneário:", err);
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    carregarEcossistemaCompleto();
  }, [id, navigate]);

  if (loading) return <div className="ge-loading">A preparar o balneário...</div>;

  // Lista simples apenas para renderizar os cards do painel central
  const mundosCards = [
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

  return (
    <div className="ge-fullscreen-wrapper">
      <div className="ge-workspace">
        
        {/* =========================================================
           1. MENU LATERAL GLOBAL REUTILIZÁVEL E ISOLADO
        ========================================================= */}
        <SidebarBalneario />

        {/* =========================================================
           2. ÁREA DE CONTEÚDO CENTRAL (PAINEL CENTRAL PRINCIPAL)
        ========================================================= */}
        <main className="ge-content-pane">
          <div className="ge-header">
            <div>
              {/* Alinhamento do cabeçalho com a estrutura: Escalão | Clube */}
              <h2>
                Painel Central do Escalão {equipaAtiva && equipaAtiva.escalao} 
                <span className="header-divider"> | </span> 
                <span className="header-club-name">{clube ? clube.nome : 'JS20 Club'}</span>
              </h2>
              <p>Estás dentro de campo. Seleciona o departamento que pretendes analisar.</p>
            </div>
          </div>

          <div className="ge-cards-grid full-grid">
            
            {/* CARDS EXCLUSIVOS DE DIREÇÃO */}
            {userRole === 'Dirigente' && (
              <>
                <Link to={`/equipa/${id}/membros`} className="card-redirect-link">
                  <div className="ge-hub-card ge-admin-card-block">
                    <div className="card-badge admin-badge">🔒 DIREÇÃO</div>
                    <div className="card-icon">👥</div>
                    <h4>Gestão de Membros</h4>
                    <p>Adicionar ativos, enviar convites ao plantel e remover membros da equipa.</p>
                    <span className="card-link-block text-red">Abrir Gestão &rarr;</span>
                  </div>
                </Link>

                <Link to={`/equipa/${id}/definicoes`} className="card-redirect-link">
                  <div className="ge-hub-card ge-admin-card-block">
                    <div className="card-badge admin-badge">🔒 DIREÇÃO</div>
                    <div className="card-icon">⚙️</div>
                    <h4>Definições do Escalão</h4>
                    <p>Arquivar época corrente, encerrar sessões desportivas e configurações base.</p>
                    <span className="card-link-block text-red">Abrir Definições &rarr;</span>
                  </div>
                </Link>
              </>
            )}

            {/* DEPARTAMENTOS DESPORTIVOS COMUNS */}
            {mundosCards.map(m => (
              <Link to={m.path} key={m.id} className="card-redirect-link">
                <div className={`ge-hub-card ${m.priority ? 'high-priority' : ''} ${m.gold ? 'gold-border' : ''}`}>
                  <div className="card-icon">{m.icon}</div>
                  <h4>{m.label}</h4>
                  <p>Entrar na gestão interativa do módulo de {m.label.toLowerCase()}.</p>
                  <span className="card-link-block">Abrir Módulo &rarr;</span>
                </div>
              </Link>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}