/**
 * Standard API error response matching Spring Boot global exception handler
 */
export interface ApiErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  errorCode?: string;
  errors?: Record<string, string>; // Validation errors (field: message)
}

/**
 * Standard Paginated Response metadata matching Spring Boot Page/PageImpl
 */
export interface PaginatedResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
}

/**
 * Generic API success response (if used beyond raw body)
 */
export interface ApiResponse<T> {
  data: T;
  message?: string;
}
