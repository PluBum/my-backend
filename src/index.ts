import express from 'express';
import app from './app.js';

// Динамический импорт для AdminJS (ESM/CJS совместимость)
// @ts-ignore - .mjs файл без типов
const { admin, adminRouter } = await import('./admin/admin.mjs');

// Подключаем AdminJS
app.use(admin.options.rootPath, adminRouter);

// 404 handler (должен быть последним)
app.use(function notFoundHandler(_req: express.Request, res: express.Response) {
  return res.status(404).send({ message: "Not Found" });
});

// Start the application
const port = Number(process.env.PORT || 8080);

app.listen(port, () => {
  console.info('Express application started on port: ' + port);
  console.info(`Swagger UI: http://localhost:${port}/docs`);
  console.info(`AdminJS: http://localhost:${port}/admin`);
});
