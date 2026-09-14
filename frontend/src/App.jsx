import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home/Home';
import Register from './pages/Register/Register';
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import CreateClub from './pages/CreateClub/CriarClube';
import AdminClub from './pages/AdminClub/AdminClub'; 
import Profile from './pages/Profile/Profile';
import CriarEquipa from "./pages/CriarEquipa/CriarEquipa";
import GestaoEquipa from './pages/GestaoEquipa/GestaoEquipa';


import MembrosGestao from './pages/MembrosGestao/MembrosGestao';

import CalendarEvents from './pages/CalendarEvents/CalendarEvents';
import PlayerEvaluations from './pages/PlayerEvaluations/PlayerEvaluations'; 
import ConvocatoriasDashboard from './pages/ConvocatoriasDashboard/ConvocatoriasDashboard'; 
import PranchetaTatica from './pages/PranchetaTatica/PranchetaTatica';
import Comunicacao from './pages/Comunicacao/Comunicacao';
// IMPORTA O NOVO LAYOUT QUE CRIÁMOS
import Layout from './components/Layout';

import DeptoMedico from './pages/DeptoMedico/DeptoMedico';
import Nutricao from './pages/Nutricao/Nutricao';

import Loja from './pages/Loja/Loja';

import DefinicoesEscalao from './pages/DefinicoesEscalao/DefinicoesEscalao';

import RadarTatico from './pages/RadarTatico/RadarTatico';


const TesteLogin = () => (
  <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F5F7', fontFamily: 'Inter' }}>
    <h1 style={{ color: '#1D3557' }}>✅ Login efetuado com sucesso!</h1>
  </div>
);
  
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* PÁGINAS SEM MENU LATERAL GLOBAL (Livres) */}
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/teste-login" element={<TesteLogin />} />

        {/* 
          ROTAS DE IMERSÃO TOTAL DO BALNEÁRIO
          Ficam fora do <Layout> para a SidebarBalneario assumir o controlo total do ecrã
        */}
        <Route path="/equipa-gestao/:id" element={<GestaoEquipa />} />
        <Route path="/equipa/:id/membros" element={<MembrosGestao />} />
        <Route path="/equipa/:id/calendario" element={<CalendarEvents />} />
        <Route path="/equipa/:id/avaliacoes" element={<PlayerEvaluations />} />
        <Route path="/equipa/:id/convocatorias" element={<ConvocatoriasDashboard />} />
        <Route path="/equipa/:id/tatica" element={<PranchetaTatica />} />
        <Route path="/equipa/:id/comunicacao" element={<Comunicacao />} />
        <Route path="/equipa/:id/medico" element={<DeptoMedico />} />
        <Route path="/equipa/:id/nutricao" element={<Nutricao />} />     
        <Route path="/equipa/:id/loja" element={<Loja />} />
        <Route path="/equipa/:id/definicoes" element={<DefinicoesEscalao />} />
        <Route path="/equipa/:id/radar" element={<RadarTatico />} />

        {/* PÁGINAS COM MENU LATERAL DINÂMICO DA APP (Abrem dentro do Layout Geral) */}
        <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
        <Route path="/criar-clube" element={<Layout><CreateClub /></Layout>} />
        <Route path="/admin-club/:id" element={<Layout><AdminClub /></Layout>} />
        <Route path="/perfil" element={<Layout><Profile /></Layout>} />
        <Route path="/criar-equipa" element={<Layout><CriarEquipa /></Layout>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;