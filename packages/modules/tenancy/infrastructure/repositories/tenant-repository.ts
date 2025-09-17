import { db } from '@acme/db/connection';
import { tenants, insertTenantSchema } from '@acme/db/schema';
import { eq } from 'drizzle-orm';
import { Tenant, TenantData } from '../domain/entities/tenant';
import { AppError } from '@acme/core';

export interface CreateTenantData {
  name: string;
  slug: string;
  description?: string;
  status: 'active' | 'suspended' | 'archived';
}

export class TenantRepository {
  async create(data: CreateTenantData): Promise<Tenant> {
    const validatedData = insertTenantSchema.parse(data);

    const [dbTenant] = await db
      .insert(tenants)
      .values(validatedData)
      .returning();

    return this.toDomainEntity(dbTenant);
  }

  async findById(id: string): Promise<Tenant | null> {
    const [dbTenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, id))
      .limit(1);

    if (!dbTenant) {
      return null;
    }

    return this.toDomainEntity(dbTenant);
  }

  async findBySlug(slug: string): Promise<Tenant | null> {
    const [dbTenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, slug))
      .limit(1);

    if (!dbTenant) {
      return null;
    }

    return this.toDomainEntity(dbTenant);
  }

  async update(id: string, updates: Partial<CreateTenantData>): Promise<Tenant> {
    const [dbTenant] = await db
      .update(tenants)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, id))
      .returning();

    if (!dbTenant) {
      throw AppError.notFound('Tenant not found');
    }

    return this.toDomainEntity(dbTenant);
  }

  async delete(id: string): Promise<void> {
    const result = await db
      .delete(tenants)
      .where(eq(tenants.id, id));

    if (result.rowCount === 0) {
      throw AppError.notFound('Tenant not found');
    }
  }

  async findAll(): Promise<Tenant[]> {
    const dbTenants = await db
      .select()
      .from(tenants)
      .orderBy(tenants.createdAt);

    return dbTenants.map(tenant => this.toDomainEntity(tenant));
  }

  private toDomainEntity(dbTenant: any): Tenant {
    const tenantData: TenantData = {
      id: dbTenant.id,
      slug: dbTenant.slug,
      name: dbTenant.name,
      status: dbTenant.status,
      description: dbTenant.description,
      domain: dbTenant.domain,
      settings: dbTenant.settings,
      createdAt: dbTenant.createdAt,
      updatedAt: dbTenant.updatedAt,
    };

    return new Tenant(tenantData);
  }
}
