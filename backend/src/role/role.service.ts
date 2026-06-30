import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Auth } from '../auth/auth.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Role } from './role.entity';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(Auth)
    private readonly authRepo: Repository<Auth>,
  ) {}

  findAll() {
    return this.roleRepo.find({ order: { isSystem: 'DESC', name: 'ASC' } });
  }

  async findActiveByName(name: string) {
    const role = await this.roleRepo.findOne({
      where: { name: this.normalizeName(name), isActive: true },
    });
    if (!role) throw new BadRequestException('Selected role is not available');
    return role;
  }

  async create(dto: CreateRoleDto) {
    const name = this.normalizeName(dto.name);
    const existing = await this.roleRepo.findOne({ where: { name } });
    if (existing) throw new ConflictException('Role already exists');

    return this.roleRepo.save(
      this.roleRepo.create({
        name,
        description: dto.description?.trim() || null,
        isSystem: false,
        isActive: true,
      }),
    );
  }

  async update(id: number, dto: UpdateRoleDto) {
    const role = await this.getById(id);
    const nextName = dto.name ? this.normalizeName(dto.name) : role.name;

    if (role.isSystem && nextName !== role.name) {
      throw new BadRequestException('System role names cannot be changed');
    }
    if (dto.isActive === false && role.isSystem) {
      throw new BadRequestException('System roles cannot be disabled');
    }
    if (nextName !== role.name) {
      const existing = await this.roleRepo.findOne({
        where: { name: nextName },
      });
      if (existing) throw new ConflictException('Role already exists');
      await this.authRepo.update({ role: role.name }, { role: nextName });
      role.name = nextName;
    }

    if (dto.description !== undefined) {
      role.description = dto.description.trim() || null;
    }
    if (dto.isActive !== undefined) role.isActive = dto.isActive;
    return this.roleRepo.save(role);
  }

  async remove(id: number) {
    const role = await this.getById(id);
    if (role.isSystem) {
      throw new BadRequestException('System roles cannot be deleted');
    }
    const assignedUsers = await this.authRepo.count({
      where: { role: role.name },
    });
    if (assignedUsers > 0) {
      throw new ConflictException(
        `Role is assigned to ${assignedUsers} account(s) and cannot be deleted`,
      );
    }
    await this.roleRepo.remove(role);
    return { message: 'Role deleted successfully' };
  }

  private async getById(id: number) {
    const role = await this.roleRepo.findOne({ where: { id } });
    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  private normalizeName(name: string) {
    return name.trim().toLowerCase().replace(/\s+/g, '_');
  }
}
