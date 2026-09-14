import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import SidebarBalneario from '../../components/SidebarBalneario/SidebarBalneario';
import './PranchetaTatica.css';

export default function PranchetaTatica() {
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isStaff, setIsStaff] = useState(false);
  const [jogadas, setJogadas] = useState([]);
  
  const [tacticalPlayId, setTacticalPlayId] = useState(null);
  const [titulo, setTitulo] = useState('');
  const [categoria, setCategoria] = useState('Ataque');
  const [estadoPlay, setEstadoPlay] = useState('Rascunho');
  
  const [frames, setFrames] = useState([
    { ordem_frame: 0, acao_nota: 'Posições Iniciais', pinos: [] }
  ]);
  const [currentFrameIdx, setCurrentFrameIdx] = useState(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const playbackIntervalRef = useRef(null);
  const campoRef = useRef(null);

  const [showModalArquivo, setShowModalArquivo] = useState(false);
  const [termoPesquisa, setTermoPesquisa] = useState('');

  useEffect(() => {
    carregarDossierTatico();
    return () => interromperAnimacao();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (isPlaying) {
      playbackIntervalRef.current = setInterval(() => {
        setCurrentFrameIdx((prevIdx) => {
          if (prevIdx >= frames.length - 1) {
            clearInterval(playbackIntervalRef.current);
            setIsPlaying(false);
            return prevIdx;
          }
          return prevIdx + 1;
        });
      }, 1200);
    } else {
      interromperAnimacao();
    }
  }, [isPlaying, frames.length]);

  const interromperAnimacao = () => {
    if (playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current);
    }
  };

  const carregarDossierTatico = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/teams/${id}/tactical-plays`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setJogadas(data.jogadas || []);
        setIsStaff(data.is_staff || false);
      } else {
        setError('Erro ao ler a prancheta do balneário.');
      }
    } catch (err) {
      setError('Falha de ligação ao arquivo tático.');
    } finally {
      setLoading(false);
    }
  };

  const carregarJogadaNoQuadro = async (playId) => {
    interromperAnimacao();
    setIsPlaying(false);
    setShowModalArquivo(false);
    try {
      const res = await fetch(`http://localhost:8000/api/teams/${id}/tactical-plays/${playId}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setTacticalPlayId(playId);
        setTitulo(data.titulo);
        setCategoria(data.categoria);
        setEstadoPlay(data.estado);

        if (data.frames && data.frames.length > 0) {
          const framesAgrupados = {};
          data.frames.forEach(f => {
            if (!framesAgrupados[f.ordem_frame]) {
              framesAgrupados[f.ordem_frame] = {
                ordem_frame: f.ordem_frame,
                acao_nota: f.acao_nota || '',
                pinos: []
              };
            }
            framesAgrupados[f.ordem_frame].pinos.push({
              id_pino: f.pino_identificador,
              tipo_pino: f.tipo_pino,
              label: f.label || '',
              x: parseFloat(f.coord_x),
              y: parseFloat(f.coord_y)
            });
          });
          const listaFrames = Object.values(framesAgrupados).sort((a, b) => a.ordem_frame - b.ordem_frame);
          setFrames(listaFrames);
          setCurrentFrameIdx(0);
        }
      }
    } catch (err) {
      alert('Erro ao processar a jogada.');
    }
  };

  const aprovarSugestaoReal = async (playId) => {
    try {
      const res = await fetch(`http://localhost:8000/api/teams/${id}/tactical-plays/${playId}/aprovar`, {
        method: 'PATCH',
        headers: { 'Accept': 'application/json' },
        credentials: 'include'
      });
      if (res.ok) {
        alert('Sugestão aprovada! A jogada ensaiada já está visível para todo o plantel.');
        await carregarDossierTatico(); 
      } else {
        alert('Não foi possível validar o esquema tático.');
      }
    } catch (err) {
      alert('Erro de comunicação com o servidor desportivo.');
    }
  };

  const guardarEstrategia = async () => {
    if (!titulo.trim()) return alert('Dê um título à jogada ensaiada, Mister!');
    try {
      const res = await fetch(`http://localhost:8000/api/teams/${id}/tactical-plays`, {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id: tacticalPlayId, titulo, categoria, estado: estadoPlay, frames })
      });
      if (res.ok) {
        alert(isStaff ? 'Tática guardada com sucesso no arquivo!' : 'Sugestão tática enviada para análise do Mister!');
        setTitulo('');
        setTacticalPlayId(null);
        setFrames([{ ordem_frame: 0, acao_nota: 'Posições Iniciais', pinos: [] }]);
        setCurrentFrameIdx(0);
        carregarDossierTatico();
      }
    } catch (err) {
      alert('Erro ao gravar tática.');
    }
  };

  const eliminarEstrategia = async () => {
    if (!isStaff) return; 
    
    if (!tacticalPlayId) {
      return alert("Mister, esta tática ainda não foi gravada no arquivo ou acabou de ser limpa!");
    }
    
    if (window.confirm("Mister, tem a certeza que quer eliminar permanentemente esta jogada ensaiada do arquivo?")) {
      try {
        const res = await fetch(`http://localhost:8000/api/teams/${id}/tactical-plays/${tacticalPlayId}`, {
          method: 'DELETE',
          headers: { 'Accept': 'application/json' },
          credentials: 'include'
        });
        
        if (res.ok) {
          alert("Tática eliminada com sucesso da biblioteca!");
          setTitulo('');
          setTacticalPlayId(null);
          setFrames([{ ordem_frame: 0, acao_nota: 'Posições Iniciais', pinos: [] }]);
          setCurrentFrameIdx(0);
          await carregarDossierTatico();
        } else {
          alert("Não foi possível eliminar a jogada ensaiada.");
        }
      } catch (err) {
        alert("Erro ao comunicar com o arquivo estratégico.");
      }
    }
  };

  const adicionarPino = (tipo) => {
    const pinosNoFrame = frames[currentFrameIdx]?.pinos || [];
    const contagemTipo = pinosNoFrame.filter(p => p.tipo_pino === tipo).length;

    if (tipo === 'Bola') {
      const jaTemBola = pinosNoFrame.some(p => p.tipo_pino === 'Bola');
      if (jaTemBola) return alert('Só pode haver uma bola em jogo!');
    } else {
      if (contagemTipo >= 11) {
        return alert(`Limite atingido: Não pode colocar mais de 11 pinos da equipa ${tipo === 'Ataque' ? 'Aliada' : 'Adversária'}!`);
      }
    }

    let novoId = `${tipo[0].toUpperCase()}-${contagemTipo + 1}-${Date.now()}`;
    let label = (contagemTipo + 1).toString();

    if (tipo === 'Bola') {
      novoId = `BOLA-UNICA`;
      label = '⚽';
    }

    const novoPino = { id_pino: novoId, tipo_pino: tipo, label, x: 50, y: 50 };

    const novosFrames = [...frames];
    novosFrames[currentFrameIdx].pinos.push(novoPino);
    setFrames(novosFrames);
  };

  const adicionarFrameSequencia = () => {
    interromperAnimacao();
    setIsPlaying(false);
    const ultimoFrame = frames[frames.length - 1];
    const novosPinos = ultimoFrame.pinos.map(p => ({ ...p }));
    
    setFrames([
      ...frames,
      { ordem_frame: frames.length, acao_nota: `Movimento ${frames.length}`, pinos: novosPinos }
    ]);
    setCurrentFrameIdx(frames.length);
  };

  const handleDragStart = (e, pinoId) => {
    if (isPlaying) return e.preventDefault();
    e.dataTransfer.setData('text/plain', pinoId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDropCampo = (e) => {
    e.preventDefault();
    if (!campoRef.current) return;

    const rect = campoRef.current.getBoundingClientRect();
    const id_pino = e.dataTransfer.getData('text/plain');

    let x = ((e.clientX - rect.left) / rect.width) * 100;
    let y = ((e.clientY - rect.top) / rect.height) * 100;

    if (x < 2) x = 2; if (x > 98) x = 98;
    if (y < 2) y = 2; if (y > 98) y = 98;

    const novosFrames = [...frames];
    const pinoIndex = novosFrames[currentFrameIdx].pinos.findIndex(p => p.id_pino === id_pino);

    if (pinoIndex !== -1) {
      novosFrames[currentFrameIdx].pinos[pinoIndex].x = parseFloat(x.toFixed(2));
      novosFrames[currentFrameIdx].pinos[pinoIndex].y = parseFloat(y.toFixed(2));
      setFrames(novosFrames);
    }
  };

  const taticasRecentes = jogadas.slice(0, 5);
  const taticasFiltradasModal = jogadas.filter(p => 
    p.titulo.toLowerCase().includes(termoPesquisa.toLowerCase()) ||
    p.categoria.toLowerCase().includes(termoPesquisa.toLowerCase())
  );

  if (loading) return <div className="ge-loading">A abrir prancheta tática...</div>;

  return (
    <div className="ge-fullscreen-wrapper">
      <div className="ge-workspace">
        <SidebarBalneario />
        <main className="tactical-module-grid">
          
          <div className="tactical-board-area">
            <div className="ge-card board-header">
              <div className="board-inputs-row">
                <input 
                  type="text" 
                  placeholder={isStaff ? "Título da Jogada Ensaiada..." : "Sugere uma ideia tática ao Mister..."} 
                  value={titulo} 
                  onChange={(e) => setTitulo(e.target.value)} 
                  className="board-title-input"
                />
                <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="board-mini-select">
                  <option value="Ataque">Ataque 🟢</option>
                  <option value="Defesa">Defesa 🔴</option>
                  <option value="Bolas Paradas">Bolas Paradas 🎯</option>
                  <option value="Transição">Transição 🔄</option>
                </select>
                
                {isStaff ? (
                  <select value={estadoPlay} onChange={(e) => setEstadoPlay(e.target.value)} className="board-mini-select">
                    <option value="Rascunho">Privado (Staff)</option>
                    <option value="Publicada">Publicar p/ Plantel</option>
                  </select>
                ) : (
                  <div className="player-status-badge">💡 Sugestão</div>
                )}
                
                <div className="board-actions-group">
                  <button className="ge-btn ge-primary-btn" onClick={guardarEstrategia}>
                    {isStaff ? '💾 Gravar Tática' : '🚀 Enviar ao Mister'}
                  </button>
                  
                  {isStaff && (
                    <button className="btn-delete-tactical" onClick={eliminarEstrategia}>
                      🗑️ Eliminar
                    </button>
                  )}
                </div>
              </div>

              <div className="board-toolbox">
                <button onClick={() => adicionarPino('Ataque')} className="tool-btn btn-atq">👤 +Pino Nosso</button>
                <button onClick={() => adicionarPino('Defesa')} className="tool-btn btn-def">👤 +Pino Adv</button>
                <button onClick={() => adicionarPino('Bola')} className="tool-btn btn-ball">⚽ Adicionar Bola</button>
              </div>
            </div>

            <div 
              className="tactical-pitch" 
              ref={campoRef}
              onDragOver={handleDragOver}
              onDrop={handleDropCampo}
            >
              <div className="pitch-lines-midfield"></div>
              <div className="pitch-lines-circle"></div>
              <div className="pitch-center-spot"></div>

              <div className="pitch-large-area-home"></div>
              <div className="pitch-small-area-home"></div>
              <div className="pitch-penalty-spot-home"></div>
              <div className="pitch-d-arc-home"></div>
              <div className="goal-home"></div>

              <div className="pitch-large-area-away"></div>
              <div className="pitch-small-area-away"></div>
              <div className="pitch-penalty-spot-away"></div>
              <div className="pitch-d-arc-away"></div>
              <div className="goal-away"></div>

              {frames[currentFrameIdx]?.pinos.map((pino) => (
                <div
                  key={pino.id_pino}
                  draggable={!isPlaying}
                  onDragStart={(e) => handleDragStart(e, pino.id_pino)}
                  className={`tactical-token token-${pino.tipo_pino.toLowerCase()} ${isPlaying ? 'animated-move' : ''}`}
                  style={{ left: `${pino.x}%`, top: `${pino.y}%` }}
                >
                  {pino.label}
                </div>
              ))}
            </div>

            <div className="ge-card board-timeline">
              <div className="timeline-navigation">
                <div className="playback-controls">
                  <button 
                    onClick={() => {
                      if (currentFrameIdx >= frames.length - 1) setCurrentFrameIdx(0);
                      setIsPlaying(!isPlaying);
                    }} 
                    className={`play-simulation-btn ${isPlaying ? 'stop-mode' : ''}`}
                  >
                    {isPlaying ? '⏹️ Parar Simulação' : '▶️ Reproduzir Jogada'}
                  </button>
                </div>

                <span className="frame-counter">Momento: <strong>{currentFrameIdx + 1} / {frames.length}</strong></span>
                
                <div className="timeline-btns">
                  <button disabled={currentFrameIdx === 0 || isPlaying} onClick={() => setCurrentFrameIdx(currentFrameIdx - 1)} className="timeline-arrow">◀️ Anterior</button>
                  <button disabled={currentFrameIdx === frames.length - 1 || isPlaying} onClick={() => setCurrentFrameIdx(currentFrameIdx + 1)} className="timeline-arrow">Seguinte ▶️</button>
                  <button onClick={adicionarFrameSequencia} disabled={isPlaying} className="timeline-add-frame">➕ Novo Momento</button>
                </div>
              </div>
              <input 
                type="text"
                placeholder="Indicações táticas para este momento do lance..."
                value={frames[currentFrameIdx]?.acao_nota || ''}
                disabled={isPlaying}
                onChange={(e) => {
                  const novosFrames = [...frames];
                  novosFrames[currentFrameIdx].acao_nota = e.target.value;
                  setFrames(novosFrames);
                }}
                className="frame-note-input"
              />
            </div>
          </div>

          <div className="tactical-sidebar-archive">
            <div className="ge-card archive-container">
              <div className="archive-sidebar-header">
                <h3>📂 Dossier Recente</h3>
                <button className="open-archive-modal-btn" onClick={() => setShowModalArquivo(true)}>
                  🗄️ Ver Todo o Arquivo
                </button>
              </div>
              <p className="archive-subtitle">Últimas 5 jogadas ou sugestões recebidas</p>
              
              <div className="archive-list">
                {taticasRecentes.length === 0 ? (
                  <p className="no-data-text">Nenhuma jogada em ficheiro recente.</p>
                ) : (
                  taticasRecentes.map((play) => (
                    <div key={play.id} className={`archive-play-card status-${play.estado.toLowerCase()}`}>
                      <div className="play-card-header">
                        <span className="play-badge-cat">{play.categoria}</span>
                        <span className={`play-badge-status status-${play.estado.toLowerCase()}`}>
                          {play.estado.toUpperCase()}
                        </span>
                      </div>
                      <h4>{play.titulo}</h4>
                      <p className="play-author">Por: {play.criador ? `${play.criador.nome} ${play.criador.apelido}` : 'Staff Técnico'}</p>
                      
                      <div className="play-card-actions">
                        <button onClick={() => carregarJogadaNoQuadro(play.id)} className="play-action-btn load-btn">
                          👁️ Abrir
                        </button>
                        {isStaff && play.estado === 'Sugestao' && (
                          <button onClick={() => aprovarSugestaoReal(play.id)} className="play-action-btn approve-btn">
                            ✔️ Aprovar Ideia
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </main>
      </div>

      {showModalArquivo && (
        <div className="ge-modal-overlay animate-fade">
          <div className="ge-modal-card tactical-large-archive-modal">
            <div className="modal-archive-header">
              <div>
                <h2>🗄️ Arquivo Estratégico Integral</h2>
                <p>Pesquise e consulte a biblioteca completa de jogadas ensaiadas da equipa</p>
              </div>
              <button className="close-modal-x-btn" onClick={() => setShowModalArquivo(false)}>✕</button>
            </div>

            <div className="modal-archive-search-bar">
              <input 
                type="text" 
                placeholder="🔍 Pesquisar por título da jogada ou categoria..."
                value={termoPesquisa}
                onChange={(e) => setTermoPesquisa(e.target.value)}
                className="modal-search-input"
              />
              <span className="search-counter-badge">Total: {taticasFiltradasModal.length} lances</span>
            </div>

            <div className="modal-archive-scroll-area">
              {taticasFiltradasModal.length === 0 ? (
                <p className="no-data-text" style={{ padding: '3rem 0' }}>Nenhuma jogada ensaiada encontrada com este critério.</p>
              ) : (
                <div className="modal-archive-grid-layout">
                  {taticasFiltradasModal.map((play) => (
                    <div key={play.id} className={`archive-play-card status-${play.estado.toLowerCase()}`}>
                      <div className="play-card-header">
                        <span className="play-badge-cat">{play.categoria}</span>
                        <span className={`play-badge-status status-${play.estado.toLowerCase()}`}>
                          {play.estado.toUpperCase()}
                        </span>
                      </div>
                      <h4>{play.titulo}</h4>
                      <p className="play-author">Submetido por: <strong>{play.criador ? `${play.criador.nome} ${play.criador.apelido}` : 'Staff Técnico'}</strong></p>
                      <div className="play-card-actions" style={{ marginTop: '1rem' }}>
                        <button onClick={() => carregarJogadaNoQuadro(play.id)} className="play-action-btn load-btn">
                          👁️ Carregar p/ Quadro
                        </button>
                        {isStaff && play.estado === 'Sugestao' && (
                          <button onClick={() => aprovarSugestaoReal(play.id)} className="play-action-btn approve-btn">
                            ✔️ Validar Ideia
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}