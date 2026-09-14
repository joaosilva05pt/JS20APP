import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Register.css";

export default function Register() {
  const [form, setForm] = useState({
    nome: "", 
    apelido: "", 
    email: "", 
    password: "", 
    password_confirmation: "",
    genero: "Masculino", 
    telemovel: "",       
    profissao_base: "Jogador", 
    data_nascimento: "", 
    pais: "", 
    localidade: ""
  });

  // Para segurar o ficheiro real da foto de perfil
  const [fotoPerfil, setFotoPerfil] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  //FUNÇÃO: Captura o ficheiro quando o utilizador escolhe a imagem
  const handleFileChange = (e) => {
    setFotoPerfil(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (form.password !== form.password_confirmation) {
      setError("As passwords não coincidem.");
      setLoading(false);
      return;
    }

    try {
      //FORM_DATA: Necessário para enviar ficheiros binários (imagens)
      const dataPayload = new FormData();
      
      // 1. Anexar todos os campos de texto comuns
      Object.keys(form).forEach((key) => {
        dataPayload.append(key, form[key]);
      });

      // 2. Anexar a foto de perfil apenas se o utilizador tiver escolhido uma
      if (fotoPerfil) {
        dataPayload.append("foto_perfil", fotoPerfil);
      }

      const response = await fetch("http://127.0.0.1:8000/api/register", {
        method: "POST",
       
        // O navegador define automaticamente como multipart/form-data por causa do FormData.
        credentials: "include",
        body: dataPayload
      });

      const data = await response.json();

      if (response.ok) {
        navigate("/dashboard");
      } else {
        setError(data.message || "Erro ao criar conta. Verifica os dados.");
      }
    } catch (err) {
      setError("Erro de conexão. Verifique se o servidor está ativo.");
    } finally {
      setLoading(false);
    }
  };

  const EyeIcon = () => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="input-icon"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
  );

  const EyeSlashIcon = () => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="input-icon"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
  );

  return (
    <div className="register-container">
      <nav className="register-nav">
        <Link to="/" className="nav-logo" style={{ textDecoration: 'none', color: 'white' }}>
          <span className="text-red">JS20</span> APP
        </Link>
      </nav>

      <div className="register-card-wrapper">
        <div className="register-card">
          <div className="register-header">
            <h2>Criar Conta</h2>
            <p>Preenche os teus dados para entrar no jogo.</p>
          </div>

          <form onSubmit={handleSubmit} className="register-form" encType="multipart/form-data">
            {error && <div className="register-alert error">{error}</div>}

            <div className="form-row">
              <div className="form-group">
                <label>Nome</label>
                <input name="nome" placeholder="João" onChange={handleChange} value={form.nome} required />
              </div>
              <div className="form-group">
                <label>Apelido</label>
                <input name="apelido" placeholder="Silva" onChange={handleChange} value={form.apelido} required />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Email</label>
                <input name="email" type="email" placeholder="nome@email.com" onChange={handleChange} value={form.email} required />
              </div>
              <div className="form-group">
                <label>Género *</label>
                <select name="genero" onChange={handleChange} value={form.genero} required>
                  <option value="Masculino">Masculino</option>
                  <option value="Feminino">Feminino</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Password</label>
                <div className="password-wrapper">
                  <input 
                    name="password" 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Mínimo 6 caracteres" 
                    onChange={handleChange} 
                    value={form.password} 
                    required 
                  />
                  <button type="button" className="eye-btn" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label>Confirmar Password</label>
                <div className="password-wrapper">
                  <input 
                    name="password_confirmation" 
                    type={showConfirmPassword ? "text" : "password"} 
                    placeholder="Repete a password" 
                    onChange={handleChange} 
                    value={form.password_confirmation} 
                    required 
                  />
                  <button type="button" className="eye-btn" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? <EyeSlashIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>País (Opcional)</label>
                <input name="pais" placeholder="Portugal" onChange={handleChange} value={form.pais} />
              </div>
              <div className="form-group">
                <label>Localidade (Opcional)</label>
                <input name="localidade" placeholder="Portimão" onChange={handleChange} value={form.localidade} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Telemóvel (Opcional)</label>
                <input name="telemovel" type="tel" placeholder="910 000 000" onChange={handleChange} value={form.telemovel} />
              </div>
              <div className="form-group">
                <label>Data de Nascimento</label>
                <input type="date" name="data_nascimento" onChange={handleChange} value={form.data_nascimento} />
              </div>
            </div>

            {/* BLOCO TWIN: Perfil e Escolha da Foto de Perfil lado a lado */}
            <div className="form-row">
              <div className="form-group">
                <label>Perfil Base</label>
                <select name="profissao_base" onChange={handleChange} value={form.profissao_base}>
                  <option value="Jogador">Jogador</option>
                  <option value="Treinador">Treinador</option>
                  <option value="Dirigente">Dirigente</option>
                  <option value="Staff">Staff</option>
                </select>
              </div>
              <div className="form-group">
                <label>Foto de Perfil</label>
                <input 
                  type="file" 
                  name="foto_perfil" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                  className="file-input-style"
                />
              </div>
            </div>

            <button type="submit" className="register-submit-btn" disabled={loading}>
              {loading ? "A processar inscrição..." : "Registar e Entrar em Campo"}
            </button>

            <div className="register-footer">
              Já tens uma conta? <Link to="/login">Inicia sessão aqui</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}