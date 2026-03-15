import { AppDataSource } from '../database/config';
import { Role } from '../models/role';

export class RoleService {
  private roleRepository = AppDataSource.getRepository(Role);

  async createRole(name: string, description: string, permissions: string[]) {
    const role = this.roleRepository.create({
      name,
      description,
      permissions
    });
    
    return this.roleRepository.save(role);
  }

  async getRoleById(id: string) {
    return this.roleRepository.findOne({ where: { id } });
  }

  async getAllRoles() {
    return this.roleRepository.find();
  }

  async updateRole(id: string, updateData: Partial<Role>) {
    await this.roleRepository.update(id, updateData);
    return this.getRoleById(id);
  }

  async deleteRole(id: string) {
    await this.roleRepository.delete(id);
  }
}

export const roleService = new RoleService();
