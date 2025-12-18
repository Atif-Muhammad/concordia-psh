import {
  Body,
  Controller,
  Patch,
  Post,
  Get,
  Query,
  Req,
  Res,
  UseGuards,
  Delete,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { CreateAdminDto } from './dtos/create-admin.dto';
import { AuthService } from './auth.service';
import { LoginAdminDto } from './dtos/login-admin.dto';
import { JwtRefGuard } from 'src/common/guards/jwt-refresh.guard';
import { JwtAccGuard } from 'src/common/guards/jwt-access.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesEnum } from 'src/common/constants/roles.enum';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('create/super-admin')
  async createSuperAdmin(@Body() payload: CreateAdminDto) {
    return await this.authService.createSuperAdmin(payload);
  }

  @Post('login')
  async loginAdmin(@Body() payload: LoginAdminDto, @Res() res: Response) {
    const admin = await this.authService.login(payload);
    // console.log(admin)
    const { access_token, refresh_token } =
      await this.authService.generateTokens(admin);
    res.cookie('access_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });
    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    return res.status(200).json({
      message: 'Login successful',
      user: {
        ...admin,
        role: admin.role || 'Teacher'
      }
    });
  }

  @Post('logout')
  async logoutAdmin(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    return { message: 'Logout successful' };
  }

  @UseGuards(JwtRefGuard)
  @Post('refresh-tokens')
  async refreshTokens(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const clientType = req.headers['client-type'] || 'web';
    const { id, email, role, permissions } = req.user as {
      id: string | number;
      email: string;
      role: string;
      permissions: any;
    };
    const { access_token, refresh_token } =
      await this.authService.refreshTokens({ id, email, role, permissions });
    // for web
    if (clientType === 'web') {
      res.cookie('access_token', access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: true,
        maxAge: 24 * 60 * 60 * 1000,
      });
      res.cookie('refresh_token', refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      return { message: 'Login successful' };
    }
    // for mobile
    return { refresh_token: refresh_token, access_token: access_token };
  }

  @UseGuards(JwtAccGuard)
  @Get('user-who')
  async userWho(
    @Req()
    req: {
      user: {
        id: number | string;
        email: string;
        role?: string;
        permissions: any;
      };
    },
  ) {
    return {
      id: req.user?.id,
      role: req.user?.role,
      email: req.user?.email,
      permissions: req.user?.permissions,
    };
  }
}
