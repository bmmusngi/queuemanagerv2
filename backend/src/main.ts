import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Configure CORS (Cross-Origin Resource Sharing)
  // This allows your React frontend (running on a different port) to securely make requests to this backend.
  // THIS IS THE FIX:
app.enableCors({
  origin: '*', // For development, allow everything. 
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  preflightContinue: false,
  optionsSuccessStatus: 204,
});

  // 2. Enable Global Validation
  // This turns on the class-validator decorators in your DTOs.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strips away any extra fields sent in the JSON that aren't defined in the DTO
      forbidNonWhitelisted: true, // Rejects the request entirely if the frontend sends undocumented fields
      transform: true, // Automatically transforms plain JSON payloads into instances of your DTO classes
    }),
  );

  // 3. Set Global API Prefix (Optional but highly recommended)
  // This changes your routes from `localhost:3001/sessions` to `localhost:3001/api/sessions`
  app.setGlobalPrefix('api');

  // Start the server on port 3001 to avoid conflicting with React's default port 3000
  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 Backend successfully running on: http://localhost:${port}/api`);
  
  await app.listen(3001);
}
bootstrap();