import jwt, { SignOptions } from 'jsonwebtoken';
import { prisma } from '../app.js';

// Конфигурация из переменных окружения
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'default-access-secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'default-refresh-secret';

// Время жизни токенов в секундах
const ACCESS_EXPIRES_IN_SEC = 15 * 60; // 15 минут
const REFRESH_EXPIRES_IN_SEC = 7 * 24 * 60 * 60; // 7 дней

// Payload токена
export interface TokenPayload {
  userId: number;
  email: string;
}

// Ответ с токенами
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Генерация access токена (короткоживущий)
 */
export const generateAccessToken = (payload: TokenPayload): string => {
  const options: SignOptions = { expiresIn: ACCESS_EXPIRES_IN_SEC };
  return jwt.sign(payload, ACCESS_SECRET, options);
};

/**
 * Генерация refresh токена (долгоживущий)
 */
export const generateRefreshToken = (payload: TokenPayload): string => {
  const options: SignOptions = { expiresIn: REFRESH_EXPIRES_IN_SEC };
  return jwt.sign(payload, REFRESH_SECRET, options);
};

/**
 * Генерация пары токенов + сохранение refresh в БД
 */
export const generateTokenPair = async (userId: number, email: string): Promise<TokenPair> => {
  const payload: TokenPayload = { userId, email };
  
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);
  
  // Вычисляем дату истечения refresh токена
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 дней
  
  // Сохраняем refresh токен в БД
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId,
      expiresAt
    }
  });
  
  return { accessToken, refreshToken };
};

/**
 * Верификация access токена
 */
export const verifyAccessToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, ACCESS_SECRET) as TokenPayload;
  } catch {
    return null;
  }
};

/**
 * Верификация refresh токена
 */
export const verifyRefreshToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, REFRESH_SECRET) as TokenPayload;
  } catch {
    return null;
  }
};

/**
 * Обновление токенов по refresh токену
 */
export const refreshTokens = async (refreshToken: string): Promise<TokenPair | null> => {
  // Проверяем валидность токена
  const payload = verifyRefreshToken(refreshToken);
  if (!payload) {
    return null;
  }
  
  // Проверяем, есть ли токен в БД и не истёк ли он
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshToken }
  });
  
  if (!storedToken || storedToken.expiresAt < new Date()) {
    return null;
  }
  
  // Удаляем старый refresh токен
  await prisma.refreshToken.delete({
    where: { id: storedToken.id }
  });
  
  // Генерируем новую пару токенов
  return generateTokenPair(payload.userId, payload.email);
};

/**
 * Отзыв refresh токена (logout)
 */
export const revokeRefreshToken = async (refreshToken: string): Promise<boolean> => {
  try {
    await prisma.refreshToken.delete({
      where: { token: refreshToken }
    });
    return true;
  } catch {
    return false;
  }
};

/**
 * Отзыв всех refresh токенов пользователя (logout everywhere)
 */
export const revokeAllUserTokens = async (userId: number): Promise<void> => {
  await prisma.refreshToken.deleteMany({
    where: { userId }
  });
};
