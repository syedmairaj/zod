/**
 * Shared domain errors for control-plane packages.
 * Do not put provider secrets or raw webhook bodies in error messages.
 */

export class AppError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status = 500) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super("unauthorized", message, 401);
    this.name = "UnauthorizedError";
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Bad request") {
    super("bad_request", message, 400);
    this.name = "BadRequestError";
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict") {
    super("conflict", message, 409);
    this.name = "ConflictError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found") {
    super("not_found", message, 404);
    this.name = "NotFoundError";
  }
}
