import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Set the global prefix (Matches your current logs)
  app.setGlobalPrefix('api');

  // 2. Enable CORS (Unlocks the gates for secure cross-origin requests)
  app.enableCors({
    origin: true, // Echoes the requesting origin - required for credentials: true with diverse funnel addresses
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // 3. Start the server (ONLY ONE LISTEN CALL)
  const port = 3001;
  await app.listen(port);

  console.log(`✅ Backend is live at: https://shirostor.tailf23fe.ts.net:3001/api`);
}
bootstrap();
