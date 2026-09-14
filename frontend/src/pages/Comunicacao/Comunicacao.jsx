import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import SidebarBalneario from '../../components/SidebarBalneario/SidebarBalneario';
import './Comunicacao.css';

export default function Comunicacao() {
  const { id } = useParams(); // team_id

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Estados para criar um novo post
  const [titulo, setTitulo] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [tipo, setTipo] = useState('Noticia');

  // Estado para controlo de comentários
  const [activePostComments, setActivePostComments] = useState({});
  const [novoComentarioTexto, setNovoComentarioTexto] = useState({});

  useEffect(() => {
    carregarFeed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const carregarFeed = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/teams/${id}/posts`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        
        const listaPosts = Array.isArray(data) ? data : (data.posts || []);
        setPosts(listaPosts);
      } else {
        setError('Erro ao carregar o mural de comunicação.');
      }
    } catch (err) {
      setError('Falha de ligação ao servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleCriarPost = async (e) => {
    e.preventDefault();
    if (!titulo.trim() || !conteudo.trim()) {
      return alert('Mister, preencha o título e o conteúdo da publicação!');
    }

    try {
      const res = await fetch(`http://localhost:8000/api/teams/${id}/posts`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ titulo, conteudo, tipo })
      });

      if (res.ok) {
        const novoPost = await res.json();
        setPosts([novoPost, ...posts]);
        setTitulo('');
        setConteudo('');
        setTipo('Noticia');
      } else {
        alert('Não foi possível publicar no mural.');
      }
    } catch (err) {
      alert('Erro ao comunicar com o servidor.');
    }
  };

  const handleSubmeterComentario = async (postId) => {
    const texto = novoComentarioTexto[postId];
    if (!texto || !texto.trim()) return;

    try {
      const res = await fetch(`http://localhost:8000/api/teams/${id}/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ comentario: texto })
      });

      if (res.ok) {
        const novoComentario = await res.json();
        
        setPosts(posts.map(p => {
          if (p.id === postId) {
            return {
              ...p,
              comentarios: [...(p.comentarios || []), novoComentario]
            };
          }
          return p;
        }));

        setNovoComentarioTexto({
          ...novoComentarioTexto,
          [postId]: ''
        });
      }
    } catch (err) {
      alert('Erro ao submeter resposta.');
    }
  };

  const handleEliminarPost = async (postId) => {
    if (!window.confirm('Tem a certeza que deseja remover esta publicação permanente do mural?')) return;

    try {
      const res = await fetch(`http://localhost:8000/api/teams/${id}/posts/${postId}`, {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' },
        credentials: 'include'
      });

      if (res.ok) {
        setPosts(posts.filter(p => p.id !== postId));
      } else {
        alert('Não tem permissão para remover este post.');
      }
    } catch (err) {
      alert('Erro ao apagar publicação.');
    }
  };

  const toggleComentarios = (postId) => {
    setActivePostComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  // 🔥 ESTRATÉGIA FRONTEND: Ordenar os posts para meter os AVISOS sempre no topo!
  const postsOrdenados = [...posts].sort((a, b) => {
    if (a.tipo === 'Aviso' && b.tipo !== 'Aviso') return -1;
    if (a.tipo !== 'Aviso' && b.tipo === 'Aviso') return 1;
    return 0; // Se forem iguais, mantém a ordem cronológica original da BD
  });

  if (loading) return <div className="ge-loading">A carregar canal de comunicação...</div>;

  return (
    <div className="ge-fullscreen-wrapper">
      <div className="ge-workspace">
        <SidebarBalneario />
        
        <main className="comunicacao-module-pane">
          <div className="comunicacao-full-feed-layout">
            
            {/* ÁREA DE CRIAÇÃO */}
            <div className="ge-card post-creator-card">
              <h3>📣 Espaço de Comunicação Interativo</h3>
              <p className="creator-subtitle">Partilhe avisos, notícias, lances ou orientações com a equipa</p>
              
              <form onSubmit={handleCriarPost} className="post-form">
                <div className="form-row-top">
                  <input 
                    type="text"
                    placeholder="Título do teu comunicado..."
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    className="post-title-input"
                    maxLength={150}
                  />
                  <select 
                    value={tipo} 
                    onChange={(e) => setTipo(e.target.value)} 
                    className="post-type-select"
                  >
                    <option value="Noticia">📰 Notícia</option>
                    <option value="Aviso">⚠️ Aviso Urgente</option>
                    <option value="Convocatoria">📋 Convocatória</option>
                    <option value="Tatica">🧠 Quadro Tático</option>
                  </select>
                </div>

                <textarea
                  placeholder="O que está a acontecer no balneário, Mister/Atleta? Digite aqui..."
                  value={conteudo}
                  onChange={(e) => setConteudo(e.target.value)}
                  className="post-textarea"
                  rows={3}
                />

                <div className="form-row-bottom">
                  <span className="char-indicator">{conteudo.length} caracteres</span>
                  <button type="submit" className="ge-btn btn-publish-comunicacao">
                    🚀 Publicar no Feed
                  </button>
                </div>
              </form>
            </div>

            {/* LISTAGEM DO FEED */}
            <div className="comunicacao-posts-list">
              {error && <div className="ge-error-alert">{error}</div>}
              
              {postsOrdenados.length === 0 ? (
                <div className="ge-card no-posts-card">
                  <p> Muro de comunicação limpo. Seja o primeiro a lançar uma nota!</p>
                </div>
              ) : (
                postsOrdenados.map((post) => {
                  const commentsOpen = !!activePostComments[post.id];

                  return (
                    <div 
                      key={post.id} 
                      className={`ge-card post-tweet-card type-${post.tipo.toLowerCase()} ${post.tipo === 'Aviso' ? 'pinned-aviso' : ''}`}
                    >
                      <div className="tweet-header">
                        <div className="tweet-author-info">
                          <div className="author-avatar-stub">
                            {post.autor?.nome?.[0] || 'U'}
                          </div>
                          <div>
                            <span className="author-name">
                              {post.autor ? `${post.autor.nome} ${post.autor.apelido}` : 'Membro Balneário'}
                            </span>
                            <span className="post-badge-type">
                              {post.tipo === 'Aviso' ? '📌 AVISO FIXADO' : post.tipo.toUpperCase()}
                            </span>
                            <span className="tweet-date">
                              • {new Date(post.created_at || post.criado_em).toLocaleDateString('pt-PT')}
                            </span>
                          </div>
                        </div>
                        
                        {/* ✕ Sempre visível para testes ou gerido diretamente pelas permissões da API no Laravel */}
                        <button 
                          className="btn-delete-tweet"
                          onClick={() => handleEliminarPost(post.id)}
                          title="Remover publicação"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="tweet-body">
                        <h4 className="tweet-title">{post.titulo}</h4>
                        <p className="tweet-content">{post.conteudo}</p>
                      </div>

                      <div className="tweet-actions-bar">
                        <button 
                          className={`action-btn-chat ${commentsOpen ? 'active' : ''}`} 
                          onClick={() => toggleComentarios(post.id)}
                        >
                          💬 Respostas <span className="action-counter">({post.comentarios?.length || 0})</span>
                        </button>
                      </div>

                      {/* RESPOSTAS */}
                      {commentsOpen && (
                        <div className="tweet-comments-section">
                          <div className="comments-divider"></div>
                          
                          <div className="comments-scroll-area">
                            {post.comentarios && post.comentarios.length > 0 ? (
                              post.comentarios.map((comment) => (
                                <div key={comment.id} className="comment-bubble-row">
                                  <div className="comment-avatar-stub">
                                    {comment.user?.nome?.[0] || 'U'}
                                  </div>
                                  <div className="comment-bubble-content">
                                    <div className="comment-author-meta">
                                      <strong>{comment.user ? `${comment.user.nome} ${comment.user.apelido}` : 'Utilizador'}</strong>
                                      <span className="comment-date">
                                        {new Date(comment.created_at || comment.criado_em).toLocaleDateString('pt-PT')}
                                      </span>
                                    </div>
                                    <p className="comment-text">{comment.comentario}</p>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="no-comments-text">Ainda não há respostas a esta publicação.</p>
                            )}
                          </div>

                          <div className="comment-input-row">
                            <input
                              type="text"
                              placeholder="Escreva a sua resposta balnear..."
                              value={novoComentarioTexto[post.id] || ''}
                              onChange={(e) => setNovoComentarioTexto({
                                ...novoComentarioTexto,
                                [post.id]: e.target.value
                              })}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSubmeterComentario(post.id);
                              }}
                              className="comment-box-input"
                            />
                            <button 
                              onClick={() => handleSubmeterComentario(post.id)}
                              className="comment-send-btn"
                            >
                              Responder
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}