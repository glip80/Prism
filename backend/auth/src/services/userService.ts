import { AppDataSource } from '../database/config';
import { User } from '../models/user';
import { Role } from '../models/role';
import { hashPassword } from '../../../shared/utils/encryption';

export class UserService {
  private userRepository = AppDataSource.getRepository(User);
  private roleRepository = AppDataSource.getRepository(Role);

  async createUser(userData: Partial<User>, roleIds: string[]) {
    if (userData.password_hash) {
      userData.password_hash = await hashPassword(userData.password_hash);
    }

    const roles = await this.roleRepository.findByIds(roleIds);
    
    const user = this.userRepository.create({
      ...userData,
      roles
    });

    await this.userRepository.save(user);
    const { password_hash, ...safeUser } = user;
    return safeUser;
  }

  async getUserById(id: string) {
    return this.userRepository.findOne({
      where: { id },
      relations: ['roles', 'organization']
    });
  }

  async getAllUsers() {
    return this.userRepository.find({
      relations: ['roles', 'organization'],
      select: ['id', 'email', 'first_name', 'last_name', 'is_active', 'organization_id', 'created_at']
    });
  }

  async updateUser(id: string, updateData: Partial<User>) {
    if (updateData.password_hash) {
      updateData.password_hash = await hashPassword(updateData.password_hash);
    }
    
    await this.userRepository.update(id, updateData);
    return this.getUserById(id);
  }

  async deleteUser(id: string) {
    await this.userRepository.delete(id);
  }
}

export const userService = new UserService();
