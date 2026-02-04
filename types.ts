
export enum AlertSeverity {
  CRITICAL = 'CRITICAL',
  WARNING = 'WARNING',
  INFO = 'INFO'
}

export type DeviceType = 'CAMERA' | 'NVR' | 'DVR';

export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  status: 'online' | 'offline';
  ip: string;
  port?: number;
  username?: string;
  password?: string;
  protocol: string;
  model: string;
  channels?: number;
  firmware: string;
  clientId?: string;
  recordingEnabled?: boolean;
  storageConfigId?: string;
  recordingMode?: 'CONTINUOUS' | 'MOTION' | 'SCHEDULED';
  retentionDays?: number;
  streamQuality?: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface SecurityEvent {
  id: string;
  type: string;
  severity: AlertSeverity;
  timestamp: string;
  location: string;
  description: string;
  image?: string;
  metadata?: Record<string, any>;
}

export interface Camera {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'unstable';
  brand: string;
  latency: number;
  ip: string;
  client?: string; // Nome do cliente/projeto
  streamName?: string; // Nome do stream no go2rtc
}

export interface ChatMessage {
  id: string;
  senderName: string;
  senderRole?: string;
  text: string;
  timestamp: string;
  isMe: boolean;
  senderId?: string;
}
export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  document?: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface StorageConfig {
  id: string;
  name: string;
  type: 'CLOUD' | 'LOCAL';
  provider?: string; // S3, Azure, Google Cloud, etc (para Cloud)
  endpoint?: string;
  accessKey?: string;
  secretKey?: string;
  bucketName?: string;
  localPath?: string; // Caminho para servidor local
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface SuspiciousPlate {
  id: string;
  plate: string;
  vehicleType: string;
  model: string;
  ownerName: string;
  city: string;
  zipCode: string;
  observations?: string;
  imageUrl?: string;
  createdAt: string;
}

export type UserRole = 'ADMIN' | 'OPERADOR' | 'TATICO' | 'CLIENTE' | 'ASSISTENCIA_TECNICA';

export interface ModulePermission {
  id: string;
  module: string;
  icon: string;
  roles: {
    [key in UserRole]: boolean;
  };
}

export interface UserProfile {
  id: string;
  role: UserRole;
  fullName?: string;
  email?: string;
  phone?: string;
  address?: string;
  cep?: string;
  city?: string;
  avatarUrl?: string;
  department?: string;
  clientId?: string;
}

export interface AlertRule {
  id: string;
  name: string;
  camera: string;
  type: string;
  severity: string;
  active: boolean;
}

export interface KanbanColumn {
  id: string;
  title: string;
  position: number;
  color: string;
}

export interface KanbanCard {
  id: string;
  columnId: string;
  title: string;
  description?: string;
  severity: string;
  position: number;
  createdAt: string;
  createdBy?: string;
  assignedTo?: string;
}

export interface ServiceOrder {
  id: string;
  clientId?: string;
  deviceId?: string;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  technicianId?: string;
  scheduledDate?: string;
  completedAt?: string;
  createdAt: string;
  location?: string;
}

export interface SystemSettings {
  id: string;
  brandName: string;
  brandTagline: string;
  logoUrl?: string;
}
