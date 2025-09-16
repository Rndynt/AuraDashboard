export interface RoleData {
  id: string;
  tenantId: string | null; // null for global roles
  name: string;
  description?: string;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

export class Role {
  constructor(private data: RoleData) {}

  get id(): string {
    return this.data.id;
  }

  get tenantId(): string | null {
    return this.data.tenantId;
  }

  get name(): string {
    return this.data.name;
  }

  get description(): string | undefined {
    return this.data.description;
  }

  get permissions(): readonly string[] {
    return [...this.data.permissions];
  }

  get createdAt(): Date {
    return this.data.createdAt;
  }

  get updatedAt(): Date {
    return this.data.updatedAt;
  }

  public isGlobal(): boolean {
    return this.data.tenantId === null;
  }

  public hasPermission(permission: string): boolean {
    return this.data.permissions.includes(permission);
  }

  public addPermission(permission: string): void {
    if (!this.data.permissions.includes(permission)) {
      this.data.permissions.push(permission);
      this.data.updatedAt = new Date();
    }
  }

  public removePermission(permission: string): void {
    const index = this.data.permissions.indexOf(permission);
    if (index > -1) {
      this.data.permissions.splice(index, 1);
      this.data.updatedAt = new Date();
    }
  }

  public setPermissions(permissions: string[]): void {
    this.data.permissions = [...permissions];
    this.data.updatedAt = new Date();
  }

  public updateName(name: string): void {
    if (!name.trim()) {
      throw new Error('Role name cannot be empty');
    }
    this.data.name = name.trim();
    this.data.updatedAt = new Date();
  }

  public updateDescription(description: string): void {
    this.data.description = description.trim() || undefined;
    this.data.updatedAt = new Date();
  }

  public toJSON(): RoleData {
    return { ...this.data, permissions: [...this.data.permissions] };
  }
}

export class Permission {
  constructor(
    public readonly key: string,
    public readonly description: string,
    public readonly resource: string = key.split('.')[0] || '',
    public readonly action: string = key.split('.')[1] || ''
  ) {}

  get id(): string {
    return this.key;
  }
}

export class PermissionSet {
  constructor(private permissions: Permission[]) {}

  public has(permissionKey: string): boolean {
    return this.permissions.some(p => p.key === permissionKey);
  }

  public getByResource(resource: string): Permission[] {
    return this.permissions.filter(p => p.resource === resource);
  }

  public getAll(): readonly Permission[] {
    return [...this.permissions];
  }

  public getKeys(): string[] {
    return this.permissions.map(p => p.key);
  }
}
