import { Body, Controller, Delete, Get, Post, Put, Query, Route, Tags, Security } from 'tsoa';
import { getAllUser, createUser, updateUser, deleteUser } from './user.service.js';
import { User } from '@prisma/client';

@Tags('User Management')
@Route('/api/users')
@Security('jwt')  // Все эндпоинты этого контроллера требуют авторизации
export class UserController extends Controller {

  /**
   * Получить всех пользователей
   * Требует авторизации
   */
  @Get('/')
  public async getAllUser(): Promise<(User & { role: { role: string }[] })[]> {
    return getAllUser()
  }

  /**
   * Создать пользователя
   * Требует авторизации
   */
  @Post('/')
  public async createUser(@Body() body: { email: string, password: string, roles: { role: string }[] }): Promise<User> {
    return createUser({ email: body.email, password: body.password, roles: body.roles });
  }

  /**
   * Обновить пользователя
   * Требует авторизации
   */
  @Put('/{id}')
  public async updateUser(@Query('id') id: string, @Body() body: { email: string, roles: { role: string }[] }): Promise<User> {
    return updateUser({ id: Number(id), email: body.email, roles: body.roles });
  }

  /**
   * Удалить пользователя
   * Требует авторизации
   */
  @Delete('/{id}')
  public async deleteUser(@Query('id') id: string): Promise<User> {
    return deleteUser({ id: Number(id) });
  }

}

