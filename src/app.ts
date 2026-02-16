import express, { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { ValidateError } from 'tsoa';
import { RegisterRoutes } from '../tsoa/routes.js';
import session from 'express-session';

const app: Express = express();

// Сессии для AdminJS
app.use(session({
  secret: process.env.SESSION_SECRET || 'super-secret-session-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // В продакшене поставить true с HTTPS
}));

/************************************************************************************
 *                              Basic Express Middlewares
 ***********************************************************************************/

app.set('json spaces', 4);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Handle logs in console during development
if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
  app.use(cors());
}

// Handle security and origin in production
if (process.env.NODE_ENV === 'production') {
  app.use(helmet());
  app.use(cors()); // Добавляем CORS и для продакшена
}

/************************************************************************************
 *                               Register all routes
 ***********************************************************************************/

RegisterRoutes(app);

import swaggerJson from '../tsoa/swagger.json' with { type: 'json' };
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerJson));

/************************************************************************************
 *                               Express Error Handling
 ***********************************************************************************/

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof ValidateError) {
    console.error(`Caught Validation Error for ${req.path}:`, err.fields);
    return res.status(422).json({
      message: "Validation Failed",
      details: err?.fields,
    });
  }
  if (err instanceof Error) {
    return res.status(500).json({
      errorName: err.name,
      message: err.message,
      stack: err.stack || 'no stack defined'
    });
  }
  next();
});

// notFoundHandler перенесён в index.ts (после AdminJS)

export const prisma = new PrismaClient();
export default app;
