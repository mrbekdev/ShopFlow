import { Module } from '@nestjs/common';
import { NonvoyService } from './nonvoy.service';
import { NonvoyController } from './nonvoy.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({ 
  imports: [PrismaModule],
  controllers: [NonvoyController],
  providers: [NonvoyService],
  exports: [NonvoyService],
})
export class NonvoyModule {}
