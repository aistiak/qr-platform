/**
 * TypeScript types for API responses
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page?: number;
  limit?: number;
  hasMore?: boolean;
}

export interface ErrorResponse {
  success: false;
  error: string;
  message?: string;
}

export interface SuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}
