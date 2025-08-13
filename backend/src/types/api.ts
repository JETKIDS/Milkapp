export interface ErrorResponse {
  success: false;
  error: { code: string; message: string; details?: any };
}

export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}


