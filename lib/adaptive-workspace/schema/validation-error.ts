export class ValidationError extends Error {
  readonly code: string;
  readonly details?: unknown;

  constructor(code: string, message: string, details?: unknown) {
    super(message);
    this.name = "ValidationError";
    this.code = code;
    this.details = details;
  }
}

export class RecoverableResolutionError extends Error {
  readonly code: string;
  readonly details?: unknown;

  constructor(code: string, message: string, details?: unknown) {
    super(message);
    this.name = "RecoverableResolutionError";
    this.code = code;
    this.details = details;
  }
}

export class HardContractViolation extends Error {
  readonly code: string;
  readonly details?: unknown;

  constructor(code: string, message: string, details?: unknown) {
    super(message);
    this.name = "HardContractViolation";
    this.code = code;
    this.details = details;
  }
}
