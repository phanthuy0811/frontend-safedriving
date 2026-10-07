export interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  data?: T;
  errorCode?: string;
  timestamp?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}
