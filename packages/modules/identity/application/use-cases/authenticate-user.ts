import { User } from '../domain/entities/user.js';
import { UserRepository } from '../infrastructure/repositories/user-repository.js';
import { Result, success, failure, AppError } from '@acme/core.js';
import { logger } from '@acme/core.js';
import bcrypt from 'bcrypt';

export interface AuthenticateUserRequest {
  email: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuthenticateUserResponse {
  user: User;
  sessionToken?: string;
}

export class AuthenticateUserUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(request: AuthenticateUserRequest): Promise<Result<AuthenticateUserResponse>> {
    try {
      logger.debug('Authenticating user', { 
        email: request.email,
        ipAddress: request.ipAddress 
      });

      // Validate inputs
      if (!request.email || !request.password) {
        return failure(AppError.badRequest('Email and password are required'));
      }

      // Find user by email
      const user = await this.userRepository.findByEmail(request.email);
      if (!user) {
        // Use same timing as password check to prevent timing attacks
        await bcrypt.compare(request.password, '$2b$12$invalid.hash.to.prevent.timing.attacks');
        return failure(AppError.unauthorized('Invalid email or password'));
      }

      // Check if user is active
      if (!user.isActive()) {
        return failure(AppError.unauthorized('Account is suspended or archived'));
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(request.password, user.data.passwordHash);
      if (!isPasswordValid) {
        return failure(AppError.unauthorized('Invalid email or password'));
      }

      // Record login
      user.recordLogin();
      await this.userRepository.update(user.id, {
        lastLoginAt: user.lastLoginAt,
        updatedAt: user.updatedAt,
      });

      logger.info('User authenticated successfully', {
        userId: user.id,
        email: user.email,
        isSuperuser: user.isSuperuser,
        ipAddress: request.ipAddress,
      });

      return success({
        user,
      });
    } catch (error) {
      logger.error('Failed to authenticate user', error, {
        email: request.email,
        ipAddress: request.ipAddress,
      });

      if (error instanceof AppError) {
        return failure(error);
      }

      return failure(
        AppError.internal('Authentication failed')
      );
    }
  }
}
