
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase, checkSupabaseConnection } from './supabaseClient';
import { SupabaseMapper } from './supabaseMapper';
import { Device, SecurityEvent, Camera, Client, StorageConfig, SuspiciousPlate, UserProfile, ModulePermission, AlertRule, KanbanColumn, KanbanCard, ChatMessage, SystemSettings, ServiceOrder } from './types';

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
    serviceOrders: ServiceOrder[];
    systemSettings: SystemSettings | null;
    error: string | null;
    refreshData: (target?: string) => Promise<void>;
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
    const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
    const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
    const [error, setError] = useState<string | null>(null);

    const syncInProgress = useRef(false);

    // --- Funções Granulares de Busca ---
    const fetchUserProfile = async (userId: string) => {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
        if (profile) {
            setUserProfile(SupabaseMapper.toUserProfile(profile));
        } else {
            setUserProfile({
                id: userId,
                role: 'OPERADOR',
                fullName: 'Usuário MoniMax'
            });
        }
    };

    const fetchDevices = async () => {
        const { data } = await supabase.from('devices').select('*');
        if (data) setDevices(data.map(SupabaseMapper.toDevice));
    };

    const fetchEvents = async () => {
        const { data } = await supabase.from('security_events').select('*').order('timestamp', { ascending: false }).limit(20);
        if (data) setEvents(data.map(SupabaseMapper.toSecurityEvent));
    };

    const fetchCameras = async () => {
        const { data } = await supabase.from('cameras').select('*');
        if (data) setCameras(data.map(SupabaseMapper.toCamera));
    };

    const fetchClients = async () => {
        const { data } = await supabase.from('clients').select('*').order('name', { ascending: true });
        if (data) setClients(data.map(SupabaseMapper.toClient));
    };

    const fetchStorageConfigs = async () => {
        const { data } = await supabase.from('storage_configs').select('*').order('name', { ascending: true });
        if (data) setStorageConfigs(data.map(SupabaseMapper.toStorageConfig));
    };

    const fetchSuspiciousPlates = async () => {
        const { data } = await supabase.from('suspicious_plates').select('*').order('created_at', { ascending: false });
        if (data) setSuspiciousPlates(data.map(SupabaseMapper.toSuspiciousPlate));
    };

    const fetchPermissions = async () => {
        const { data } = await supabase.from('module_permissions').select('*').order('position', { ascending: true });
        if (data) setPermissions(data.map(SupabaseMapper.toModulePermission));
    };

    const fetchAlertRules = async () => {
        const { data } = await supabase.from('alert_rules').select('*').order('created_at', { ascending: false });
        if (data) setAlertRules(data.map(SupabaseMapper.toAlertRule));
    };

    const fetchKanban = async () => {
        const [cols, crds] = await Promise.all([
            supabase.from('kanban_columns').select('*').order('position', { ascending: true }),
            supabase.from('kanban_cards').select('*').order('position', { ascending: true })
        ]);
        if (cols.data) setKanbanColumns(cols.data.map(SupabaseMapper.toKanbanColumn));
        if (crds.data) setKanbanCards(crds.data.map(SupabaseMapper.toKanbanCard));
    };

    const fetchServiceOrders = async () => {
        const { data } = await supabase.from('service_orders').select('*').order('created_at', { ascending: false });
        if (data) setServiceOrders(data.map(SupabaseMapper.toServiceOrder));
    };

    const fetchChat = async () => {
        const { data: messages } = await supabase.from('chat_messages').select('*').order('created_at', { ascending: true }).limit(50);
        if (messages) {
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            setChatMessages(messages.map(m => SupabaseMapper.toChatMessage(m, currentUser?.id)));
        }
    };

    const fetchSettings = async () => {
        const { data } = await supabase.from('system_settings').select('*');
        if (data && data.length > 0) {
            const branding = data.find(s => s.id === 'branding');
            if (branding) setSystemSettings(SupabaseMapper.toSystemSettings(branding));
        }
    };

    const fetchAllData = useCallback(async (target?: string) => {
        if (syncInProgress.current && !target) return;
        syncInProgress.current = true;
        setIsSyncing(true);
        setError(null);

        try {
            console.log(`Sincronizando: ${target || 'Tudo'}...`);

            if (target === 'devices') await fetchDevices();
            else if (target === 'events') await fetchEvents();
            else if (target === 'cameras') await fetchCameras();
            else if (target === 'clients') await fetchClients();
            else if (target === 'kanban') await fetchKanban();
            else if (target === 'chat') await fetchChat();
            else if (target === 'service_orders') await fetchServiceOrders();
            else if (target === 'plates') await fetchSuspiciousPlates();
            else {
                // Sincronização Inicial Completa
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    setUser(session.user);
                    await fetchUserProfile(session.user.id);
                }

                await Promise.all([
                    fetchDevices(),
                    fetchEvents(),
                    fetchCameras(),
                    fetchClients(),
                    fetchStorageConfigs(),
                    fetchSuspiciousPlates(),
                    fetchPermissions(),
                    fetchAlertRules(),
                    fetchKanban(),
                    fetchChat(),
                    fetchServiceOrders(),
                    fetchSettings()
                ]);
            }
        } catch (err: any) {
            console.error('Erro na sincronização:', err.message);
            setError('Erro de conexão. Tentando reconectar...');
        } finally {
            syncInProgress.current = false;
            setIsSyncing(false);
        }
    }, []);

    useEffect(() => {
        const setup = async () => {
            const { connected } = await checkSupabaseConnection();
            setIsConnected(connected);
            await fetchAllData();
        };
        setup();

        const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                fetchAllData();
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                setUserProfile(null);
            }
        });

        // Canais Realtime Otimizados (Atualizam apenas o necessário)
        const channel = supabase.channel('global_sync')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'devices' }, () => fetchDevices())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'security_events' }, () => fetchEvents())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'cameras' }, () => fetchCameras())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, () => fetchClients())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'kanban_columns' }, () => fetchKanban())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'kanban_cards' }, () => fetchKanban())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages' }, () => fetchChat())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'service_orders' }, () => fetchServiceOrders())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'suspicious_plates' }, () => fetchSuspiciousPlates())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'system_settings' }, () => fetchSettings())
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, (payload) => {
                if (user && payload.new.id === user.id) fetchUserProfile(user.id);
            })
            .subscribe();

        return () => {
            supabase.removeAllChannels();
            authListener.unsubscribe();
        };
    }, [fetchAllData, user]);

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
            serviceOrders,
            systemSettings,
            error,
            refreshData: fetchAllData
        }}>
            {isSyncing && (
                <div className="fixed bottom-4 right-4 bg-primary text-white px-3 py-1.5 rounded-full shadow-2xl z-50 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest animate-in slide-in-from-bottom-4">
                    <span className="material-symbols-outlined text-[14px] animate-spin">refresh</span>
                    <span>Sincronizando</span>
                </div>
            )}
            {error && (
                <div className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-xl shadow-lg z-50 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                    <span className="material-symbols-outlined text-sm">cloud_off</span>
                    {error}
                </div>
            )}
            {children}
        </SyncContext.Provider>
    );
};

export const useSync = () => {
    const context = useContext(SyncContext);
    if (context === undefined) throw new Error('useSync deve ser usado dentro de um DataSynchronizer');
    return context;
};

