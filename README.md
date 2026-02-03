# 🛡️ MoniMax - Sistema de Monitoramento e Segurança Eletrônica

<div align="center">
  <img src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" alt="MoniMax Banner" width="100%" />
  
  [![React](https://img.shields.io/badge/React-19.2.4-61dafb?logo=react)](https://reactjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.8.2-3178c6?logo=typescript)](https://www.typescriptlang.org/)
  [![Supabase](https://img.shields.io/badge/Supabase-Latest-3ecf8e?logo=supabase)](https://supabase.com/)
  [![Vite](https://img.shields.io/badge/Vite-6.2.0-646cff?logo=vite)](https://vitejs.dev/)
  [![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
</div>

---

## 📋 Sobre o Projeto

**MoniMax** é uma plataforma completa de gerenciamento de segurança eletrônica desenvolvida com tecnologias modernas. O sistema oferece monitoramento em tempo real de dispositivos de segurança (câmeras, NVRs, DVRs), reconhecimento de placas veiculares (LPR), gestão de clientes e muito mais.

### ✨ Principais Funcionalidades

- 🎥 **Gerenciamento de Dispositivos**: Cadastro e monitoramento de câmeras, NVRs e DVRs
- 👥 **Gestão de Clientes**: Controle completo de clientes e projetos
- 🚗 **LPR (Reconhecimento de Placas)**: Sistema de detecção e alerta de placas suspeitas
- 📊 **Dashboard Inteligente**: Estatísticas e insights em tempo real com IA
- 🔔 **Sistema de Alertas**: Notificações configuráveis por severidade
- 💾 **Armazenamento Flexível**: Suporte a Cloud (S3, Azure, Google Cloud) e Local
- 👤 **Controle de Acesso**: 4 níveis de permissão (Admin, Operador, Tático, Cliente)
- 🔄 **Sincronização em Tempo Real**: Atualizações instantâneas via Supabase Realtime
- 🤖 **IA Integrada**: Análise de segurança com Google Gemini AI
- 📱 **Interface Responsiva**: Design moderno e adaptável

---

## 🚀 Tecnologias Utilizadas

### Frontend
- **React 19.2.4** - Biblioteca JavaScript para interfaces
- **TypeScript 5.8.2** - Superset tipado do JavaScript
- **Vite 6.2.0** - Build tool ultrarrápido
- **React Router DOM 7.13.0** - Roteamento de páginas
- **Recharts 3.7.0** - Biblioteca de gráficos

### Backend & Database
- **Supabase** - Backend as a Service (PostgreSQL + Realtime + Auth)
- **Supabase Auth** - Sistema de autenticação
- **Supabase Realtime** - Sincronização em tempo real

### IA & Serviços
- **Google Gemini AI** - Análise inteligente de dados de segurança

---

## 📦 Instalação

### Pré-requisitos

- **Node.js** (versão 18 ou superior)
- **npm** ou **yarn**
- Conta no **Supabase** (gratuita)
- **Chave API do Google Gemini** (opcional, para insights de IA)

### Passo a Passo

1. **Clone o repositório**
   ```bash
   git clone https://github.com/seu-usuario/monimax-sistema.git
   cd monimax-sistema
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**
   
   Crie um arquivo `.env.local` na raiz do projeto:
   ```env
   # Supabase
   VITE_SUPABASE_URL=sua_url_do_supabase
   VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
   
   # Google Gemini AI (opcional)
   GEMINI_API_KEY=sua_chave_api_do_gemini
   ```

4. **Execute o projeto**
   ```bash
   npm run dev
   ```

5. **Acesse no navegador**
   ```
   http://localhost:5173
   ```

---

## 🗄️ Configuração do Banco de Dados

O MoniMax utiliza o Supabase como backend. Você precisará criar as seguintes tabelas:

### Tabelas Principais

- `devices` - Dispositivos de segurança
- `clients` - Clientes/Projetos
- `cameras` - Câmeras individuais
- `security_events` - Eventos de segurança
- `suspicious_plates` - Placas suspeitas (LPR)
- `storage_configs` - Configurações de armazenamento
- `profiles` - Perfis de usuário
- `module_permissions` - Permissões por módulo
- `alert_rules` - Regras de alerta
- `kanban_columns` - Colunas do Kanban
- `kanban_cards` - Cards do Kanban
- `chat_messages` - Mensagens do chat
- `system_settings` - Configurações do sistema

> **Nota**: Scripts SQL para criação das tabelas serão disponibilizados em breve.

---

## 🎯 Como Usar

### Login Inicial

1. Acesse a página de login
2. Use as credenciais padrão (admin):
   - **Email**: `admin@monimax.com`
   - **Senha**: (configure no Supabase)

### Cadastrando Dispositivos

1. Acesse **Dispositivos** no menu lateral
2. Clique em **+ Novo Dispositivo**
3. Preencha as informações:
   - Nome, Tipo (Câmera/NVR/DVR)
   - IP, Porta, Protocolo
   - Credenciais de acesso
   - Associe a um cliente (opcional)
4. Configure gravação e armazenamento
5. Salve o dispositivo

### Varredura de Rede

1. Na página de Dispositivos, clique em **Varredura de Rede**
2. O sistema buscará dispositivos na rede local
3. Selecione os dispositivos encontrados para adicionar

### Monitoramento

1. Acesse **Monitor** no menu
2. Visualize todas as câmeras em tempo real
3. Filtre por cliente se necessário
4. Clique em uma câmera para ver detalhes

---

## 📁 Estrutura do Projeto

```
monimax-sistema/
├── pages/                    # Páginas da aplicação
│   ├── Dashboard.tsx         # Painel principal
│   ├── Devices.tsx           # Gerenciamento de dispositivos
│   ├── Monitor.tsx           # Monitoramento ao vivo
│   ├── Clients.tsx           # Gestão de clientes
│   ├── Users.tsx             # Gerenciamento de usuários
│   ├── Alerts.tsx            # Sistema de alertas
│   ├── Events.tsx            # Eventos de segurança
│   ├── Storage.tsx           # Configuração de armazenamento
│   ├── SuspiciousPlates.tsx  # Placas suspeitas
│   ├── Settings.tsx          # Configurações
│   ├── Profile.tsx           # Perfil do usuário
│   ├── Network.tsx           # Configurações de rede
│   └── Login.tsx             # Autenticação
├── components/               # Componentes reutilizáveis
│   ├── Layout.tsx            # Layout principal
│   ├── CameraCard.tsx        # Card de câmera
│   ├── ChartSection.tsx      # Seção de gráficos
│   └── EventItem.tsx         # Item de evento
├── DataSynchronizer.tsx      # Sincronização em tempo real
├── supabaseMapper.ts         # Mapeamento de dados
├── supabaseClient.ts         # Cliente Supabase
├── types.ts                  # Definições TypeScript
├── geminiService.ts          # Integração com IA
├── constants.tsx             # Constantes da aplicação
├── App.tsx                   # Configuração de rotas
└── index.tsx                 # Ponto de entrada
```

---

## 🔐 Segurança

- ✅ Autenticação via Supabase Auth
- ✅ Controle de acesso baseado em roles (RBAC)
- ✅ Row Level Security (RLS) no banco de dados
- ✅ Tokens JWT para sessões
- ✅ Variáveis de ambiente para credenciais sensíveis

> ⚠️ **IMPORTANTE**: Nunca commite o arquivo `.env.local` no Git!

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

---

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 👨‍💻 Autor

Desenvolvido com ❤️ para profissionais de segurança eletrônica.

---

## 📞 Suporte

Para suporte, entre em contato através de:
- 📧 Email: suporte@monimax.com
- 💬 Issues: [GitHub Issues](https://github.com/seu-usuario/monimax-sistema/issues)

---

## 🗺️ Roadmap

- [ ] Implementação de WebRTC para streaming ao vivo
- [ ] Aplicativo mobile (React Native)
- [ ] Notificações push
- [ ] Integração com mais fabricantes de câmeras
- [ ] Dashboard de analytics avançado
- [ ] Exportação de relatórios em PDF
- [ ] Modo offline (PWA)
- [ ] API REST pública

---

<div align="center">
  <p>⭐ Se este projeto foi útil, considere dar uma estrela!</p>
  <p>Feito com React, TypeScript e Supabase</p>
</div>
