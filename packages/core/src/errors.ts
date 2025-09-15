export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500,
    public readonly code?: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }

  static badRequest(message: string, details?: unknown): AppError {
    return new AppError(message, 400, 'BAD_REQUEST', details);
  }

  static unauthorized(message: string = 'Unauthorized'): AppError {
    return new AppError(message, 401, 'UNAUTHORIZED');
  }

  static forbidden(message: string = 'Forbidden'): AppError {
    return new AppError(message, 403, 'FORBIDDEN');
  }

  static notFound(message: string = 'Not found'): AppError {
    return new AppError(message, 404, 'NOT_FOUND');
  }

  static conflict(message: string, details?: unknown): AppError {
    return new AppError(message, 409, 'CONFLICT', details);
  }

  static internal(message: string, details?: unknown): AppError {
    return new AppError(message, 500, 'INTERNAL_SERVER_ERROR', details);
  }
}

export type Result<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: AppError;
};

export const success = <T>(data: T): Result<T> => ({
  success: true,
  data,
});

export const failure = <T>(error: AppError): Result<T> => ({
  success: false,
  error,
});
