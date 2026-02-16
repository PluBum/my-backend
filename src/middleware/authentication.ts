import * as express from 'express';
import { verifyAccessToken, TokenPayload } from '../services/jwt.service.js';

/**
 * TSOA authentication middleware
 * Вызывается для роутов с декоратором @Security('jwt')
 */
export async function expressAuthentication(
  request: express.Request,
  securityName: string,
  _scopes?: string[]
): Promise<TokenPayload> {
  if (securityName === 'jwt') {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new Error('Отсутствует заголовок Authorization');
    }

    // Формат: "Bearer <token>"
    const [bearer, token] = authHeader.split(' ');

    if (bearer !== 'Bearer' || !token) {
      throw new Error('Неверный формат токена. Используйте: Bearer <token>');
    }

    const payload = verifyAccessToken(token);

    if (!payload) {
      throw new Error('Невалидный или истёкший токен');
    }

    return payload;
  }

  throw new Error(`Неизвестный тип аутентификации: ${securityName}`);
}
