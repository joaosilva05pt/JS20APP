export default function Navbar() {
  return (
    <nav style={{ padding: '15px 20px', backgroundColor: '#1D3557', color: 'white', display: 'flex', justifyContent: 'space-between' }}>
      <h2 style={{ margin: 0, color: '#E63946' }}>JS20 APP</h2>
      <div>
        {/* Futuramente novos links */}
        <span style={{ cursor: 'pointer' }}>Entrar</span>
      </div>
    </nav>
  );
}