import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserRole } from '@prisma/client';

class CreateUserDto {
  fullName: string;
  phone: string;
  username: string;
  password: string;
  role: UserRole;
  branchId: string;
}

class UpdateUserDto {
  fullName?: string;
  phone?: string;
  username?: string;
  password?: string;
  role?: UserRole;
  branchId?: string;
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
