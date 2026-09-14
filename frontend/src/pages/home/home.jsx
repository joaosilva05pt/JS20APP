import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Home.css';

export default function Home() {
  const navigate = useNavigate();

  // "Segurança à porta": Verifica se o utilizador já tem sessão ativa no navegador
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/user', {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          credentials: 'include' // Lê o cookie de forma invisível
        });
        
        // Se a resposta for OK (tem sessão ativa), teleporta para o Dashboard!
        if (response.ok) {
          navigate('/dashboard', { replace: true }); 
        }
      } catch (err) {
        // Se der erro (não está logado), não faz nada e mostra a página inicial
      }
    };

    checkSession();
  }, [navigate]);

  return (
    <div className="home-container">
      {/* =========================================
          NAVBAR
          ========================================= */}
      <nav className="home-navbar">
        <div className="nav-logo">
          <span className="text-red">JS20</span> APP
        </div>
        <div className="nav-links">
          <Link to="/login" className="nav-link-entrar">Entrar</Link>
          <Link to="/register" className="nav-btn-registar">Registar</Link>
        </div>
      </nav>

      {/* =========================================
          HERO SECTION (Secção Inicial)
          ========================================= */}
      <section className="hero-section">
        <div className="hero-badge">
          ⚡ ERP DESPORTIVO • RADAR ANALÍTICO • GAMIFICAÇÃO
        </div>
        <h1 className="hero-title">
          O Jogo começa <br />
          <span className="text-red">antes do apito.</span>
        </h1>
        <p className="hero-subtitle">
          A plataforma que centraliza a gestão do teu clube de futebol — presenças, 
          táticas, pautas de avaliação (0-20), departamento médico e gamificação num único ecossistema digital.
        </p>
        <div className="hero-buttons">
          <Link to="/register" className="btn-primary">Começar Gratuitamente &rarr;</Link>
          <Link to="/login" className="btn-secondary">Já tenho conta &gt;</Link>
        </div>

        <div className="hero-stats-card">
          <div className="stat-item">
            <h2>0-20</h2>
            <p>SISTEMA DE AVALIAÇÃO</p>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <h2>4</h2>
            <p>PERFIS DE ACESSO</p>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <h2>100%</h2>
            <p>ALERTAS DE RETENÇÃO</p>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <h2>&infin;</h2>
            <p>MISSÕES DISPONÍVEIS</p>
          </div>
        </div>
      </section>

      {/* =========================================
          SECÇÃO FUNCIONALIDADES
          ========================================= */}
      <section className="features-section">
        <div className="features-header">
          <span className="section-eyebrow">FUNCIONALIDADES</span>
          <h2 className="section-title">Tudo o que o teu clube precisa</h2>
          <p className="section-subtitle">
            Da gestão administrativa ao balneário digital — numa única plataforma modular que cresce com o teu clube.
          </p>
        </div>

        <div className="features-grid">
          {/* Cartão 1 */}
          <div className="feature-card">
            <div className="feature-icon" style={{ backgroundColor: 'rgba(240, 62, 62, 0.1)', color: '#F03E3E' }}>
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" /></svg>
            </div>
            <h3>Gestão de Presenças</h3>
            <p>Registo de presenças em treinos com justificação de faltas pelos próprios jogadores.</p>
          </div>
          {/* Cartão 2 */}
          <div className="feature-card">
            <div className="feature-icon" style={{ backgroundColor: 'rgba(51, 154, 240, 0.1)', color: '#339AF0' }}>
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zm-7.518-.267A8.25 8.25 0 1120.25 10.5M8.288 14.212A5.25 5.25 0 1117.25 10.5" /></svg>
            </div>
            <h3>Táticas & Bolas Paradas</h3>
            <p>O treinador desenha as suas táticas no tactical board e partilha com toda a equipa.</p>
          </div>
          {/* Cartão 3 */}
          <div className="feature-card">
            <div className="feature-icon" style={{ backgroundColor: 'rgba(252, 196, 25, 0.1)', color: '#FCC419' }}>
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>
            </div>
            <h3>Avaliações 0-20</h3>
            <p>Sistema padronizado de avaliação de desempenho técnico, tático e físico em jogos e treinos.</p>
          </div>
          {/* Cartão 4 */}
          <div className="feature-card">
            <div className="feature-icon" style={{ backgroundColor: 'rgba(156, 54, 181, 0.1)', color: '#9C36B5' }}>
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.516 0c.85.493 1.509 1.333 1.509 2.316V18" /></svg>
            </div>
            <h3>Radar de Atributos</h3>
            <p>Algoritmos analíticos que monitorizam a evolução técnica e assinalam quebras de forma estatísticas.</p>
          </div>
          {/* Cartão 5 */}
          <div className="feature-card">
            <div className="feature-icon" style={{ backgroundColor: 'rgba(64, 192, 87, 0.1)', color: '#40C057' }}>
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.112-1.875s-2.112.839-2.112 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.39 48.39 0 01-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 01-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 00-1.003-.349c-1.036 0-1.875 1.007-1.875 2.112s.839 2.112 1.875 2.112c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.536.57a48.05 48.05 0 01-.3 4.163c1.613-.186 3.25-.293 4.907-.315a.656.656 0 01.663.658v0c0 .355-.186.676-.401.959a1.647 1.647 0 00-.349 1.003c0 1.036 1.007 1.875 2.112 1.875s2.112-.839 2.112-1.875c0-.369-.128-.713-.349-1.003-.215-.283-.401-.604-.401-.959v0c0-.31.26-.555.57-.536a48.05 48.05 0 014.163.3c-.186-1.613-.293-3.25-.315-4.907a.656.656 0 01.658-.663v0c.355 0 .676.186.959.401.29.221.634.349 1.003.349 1.036 0 1.875-1.007 1.875-2.112s-.839-2.112-1.875-2.112c-.369 0-.713.128-1.003.349-.283.215-.604.401-.959.401v0a.64.64 0 01-.643-.657 48.39 48.39 0 01.3-4.163c-1.613.186-3.25.293-4.907.315a.656.656 0 01-.663-.658v0c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.112-1.875s-2.112.839-2.112 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0c0 .31-.26.555-.57.536-1.362-.116-2.748-.2-4.163-.3z" /></svg>
            </div>
            <h3>Gamificação</h3>
            <p>Missões semanais geram pontos XP para desbloquear skins e vantagens para o clube.</p>
          </div>
          {/* Cartão 6 */}
          <div className="feature-card">
            <div className="feature-icon" style={{ backgroundColor: 'rgba(253, 126, 20, 0.1)', color: '#FD7E14' }}>
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" /></svg>
            </div>
            <h3>Feed de Equipa</h3>
            <p>Rede social interna por escalão — posts, novidades e comunicação direta sem confusões.</p>
          </div>
        </div>
      </section>

      {/* =========================================
          SECÇÃO PERFIS DE ACESSO
          ========================================= */}
      <section className="roles-section">
        <div className="features-header">
          <span className="section-eyebrow">PERFIS DE ACESSO</span>
          <h2 className="section-title">Para cada papel, a sua visão</h2>
          <p className="section-subtitle">
            Quatro níveis de acesso desenhados para as necessidades reais de cada interveniente no clube.
          </p>
        </div>

        <div className="roles-grid">
          {/* Perfil 1: Presidente */}
          <div className="role-card">
            <div className="role-badge">DIREÇÃO</div>
            <div className="role-icon">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
            </div>
            <h3>Presidente</h3>
            <p>Dashboard executivo com métricas globais, controlo de módulos e visão estratégica do clube.</p>
          </div>
          {/* Perfil 2: Treinador */}
          <div className="role-card">
            <div className="role-badge">EQUIPA TÉCNICA</div>
            <div className="role-icon">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
            </div>
            <h3>Treinador</h3>
            <p>Presenças, convocatórias, táticas, avaliações de jogadores e gestão completa do plantel.</p>
          </div>
          {/* Perfil 3: Dep. Médico */}
          <div className="role-card">
            <div className="role-badge">SAÚDE</div>
            <div className="role-icon">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>
            </div>
            <h3>Dep. Médico</h3>
            <p>Histórico clínico, boletins de lesão, gestão de baixas e bloqueio automático de atletas inaptos.</p>
          </div>
          {/* Perfil 4: Jogador */}
          <div className="role-card">
            <div className="role-badge">PLANTEL</div>
            <div className="role-icon">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" /></svg>
            </div>
            <h3>Jogador</h3>
            <p>Estatísticas pessoais, missões diárias, pontos XP, skins desbloqueáveis e feed do balneário.</p>
          </div>
        </div>
      </section>

      {/* =========================================
          SECÇÃO GAMIFICAÇÃO
          ========================================= */}
      <section className="gamification-section">
        <div className="gamification-content">
          <span className="section-eyebrow" style={{ textAlign: 'left', margin: '0 0 15px 0' }}>GAMIFICAÇÃO</span>
          <h2 className="section-title" style={{ textAlign: 'left' }}>O balneário mais motivado do futebol</h2>
          
          <p className="gami-text">
            Missões semanais geram pontos XP que os jogadores usam para desbloquear skins e itens visuais exclusivos. O clube acumula pontos coletivos para ativar módulos adicionais como Nutrição.
          </p>
          
          <p className="gami-text">
            Os jogadores podem ainda <strong>doar pontos</strong> uns aos outros e ao próprio clube — transformando a gestão numa experiência de equipa real.
          </p>
          
          <div className="gami-tags">
            <span className="gami-tag red-tag">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" /></svg>
              Doação de Pontos
            </span>
            <span className="gami-tag dark-tag">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
              Módulos Desbloqueáveis
            </span>
          </div>
        </div>

        <div className="gamification-missions">
          <div className="mission-card">
            <div className="mission-header">
              <div className="mission-icon">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
              </div>
              <div className="mission-info">
                <h4>Assistência Perfeita</h4>
                <p>Comparecer a todos os treinos da semana</p>
              </div>
              <div className="mission-xp">+150 XP</div>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: '85%' }}></div>
            </div>
          </div>
          <div className="mission-card">
            <div className="mission-header">
              <div className="mission-icon">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>
              </div>
              <div className="mission-info">
                <h4>Craque da Semana</h4>
                <p>Atingir média ≥ 15 nas avaliações</p>
              </div>
              <div className="mission-xp">+200 XP</div>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: '95%' }}></div>
            </div>
          </div>
          <div className="mission-card">
            <div className="mission-header">
              <div className="mission-icon">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" /></svg>
              </div>
              <div className="mission-info">
                <h4>Capitão de Equipa</h4>
                <p>Ser eleito MVP em 3 jogos consecutivos</p>
              </div>
              <div className="mission-xp">+300 XP</div>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: '65%' }}></div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================
          SECÇÃO SEGURANÇA MÉDICA E RETENÇÃO
          ========================================= */}
      <section className="ai-section">
        <div className="ai-badge">
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.516 0c.85.493 1.509 1.333 1.509 2.316V18" /></svg>
          SEGURANÇA CLÍNICA & RGPD
        </div>
        <h2 className="ai-title">Proteção de dados e retenção médica atómica</h2>
        <p className="ai-subtitle">
          O sistema da JS20 App cruza os registos clínicos do Departamento Médico com as convocatórias em tempo real — bloqueando automaticamente atletas inaptos e assegurando o sigilo médico de acordo com o RGPD.
        </p>
      </section>

      {/* =========================================
          SECÇÃO CTA FINAL
          ========================================= */}
      <section className="cta-section">
        <h2 className="cta-title">Pronto para elevar <br/><span className="text-red">o teu clube?</span></h2>
        <p className="cta-subtitle">Junta-te à nova era da gestão desportiva. Grátis para começar — sem cartão de crédito.</p>
        <div className="hero-buttons">
          <Link to="/register" className="btn-primary">Criar Conta Grátis &rarr;</Link>
          <Link to="/login" className="btn-secondary">Já tenho conta</Link>
        </div>
      </section>

      {/* =========================================
          FOOTER
          ========================================= */}
      <footer className="home-footer">
        <div className="footer-logo">
          <span className="text-red">JS20</span> APP
        </div>
        <div className="footer-copy">
          &copy; 2026 JS20 App &middot; ERP de Gestão Desportiva &middot; Todos os direitos reservados.
        </div>
        <div className="footer-links">
          <a href="#">Privacidade</a>
          <a href="#">Termos</a>
          <a href="#">Contacto</a>
        </div>
      </footer>
    </div>
  );
}