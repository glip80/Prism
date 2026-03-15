import { Request, Response } from 'express';
import { userService } from '../services/userService';

export class UserController {
  async createUser(req: Request, res: Response) {
    try {
      const { roles, ...userData } = req.body;
      const user = await userService.createUser(userData, roles || []);
      res.status(201).json(user);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getUser(req: Request, res: Response) {
    try {
      const user = await userService.getUserById(req.params.id as string);
      if (!user) {
         res.status(404).json({ error: 'User not found' });
         return;
      }
      
      const { password_hash, ...safeUser } = user;
      res.status(200).json(safeUser);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAllUsers(req: Request, res: Response) {
    try {
      const users = await userService.getAllUsers();
      res.status(200).json(users);
    } catch (error: any) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateUser(req: Request, res: Response) {
    try {
      const user = await userService.updateUser(req.params.id as string, req.body);
      if (!user) {
         res.status(404).json({ error: 'User not found' });
         return;
      }
      const { password_hash, ...safeUser } = user;
      res.status(200).json(safeUser);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteUser(req: Request, res: Response) {
    try {
      await userService.deleteUser(req.params.id as string);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export const userController = new UserController();
