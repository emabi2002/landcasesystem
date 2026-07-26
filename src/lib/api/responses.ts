export type ApiSuccess<T> = {
  success: true;
  data: T;
  warnings?: string[];
};

export type ApiFailure = {
  success: false;
  error: {
    code: string;
    message: string;
    requestId?: string;
    fieldErrors?: Record<string, string[]>;
  };
};

export function createRequestId() {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function apiSuccess<T>(data: T, warnings?: string[]): ApiSuccess<T> {
  return warnings?.length ? { success: true, data, warnings } : { success: true, data };
}

export function apiFailure(
  code: string,
  message: string,
  requestId?: string,
  fieldErrors?: Record<string, string[]>,
): ApiFailure {
  return {
    success: false,
    error: {
      code,
      message,
      ...(requestId ? { requestId } : {}),
      ...(fieldErrors ? { fieldErrors } : {}),
    },
  };
}

export function databaseErrorToHttp(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || 'Unexpected error');

  if (message.includes('AUTH_REQUIRED')) return { status: 401, code: 'UNAUTHENTICATED', message: 'Authentication is required.' };
  if (message.includes('PERMISSION_DENIED') || message.includes('ACCESS_DENIED') || message.includes('NOT_ASSIGNED_TO_CASE')) {
    return { status: 403, code: 'FORBIDDEN', message: 'You are not authorised to perform this action.' };
  }
  if (message.includes('NOT_FOUND')) return { status: 404, code: 'NOT_FOUND', message: 'The requested record was not found.' };
  if (message.includes('INVALID_WORKFLOW') || message.includes('NOT_IN_DRAFTING') || message.includes('NOT_UNDER_REVIEW') || message.includes('NOT_APPROVED')) {
    return { status: 409, code: 'WORKFLOW_CONFLICT', message: 'The record is not in the required workflow state.' };
  }
  if (message.includes('REQUIRED') || message.includes('VALIDATION') || message.includes('NO_SUBMITTABLE')) {
    return { status: 422, code: 'BUSINESS_RULE_FAILED', message: 'The request does not satisfy the required business rules.' };
  }

  return { status: 500, code: 'SERVER_ERROR', message: 'The operation could not be completed.' };
}
