export type AuditAction = 
  | 'tenant.create' | 'tenant.update' | 'tenant.delete'
  | 'user.create' | 'user.update' | 'user.delete' | 'user.invite'
  | 'role.create' | 'role.update' | 'role.delete'
  | 'permission.grant' | 'permission.revoke'
  | 'apikey.create' | 'apikey.revoke'
  | 'session.create' | 'session.revoke'
  | 'auth.login' | 'auth.logout' | 'auth.failed';

export type AuditResource = 
  | 'tenant' | 'user' | 'role' | 'permission' 
  | 'apikey' | 'session' | 'auth' | 'system';

export interface AuditLogData {
  id: string;
  tenantId: string | null;
  actorUserId: string | null;
  action: AuditAction;
  resource: AuditResource;
  resourceId: string | null;
  metadata: Record<string, any>;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

export class AuditLog {
  constructor(private data: AuditLogData) {}

  get id(): string {
    return this.data.id;
  }

  get tenantId(): string | null {
    return this.data.tenantId;
  }

  get actorUserId(): string | null {
    return this.data.actorUserId;
  }

  get action(): AuditAction {
    return this.data.action;
  }

  get resource(): AuditResource {
    return this.data.resource;
  }

  get resourceId(): string | null {
    return this.data.resourceId;
  }

  get metadata(): Record<string, any> {
    return { ...this.data.metadata };
  }

  get ipAddress(): string | null {
    return this.data.ipAddress;
  }

  get userAgent(): string | null {
    return this.data.userAgent;
  }

  get createdAt(): Date {
    return this.data.createdAt;
  }

  public isSystemAction(): boolean {
    return this.data.actorUserId === null;
  }

  public isTenantScoped(): boolean {
    return this.data.tenantId !== null;
  }

  public hasMetadata(key: string): boolean {
    return key in this.data.metadata;
  }

  public getMetadata<T = any>(key: string): T | undefined {
    return this.data.metadata[key] as T;
  }

  public getDescription(): string {
    const actor = this.isSystemAction() ? 'System' : 'User';
    const target = this.data.resourceId ? ` (${this.data.resourceId})` : '';
    return `${actor} performed ${this.data.action} on ${this.data.resource}${target}`;
  }

  public toJSON(): AuditLogData {
    return { 
      ...this.data, 
      metadata: { ...this.data.metadata } 
    };
  }
}

export interface CreateAuditLogData {
  tenantId?: string;
  actorUserId?: string;
  action: AuditAction;
  resource: AuditResource;
  resourceId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}
