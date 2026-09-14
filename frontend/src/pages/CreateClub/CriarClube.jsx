import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CriarClube.css';

export default function CriarClube() {
  const navigate = useNavigate();
  
  const [form, setForm] = useState({
    nome: '',
    sigla: '',             
    email_clube: '',       
    contacto_oficial: '',  
    localidade: '',
    data_fundacao: ''
  });

  //  Para segurar o ficheiro de imagem do emblema
  const [emblema, setEmblema] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificandoAcesso, setVerificandoAcesso] = useState(true);

  // ==========================================
  // BLOQUEIO DE ACESSO (O Guarda-Costas)
  // ==========================================
  useEffect(() => {
    const verificarAcesso = async () => {
      try {
        const userRes = await fetch('http://localhost:8000/api/user', {
          headers: { 'Accept': 'application/json' },
          credentials: 'include'
        });
        
        if (!userRes.ok) {
          navigate('/login');
          return;
        }
        
        const userData = await userRes.json();
        
        if (userData.profissao_base !== 'Dirigente') {
          navigate('/dashboard');
          return;
        }

        const clubRes = await fetch('http://localhost:8000/api/meu-clube', {
          headers: { 'Accept': 'application/json' },
          credentials: 'include'
        });

        if (clubRes.ok) {
          navigate('/dashboard');
          return;
        }

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

  //  Captura o ficheiro do emblema
  const handleFileChange = (e) => {
    setEmblema(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Essencial para conseguir enviar ficheiros binários
      const dataPayload = new FormData();
      
      // Anexa os campos de texto comuns do clube
      Object.keys(form).forEach((key) => {
        dataPayload.append(key, form[key]);
      });

      // Anexa a imagem do emblema apenas se o utilizador escolheu uma
      if (emblema) {
        dataPayload.append('emblema', emblema);
      }

      const response = await fetch('http://localhost:8000/api/clubs', {
        method: 'POST',
        // O navegador trata de definir o multipart/form-data automaticamente
        credentials: 'include',
        body: dataPayload
      });

      const data = await response.json();

      if (response.ok) {
        navigate('/dashboard');
      } else if (response.status === 422) {
        const primeiraMensagemDeErro = data.errors ? Object.values(data.errors)[0][0] : data.message;
        setError(primeiraMensagemDeErro);
      } else {
        setError(data.message || 'Erro ao fundar o clube. Verifica os dados.');
      }
    } catch (err) {
      setError('Erro de conexão ao servidor.');
    } finally {
      setLoading(false);
    }
  };

  if (verificandoAcesso) return null;

  return (
    <div className="cc-open-layout-container">
      
      <div className="cc-open-header">
        <h2>Fundação de Clube <span className="cc-header-divider">|</span> <span className="cc-header-highlight">Nova Instituição</span></h2>
        <p>O primeiro passo para a glória. Preenche os dados oficiais da tua instituição desportiva.</p>
      </div>

      <div className="cc-open-workspace">
        <h3 className="cc-open-section-title">Dados Oficiais de Fundação</h3>
        
        <form onSubmit={handleSubmit} className="cc-form" encType="multipart/form-data">
          {error && <div className="cc-alert-error">{error}</div>}

          {/*  Nome do Clube e Sigla lado a lado */}
          <div className="cc-row">
            <div className="cc-group" style={{ flex: 3 }}>
              <label>Nome do Clube *</label>
              <input 
                name="nome" 
                type="text" 
                placeholder="Ex: Futebol Clube de Portimão..." 
                value={form.nome} 
                onChange={handleChange} 
                required 
              />
            </div>
            <div className="cc-group" style={{ flex: 1 }}>
              <label>Sigla *</label>
              <input 
                name="sigla" 
                type="text" 
                placeholder="Ex: FCP" 
                value={form.sigla} 
                onChange={handleChange} 
                maxLength={10}
                required 
              />
            </div>
          </div>

          {/* : Email e Contacto Oficial da secretaria */}
          <div className="cc-row">
            <div className="cc-group">
              <label>Email do Clube (Opcional)</label>
              <input 
                name="email_clube" 
                type="email" 
                placeholder="secretaria@clube.com" 
                value={form.email_clube} 
                onChange={handleChange} 
              />
            </div>
            <div className="cc-group">
              <label>Contacto Oficial / Telefone</label>
              <input 
                name="contacto_oficial" 
                type="text" 
                placeholder="Ex: +351 282 000 000" 
                value={form.contacto_oficial} 
                onChange={handleChange} 
              />
            </div>
          </div>

          <div className="cc-row">
            <div className="cc-group">
              <label>País *</label>
              <input 
                name="pais" 
                type="text" 
                placeholder="Ex: Portugal" 
                value={form.pais} 
                onChange={handleChange} 
                required 
              />
            </div>
            
            <div className="cc-group">
              <label>Localidade</label>
              <input 
                name="localidade" 
                type="text" 
                placeholder="Ex: Portimão" 
                value={form.localidade} 
                onChange={handleChange} 
              />
            </div>
          </div>

          {/*  Data de Fundação e Upload do Emblema */}
          <div className="cc-row">
            <div className="cc-group">
              <label>Data de Fundação</label>
              <input 
                name="data_fundacao" 
                type="date" 
                value={form.data_fundacao} 
                onChange={handleChange} 
              />
            </div>
            <div className="cc-group">
              <label>Emblema Oficial / Logo</label>
              <input 
                type="file"
                name="emblema"
                accept="image/*"
                onChange={handleFileChange}
                className="pf-file-input" // Reutiliza a classe limpa de ficheiros do no perfil
              />
            </div>
          </div>

          <button type="submit" className="cc-submit-btn" disabled={loading}>
            {loading ? 'A processar fundação oficial...' : 'Registar e Fundar Clube'}
          </button>
        </form>
      </div>

      <button onClick={() => navigate('/dashboard')} className="cc-back-btn" style={{ marginTop: '2.5rem' }}>
        &larr; Abortar e Voltar à Dashboard
      </button>
    </div>
  );
}