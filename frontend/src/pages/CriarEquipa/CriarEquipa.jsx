import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CriarEquipa.css';

export default function CriarEquipa() {
  const navigate = useNavigate();
  
  const obterEpocaAtualSugerida = () => {
    const data = new Date();
    const ano = data.getFullYear();
    const mes = data.getMonth() + 1;
    if (mes >= 7) {
      return `${ano}/${ano + 1}`;
    } else {
      return `${ano - 1}/${ano}`;
    }
  };

  const epocaSugerida = obterEpocaAtualSugerida();
  const [anoBase] = epocaSugerida.split('/');
  const anoSeguinte = parseInt(anoBase) + 1;
  const proximaEpocaSugerida = `${anoSeguinte}/${anoSeguinte + 1}`;

  const [form, setForm] = useState({
    escalao: 'Senior',
    genero: 'Masculino',
    epoca_desportiva: epocaSugerida
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificandoAcesso, setVerificandoAcesso] = useState(true);

  useEffect(() => {
    const verificarAcesso = async () => {
      try {
        const userRes = await fetch('http://localhost:8000/api/user', { credentials: 'include' });
        if (!userRes.ok) { navigate('/login'); return; }
        
        const userData = await userRes.json();
        if (userData.profissao_base !== 'Dirigente') { navigate('/dashboard'); return; }

        const clubRes = await fetch('http://localhost:8000/api/meu-clube', { credentials: 'include' });
        if (!clubRes.ok) { navigate('/dashboard'); return; }

        setVerificandoAcesso(false);
      } catch (err) {
        navigate('/dashboard');
      }
    };
    verificarAcesso();
  }, [navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8000/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form)
      });

      const data = response.ok ? await response.json() : null;

      if (response.ok) {
        navigate('/dashboard');
      } else {
        setError(data?.message || 'Erro ao criar a equipa.');
      }
    } catch (err) {
      setError('Erro de conexão ao servidor.');
    } finally {
      setLoading(false);
    }
  };

  if (verificandoAcesso) return null;

  return (
    <div className="ce-open-layout-container">
      {/*  */}
      <div className="ce-open-header">
        <h2>Gestão de Estrutura <span className="ce-header-divider">|</span> <span className="ce-header-highlight">Novo Escalão</span></h2>
        <p>Adiciona uma nova equipa ao teu clube e define o planeamento para a temporada desportiva.</p>
      </div>

      {/*  */}
      <div className="ce-open-workspace">
        <h3 className="ce-open-section-title">Configuração do Novo Relvado</h3>
        
        <form onSubmit={handleSubmit} className="ce-form">
          {error && <div className="ce-alert">{error}</div>}

          <div className="ce-row">
            <div className="ce-group">
              <label>Escalão Desportivo</label>
              <select className="ce-select" name="escalao" value={form.escalao} onChange={handleChange} required>
                <option value="Senior">Séniores (Principal)</option>
                <option value="Sub-23">Sub-23</option>
                <option value="Sub-22">Sub-22</option>
                <option value="Sub-21">Sub-21</option>
                <option value="Sub-20">Sub-20</option>
                <option value="Sub-19">Sub-19</option>
                <option value="Sub-18">Sub-18</option>
                <option value="Sub-17">Sub-17</option>
                <option value="Sub-16">Sub-16</option>
                <option value="Sub-15">Sub-15</option>
              </select>
            </div>
            
            <div className="ce-group">
              <label>Género</label>
              <select className="ce-select" name="genero" value={form.genero} onChange={handleChange} required>
                <option value="Masculino">Masculino</option>
                <option value="Feminino">Feminino</option>
              </select>
            </div>
          </div>

          <div className="ce-group">
            <label>Época Desportiva</label>
            <select className="ce-select" name="epoca_desportiva" value={form.epoca_desportiva} onChange={handleChange} required>
              <option value={epocaSugerida}>Época Atual Corrente ({epocaSugerida})</option>
              <option value={proximaEpocaSugerida}>Planeamento Futuro ({proximaEpocaSugerida})</option>
            </select>
          </div>

          <button type="submit" className="ce-submit-btn" disabled={loading}>
            {loading ? 'A preparar balneário...' : 'Registar Equipa Oficial'}
          </button>
        </form>
      </div>

      <button onClick={() => navigate('/dashboard')} className="ce-back-btn" style={{ marginTop: '2.5rem', display: 'inline-block', width: 'auto' }}>
        ← Cancelar e Voltar à Dashboard
      </button>
    </div>
  );
}