/**
 * Error handler for consistent error responses and logging
 */

export interface ErrorResponse {
  error: {
    message: string;
    code: string;
    details?: Record<string, unknown>;
  };
}

export interface ErrorContext {
  artistId?: string;
  artistName?: string;
  year?: number;
  userId?: string;
  [key: string]: unknown;
}

/**
 * Custom error classes for different error categories
 */
export class AuthenticationError extends Error {
  constructor(message: string, public details?: Record<string, unknown>) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class ExternalAPIError extends Error {
  constructor(
    message: string,
    public serviceName: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ExternalAPIError';
  }
}

export class DataNotFoundError extends Error {
  constructor(message: string, public details?: Record<string, unknown>) {
    super(message);
    this.name = 'DataNotFoundError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public details?: Record<string, unknown>) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Maps error types to appropriate HTTP status codes
 * @param error - Error instance
 * @returns HTTP status code
 */
export function getStatusCode(error: Error): number {
  if (error instanceof AuthenticationError) {
    return 401;
  }
  if (error instanceof ExternalAPIError) {
    return 502;
  }
  if (error instanceof DataNotFoundError) {
    return 404;
  }
  if (error instanceof ValidationError) {
    return 400;
  }
  return 500;
}

/**
 * Formats errors as JSON with message, code, and details
 * @param error - Error instance
 * @returns Formatted error response
 */
export function formatErrorResponse(error: Error): ErrorResponse {
  const response: ErrorResponse = {
    error: {
      message: error.message,
      code: error.name.replace(/Error$/, '').toUpperCase(),
    },
  };

  // Add details if available
  if (error instanceof AuthenticationError && error.details) {
    response.error.details = error.details;
  } else if (error instanceof ExternalAPIError) {
    response.error.details = {
      serviceName: error.serviceName,
      ...(error.details || {}),
    };
  } else if (error instanceof DataNotFoundError && error.details) {
    response.error.details = error.details;
  } else if (error instanceof ValidationError && error.details) {
    response.error.details = error.details;
  }

  return response;
}

/**
 * Logs error details with timestamp, error message, and context
 * @param error - Error instance
 * @param context - Additional context information
 */
export function logError(error: Error, context?: ErrorContext): void {
  const timestamp = new Date().toISOString();
  const errorType = error.name;
  const errorMessage = error.message;
  
  const logEntry = {
    timestamp,
    errorType,
    message: errorMessage,
    context: context || {},
    stack: error.stack,
  };

  // Log to console (in production, this would go to a logging service)
  console.error('[ERROR]', JSON.stringify(logEntry, null, 2));
}

/**
 * Handles errors by logging and formatting response
 * @param error - Error instance
 * @param context - Additional context information
 * @returns Object with status code and formatted error response
 */
export function handleError(
  error: Error,
  context?: ErrorContext
): { statusCode: number; body: ErrorResponse } {
  // Log the error (Requirement 5.4)
  logError(error, context);

  // Format and return error response (Requirement 5.5)
  const statusCode = getStatusCode(error);
  const body = formatErrorResponse(error);

  return { statusCode, body };
}
