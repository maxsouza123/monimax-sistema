
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, checkSupabaseConnection } from './supabaseClient';
import { SupabaseMapper } from './supabaseMapper';
import { Device, SecurityEvent, Camera, Client, StorageConfig, SuspiciousPlate, UserProfile, ModulePermission, AlertRule, KanbanColumn, KanbanCard, ChatMessage, SystemSettings } from './types';

interface SyncContextType {
    isConnected: boolean;
    isSyncing: boolean;
    user: any | null;
    devices: Device[];
    events: SecurityEvent[];
    cameras: Camera[];
    clients: Client[];
    storageConfigs: StorageConfig[];
    suspiciousPlates: SuspiciousPlate[];
    userProfile: UserProfile | null;
    permissions: ModulePermission[];
    alertRules: AlertRule[];
    kanbanColumns: KanbanColumn[];
    kanbanCards: KanbanCard[];
    chatMessages: ChatMessage[];
    systemSettings: SystemSettings | null;
    error: string | null;
    refreshData: () => Promise<void>;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const DataSynchronizer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [user, setUser] = useState<any | null>(null);
    const [devices, setDevices] = useState<Device[]>([]);
    const [events, setEvents] = useState<SecurityEvent[]>([]);
    const [cameras, setCameras] = useState<Camera[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [storageConfigs, setStorageConfigs] = useState<StorageConfig[]>([]);
    const [suspiciousPlates, setSuspiciousPlates] = useState<SuspiciousPlate[]>([]);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [permissions, setPermissions] = useState<ModulePermission[]>([]);
    const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
    const [kanbanColumns, setKanbanColumns] = useState<KanbanColumn[]>([]);
    const [kanbanCards, setKanbanCards] = useState<KanbanCard[]>([]);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
    const [error, setError] = useState<string | null>(null);

    const syncRef = React.useRef(false);

    const fetchInitialData = async () => {
        if (syncRef.current) return;

        syncRef.current = true;
        setIsSyncing(true);
        setError(null);

        try {
            console.log('Iniciando sincronização...');

            // 1. Prioridade: Buscar Perfil do Usuário para liberar os menus
            const { data: { session } } = await supabase.auth.getSession();
            const currentUser = session?.user;

            if (currentUser) {
                setUser(currentUser);
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', currentUser.id)
                    .maybeSingle();

                if (profile) {
                    setUserProfile(SupabaseMapper.toUserProfile(profile));
                } else {
                    // Fallback para admin master se der erro ou não existir perfil
                    setUserProfile({
                        id: currentUser.id,
                        role: currentUser.email === 'admin@monimax.com' ? 'ADMIN' : 'OPERADOR',
                        fullName: 'Usuário MoniMax'
                    });
                }
            }

            // 2. Buscar Dados Secundários em paralelo
            const [devs, evs, cams, cls, stor, plates, perms] = await Promise.all([
                supabase.from('devices').select('*'),
                supabase.from('security_events').select('*').order('timestamp', { ascending: false }).limit(20),
                supabase.from('cameras').select('*'),
                supabase.from('clients').select('*').order('name', { ascending: true }),
                supabase.from('storage_configs').select('*').order('name', { ascending: true }),
                supabase.from('suspicious_plates').select('*').order('plate', { ascending: true }),
                supabase.from('module_permissions').select('*').order('position', { ascending: true }),
                supabase.from('alert_rules').select('*').order('created_at', { ascending: false })
            ]);

            if (devs.data) setDevices(devs.data.map(SupabaseMapper.toDevice));
            if (evs.data) setEvents(evs.data.map(SupabaseMapper.toSecurityEvent));
            if (cams.data) setCameras(cams.data.map(SupabaseMapper.toCamera));
            if (cls.data) setClients(cls.data.map(SupabaseMapper.toClient));
            if (stor.data) setStorageConfigs(stor.data.map(SupabaseMapper.toStorageConfig));
            if (plates.data) setSuspiciousPlates(plates.data.map(SupabaseMapper.toSuspiciousPlate));
            if (perms.data) setPermissions(perms.data.map(SupabaseMapper.toModulePermission));

            const alertRes = await supabase.from('alert_rules').select('*').order('created_at', { ascending: false });
            if (alertRes.data) setAlertRules(alertRes.data.map(SupabaseMapper.toAlertRule));

            const kanbanColRes = await supabase.from('kanban_columns').select('*').order('position', { ascending: true });
            if (kanbanColRes.data) setKanbanColumns(kanbanColRes.data.map(SupabaseMapper.toKanbanColumn));

            const kanbanCardRes = await supabase.from('kanban_cards').select('*').order('position', { ascending: true });
            if (kanbanCardRes.data) setKanbanCards(kanbanCardRes.data.map(SupabaseMapper.toKanbanCard));

            const chatRes = await supabase.from('chat_messages').select('*').order('created_at', { ascending: true }).limit(50);
            if (chatRes.data) {
                const { data: { user: currentUser } } = await supabase.auth.getUser();
                setChatMessages(chatRes.data.map(m => SupabaseMapper.toChatMessage(m, currentUser?.id)));
            }

            const { data: settingsData, error: settingsError } = await supabase.from('system_settings').select('*');
            if (settingsData && settingsData.length > 0) {
                const branding = settingsData.find(s => s.id === 'branding');
                if (branding) setSystemSettings(SupabaseMapper.toSystemSettings(branding));
            }
            if (settingsError) console.error('Erro ao buscar branding:', settingsError);

        } catch (err: any) {
            console.error('Falha na sincronização:', err.message);
            setError('Instabilidade na conexão. Reconectando...');
        } finally {
            syncRef.current = false;
            setIsSyncing(false);
        }
    };

    useEffect(() => {
        // Inicialização
        const setup = async () => {
            const { connected } = await checkSupabaseConnection();
            setIsConnected(connected);
            await fetchInitialData();
        };
        setup();

        // Listener de Autenticação
        const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (_event === 'SIGNED_IN' || _event === 'TOKEN_REFRESHED') {
                fetchInitialData();
            } else if (_event === 'SIGNED_OUT') {
                setUser(null);
                setUserProfile(null);
            }
        });

        // Canais Realtime
        const mainChannel = supabase.channel('realtime_updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'devices' }, () => {
                fetchInitialData();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'module_permissions' }, () => {
                fetchInitialData();
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, async (payload) => {
                const { data: { user: currentUser } } = await supabase.auth.getUser();
                if (currentUser && payload.new.id === currentUser.id) {
                    setUserProfile(SupabaseMapper.toUserProfile(payload.new));
                }
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'alert_rules' }, () => {
                fetchInitialData();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'kanban_columns' }, () => {
                fetchInitialData();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'kanban_cards' }, () => {
                fetchInitialData();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages' }, () => {
                fetchInitialData();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'system_settings' }, () => {
                fetchInitialData();
            })
            .subscribe();

        return () => {
            supabase.removeAllChannels();
            authListener.unsubscribe();
        };
    }, []);

    return (
        <SyncContext.Provider value={{
            isConnected,
            isSyncing,
            user,
            devices,
            events,
            cameras,
            clients,
            storageConfigs,
            suspiciousPlates,
            userProfile,
            permissions,
            alertRules,
            kanbanColumns,
            kanbanCards,
            chatMessages,
            systemSettings,
            error,
            refreshData: fetchInitialData
        }}>
            {/* Indicador de Carregamento / Erro Global */}
            {isSyncing && (
                <div className="fixed bottom-4 right-4 bg-primary text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2 animate-pulse">
                    <span className="material-symbols-outlined spin">sync</span>
                    Sincronizando...
                </div>
            )}
            {error && (
                <div className="fixed top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2">
                    <span className="material-symbols-outlined">error</span>
                    {error}
                </div>
            )}
            {children}
        </SyncContext.Provider>
    );
};

export const useSync = () => {
    const context = useContext(SyncContext);
    if (context === undefined) {
        throw new Error('useSync deve ser usado dentro de um DataSynchronizer');
    }
    return context;
};

