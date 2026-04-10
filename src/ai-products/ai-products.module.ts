import { Module } from '@nestjs/common';
import { AiProductsController } from './ai-products.controller';
import { AiProductsService } from './ai-products.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AiProductsController],
  providers: [AiProductsService],
  exports: [AiProductsService],
})
export class AiProductsModule {}
