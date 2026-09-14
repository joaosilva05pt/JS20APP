import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css';

export default function Login() {
  // Estado do formulário
  const [form, setForm] = useState({ email: '', password: '', remember: false });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  // 🚀 NOVO: Verifica se o utilizador já tem o Super Cookie e atira-o para o Dashboard
  useEffect(() => {
    const checkLoggedUser = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/user', {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          credentials: 'include' // Essencial para enviar o cookie silenciosamente
        });
        
        if (response.ok) {
          // Se o Laravel disser "Sim, conheço este cookie", teleporta!
          navigate('/dashboard'); 
        }
      } catch (err) {
        // Se der erro (não tem sessão), não faz nada e deixa o formulário visível
      }
    };

    checkLoggedUser();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ 
      ...form, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Inicializa o cookie CSRF do Sanctum
      await fetch('http://localhost:8000/sanctum/csrf-cookie', { credentials: 'include' });

      // 2. Faz o Login real
      const response = await fetch('http://localhost:8000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form)
      });

      const data = await response.json();

      if (response.ok) {
        navigate('/dashboard');
      } else {
        setError(data.message || 'Credenciais inválidas. Tenta novamente.');
      }
    } catch (err) {
      setError('Erro de conexão ao servidor.');
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
    <div className="login-container">
      <nav className="login-nav">
        <Link to="/" className="nav-logo" style={{ textDecoration: 'none', color: 'white' }}>
          <span className="text-red">JS20</span> APP
        </Link>
      </nav>

      <div className="login-card-wrapper">
        <div className="login-card">
          <div className="login-header">
            <h2>Bem-vindo de volta</h2>
            <p>Insere os teus dados para entrar no balneário.</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {error && <div className="login-alert error">{error}</div>}

            <div className="form-group">
              <label>Email</label>
              <input 
                name="email" 
                type="email" 
                placeholder="nome@email.com" 
                onChange={handleChange} 
                value={form.email} 
                required 
              />
            </div>

            <div className="form-group">
              <div className="label-row">
                <label>Password</label>
                <Link to="/recuperar" className="forgot-password">Esqueceste a password?</Link>
              </div>
              <div className="password-wrapper">
                <input 
                  name="password" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                  onChange={handleChange} 
                  value={form.password} 
                  required 
                />
                <button type="button" className="eye-btn" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {/* OPÇÃO: GUARDAR SESSÃO */}
            <div className="remember-me-group">
              <label className="remember-me-label">
                <input 
                  type="checkbox" 
                  name="remember" 
                  checked={form.remember} 
                  onChange={handleChange} 
                />
                Manter sessão iniciada
              </label>
            </div>

            <button type="submit" className="login-submit-btn" disabled={loading}>
              {loading ? "A entrar..." : "Entrar na App"}
            </button>

            <div className="login-footer">
              Ainda não tens clube? <Link to="/register">Cria uma conta grátis</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}