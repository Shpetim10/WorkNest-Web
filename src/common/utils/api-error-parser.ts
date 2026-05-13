import { toast } from 'sonner';
import { ApiErrorResponse } from '../types/api';
import { translate } from '../i18n/translate';

export interface ParseErrorOptions {
  toastId?: string | number;
  fallbackMessage?: string;
}

type ApiClientError = {
  message?: string;
  response?: {
    data?: ApiErrorResponse;
  };
};

/**
 * Shared frontend error parser
 * Maps backend error codes -> UI actions
 */
export function handleApiError(error: unknown, options?: ParseErrorOptions) {
  const fallback = options?.fallbackMessage || translate('common.feedback.unexpectedError');
  const toastId = options?.toastId;

  // Don't run on server
  if (typeof window === 'undefined') return;

  if (typeof error !== 'object' || error === null) {
    toast.error(fallback, { id: toastId });
    return;
  }

  const apiError = error as ApiClientError;
  const data = apiError.response?.data as ApiErrorResponse | undefined;
  
  if (!data) {
    toast.error(apiError.message || fallback, { id: toastId });
    return;
  }

  const { code, message, fieldErrors } = data;
  const displayMessage = message || fallback;
  
  // Maps code -> UI action
  switch (code) {
    case 'INVALID_CREDENTIALS':
      toast.error(displayMessage, { id: toastId });
      break;
    case 'ACCESS_DENIED':
      toast.error(displayMessage, { id: toastId });
      break;
    case 'RESOURCE_NOT_FOUND':
      toast.error(displayMessage, { id: toastId });
      break;
    case 'DUPLICATE_RESOURCE':
    case 'USER_EMAIL_ALREADY_EXISTS':
      toast.error(displayMessage, { id: toastId });
      break;
    case 'VALIDATION_ERROR':
      toast.error(displayMessage, { id: toastId });
      // Form-level rendering can optionally parse fieldErrors
      if (fieldErrors && fieldErrors.length > 0) {
        console.warn('Field validation errors:', fieldErrors);
      }
      break;
    case 'INTERNAL_ERROR':
      toast.error(displayMessage, { id: toastId });
      break;
    default:
      // Fallback for missing code or non-standard
      // If status is 401/403 (Auth/security failures) and handled by middleware, it will show up here
      toast.error(displayMessage, { id: toastId });
  }
}
