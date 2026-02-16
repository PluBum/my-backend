const { generateRoutes, generateSpec } = require('tsoa');
const fs = require('fs');
const path = require('path');

(async () => {
  const specOptions = {
    basePath: "/",
    entryFile: "src/app.ts",
    noImplicitAdditionalProperties: "throw-on-extras",
    bodyCoercion: true,
    controllerPathGlobs: ["src/**/*.router.ts"],
    outputDirectory: "tsoa",
    specVersion: 3,
    securityDefinitions: {
      jwt: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      }
    }
  };

  const routeOptions = {
    middleware: "express",
    basePath: "/",
    entryFile: "src/app.ts",
    noImplicitAdditionalProperties: "throw-on-extras",
    bodyCoercion: true,
    controllerPathGlobs: ["src/**/*.router.ts"],
    routesDir: "tsoa",
    authenticationModule: "src/middleware/authentication.ts"
  };

  await generateSpec(specOptions);
  await generateRoutes(routeOptions);

  // Fix ESM imports - add .js extension to local imports
  const routesPath = path.join(__dirname, 'tsoa', 'routes.ts');
  let content = fs.readFileSync(routesPath, 'utf8');
  
  // Add .js to imports from ./../src/ (relative paths without extension)
  content = content.replace(/from '(\.\/\.\.\/[^']+)'/g, (match, p1) => {
    if (p1.endsWith('.js')) return match;
    return `from '${p1}.js'`;
  });
  
  fs.writeFileSync(routesPath, content);
  console.log('ESM imports fixed in routes.ts');
})();
