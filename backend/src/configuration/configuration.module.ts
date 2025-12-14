import { Module } from '@nestjs/common';
import { ConfigurationController } from './configuration.controller';
import { ConfigurationService } from './configuration.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  imports: [PrismaModule],
  controllers: [ConfigurationController],
  providers: [ConfigurationService, PrismaService],
})
export class ConfigurationModule {}
