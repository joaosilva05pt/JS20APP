import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

export default function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState({ type: '', text: '' });
  
  const [formData, setFormData] = useState({
    nome: '',
    apelido: '',
    email: '',
    genero: 'Masculino',
    telemovel: '',
    pais: '',
    localidade: '',
    profissao_base: '',
    foto_perfil_url: '' // Guardará o link completo vindo do Laravel para renderizar
  });

  // Estado para capturar o novo ficheiro de imagem se o utilizador fizer upload
  const [novaFoto, setNovaFoto] = useState(null);

  // 1. Carregar os dados completos do utilizador
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/user', {
          headers: { 'Accept': 'application/json' },
          credentials: 'include'
        });
        
        if (response.ok) {
          const userData = await response.json();
          setFormData({
            nome: userData.nome || '',
            apelido: userData.apelido || '',
            email: userData.email || '',
            genero: userData.genero || 'Masculino',
            telemovel: userData.telemovel || '',
            pais: userData.pais || '',
            localidade: userData.localidade || '',
            profissao_base: userData.profissao_base || '',
            // Se houver foto no servidor, monta o URL público, senão fica vazio
            foto_perfil_url: userData.foto_perfil ? `http://localhost:8000/storage/${userData.foto_perfil}` : ''
          });
        } else {
          navigate('/login');
        }
      } catch (err) {
        console.error('Erro ao carregar perfil:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setNovaFoto(e.target.files[0]);
  };

  // 2. Enviar a atualização com suporte a FormData (por causa da Imagem)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionMessage({ type: '', text: '' });

    try {
      const dataPayload = new FormData();
      
      // Anexa os campos editáveis
      dataPayload.append('nome', formData.nome);
      dataPayload.append('apelido', formData.apelido);
      dataPayload.append('email', formData.email);
      dataPayload.append('genero', formData.genero);
      dataPayload.append('telemovel', formData.telemovel);
      dataPayload.append('pais', formData.pais);
      dataPayload.append('localidade', formData.localidade);

      // Se o utilizador escolheu uma nova foto, anexa-a ao payload
      if (novaFoto) {
        dataPayload.append('foto_perfil', novaFoto);
      }

      dataPayload.append('_method', 'PUT');

      const response = await fetch('http://localhost:8000/api/perfil', {
        method: 'POST', // Mudado para POST + _method PUT por segurança de uploads
        headers: {
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: dataPayload
      });

      const data = await response.json();

      if (response.ok) {
        setActionMessage({ type: 'success', text: data.message });
        // Atualiza o URL da imagem no ecrã com a nova foto devolvida pelo servidor
        if (data.user && data.user.foto_perfil) {
          setFormData(prev => ({
            ...prev,
            foto_perfil_url: `http://localhost:8000/storage/${data.user.foto_perfil}`
          }));
        }
      } else {
        setActionMessage({ type: 'error', text: data.message || 'Erro ao atualizar dados.' });
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: 'Erro de conexão com o servidor.' });
    }
  };

  if (loading) return <div className="pf-loading-screen">A carregar o teu cacifo...</div>;

  return (
    <div className="pf-open-layout-container">
      
      <div className="pf-open-header">
        <h2>Definições de Conta <span className="pf-header-divider">|</span> <span className="pf-header-highlight">Editar</span></h2>
        <p>Atualiza as tuas credenciais e informações pessoais de utilizador.</p>
      </div>

      <div className="pf-open-workspace">
        
        <div className="pf-meta-identity-row">
          {/*Se tiver foto_perfil_url renderiza a imagem real, senão mostra as iniciais */}
          {formData.foto_perfil_url ? (
            <img src={formData.foto_perfil_url} alt="Perfil" className="pf-avatar-large" style={{ objectFit: 'cover' }} />
          ) : (
            <div className="pf-avatar-large">
              {formData.nome.charAt(0).toUpperCase()}{formData.apelido.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="pf-identity-text">
            <h3>{formData.nome} {formData.apelido}</h3>
            <span className="pf-role-badge">{formData.profissao_base}</span>
          </div>
        </div>

        {actionMessage.text && (
          <div className={`pf-global-alert ${actionMessage.type}`}>{actionMessage.text}</div>
        )}

        <form onSubmit={handleSubmit} className="pf-form" encType="multipart/form-data">
          
          <div className="pf-row">
            <div className="pf-group">
              <label>Primeiro Nome</label>
              <input type="text" name="nome" value={formData.nome} onChange={handleChange} required />
            </div>
            <div className="pf-group">
              <label>Apelido</label>
              <input type="text" name="apelido" value={formData.apelido} onChange={handleChange} required />
            </div>
          </div>

          <div className="pf-row">
            <div className="pf-group">
              <label>Email (Identificador de Login)</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required />
            </div>
            {/* : Género do Utilizador */}
            <div className="pf-group">
              <label>Género</label>
              <select name="genero" value={formData.genero} onChange={handleChange} required className="pf-select-style">
                <option value="Masculino">Masculino</option>
                <option value="Feminino">Feminino</option>
              </select>
            </div>
          </div>

          <div className="pf-row">
            {/* País */}
            <div className="pf-group">
              <label>País</label>
              <input type="text" name="pais" value={formData.pais} onChange={handleChange} placeholder="Ex: Portugal" />
            </div>
            {/*  Localidade */}
            <div className="pf-group">
              <label>Localidade</label>
              <input type="text" name="localidade" value={formData.localidade} onChange={handleChange} placeholder="Ex: Portimão" />
            </div>
          </div>

          <div className="pf-row">
            {/*  Telemóvel */}
            <div className="pf-group">
              <label>Telemóvel</label>
              <input type="tel" name="telemovel" value={formData.telemovel} onChange={handleChange} placeholder="910 000 000" />
            </div>
            {/*  Atualizar Foto de Perfil */}
            <div className="pf-group">
              <label>Atualizar Cromo / Foto</label>
              <input type="file" accept="image/*" onChange={handleFileChange} className="pf-file-input" />
            </div>
          </div>

          <div className="pf-group">
            <label>Profissão Base</label>
            <input type="text" value={formData.profissao_base} disabled className="pf-input-disabled" />
            <small className="pf-help-text">A tua profissão base dita as tuas permissões de acesso estruturais no sistema.</small>
          </div>

          <div className="pf-actions-row">
            <button type="submit" className="pf-submit-btn">Guardar Alterações do Perfil</button>
          </div>
        </form>
      </div>

      <button onClick={() => navigate('/dashboard')} className="pf-back-btn">
        ← Abortar e Voltar à Dashboard
      </button>
    </div>
  );
}