import { Module } from '@nestjs/common';
import { NonService } from './non.service';
import { NonController } from './non.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [NonController],
  providers: [NonService],
  exports: [NonService],
})
export class NonModule {}
