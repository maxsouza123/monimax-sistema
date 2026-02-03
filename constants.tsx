
import { AlertSeverity, SecurityEvent, Camera, ChatMessage } from './types';

export const INITIAL_CAMERAS: Camera[] = [
  { id: 'cam-1', name: 'Portão Norte', status: 'online', brand: 'Intelbras', latency: 42, ip: '192.168.1.50', client: 'Condomínio Solar' },
  { id: 'cam-2', name: 'Recepção Lobbby', status: 'online', brand: 'Hikvision', latency: 38, ip: '192.168.1.51', client: 'Empresa Alpha' },
  { id: 'cam-3', name: 'Corredor Leste', status: 'unstable', brand: 'Dahua', latency: 120, ip: '192.168.1.52', client: 'Condomínio Solar' },
  { id: 'cam-4', name: 'Estacionamento P1', status: 'online', brand: 'Intelbras', latency: 45, ip: '192.168.1.53', client: 'Empresa Alpha' },
  { id: 'cam-5', name: 'Doca de Carga', status: 'offline', brand: 'Hikvision', latency: 0, ip: '192.168.1.54', client: 'Logística Express' },
];

export const MOCK_EVENTS: SecurityEvent[] = [
  {
    id: 'ev-1',
    type: 'LPR - Blacklist',
    severity: AlertSeverity.CRITICAL,
    timestamp: '14:30:22',
    location: 'Portão Norte',
    description: 'Veículo Roubado Detectado: ABC-1234',
    image: 'https://picsum.photos/seed/car1/200/120',
    metadata: { plate: 'ABC-1234', confidence: '98.4%' }
  },
  {
    id: 'ev-2',
    type: 'Acesso Autorizado',
    severity: AlertSeverity.INFO,
    timestamp: '14:28:05',
    location: 'Recepção',
    description: 'Entrada Autorizada: Ana Silva',
    image: 'https://picsum.photos/seed/face1/200/120',
    metadata: { person: 'Ana Silva', id: '883-M' }
  },
  {
    id: 'ev-3',
    type: 'Acesso Forçado',
    severity: AlertSeverity.CRITICAL,
    timestamp: '14:25:10',
    location: 'Portão Sul 02',
    description: 'Tentativa de abertura sem autorização',
    image: 'https://picsum.photos/seed/gate1/200/120'
  }
];

export const INITIAL_CHAT: ChatMessage[] = [
  { id: 'm1', sender: 'Op. Carlos', text: 'Alguém verificou o perímetro do Portão Sul?', timestamp: '14:32', isMe: false },
  { id: 'm2', sender: 'Op. Ana', text: 'Estou analisando a LPR-042 agora. Parece restrito.', timestamp: '14:35', isMe: false },
  { id: 'm3', sender: 'Você', text: 'Positivo. Acionei protocolo de monitoramento.', timestamp: '14:38', isMe: true },
];
