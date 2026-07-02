import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async register(registerInput: any): Promise<any> {
    const existingEmail = await this.usersService.findByEmail(
      registerInput.email,
    );
    if (existingEmail) {
      throw new BadRequestException('Email already in use');
    }

    const existingUsername = await this.usersService.findByUsername(
      registerInput.username,
    );
    if (existingUsername) {
      throw new BadRequestException('Username already taken');
    }

    const hashedPassword = await this.hashPassword(registerInput.password);
    const user = await this.usersService.create({
      ...registerInput,
      password: hashedPassword,
    });

    const tokens = await this.generateTokens(
      user._id.toString(),
      user.username,
    );
    await this.usersService.updateRefreshToken(
      user._id.toString(),
      tokens.refreshToken,
    );

    return {
      ...tokens,
      user,
    };
  }

  async login(loginInput: any): Promise<any> {
    // identity can be email or username
    const user =
      (await this.usersService.findByEmail(loginInput.identity)) ||
      (await this.usersService.findByUsername(loginInput.identity));

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginInput.password,
      user.password || '',
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(
      user._id.toString(),
      user.username,
    );
    await this.usersService.updateRefreshToken(
      user._id.toString(),
      tokens.refreshToken,
    );

    return {
      ...tokens,
      user,
    };
  }

  async refreshTokens(userId: string, refreshToken: string): Promise<any> {
    const user = await this.usersService.findById(userId);
    if (!user || !user.refreshToken || user.refreshToken !== refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = await this.generateTokens(
      user._id.toString(),
      user.username,
    );
    await this.usersService.updateRefreshToken(
      user._id.toString(),
      tokens.refreshToken,
    );

    return {
      ...tokens,
      user,
    };
  }

  async logout(userId: string): Promise<boolean> {
    await this.usersService.updateRefreshToken(userId, null);
    return true;
  }

  async generateTokens(userId: string, username: string) {
    const accessToken = await this.jwtService.signAsync(
      { sub: userId, username },
      {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '15m',
      },
    );

    const refreshToken = await this.jwtService.signAsync(
      { sub: userId },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      },
    );

    return { accessToken, refreshToken };
  }
}
