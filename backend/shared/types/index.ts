export interface UserPayload {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  organization_id: string;
  roles: string[];
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  meta?: any;
}
