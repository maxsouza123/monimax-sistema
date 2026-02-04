
import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { MOCK_EVENTS } from '../constants';
import { AlertSeverity } from '../types';
import { useSync } from '../DataSynchronizer';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  const { userProfile, permissions, systemSettings } = useSync();

  const hasPermission = (moduleName: string) => {
    if (!userProfile) return false;
    const perm = permissions.find(p => p.module === moduleName);
    if (!perm) return false;
    return perm.roles[userProfile.role] === true;
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background-dark">
      {/* Sidebar */}
      <aside
        className={`bg-background-dark border-r border-border-dark flex flex-col shrink-0 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'
          }`}
      >
        <div className="p-4 flex items-center justify-between overflow-hidden">
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 shadow-lg border border-primary/20 overflow-hidden">
              {systemSettings?.logoUrl ? (
                <img src={systemSettings.logoUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-primary">shield</span>
              )}
            </div>
            <div className={`transition-all duration-300 ${isCollapsed ? 'opacity-0 scale-95 w-0' : 'opacity-100 scale-100 w-auto'}`}>
              <h1 className="text-white font-bold leading-none whitespace-nowrap uppercase tracking-tight">
                {systemSettings?.brandName || 'MoniMax'}
              </h1>
              <p className="text-slate-500 text-[9px] mt-1 uppercase font-black tracking-widest whitespace-nowrap">
                {systemSettings?.brandTagline || 'Security AI'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`hidden md:flex size-8 items-center justify-center rounded-lg hover:bg-white/5 text-slate-500 transition-transform duration-500 ${isCollapsed ? 'rotate-180' : ''}`}
          >
            <span className="material-symbols-outlined text-sm">menu_open</span>
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto overflow-x-hidden custom-scrollbar">
          {(!userProfile && permissions.length === 0) ? (
            <div className="flex flex-col gap-2 px-2 animate-pulse">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-10 bg-white/5 rounded-xl w-full"></div>
              ))}
            </div>
          ) : (
            <>
              {hasPermission('Dashboard') && <NavItem to="/" icon="dashboard" label="Dashboard" isCollapsed={isCollapsed} />}
              {hasPermission('Monitoramento') && <NavItem to="/monitor" icon="videocam" label="Monitoramento" isCollapsed={isCollapsed} />}
              {hasPermission('Dispositivos') && <NavItem to="/devices" icon="settings_input_component" label="Dispositivos" isCollapsed={isCollapsed} />}
              {hasPermission('Armazenamento') && <NavItem to="/storage" icon="cloud_sync" label="Armazenamento" isCollapsed={isCollapsed} />}
              {hasPermission('Quadro KanBan de Alertas') && <NavItem to="/alerts" icon="view_kanban" label="Quadro KanBan de Alertas" isCollapsed={isCollapsed} />}
              {hasPermission('Veículos (LPR)') && <NavItem to="/plates" icon="minor_crash" label="Veículos (LPR)" isCollapsed={isCollapsed} />}
              {hasPermission('Clientes') && <NavItem to="/clients" icon="business_center" label="Clientes" isCollapsed={isCollapsed} />}
              {hasPermission('Usuários') && <NavItem to="/users" icon="group" label="Usuários" isCollapsed={isCollapsed} />}
              {hasPermission('Log de Eventos') && <NavItem to="/events" icon="history" label="Log de Eventos" isCollapsed={isCollapsed} />}
              {hasPermission('Ordens de Serviço') && <NavItem to="/service-orders" icon="engineering" label="Ordens de Serviço" isCollapsed={isCollapsed} />}
              {hasPermission('Rede') && <NavItem to="/network" icon="analytics" label="Rede" isCollapsed={isCollapsed} />}
              {hasPermission('Configurações') && <NavItem to="/settings" icon="settings" label="Configurações" isCollapsed={isCollapsed} />}
            </>
          )}
        </nav>

        <div className="p-3 border-t border-border-dark">
          <button
            onClick={() => {
              localStorage.removeItem('monimax_auth');
              navigate('/login');
            }}
            className={`flex items-center gap-3 text-red-400/70 hover:text-red-400 transition-all w-full px-3 py-2.5 rounded-xl hover:bg-red-500/5 ${isCollapsed ? 'justify-center' : ''}`}
          >
            <span className="material-symbols-outlined">logout</span>
            {!isCollapsed && <span className="text-sm font-medium">Sair do Sistema</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-background-light dark:bg-background-dark">
        {/* Header */}
        <header className="h-16 border-b border-border-dark flex items-center justify-between px-6 bg-white dark:bg-background-dark sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <button
              className="md:hidden size-9 bg-primary/10 text-primary rounded-lg flex items-center justify-center"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h2 className="text-lg font-bold truncate">Console de Operação</h2>
            <div className="hidden sm:flex items-center gap-2 bg-red-500/10 text-red-500 px-3 py-1 rounded-full border border-red-500/20">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] font-bold uppercase tracking-wider">Ao Vivo</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-2 bg-border-dark/30 px-3 py-1.5 rounded-lg border border-border-dark">
              <span className="material-symbols-outlined text-green-500 text-sm">check_circle</span>
              <span className="text-[10px] font-medium text-slate-400">Sistema: Servidor 04 (SP)</span>
            </div>

            <div className="flex gap-2 relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`p-2 rounded-lg transition-colors relative ${showNotifications ? 'bg-primary/20 text-primary' : 'hover:bg-slate-100 dark:hover:bg-card-dark text-slate-500'}`}
              >
                <span className="material-symbols-outlined">notifications</span>
                <span className="absolute top-1.5 right-1.5 size-2 bg-red-500 rounded-full border-2 border-background-dark"></span>
              </button>

              {showNotifications && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-card-dark border border-border-dark rounded-xl shadow-2xl z-[100] animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-4 border-b border-border-dark flex justify-between items-center">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-white">Alertas Recentes</h4>
                    <Link to="/events" onClick={() => setShowNotifications(false)} className="text-[9px] font-bold text-primary hover:underline">Ver tudo</Link>
                  </div>
                  <div className="max-h-96 overflow-y-auto divide-y divide-border-dark/50">
                    {MOCK_EVENTS.map(event => (
                      <div key={event.id} className="p-4 hover:bg-white/5 transition-colors cursor-pointer" onClick={() => { navigate('/events'); setShowNotifications(false); }}>
                        <div className="flex items-start gap-3">
                          <span className={`material-symbols-outlined text-sm mt-0.5 ${event.severity === AlertSeverity.CRITICAL ? 'text-red-500' : 'text-primary'}`}>
                            {event.severity === AlertSeverity.CRITICAL ? 'warning' : 'info'}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-bold text-white truncate uppercase">{event.type}</p>
                            <p className="text-[10px] text-slate-500 truncate">{event.description}</p>
                            <p className="text-[9px] text-slate-600 mt-1 font-mono uppercase">{event.timestamp} • {event.location}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Link
                to="/profile"
                className="p-1 hover:bg-slate-100 dark:hover:bg-card-dark rounded-lg transition-colors text-slate-500 flex items-center justify-center shrink-0"
                title="Meu Perfil"
              >
                <div className="size-8 rounded-full overflow-hidden border border-border-dark flex items-center justify-center bg-primary/10">
                  {userProfile?.avatarUrl ? (
                    <img src={userProfile.avatarUrl} alt="Perfil" className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-xl">account_circle</span>
                  )}
                </div>
              </Link>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 custom-scrollbar">
          {children}
        </main>
      </div>

      {showNotifications && <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)}></div>}
    </div>
  );
};

const NavItem = ({ to, icon, label, isCollapsed }: { to: string; icon: string; label: string; isCollapsed: boolean }) => (
  <NavLink
    to={to}
    title={isCollapsed ? label : ''}
    className={({ isActive }) =>
      `flex items-center gap-4 px-3.5 py-3 rounded-xl transition-all duration-300 group overflow-hidden ${isActive
        ? 'bg-primary text-white shadow-lg shadow-primary/20'
        : 'text-slate-500 hover:text-white hover:bg-white/5'
      } ${isCollapsed ? 'justify-center' : 'justify-start'}`
    }
  >
    <span className="material-symbols-outlined shrink-0">{icon}</span>
    <span
      className={`text-sm font-medium whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0 -translate-x-4' : 'opacity-100 w-auto translate-x-0'
        }`}
    >
      {label}
    </span>
  </NavLink>
);

export default Layout;
