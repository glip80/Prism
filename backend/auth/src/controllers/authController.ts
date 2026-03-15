import { Request, Response } from 'express';
import { authService } from '../services/authService';

export class AuthController {
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      
      res.status(200).json(result);
    } catch (error: any) {
      if (error.message === 'Email and password must be provided' || error.message === 'Invalid credentials') {
         res.status(401).json({ error: error.message });
         return;
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async logout(req: Request, res: Response) {
    // With stateless JWTs, logout is typically handled client-side by dropping the token.
    // If blacklisting is needed, it goes here.
    res.status(200).json({ message: 'Logged out successfully' });
  }

  async me(req: Request, res: Response) {
    const user = (req as any).user;
    res.status(200).json(user);
  }

  async checkPermission(req: Request, res: Response) {
    const user = (req as any).user;
    const { permission } = req.body;

    if (!user || (!user.roles.includes('*') && !user.roles.includes(permission))) {
      // Typically, permissions are flattened into roles array in the JWT for speed
      // Or checked against RBAC middleware. This is just a basic fallback test.
      res.status(200).json({ has_permission: false });
      return;
    }

    res.status(200).json({ has_permission: true });
  }
}

export const authController = new AuthController();
