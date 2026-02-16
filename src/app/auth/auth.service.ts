import bcrypt from 'bcrypt';
import { prisma } from '../../app.js';
import { generateTokenPair, refreshTokens, revokeRefreshToken, revokeAllUserTokens, TokenPair } from '../../services/jwt.service.js';

const SALT_ROUNDS = 10;

// Типы для ответов
export interface AuthResponse {
  success: boolean;
  message: string;
  user?: {
    id: number;
    email: string;
    createdAt: Date;
  };
  tokens?: TokenPair;
}

export interface RefreshResponse {
  success: boolean;
  message: string;
  tokens?: TokenPair;
}

// Регистрация пользователя
export const registerUser = async (email: string, password: string): Promise<AuthResponse> => {
  // Проверяем, существует ли пользователь
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    return {
      success: false,
      message: 'Пользователь с таким email уже существует'
    };
  }

  // Хешируем пароль
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  // Создаём пользователя
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword
    }
  });

  // Генерируем токены сразу после регистрации
  const tokens = await generateTokenPair(user.id, user.email);

  return {
    success: true,
    message: 'Пользователь успешно зарегистрирован',
    user: {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt
    },
    tokens
  };
};

// Логин пользователя
export const loginUser = async (email: string, password: string): Promise<AuthResponse> => {
  // Ищем пользователя
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    return {
      success: false,
      message: 'Неверный email или пароль'
    };
  }

  // Проверяем пароль
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return {
      success: false,
      message: 'Неверный email или пароль'
    };
  }

  // Генерируем токены
  const tokens = await generateTokenPair(user.id, user.email);

  return {
    success: true,
    message: 'Успешный вход',
    user: {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt
    },
    tokens
  };
};

// Обновление токенов
export const refreshUserTokens = async (refreshToken: string): Promise<RefreshResponse> => {
  const tokens = await refreshTokens(refreshToken);

  if (!tokens) {
    return {
      success: false,
      message: 'Невалидный или истёкший refresh токен'
    };
  }

  return {
    success: true,
    message: 'Токены успешно обновлены',
    tokens
  };
};

// Выход (отзыв токена)
export const logoutUser = async (refreshToken: string): Promise<{ success: boolean; message: string }> => {
  const revoked = await revokeRefreshToken(refreshToken);

  return {
    success: revoked,
    message: revoked ? 'Успешный выход' : 'Токен не найден'
  };
};

// Выход со всех устройств
export const logoutAllDevices = async (userId: number): Promise<{ success: boolean; message: string }> => {
  await revokeAllUserTokens(userId);

  return {
    success: true,
    message: 'Выход со всех устройств выполнен'
  };
};
