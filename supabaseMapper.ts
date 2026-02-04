
import { Device, SecurityEvent, Camera, AlertSeverity, Client, StorageConfig, SuspiciousPlate, UserRole, UserProfile, ModulePermission, AlertRule, KanbanColumn, KanbanCard, ChatMessage, SystemSettings, ServiceOrder } from './types';

/**
 * Mapeador de Dados (MapeadorDeDados)
 * Converte dados entre os formatos do sistema e do Supabase (snake_case vs camelCase)
 */

export const SupabaseMapper = {
    // Dispositivos
    toDevice(dbDevice: any): Device {
        return {
            id: dbDevice.id,
            name: dbDevice.name,
            type: dbDevice.type as any,
            status: dbDevice.status as any,
            ip: dbDevice.ip,
            port: dbDevice.port,
            username: dbDevice.username,
            password: dbDevice.password,
            protocol: dbDevice.protocol,
            model: dbDevice.model,
            channels: dbDevice.channels,
            firmware: dbDevice.firmware,
            clientId: dbDevice.client_id,
            recordingEnabled: dbDevice.recording_enabled,
            storageConfigId: dbDevice.storage_config_id,
            recordingMode: dbDevice.recording_mode,
            retentionDays: dbDevice.retention_days,
            streamQuality: dbDevice.stream_quality,
            scheduleStart: dbDevice.schedule_start,
            scheduleEnd: dbDevice.schedule_end,
        };
    },

    fromDevice(device: Partial<Device>): any {
        return {
            name: device.name,
            type: device.type,
            status: device.status,
            ip: device.ip,
            port: device.port,
            username: device.username,
            password: device.password,
            protocol: device.protocol,
            model: device.model,
            channels: device.channels,
            firmware: device.firmware,
            client_id: device.clientId,
            recording_enabled: device.recordingEnabled,
            storage_config_id: device.storageConfigId,
            recording_mode: device.recordingMode,
            retention_days: device.retentionDays,
            stream_quality: device.streamQuality,
            schedule_start: device.scheduleStart,
            schedule_end: device.scheduleEnd,
        };
    },

    // Eventos de Segurança
    toSecurityEvent(dbEvent: any): SecurityEvent {
        return {
            id: dbEvent.id,
            type: dbEvent.type,
            severity: dbEvent.severity as AlertSeverity,
            timestamp: dbEvent.timestamp,
            location: dbEvent.location,
            description: dbEvent.description,
            image: dbEvent.image,
            metadata: dbEvent.metadata,
        };
    },

    fromSecurityEvent(event: Partial<SecurityEvent>): any {
        return {
            type: event.type,
            severity: event.severity,
            timestamp: event.timestamp || new Date().toISOString(),
            location: event.location,
            description: event.description,
            image: event.image,
            metadata: event.metadata,
        };
    },

    // Câmeras
    toCamera(dbCamera: any): Camera {
        return {
            id: dbCamera.id,
            name: dbCamera.name,
            status: dbCamera.status as any,
            brand: dbCamera.brand,
            latency: dbCamera.latency,
            ip: dbCamera.ip,
            client: dbCamera.client,
        };
    },

    fromCamera(camera: Partial<Camera>): any {
        return {
            name: camera.name,
            status: camera.status,
            brand: camera.brand,
            latency: camera.latency,
            ip: camera.ip,
            client: camera.client,
        };
    },

    // Clientes
    toClient(dbClient: any): Client {
        return {
            id: dbClient.id,
            name: dbClient.name,
            email: dbClient.email,
            phone: dbClient.phone,
            address: dbClient.address,
            document: dbClient.document,
            status: dbClient.status as any,
            createdAt: dbClient.created_at,
        };
    },

    fromClient(client: Partial<Client>): any {
        return {
            name: client.name,
            email: client.email,
            phone: client.phone,
            address: client.address,
            document: client.document,
            status: client.status,
        };
    },

    // Configurações de Armazenamento
    toStorageConfig(dbConfig: any): StorageConfig {
        return {
            id: dbConfig.id,
            name: dbConfig.name,
            type: dbConfig.type as any,
            provider: dbConfig.provider,
            endpoint: dbConfig.endpoint,
            accessKey: dbConfig.access_key,
            secretKey: dbConfig.secret_key,
            bucketName: dbConfig.bucket_name,
            localPath: dbConfig.local_path,
            status: dbConfig.status as any,
            createdAt: dbConfig.created_at,
        };
    },

    fromStorageConfig(config: Partial<StorageConfig>): any {
        return {
            name: config.name,
            type: config.type,
            provider: config.provider,
            endpoint: config.endpoint,
            access_key: config.accessKey,
            secret_key: config.secretKey,
            bucket_name: config.bucketName,
            local_path: config.localPath,
            status: config.status,
        };
    },

    // Placas Suspeitas
    toSuspiciousPlate(dbPlate: any): SuspiciousPlate {
        return {
            id: dbPlate.id,
            plate: dbPlate.plate,
            vehicleType: dbPlate.vehicle_type,
            model: dbPlate.model,
            ownerName: dbPlate.owner_name,
            city: dbPlate.city,
            zipCode: dbPlate.zip_code,
            observations: dbPlate.observations,
            imageUrl: dbPlate.image_url,
            createdAt: dbPlate.created_at,
        };
    },

    fromSuspiciousPlate(plate: Partial<SuspiciousPlate>): any {
        return {
            plate: plate.plate,
            vehicle_type: plate.vehicleType,
            model: plate.model,
            owner_name: plate.ownerName,
            city: plate.city,
            zip_code: plate.zipCode,
            observations: plate.observations,
            image_url: plate.imageUrl,
        };
    },

    // Regras de Alerta
    toAlertRule(dbRule: any): AlertRule {
        return {
            id: dbRule.id,
            name: dbRule.name,
            camera: dbRule.camera,
            type: dbRule.type,
            severity: dbRule.severity,
            active: dbRule.active,
        };
    },

    fromAlertRule(rule: Partial<AlertRule>): any {
        return {
            name: rule.name,
            camera: rule.camera,
            type: rule.type,
            severity: rule.severity,
            active: rule.active,
        };
    },

    // Kanban
    toKanbanColumn(dbCol: any): KanbanColumn {
        return {
            id: dbCol.id,
            title: dbCol.title,
            position: dbCol.position,
            color: dbCol.color,
        };
    },

    toKanbanCard(dbCard: any): KanbanCard {
        return {
            id: dbCard.id,
            columnId: dbCard.column_id,
            title: dbCard.title,
            description: dbCard.description,
            severity: dbCard.severity,
            position: dbCard.position,
            createdAt: dbCard.created_at,
            createdBy: dbCard.created_by,
            assignedTo: dbCard.assigned_to,
        };
    },

    fromKanbanCard(card: Partial<KanbanCard>): any {
        return {
            column_id: card.columnId,
            title: card.title,
            description: card.description,
            severity: card.severity,
            position: card.position,
            created_by: card.createdBy,
            assigned_to: card.assignedTo,
        };
    },

    // Perfis e Permissões
    toUserProfile(dbProfile: any): UserProfile {
        return {
            id: dbProfile.id,
            role: dbProfile.role as any,
            fullName: dbProfile.full_name,
            email: dbProfile.email,
            phone: dbProfile.phone,
            address: dbProfile.address,
            cep: dbProfile.cep,
            city: dbProfile.city,
            avatarUrl: dbProfile.avatar_url,
            department: dbProfile.department,
            clientId: dbProfile.client_id,
        };
    },

    fromUserProfile(profile: Partial<UserProfile>): any {
        return {
            full_name: profile.fullName,
            phone: profile.phone,
            address: profile.address,
            cep: profile.cep,
            city: profile.city,
            avatar_url: profile.avatarUrl,
            department: profile.department,
            client_id: profile.clientId
        };
    },

    toModulePermission(dbPerm: any): ModulePermission {
        return {
            id: dbPerm.id,
            module: dbPerm.module,
            icon: dbPerm.icon,
            roles: dbPerm.roles,
        };
    },

    fromModulePermission(perm: Partial<ModulePermission>): any {
        return {
            module: perm.module,
            icon: perm.icon,
            roles: perm.roles,
        };
    },

    // Chat
    toChatMessage(dbMsg: any, currentUserId?: string): ChatMessage {
        return {
            id: dbMsg.id,
            senderName: dbMsg.sender_name,
            senderRole: dbMsg.sender_role,
            text: dbMsg.text,
            timestamp: new Date(dbMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }),
            isMe: dbMsg.sender_id === currentUserId,
            senderId: dbMsg.sender_id,
        };
    },

    fromChatMessage(msg: Partial<ChatMessage>): any {
        return {
            sender_id: msg.senderId,
            sender_name: msg.senderName,
            sender_role: msg.senderRole,
            text: msg.text,
        };
    },

    // System Settings
    toSystemSettings(dbSettings: any): SystemSettings {
        return {
            id: dbSettings.id,
            brandName: dbSettings.brand_name,
            brandTagline: dbSettings.brand_tagline,
            logoUrl: dbSettings.logo_url,
        };
    },

    fromSystemSettings(settings: Partial<SystemSettings>): any {
        return {
            brand_name: settings.brandName,
            brand_tagline: settings.brandTagline,
        };
    },

    // Ordens de Serviço (Service Orders)
    toServiceOrder(dbOrder: any): ServiceOrder {
        return {
            id: dbOrder.id,
            clientId: dbOrder.client_id,
            deviceId: dbOrder.device_id,
            title: dbOrder.title,
            description: dbOrder.description,
            priority: dbOrder.priority,
            status: dbOrder.status,
            technicianId: dbOrder.technician_id,
            scheduledDate: dbOrder.scheduled_date,
            completedAt: dbOrder.completed_at,
            createdAt: dbOrder.created_at,
            location: dbOrder.location,
        };
    },

    fromServiceOrder(order: Partial<ServiceOrder>): any {
        return {
            client_id: order.clientId,
            device_id: order.deviceId,
            title: order.title,
            description: order.description,
            priority: order.priority,
            status: order.status,
            technician_id: order.technicianId,
            scheduled_date: order.scheduledDate,
            completed_at: order.completedAt,
            location: order.location,
        };
    }
};

