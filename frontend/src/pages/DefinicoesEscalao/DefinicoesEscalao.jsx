import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SidebarBalneario from '../../components/SidebarBalneario/SidebarBalneario';
import './DefinicoesEscalao.css';

export default function DefinicoesEscalao() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    escalao: '',
    genero: '',
    epoca_desportiva: '',
    arquivada: false
  });

  const carregarDefinicoes = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`http://localhost:8000/api/teams/${id}/settings`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        credentials: 'include'
      });

      if (res.ok) {
        const data = await res.json();
        setFormData(data);
      } else {
        setError('Não foi possível carregar os metadados do escalão.');
      }
    } catch (err) {
      setError('Erro de ligação ao servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDefinicoes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleArquivarEpoca = async () => {
    const msg = 
      `⚠️ ALERTA DE DIREÇÃO DE CLUBE\n\n` +
      `Confirmas o encerramento administrativo da época ${formData.epoca_desportiva}?\n\n` +
      `Esta ação vai trancar permanentemente as avaliações de 0-20, treinos e registos deste escalão.`;

    if (!window.confirm(msg)) return;

    try {
      const res = await fetch(`http://localhost:8000/api/teams/${id}/settings/archive`, {
        method: 'PATCH',
        headers: { 'Accept': 'application/json' },
        credentials: 'include'
      });

      const data = await res.json();

      if (res.ok) {
        alert(data.message);
        navigate('/dashboard'); // Redireciona para o painel principal do clube
      } else {
        alert(data.message || 'Erro ao processar fecho de época.');
      }
    } catch (err) {
      alert('Erro de rede ao comunicar com o clube.');
    }
  };

  if (loading) return <div className="ge-loading">A validar permissões de Staff do Clube...</div>;

  return (
    <div className="ge-fullscreen-wrapper">
      <div className="ge-workspace">
        <SidebarBalneario />

        <main className="settings-module-pane">
          <div className="settings-container">
            
            <div className="settings-header-zone">
              <h2>⚙️ Definições do Escalão</h2>
              <p>Consulta de metadados ativos e encerramento de ciclo desportivo por parte da Staff.</p>
            </div>

            {error && <div className="ge-alert-danger">{error}</div>}

            <div className="settings-grid-layout">
              
              {/* CARD 1: APENAS LEITURA */}
              <div className="ge-card settings-main-card">
                <h3>Informação do Plantel (Modo Leitura)</h3>
                <div className="settings-form">
                  
                  <div className="form-group">
                    <label>Nome do Escalão</label>
                    <input type="text" value={formData.escalao} readOnly style={{ opacity: 0.75, cursor: 'not-allowed' }} />
                  </div>

                  <div className="form-group">
                    <label>Género Coletivo</label>
                    <input type="text" value={formData.genero} readOnly style={{ opacity: 0.75, cursor: 'not-allowed' }} />
                  </div>

                  <div className="form-group">
                    <label>Época Ativa</label>
                    <input type="text" value={formData.epoca_desportiva} readOnly style={{ opacity: 0.75, cursor: 'not-allowed' }} />
                  </div>

                </div>
              </div>

              {/* CARD 2: PAINEL DE CONTROLO DO FIN DE ÉPOCA */}
              <div className="ge-card settings-danger-zone-card">
                <h3 className="danger-title">⚠️ Fim de Ciclo & Arquivo</h3>
                <p className="danger-desc">
                  Esta ação é restrita a membros autorizados da Direção do Clube (Presidente, Diretores ou Coordenação).
                </p>

                <div className="danger-box">
                  <h5>Consequências do Encerramento:</h5>
                  <ul>
                    <li>Bloqueio total de edição de notas e presenças de treinos ou jogos.</li>
                    <li>Congelamento dos dados para fins estatísticos e de auditoria de rendimento.</li>
                  </ul>

                  <button
                    type="button"
                    onClick={handleArquivarEpoca}
                    className="ge-btn btn-danger-action"
                    disabled={formData.arquivada}
                  >
                    {formData.arquivada ? '🔒 Escalão já se encontra Arquivado' : '🏁 Encerrar & Arquivar Época'}
                  </button>
                </div>
              </div>

            </div>

          </div>
        </main>
      </div>
    </div>
  );
}