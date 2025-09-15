export type UserStatus = 'active' | 'suspended' | 'archived';

export interface UserData {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  status: UserStatus;
  isSuperuser: boolean;
  emailVerified: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  constructor(private data: UserData) {}

  get id(): string {
    return this.data.id;
  }

  get email(): string {
    return this.data.email;
  }

  get name(): string {
    return this.data.name;
  }

  get status(): UserStatus {
    return this.data.status;
  }

  get isSuperuser(): boolean {
    return this.data.isSuperuser;
  }

  get emailVerified(): boolean {
    return this.data.emailVerified;
  }

  get lastLoginAt(): Date | undefined {
    return this.data.lastLoginAt;
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
      throw new Error('Cannot suspend an archived user');
    }
    this.data.status = 'suspended';
    this.data.updatedAt = new Date();
  }

  public activate(): void {
    if (this.data.status === 'archived') {
      throw new Error('Cannot activate an archived user');
    }
    this.data.status = 'active';
    this.data.updatedAt = new Date();
  }

  public archive(): void {
    this.data.status = 'archived';
    this.data.updatedAt = new Date();
  }

  public verifyEmail(): void {
    this.data.emailVerified = true;
    this.data.updatedAt = new Date();
  }

  public recordLogin(): void {
    this.data.lastLoginAt = new Date();
    this.data.updatedAt = new Date();
  }

  public updateName(name: string): void {
    if (!name.trim()) {
      throw new Error('User name cannot be empty');
    }
    this.data.name = name.trim();
    this.data.updatedAt = new Date();
  }

  public updateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }
    this.data.email = email.toLowerCase();
    this.data.emailVerified = false; // Require re-verification
    this.data.updatedAt = new Date();
  }

  public makeSuperuser(): void {
    this.data.isSuperuser = true;
    this.data.updatedAt = new Date();
  }

  public removeSuperuser(): void {
    this.data.isSuperuser = false;
    this.data.updatedAt = new Date();
  }

  public toJSON(): Omit<UserData, 'passwordHash'> {
    const { passwordHash, ...userData } = this.data;
    return userData;
  }

  public toPublicJSON(): Pick<UserData, 'id' | 'email' | 'name' | 'emailVerified' | 'createdAt'> {
    return {
      id: this.data.id,
      email: this.data.email,
      name: this.data.name,
      emailVerified: this.data.emailVerified,
      createdAt: this.data.createdAt,
    };
  }
}
