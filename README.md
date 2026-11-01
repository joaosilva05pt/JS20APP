# ⚽ JS20APP --- Integrated Sports Management & Intelligence Platform

![PHP](https://img.shields.io/badge/PHP-8.3-777BB4?style=for-the-badge&logo=php&logoColor=white)
![Laravel](https://img.shields.io/badge/Laravel-11.x-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791?style=for-the-badge&logo=postgresql&logoColor=white)
![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![License](https://img.shields.io/badge/Academic-PAP%20%2F%20TFC-brightgreen?style=for-the-badge)

**JS20APP** is a decoupled full-stack solution designed to modernize and
centralize the management of football clubs, locker rooms, and youth
academy teams. The platform brings together multidimensional athlete
evaluations, interactive frame-by-frame tactical planning, and sports
engagement through a comprehensive gamification engine.

------------------------------------------------------------------------

## 📌 Key Features & Modules

### 1. Tactical Intelligence & Analytics Radar

-   **Performance Evaluation (0--20 Scale):** Individual and team
    assessments based on 6 key technical and cognitive attributes:
    Shooting, Passing, Pace, Technique, Defending, and Mental.
-   **Lineup Selection Support Algorithm:** A mathematical distinction
    between cumulative season consistency (**Season**) and immediate
    physical and competitive readiness (**Score**).
-   **Interactive Tactical Radar:** Dynamic polar charts (*Recharts*)
    comparing an athlete's technical profile with positional or team
    averages.
-   **Match-Day Dossier:** Direct export of match sheets and
    consolidated technical reports to PDF (*jsPDF* and *html2canvas*).

### 2. Digital Tactical Board (Keyframe Engine)

-   **Frame-by-Frame Simulation:** Build and animate training exercises,
    game situations, and set pieces.
-   **Responsive Drag & Drop:** Player and ball positioning based on
    relative percentage coordinates `(x%, y%)`, ensuring visual accuracy
    at any screen resolution.
-   **Locker Room Collaboration:** An interactive space where players
    can view prepared tactics and suggest strategic variations to the
    manager.

### 3. Locker Room Gamification & Store

-   **Level System (1 to 10):** Dynamic experience (XP) progression
    driven by attendance, commitment, and training performance.
-   **Mission Catalog:** Individual goals, sector-specific challenges
    (Defense, Midfield, Attack), and collective locker room objectives.
-   **Virtual Store:** Convert accumulated points into rewards, club
    items, and profile customizations.

### 4. Comprehensive Club Management & Player Care

-   **Schedule & Squad Management:** Training and match scheduling with
    detailed attendance tracking and absence justifications.
-   **Medical Department & Nutrition:** Medical records, injury
    registration and monitoring, recovery plans, and nutritional
    guidance.
-   **Data Preservation (*Soft Deletes*):** Securely maintains sports
    history without compromising relational integrity.

------------------------------------------------------------------------

## 🏛️ System Architecture

The application uses a decoupled architecture in which the Frontend
(SPA) communicates with the Backend's secure REST API:

``` text
JS20APP/
├── backend/                  # Laravel REST API (PHP 8.3)
│   ├── app/
│   │   ├── Console/          # Custom Artisan commands
│   │   ├── Http/Controllers/ # API endpoints and business logic
│   │   └── Models/           # Relational Eloquent ORM models
│   ├── database/
│   │   ├── migrations/       # PostgreSQL database schema
│   │   └── seeders/          # Default data (missions, levels, store)
│   └── routes/api.php        # API routes and authentication
│
├── frontend/                 # React SPA (Vite)
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Views (Dashboard, Locker Room, Tactical Board, etc.)
│   │   └── services/         # HTTP communication layer
│   └── package.json          # Frontend dependencies
│
└── .gitignore                # Excludes dependencies and credentials
```

## 🛠️ Tech Stack

### Backend

-   **Language:** PHP 8.3
-   **Framework:** Laravel 11.x
-   **Database:** PostgreSQL (pgsql), managed through Eloquent ORM
-   **Authentication:** Laravel Sanctum (session cookies/tokens with
    CORS credentials enabled)
-   **Security:** Bcrypt password hashing (`Hash::make`) and granular
    access authorization

### Frontend

-   **Library:** React 18 (Vite)
-   **Routing:** React Router DOM (Dual-Sidebar architecture: Club
    vs. Locker Room)
-   **Data Visualization:** Recharts
-   **Document Export:** jsPDF & html2canvas
-   **Styling:** Modular CSS3 and native SVG assets

------------------------------------------------------------------------

## ⚙️ Local Setup & Installation

### Prerequisites

-   PHP \>= 8.2 with `pdo_pgsql` and `openssl` extensions enabled
-   Composer
-   Node.js \>= 18.x and npm
-   A running PostgreSQL server

### 1. Configure the Backend

Navigate to the backend directory:

``` bash
cd backend
```

Install PHP dependencies:

``` bash
composer install
```

Create the environment configuration file:

``` bash
cp .env.example .env
php artisan key:generate
```

Configure your PostgreSQL credentials in the `.env` file:

``` dotenv
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=js20app
DB_USERNAME=postgres
DB_PASSWORD=your_password_here
```

Run the database migrations and seed the initial data:

``` bash
php artisan migrate --seed
```

Start the local API development server:

``` bash
php -S 127.0.0.1:8000 -t public
```

### 2. Configure the Frontend

In a separate terminal, navigate to the frontend directory:

``` bash
cd frontend
```

Install the dependencies:

``` bash
npm install
```

Start the Vite development server:

``` bash
npm run dev
```

Open the local URL displayed in the terminal (usually
`http://localhost:5173`).

------------------------------------------------------------------------

## 🧹 Database Maintenance

Clear table records while preserving the database structure:

``` bash
php artisan db:wipe-data
```

Perform a full reset by recreating the tables and running the seeders:

``` bash
php artisan migrate:fresh --seed
```

------------------------------------------------------------------------

## 👤 Author

**João Silva** --- [@joaosilva05pt](https://github.com/joaosilva05pt)

Project developed as part of a Final Course Project (TFC).




# ⚽ JS20APP — Plataforma Integrada de Gestão & Inteligência Desportiva

![PHP](https://img.shields.io/badge/PHP-8.3-777BB4?style=for-the-badge&logo=php&logoColor=white)
![Laravel](https://img.shields.io/badge/Laravel-11.x-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791?style=for-the-badge&logo=postgresql&logoColor=white)
![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![License](https://img.shields.io/badge/Academic-PAP%20%2F%20TFC-brightgreen?style=for-the-badge)

O **JS20APP** é uma solução Full-Stack desacoplada concebida para modernizar e centralizar a gestão de clubes de futebol, balneários e escalões de formação. A plataforma unifica a avaliação multidimensional de atletas, o planeamento tático interativo quadro a quadro e a fidelização desportiva através de um motor de gamificação completo.

---

## 📌 Principais Módulos & Funcionalidades

### 1. Inteligência Tática & Radar Analítico
* **Métricas de Avaliação (Escala 0–20):** Avaliação individual e coletiva assente em 6 valências técnicas e cognitivas fundamentais: Remate, Passe, Velocidade, Técnica, Defesa e Mental.
* **Algoritmo de Apoio à Titularidade:** Distinção matemática entre a regularidade cumulativa ao longo da temporada (**Época**) e o estado de prontidão física e competitiva imediata (**Score**).
* **Radar Tático Interativo:** Gráficos polares dinâmicos (*Recharts*) que comparam o perfil técnico do atleta com a média setorial ou da equipa.
* **Dossiê Match-Day:** Exportação direta de fichas de jogo e relatórios técnicos consolidados em formato PDF (*jsPDF* e *html2canvas*).

### 2. Prancheta Tática Digital (Keyframe Engine)
* **Simulação Quadro a Quadro (*Frame-by-Frame*):** Construção e reprodução animada de exercícios de treino, dinâmicas de jogo e bolas paradas.
* **Mecânica Drag & Drop Responsiva:** Posicionamento de atletas e bola baseado em coordenadas percentuais relativas `(x%, y%)`, assegurando fidelidade visual em qualquer resolução.
* **Colaboração com o Balneário:** Espaço interativo onde os jogadores podem visualizar táticas montadas e propor variações estratégicas ao mister.

### 3. Gamificação de Balneário & Loja
* **Sistema de Níveis (1 a 10):** Progressão dinâmica de experiência (XP) impulsionada pela assiduidade, compromisso e notas obtidas nos treinos.
* **Catálogo de Missões:** Metas individuais, de setor (defesa, meio-campo, ataque) e desafios coletivos de balneário.
* **Loja Virtual:** Conversão de pontos acumulados em recompensas, itens do clube e personalização de perfil.

### 4. Gestão Global de Clube & Saúde
* **Agenda & Convocatórias:** Gestão de treinos e jogos com controlo detalhado de presenças e justificações.
* **Departamento Médico & Nutrição:** Fichas clínicas, registo e acompanhamento de lesões, planos de recuperação e orientações nutricionais.
* **Preservação de Dados (*Soft Deletes*):** Manutenção segura de históricos desportivos sem perda de integridade relacional.

---

## 🏛️ Arquitetura do Sistema

A aplicação assenta numa arquitetura desacoplada onde o Frontend (SPA) comunica com a API REST segura do Backend:

```text
JS20APP/
├── backend/                  # API REST em Laravel (PHP 8.3)
│   ├── app/
│   │   ├── Console/          # Comandos Artisan personalizados
│   │   ├── Http/Controllers/ # Endpoints e lógica de negócio
│   │   └── Models/           # Modelos Eloquent ORM relacionais
│   ├── database/
│   │   ├── migrations/       # Esquema estrutural em PostgreSQL
│   │   └── seeders/          # Dados padrão (missões, níveis, loja)
│   └── routes/api.php        # Rotas da API e autenticação
│
├── frontend/                 # Aplicação SPA em React (Vite)
│   ├── src/
│   │   ├── components/       # Componentes visuais reutilizáveis
│   │   ├── pages/            # Vistas (Dashboard, Balneário, Prancheta, etc.)
│   │   └── services/         # Camada de comunicação HTTP
│   └── package.json          # Dependências do frontend
│
└── .gitignore                # Exclusão de dependências e credenciais

🛠️ Tecnologias Utilizadas
Backend
Linguagem: PHP 8.3

Framework: Laravel 11.x

Base de Dados: PostgreSQL (pgsql) gerido via Eloquent ORM

Autenticação: Laravel Sanctum (Cookies/Tokens de Sessão com credenciais CORS ativas)

Segurança: Encriptação Bcrypt (Hash::make) e autorização granular de acesso

Frontend
Biblioteca: React 18 (Vite)

Navegação: React Router DOM (Arquitetura de Dupla Sidebar: Clube vs Balneário)

Visualização Estatística: Recharts

Exportação Documental: jsPDF & html2canvas

Estilização: CSS3 modularizado e SVGs nativos

⚙️ Instalação e Execução Local
Pré-requisitos
PHP >= 8.2 com extensões pdo_pgsql e openssl ativas

Composer

Node.js >= 18.x e npm

Servidor PostgreSQL ativo

1. Configurar o Backend
Entra na pasta do backend:

Bash
cd backend
Instala as dependências PHP:

Bash
composer install
Cria o ficheiro de variáveis de ambiente:

Bash
cp .env.example .env
php artisan key:generate
Configura as credenciais da tua base de dados PostgreSQL no ficheiro .env:

Fragmento do código
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=js20app
DB_USERNAME=postgres
DB_PASSWORD=a_tua_password
Executa as migrações estruturais e povoa as tabelas base:

Bash
php artisan migrate --seed
Inicia o servidor local da API:

Bash
php -S 127.0.0.1:8000 -t public
2. Configurar o Frontend
Noutro terminal, entra na pasta do frontend:

Bash
cd frontend
Instala as dependências:

Bash
npm install
Arranca o servidor de desenvolvimento:

Bash
npm run dev
Abre o link local gerado pelo Vite no navegador (normalmente http://localhost:5173).

🧹 Manutenção da Base de Dados
Limpar registos mantendo a integridade estrutural:

Bash
php artisan db:wipe-data
Reset total da base de dados com recriação e seed:

Bash
php artisan migrate:fresh --seed
👤 Autor
João Silva — joaosilva05pt

Projeto desenvolvido no âmbito do Trabalho de Fim de Curso.


