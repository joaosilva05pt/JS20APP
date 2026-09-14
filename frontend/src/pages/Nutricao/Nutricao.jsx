import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import SidebarBalneario from '../../components/SidebarBalneario/SidebarBalneario';
import './Nutricao.css';

export default function Nutricao() {
  const { id } = useParams(); // team_id

  // Estados de dados
  const [guias, setGuias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [podeGerir, setPodeGerir] = useState(false);

  // Filtro de Categoria Ativo: 'Todos' | 'Diario' | 'Pre-Jogo' | 'Suplementacao' | 'Recuperacao'
  const [filtroAtivo, setFiltroAtivo] = useState('Todos');

  // Controlo de Edição
  const [editandoId, setEditandoId] = useState(null);

  // Estados do formulário
  const [titulo, setTitulo] = useState('');
  const [tipo, setTipo] = useState('Diario');
  const [conteudoTexto, setConteudoTexto] = useState('');
  const [anexoUrl, setAnexoUrl] = useState('');

  // 🔥 Linha 31 protegida com o Accept JSON e validação de status 401
  const carregarDadosNutricao = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`http://localhost:8000/api/teams/${id}/nutrition-guides`, {
        method: 'GET',
        headers: { 
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (res.status === 401) {
        setError('Sessão expirada. Por favor, volte a fazer login para aceder ao painel de nutrição.');
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setGuias(data.guias || []);
        setPodeGerir(data.pode_gerir || false);
      } else {
        setError('Não foi possível carregar os planos alimentares da equipa.');
      }
    } catch (err) {
      setError('Falha de ligação ao servidor de nutrição.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDadosNutricao();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const resetFormulario = () => {
    setTitulo('');
    setTipo('Diario');
    setConteudoTexto('');
    setAnexoUrl('');
    setEditandoId(null);
  };

  const handleSubmeterFormulario = async (e) => {
    e.preventDefault();
    if (!titulo.trim()) return alert('Por favor, defina um título para o guia nutricional!');

    const url = editandoId
      ? `http://localhost:8000/api/teams/${id}/nutrition-guides/${editandoId}`
      : `http://localhost:8000/api/teams/${id}/nutrition-guides`;

    const method = editandoId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method: method,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          titulo,
          tipo,
          conteudo_texto: conteudoTexto,
          anexo_url: anexoUrl
        })
      });

      if (res.ok) {
        alert(editandoId ? 'Plano de nutrição modificado!' : 'Novo guia de dieta publicado com sucesso!');
        resetFormulario();
        carregarDadosNutricao();
      } else {
        alert('Erro ao guardar os dados do plano alimentar.');
      }
    } catch (err) {
      alert('Erro de rede ao comunicar com o servidor.');
    }
  };

  const handleEliminarGuia = async (guiaId) => {
    if (!window.confirm('Tem a certeza de que deseja remover este plano alimentar permanente do balneário?')) return;
    try {
      const res = await fetch(`http://localhost:8000/api/teams/${id}/nutrition-guides/${guiaId}`, {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' },
        credentials: 'include'
      });
      if (res.ok) {
        setGuias(guias.filter(g => g.id !== guiaId));
      }
    } catch (err) {
      alert('Erro ao apagar registo alimentar.');
    }
  };

  const handleEntrarEdicao = (g) => {
    setEditandoId(g.id);
    setTitulo(g.titulo);
    setTipo(g.tipo);
    setConteudoTexto(g.conteudo_texto || '');
    setAnexoUrl(g.anexo_url || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filtragem dinâmica de arrays em memória do React
  const guiasFiltrados = guias.filter(g => filtroAtivo === 'Todos' || g.tipo === filtroAtivo);

  if (loading) return <div className="ge-loading">A estruturar planos de nutrição desportiva...</div>;

  return (
    <div className="ge-fullscreen-wrapper">
      <div className="ge-workspace">
        <SidebarBalneario />

        <main className="nutricao-module-pane">
          <div className="nutricao-full-layout">

            {error && <div className="ge-error-alert">{error}</div>}

            {/* 🍏 FORMULÁRIO EXCLUSIVO DO NUTRICIONISTA / STAFF */}
            {podeGerir && (
              <div className="ge-card nutricao-creator-card">
                <h3>{editandoId ? '📝 Modificar Diretriz Nutricional' : '🍏 Prescrever Novo Guia Nutricional'}</h3>
                <p className="nutricao-subtitle">Disponibilize ementas diárias, rotinas de hidratação ou planos de suplementação para o plantel</p>

                <form onSubmit={handleSubmeterFormulario} className="nutricao-form">
                  <div className="nutricao-form-grid">
                    <div className="form-group" style={{ flex: '2' }}>
                      <label>Título do Plano / Ementa</label>
                      <input 
                        type="text"
                        placeholder="Ex: Refeição Pré-Jogo - Portimonense SC, Protocolo de Creatina..."
                        value={titulo}
                        onChange={(e) => setTitulo(e.target.value)}
                        className="nutricao-input"
                        maxLength={100}
                      />
                    </div>

                    <div className="form-group" style={{ flex: '1' }}>
                      <label>Categoria de Dieta</label>
                      <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="nutricao-input">
                        <option value="Diario">📰 Diário / Refeitório</option>
                        <option value="Pre-Jogo">🔥 Refeição Pré-Jogo</option>
                        <option value="Suplementacao">💊 Suplementação Alimentar</option>
                        <option value="Recuperacao">💪 Janela de Recuperação</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Instruções Gerais e Alimentos Recomendados</label>
                    <textarea 
                      placeholder="Descreva o plano pormenorizadamente, horários preferenciais e alimentos a evitar..."
                      value={conteudoTexto}
                      onChange={(e) => setConteudoTexto(e.target.value)}
                      className="nutricao-textarea"
                      rows={3}
                    />
                  </div>

                  <div className="form-group">
                    <label>Link Externo do Documento Anexo (Opcional - PDF/Imagem)</label>
                    <input 
                      type="url"
                      placeholder="https://exemplo.com/planos/ementa-semana.pdf"
                      value={anexoUrl}
                      onChange={(e) => setAnexoUrl(e.target.value)}
                      className="nutricao-input"
                    />
                  </div>

                  <div className="nutricao-form-footer">
                    <div></div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {editandoId && (
                        <button type="button" onClick={resetFormulario} className="ge-btn" style={{ background: '#334155' }}>
                          Cancelar Edição
                        </button>
                      )}
                      <button type="submit" className="ge-btn btn-save-nutrition">
                        💾 {editandoId ? 'Guardar Alterações' : 'Publicar no Balneário'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* 🎛️ BARRA DE NAVEGAÇÃO E FILTROS DINÂMICOS */}
            <div className="nutricao-filter-bar">
              {['Todos', 'Diario', 'Pre-Jogo', 'Suplementacao', 'Recuperacao'].map(cat => (
                <button
                  key={cat}
                  className={`filter-tab-btn ${filtroAtivo === cat ? 'active' : ''}`}
                  onClick={() => setFiltroAtivo(cat)}
                >
                  {cat === 'Todos' && '🌐 Ver Todos'}
                  {cat === 'Diario' && '📰 Diário'}
                  {cat === 'Pre-Jogo' && '🔥 Pré-Jogo'}
                  {cat === 'Suplementacao' && '💊 Suplementação'}
                  {cat === 'Recuperacao' && '💪 Recuperação'}
                </button>
              ))}
            </div>

            {/* 📋 LISTAGEM COMPACTA DE PLANOS */}
            <div className="nutricao-records-section">
              {guiasFiltrados.length === 0 ? (
                <div className="ge-card no-nutrition-card">
                  <p>🥗 Não existem orientações alimentares ativas nesta categoria para esta equipa.</p>
                </div>
              ) : (
                <div className="nutricao-cards-grid">
                  {guiasFiltrados.map((guia) => (
                    <div key={guia.id} className={`ge-card nutrition-display-card type-${guia.tipo.toLowerCase()}`}>
                      <div className="nutrition-card-header">
                        <div>
                          <span className="nutrition-tag">{guia.tipo.toUpperCase()}</span>
                          <h4>{guia.titulo}</h4>
                        </div>
                        {podeGerir && (
                          <div className="action-header-buttons">
                            <button onClick={() => handleEntrarEdicao(guia)} title="Editar Diretriz">✏️</button>
                            <button onClick={() => handleEliminarGuia(guia.id)} title="Apagar Guia" className="del-btn">✕</button>
                          </div>
                        )}
                      </div>

                      <div className="nutrition-card-body">
                        {guia.conteudo_texto && <p className="nutrition-text-content">{guia.conteudo_texto}</p>}
                        
                        {guia.anexo_url && (
                          <a href={guia.anexo_url} target="_blank" rel="noopener noreferrer" className="nutrition-download-link">
                            📄 Aceder ao PDF / Documento Anexo
                          </a>
                        )}

                        <div className="nutrition-card-footer">
                          <span>Prescrito por: {guia.criador ? `${guia.criador.nome} ${guia.criador.apelido}` : 'Gabinete de Nutrição'}</span>
                          <span>• {new Date(guia.created_at || guia.criado_em).toLocaleDateString('pt-PT')}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}