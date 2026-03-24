import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Set the global prefix (Matches your current logs)
  app.setGlobalPrefix('api');

  // 2. Enable CORS (Unlocks the gates for the tablet)
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // 3. Start the server (ONLY ONE LISTEN CALL)
  const port = 3001;
  await app.listen(port);
  
  console.log(`✅ Backend is live at: http://100.88.175.25:${port}/api`);
}
bootstrap();
