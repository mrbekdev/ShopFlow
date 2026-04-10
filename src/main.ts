import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { networkInterfaces } from 'os';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: true,
    credentials: true,
  });

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');
    try {
    const nets = networkInterfaces();
    const addresses: string[] = [];
    for (const name of Object.keys(nets)) {
      for (const net of nets[name] || []) {
        if (net.family === 'IPv4' && !net.internal) {
          addresses.push(net.address);
        }
      }
    }
    const localUrl = `http://localhost:${port}/`;
    const ip = addresses[0];
    const networkUrl = ip ? `http://${ip}:${port}/` : null;
    console.log('Local URL:', localUrl);
    console.log('Network URL:', networkUrl);
    if (networkUrl) {
    }
  } catch {}
}
bootstrap();

