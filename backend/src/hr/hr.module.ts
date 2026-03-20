import { Module } from '@nestjs/common';
import { HrController } from './hr.controller';
import { HrService } from './hr.service';
import { PrismaModule } from 'src/prisma/prisma.module';

import { LocalFileModule } from 'src/local-file/local-file.module';

@Module({
  imports: [PrismaModule, LocalFileModule],
  controllers: [HrController],
  providers: [HrService],
})
export class HrModule {}
