export type TenantStatus = 'active' | 'suspended' | 'archived';

export interface TenantData {
  id: string;
  slug: string;
  name: string;
  status: TenantStatus;
  description?: string;
  domain?: string;
  settings?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export class Tenant {
  constructor(private data: TenantData) {}

  get id(): string {
    return this.data.id;
  }

  get slug(): string {
    return this.data.slug;
  }

  get name(): string {
    return this.data.name;
  }

  get status(): TenantStatus {
    return this.data.status;
  }

  get description(): string | undefined {
    return this.data.description;
  }

  get domain(): string | undefined {
    return this.data.domain;
  }

  get settings(): Record<string, any> {
    return this.data.settings || {};
  }

  get createdAt(): Date {
    return this.data.createdAt;
  }

  get updatedAt(): Date {
    return this.data.updatedAt;
  }

  public isActive(): boolean {
    return this.data.status === 'active';
  }

  public suspend(): void {
    if (this.data.status === 'archived') {
      throw new Error('Cannot suspend an archived tenant');
    }
    this.data.status = 'suspended';
    this.data.updatedAt = new Date();
  }

  public activate(): void {
    if (this.data.status === 'archived') {
      throw new Error('Cannot activate an archived tenant');
    }
    this.data.status = 'active';
    this.data.updatedAt = new Date();
  }

  public archive(): void {
    this.data.status = 'archived';
    this.data.updatedAt = new Date();
  }

  public updateSettings(settings: Record<string, any>): void {
    this.data.settings = { ...this.data.settings, ...settings };
    this.data.updatedAt = new Date();
  }

  public updateName(name: string): void {
    if (!name.trim()) {
      throw new Error('Tenant name cannot be empty');
    }
    this.data.name = name.trim();
    this.data.updatedAt = new Date();
  }

  public updateDescription(description: string): void {
    this.data.description = description.trim() || undefined;
    this.data.updatedAt = new Date();
  }

  public toJSON(): TenantData {
    return { ...this.data };
  }
}
