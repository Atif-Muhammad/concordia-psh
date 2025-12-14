import { Module } from '@nestjs/common';
import { HrController } from './hr.controller';
import { HrService } from './hr.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [HrController],
  providers: [HrService],
})
export class HrModule {}
