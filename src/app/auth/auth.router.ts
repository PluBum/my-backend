import { Body, Controller, Post, Route, Tags, Security, Request } from 'tsoa';
import { 
  registerUser, 
  loginUser, 
  refreshUserTokens, 
  logoutUser, 
  logoutAllDevices,
  AuthResponse, 
  RefreshResponse 
} from './auth.service.js';
import express from 'express';

interface AuthBody {
  email: string;
  password: string;
}

interface RefreshBody {
  refreshToken: string;
}

@Tags('Auth')
@Route('/api/auth')
export class AuthController extends Controller {

  /**
   * Регистрация нового пользователя
   * Возвращает данные пользователя и пару токенов (access + refresh)
   */
  @Post('/register')
  public async register(@Body() body: AuthBody): Promise<AuthResponse> {
    const result = await registerUser(body.email, body.password);
    
    if (!result.success) {
      this.setStatus(400);
    }
    
    return result;
  }

  /**
   * Вход в систему
   * Возвращает данные пользователя и пару токенов (access + refresh)
   */
  @Post('/login')
  public async login(@Body() body: AuthBody): Promise<AuthResponse> {
    const result = await loginUser(body.email, body.password);
    
    if (!result.success) {
      this.setStatus(401);
    }
    
    return result;
  }

  /**
   * Обновление токенов
   * Принимает refresh токен, возвращает новую пару токенов
   */
  @Post('/refresh')
  public async refresh(@Body() body: RefreshBody): Promise<RefreshResponse> {
    const result = await refreshUserTokens(body.refreshToken);
    
    if (!result.success) {
      this.setStatus(401);
    }
    
    return result;
  }

  /**
   * Выход из системы
   * Отзывает refresh токен
   */
  @Post('/logout')
  public async logout(@Body() body: RefreshBody): Promise<{ success: boolean; message: string }> {
    return logoutUser(body.refreshToken);
  }

  /**
   * Выход со всех устройств
   * Требует авторизации, отзывает все refresh токены пользователя
   */
  @Security('jwt')
  @Post('/logout-all')
  public async logoutAll(@Request() req: express.Request): Promise<{ success: boolean; message: string }> {
    const userId = (req as any).user?.userId;
    
    if (!userId) {
      this.setStatus(401);
      return { success: false, message: 'Не авторизован' };
    }
    
    return logoutAllDevices(userId);
  }
}
