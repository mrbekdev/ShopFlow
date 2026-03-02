import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { BranchesModule } from './branches/branches.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { SalesModule } from './sales/sales.module';
import { DebtsModule } from './debts/debts.module';
import { ReturnsModule } from './returns/returns.module';
import { TransfersModule } from './transfers/transfers.module';
import { NonvoyModule } from './nonvoy/nonvoy.module';

import { SeedService } from './seed/seed.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule, // 👈 bu yetarli
    AuthModule,
    BranchesModule,
    UsersModule,
    ProductsModule,
    SalesModule,
    DebtsModule,
    ReturnsModule,
    TransfersModule,
    NonvoyModule,
  ],
  controllers: [AppController],
  providers: [AppService, SeedService],
})
export class AppModule {}