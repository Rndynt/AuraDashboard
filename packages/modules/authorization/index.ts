// DDD surface: export Domain types & interfaces, Application use cases,
// and (optionally) Infrastructure concrete impl for composition at the edge.
export * from "./domain/entities/role";
export type * from "./domain/repositories/role-repository";
export * from "./application/use-cases/check-permission";
export { SqlRoleRepository } from "./infrastructure/repositories/role-repository";