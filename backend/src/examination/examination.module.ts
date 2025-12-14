import { Module } from '@nestjs/common';
import { ExaminationController } from './examination.controller';
import { ExaminationService } from './examination.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ExaminationController],
  providers: [ExaminationService],
})
export class ExaminationModule {}
