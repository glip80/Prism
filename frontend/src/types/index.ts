import { Layout, LayoutSchema } from '../schemas/layoutSchema';

export type { Layout };
export { LayoutSchema };

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  organization_id: string;
  permissions: string[];
  roles: string[];
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface WidgetData {
  id: string;
  data: any;
  loading: boolean;
  error: string | null;
  lastUpdated: number;
}
