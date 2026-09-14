import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import SidebarBalneario from '../../components/SidebarBalneario/SidebarBalneario';
import './DeptoMedico.css';

export default function DeptoMedico() {
  const { id } = useParams();

  // Estados de dados e interface
  const [boletins, setBoletins] = useState([]);
  const [jogadoresPlantel, setJogadoresPlantel] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCorpoMedico, setIsCorpoMedico] = useState(false);

  // ID do registo que estamos a editar (null se for criação)
  const [editandoId, setEditandoId] = useState(null);

  // Estados do formulário
  const [jogadorSelecionado, setJogadorSelecionado] = useState('');
  const [tipoLesao, setTipoLesao] = useState('');
  const [gravidade, setGravidade] = useState('Leve');
  const [estadoProntidao, setEstadoProntidao] = useState('Inapto');
  const [dataInicio, setDataInicio] = useState('');
  const [dataRegressoPrevista, setDataRegressoPrevista] = useState('');
  const [notasTratamento, setNotasTratamento] = useState('');
  const [isPrivado, setIsPrivado] = useState(false);

  const carregarDadosMedicosERole = async () => {
    setLoading(true);
    setError('');
    try {
      const [membrosRes, recordsRes, userRes] = await Promise.all([
        fetch(`http://localhost:8000/api/teams/${id}/membros`, { credentials: 'include' }),
        fetch(`http://localhost:8000/api/teams/${id}/medical-records`, { credentials: 'include' }),
        fetch('http://localhost:8000/api/user', { credentials: 'include' })
      ]);

      if (membrosRes.ok) {
        const membrosData = await membrosRes.json();
        const listaMembros = membrosData.membros || [];
        setJogadoresPlantel(listaMembros.filter(m => m.cargo === 'Jogador'));

        if (userRes.ok) {
          const userData = await userRes.json();
          const meuMembro = listaMembros.find(m => m.user_id === userData.id);
          if (meuMembro) {
            const podeEscrever = meuMembro.cargo === 'Medico' || meuMembro.cargo === 'Fisioterapeuta' || meuMembro.cargo === 'Departamento_Medico';
            setIsCorpoMedico(podeEscrever);
          }
        }
      }

      if (recordsRes.ok) {
        const recordsData = await recordsRes.json();
        setBoletins(recordsData.boletins || recordsData);
      } else {
        setError('Erro ao carregar o histórico clínico do servidor.');
      }
    } catch (err) {
      setError('Falha de rede ao contactar o departamento médico.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDadosMedicosERole();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const resetFormulario = () => {
    setJogadorSelecionado('');
    setTipoLesao('');
    setGravidade('Leve');
    setEstadoProntidao('Inapto');
    setDataInicio('');
    setDataRegressoPrevista('');
    setNotasTratamento('');
    setIsPrivado(false);
    setEditandoId(null);
  };

  const handleSubmeterBoletim = async (e) => {
    e.preventDefault();
    if (!jogadorSelecionado || !tipoLesao.trim() || !dataInicio) {
      return alert('Por favor, preencha o atleta, o diagnóstico e a data de início!');
    }

    const url = editandoId 
      ? `http://localhost:8000/api/teams/${id}/medical-records/${editandoId}`
      : `http://localhost:8000/api/teams/${id}/medical-records`;

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
          user_id: jogadorSelecionado,
          tipo_lesao: tipoLesao,
          gravidade,
          estado_prontidao: estadoProntidao,
          data_inicio: dataInicio,
          data_regresso_prevista: dataRegressoPrevista || null,
          notas_tratamento: notasTratamento,
          privado: isPrivado
        })
      });

      if (res.ok) {
        alert(editandoId ? 'Ficha clínica atualizada com sucesso!' : 'Novo boletim clínico registado!');
        resetFormulario();
        carregarDadosMedicosERole();
      } else {
        alert('Erro ao processar o pedido no servidor.');
      }
    } catch (err) {
      alert('Erro de ligação ao servidor.');
    }
  };

  const handleDarAltaDireta = async (recordId) => {
    if (!window.confirm("Pretende dar alta médica imediata a este atleta e marcá-lo como APTO?")) return;
    try {
      const res = await fetch(`http://localhost:8000/api/teams/${id}/medical-records/${recordId}`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          estado_prontidao: 'Apto',
          data_regresso_prevista: new Date().toISOString().split('T')[0],
          privado: false
        })
      });
      if (res.ok) {
        alert("Atleta recebeu alta clínica e já está disponível para treino e jogo!");
        carregarDadosMedicosERole();
      }
    } catch (err) {
      alert("Erro ao processar alta.");
    }
  };

  const handleEntrarEdicao = (record) => {
    setEditandoId(record.id);
    setJogadorSelecionado(record.user_id);
    setTipoLesao(record.tipo_lesao);
    setGravidade(record.gravidade);
    setEstadoProntidao(record.estado_prontidao);
    setDataInicio(record.data_inicio);
    setDataRegressoPrevista(record.data_regresso_prevista || '');
    setNotasTratamento(record.notas_tratamento || '');
    setIsPrivado(record.privado === 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) return <div className="ge-loading">A desinfetar o departamento médico...</div>;

  return (
    <div className="ge-fullscreen-wrapper">
      <div className="ge-workspace">
        <SidebarBalneario />
        
        <main className="medico-module-pane">
          <div className="medico-full-layout">
            
            {isCorpoMedico && (
              <div className="ge-card medico-creator-card">
                <h3>{editandoId ? '📝 Editar Registo Clínico Ativo' : 'Nova Entrada no Boletim Clínico'}</h3>
                <p className="medico-subtitle">Gestão e acompanhamento médico das cargas e paragens do plantel</p>
                
                <form onSubmit={handleSubmeterBoletim} className="medico-form">
                  <div className="medico-form-grid">
                    
                    <div className="form-group">
                      <label>Atleta em Avaliação</label>
                      <select 
                        value={jogadorSelecionado}
                        onChange={(e) => setJogadorSelecionado(e.target.value)}
                        className="medico-input"
                        disabled={!!editandoId} // Tranca o jogador se for edição
                      >
                        <option value="">-- Escolha o Jogador --</option>
                        {jogadoresPlantel.map(u => (
                          <option key={u.user_id} value={u.user_id}>
                            {u.nome} (Nº {u.numero_camisola || '—'})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Diagnóstico Clínico</label>
                      <input 
                        type="text"
                        placeholder="Ex: Rotura Fibrilar, Tendinite..."
                        value={tipoLesao}
                        onChange={(e) => setTipoLesao(e.target.value)}
                        className="medico-input"
                      />
                    </div>

                    <div className="form-group">
                      <label>Gravidade</label>
                      <select value={gravidade} onChange={(e) => setGravidade(e.target.value)} className="medico-input">
                        <option value="Leve">Leve (Poucos dias)</option>
                        <option value="Moderada">Moderada (1 a 3 semanas)</option>
                        <option value="Grave">Grave (Longa duração)</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Prontidão Desportiva</label>
                      <select value={estadoProntidao} onChange={(e) => setEstadoProntidao(e.target.value)} className="medico-input">
                        <option value="Inapto">❌ Inapto (Baixa Total)</option>
                        <option value="Condicionado">🟡 Condicionado (Transição/Ginásio)</option>
                        <option value="Apto">🟢 Apto (Alta Clínica Completa)</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Início da Paragem</label>
                      <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="medico-input" />
                    </div>

                    <div className="form-group">
                      <label>Previsão de Alta</label>
                      <input type="date" value={dataRegressoPrevista} onChange={(e) => setDataRegressoPrevista(e.target.value)} className="medico-input" />
                    </div>
                  </div>

                  <div className="form-group text-area-group">
                    <label>Notas de Evolução e Tratamento Prescrito</label>
                    <textarea 
                      placeholder="Trabalho de reforço muscular, fisioterapia ativa ou restrições de carga nos treinos..."
                      value={notasTratamento}
                      onChange={(e) => setNotasTratamento(e.target.value)}
                      className="medico-textarea"
                      rows={2}
                    />
                  </div>

                  <div className="medico-form-footer">
                    <label className="checkbox-privacy-label">
                      <input 
                        type="checkbox" 
                        checked={isPrivado} 
                        onChange={(e) => setIsPrivado(e.target.checked)} 
                      />
                      <span>🔒 Marcar ficha clínica como privada (Invisível para jogadores comuns)</span>
                    </label>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {editandoId && (
                        <button type="button" onClick={resetFormulario} className="ge-btn" style={{ background: '#334155' }}>
                          Cancelar
                        </button>
                      )}
                      <button type="submit" className="ge-btn btn-save-medical">
                        💾 {editandoId ? 'Gravar Alterações' : 'Atualizar Arquivo Clínico'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            <div className="medico-records-section">
              <h3>📋 Quadro Clínico Geral do Plantel</h3>
              
              {error && <div className="ge-error-alert">{error}</div>}

              {boletins.length === 0 ? (
                <div className="ge-card no-records-card">
                  <p>🟢 Sem registos clínicos ativos de momento. Todo o plantel às ordens do Mister!</p>
                </div>
              ) : (
                <div className="medico-records-list">
                  {boletins.map((record) => (
                    <div 
                      key={record.id} 
                      className={`ge-card medical-record-card status-${record.estado_prontidao.toLowerCase()}`}
                    >
                      <div className="record-card-header">
                        <div className="record-player-info">
                          <div className={`status-dot status-${record.estado_prontidao.toLowerCase()}`}></div>
                          <h4>{record.jogador ? `${record.jogador.nome} ${record.jogador.apelido}` : 'Jogador'}</h4>
                        </div>
                        <span className={`badge-prontidao status-${record.estado_prontidao.toLowerCase()}`}>
                          {record.estado_prontidao.toUpperCase()}
                        </span>
                      </div>

                      <div className="record-card-body">
                        <div className="clinical-data-grid">
                          <div><span className="label-clinical">Diagnóstico:</span> <strong>{record.tipo_lesao}</strong></div>
                          <div><span className="label-clinical">Gravidade:</span> <span className={`grav-badge ${record.gravidade.toLowerCase()}`}>{record.gravidade}</span></div>
                          <div><span className="label-clinical">Parado desde:</span> {new Date(record.data_inicio).toLocaleDateString('pt-PT')}</div>
                          <div>
                            <span className="label-clinical">Retorno Estimado:</span>{' '}
                            <strong>
                              {record.data_regresso_prevista 
                                ? new Date(record.data_regresso_prevista).toLocaleDateString('pt-PT') 
                                : 'Sob Avaliação'}
                            </strong>
                          </div>
                        </div>

                        {record.notas_tratamento && (
                          <div className="record-clinical-notes">
                            <h5>📋 Notas de Evolução:</h5>
                            <p>{record.notas_tratamento}</p>
                          </div>
                        )}
                        
                        <div className="record-card-footer">
                          <span>Clínico Responsável: {record.profissional ? `${record.profissional.nome} ${record.profissional.apelido}` : 'Gabinete Médico'}</span>
                          
                          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                            {record.privado === 1 && <span className="private-lock-indicator">🔒 Restrito à Estrutura</span>}
                            {isCorpoMedico && (
                              <button 
                                onClick={() => handleEntrarEdicao(record)} 
                                className="open-archive-modal-btn" 
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                              >
                                ✏️ Editar
                              </button>
                            )}
                            {isCorpoMedico && record.estado_prontidao !== 'Apto' && (
                              <button 
                                onClick={() => handleDarAltaDireta(record.id)} 
                                className="play-action-btn approve-btn"
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', width: 'auto' }}
                              >
                                ✔️ Dar Alta
                              </button>
                            )}
                          </div>
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