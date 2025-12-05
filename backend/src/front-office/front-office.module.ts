import { Module } from '@nestjs/common';
import { FrontOfficeController } from './front-office.controller';
import { FrontOfficeService } from './front-office.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports:[PrismaModule],
  controllers: [FrontOfficeController],
  providers: [FrontOfficeService]
})
export class FrontOfficeModule {}
