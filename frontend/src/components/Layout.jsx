import React from 'react';
import Sidebar from './Sidebar';

export default function Layout({ children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%', backgroundColor: '#0f1523' }}>
      <Sidebar />
      {/* Atualizado de 250px para 260px  */}
      <main style={{ flex: 1, marginLeft: '260px', padding: '2rem', boxSizing: 'border-box' }}>
        {children}
      </main>
    </div>
  );
}