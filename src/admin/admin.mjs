// Динамические импорты для совместимости ESM/CJS
const AdminJSModule = await import('adminjs');
const AdminJS = AdminJSModule.default;

const AdminJSExpress = await import('@adminjs/express');
const { Database, Resource, getModelByName } = await import('@adminjs/prisma');
const { PrismaClient, Prisma } = await import('@prisma/client');

// Регистрируем адаптер Prisma
AdminJS.registerAdapter({ Database, Resource });

const prisma = new PrismaClient();

// Получаем DMMF для доступа к моделям (Prisma 5+)
const dmmf = Prisma.dmmf;

// Хелпер для получения модели по имени
const getModel = (name) => dmmf.datamodel.models.find(m => m.name === name);

// Настройка AdminJS
export const admin = new AdminJS({
  resources: [
    {
      resource: { model: getModel('User'), client: prisma },
      options: {
        navigation: { name: 'Пользователи', icon: 'User' },
        listProperties: ['id', 'email', 'createdAt'],
        editProperties: ['email', 'password'],
        showProperties: ['id', 'email', 'createdAt'],
        filterProperties: ['id', 'email', 'createdAt'],
      },
    },
    {
      resource: { model: getModel('Role'), client: prisma },
      options: {
        navigation: { name: 'Роли', icon: 'Shield' },
        listProperties: ['id', 'role', 'userId'],
        editProperties: ['role', 'userId'],
      },
    },
    {
      resource: { model: getModel('RefreshToken'), client: prisma },
      options: {
        navigation: { name: 'Токены', icon: 'Key' },
        listProperties: ['id', 'userId', 'expiresAt', 'createdAt'],
        actions: {
          // Запрещаем создание токенов вручную
          new: { isAccessible: false },
          edit: { isAccessible: false },
        },
      },
    },
  ],
  rootPath: '/admin',
  branding: {
    companyName: 'My Backend Admin',
    logo: false,
  },
});

// Роутер AdminJS (без аутентификации для начала)
export const adminRouter = AdminJSExpress.default.buildRouter(admin);
