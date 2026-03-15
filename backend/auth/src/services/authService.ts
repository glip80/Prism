import jwt from 'jsonwebtoken';
import { AppDataSource } from '../database/config';
import { User } from '../models/user';
import { verifyPassword, hashPassword } from '../../../shared/utils/encryption';
import { logger } from '../../../shared/utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_change_in_production';
const JWT_EXPIRES_IN = '24h';

export class AuthService {
  private userRepository = AppDataSource.getRepository(User);

  async login(email: string, passwordString: string) {
    if (!email || !passwordString) {
      throw new Error('Email and password must be provided');
    }

    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['roles', 'organization']
    });

    if (!user || !user.is_active) {
      logger.warn(`Login failed for email: ${email}`);
      throw new Error('Invalid credentials');
    }

    const isValid = await verifyPassword(passwordString, user.password_hash);
    if (!isValid) {
      logger.warn(`Invalid password for email: ${email}`);
      throw new Error('Invalid credentials');
    }

    // Generate token
    const tokenPayload = {
      id: user.id,
      email: user.email,
      organization_id: user.organization_id,
      roles: user.roles.map(r => r.name)
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    // Sanitize user for response
    const { password_hash, ...safeUser } = user;

    return { token, user: safeUser };
  }
}

export const authService = new AuthService();
