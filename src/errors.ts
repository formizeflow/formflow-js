export type ErrorCode =
  | "bad_request" | "validation_failed" | "unauthenticated" | "forbidden" | "not_found" | "conflict" | "rate_limited"
  | "entitlement_exceeded" | "payload_too_large" | "unsupported" | "integration_error" | "internal";

export class FormFlowError extends Error {
  constructor(public readonly status: number, public readonly code: ErrorCode | string, message: string, public readonly details?: unknown, public readonly requestId?: string) {
    super(message);
    this.name = "FormFlowError";
  }
}
export class AuthenticationError extends FormFlowError { constructor(...a: ConstructorParameters<typeof FormFlowError>) { super(...a); this.name = "AuthenticationError"; } }
export class PermissionError extends FormFlowError { constructor(...a: ConstructorParameters<typeof FormFlowError>) { super(...a); this.name = "PermissionError"; } }
export class NotFoundError extends FormFlowError { constructor(...a: ConstructorParameters<typeof FormFlowError>) { super(...a); this.name = "NotFoundError"; } }
export class ConflictError extends FormFlowError { constructor(...a: ConstructorParameters<typeof FormFlowError>) { super(...a); this.name = "ConflictError"; } }
export class ValidationError extends FormFlowError { constructor(...a: ConstructorParameters<typeof FormFlowError>) { super(...a); this.name = "ValidationError"; } }
export class RateLimitError extends FormFlowError {
  constructor(status: number, code: string, message: string, details: unknown, requestId: string | undefined, public readonly retryAfterSec?: number) {
    super(status, code, message, details, requestId);
    this.name = "RateLimitError";
  }
}

export function errorFor(status: number, body: unknown, requestId?: string, retryAfter?: number): FormFlowError {
  const e = (body as { error?: { code?: string; message?: string; details?: unknown } } | null)?.error;
  const code = e?.code ?? "internal";
  const msg = e?.message ?? `Request failed with status ${status}`;
  if (status === 401) return new AuthenticationError(status, code, msg, e?.details, requestId);
  if (status === 403) return new PermissionError(status, code, msg, e?.details, requestId);
  if (status === 404) return new NotFoundError(status, code, msg, e?.details, requestId);
  if (status === 409) return new ConflictError(status, code, msg, e?.details, requestId);
  if (status === 422) return new ValidationError(status, code, msg, e?.details, requestId);
  if (status === 429) return new RateLimitError(status, code, msg, e?.details, requestId, retryAfter);
  return new FormFlowError(status, code, msg, e?.details, requestId);
}
