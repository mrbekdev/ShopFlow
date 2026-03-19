import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
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
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(@Request() req, @Query('shopId') shopId?: string) {
    const effectiveShopId = req.user.role === 'bigAdmin' ? shopId : req.user.shopId;
    return this.usersService.findAll(effectiveShopId);
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
