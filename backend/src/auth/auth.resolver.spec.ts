import { Test, TestingModule } from '@nestjs/testing';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';
import { User } from '../users/user.schema';

describe('AuthResolver', () => {
  let resolver: AuthResolver;
  let service: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    refreshTokens: jest.fn(),
    logout: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthResolver,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    resolver = module.get<AuthResolver>(AuthResolver);
    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('register', () => {
    it('should call authService.register and return the payload', async () => {
      const input = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test User',
      };
      const result = {
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
        user: { username: 'testuser' } as User,
      };
      mockAuthService.register.mockResolvedValue(result);

      expect(await resolver.register(input)).toEqual(result);
      expect(service.register).toHaveBeenCalledWith(input);
    });
  });

  describe('login', () => {
    it('should call authService.login and return the payload', async () => {
      const input = { identity: 'testuser', password: 'password123' };
      const result = {
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
        user: { username: 'testuser' } as User,
      };
      mockAuthService.login.mockResolvedValue(result);

      expect(await resolver.login(input)).toEqual(result);
      expect(service.login).toHaveBeenCalledWith(input);
    });
  });

  describe('refreshTokens', () => {
    it('should call authService.refreshTokens and return the payload', async () => {
      const result = {
        accessToken: 'new_access_token',
        refreshToken: 'new_refresh_token',
        user: { username: 'testuser' } as User,
      };
      mockAuthService.refreshTokens.mockResolvedValue(result);

      expect(
        await resolver.refreshTokens('user_id', 'old_refresh_token'),
      ).toEqual(result);
      expect(service.refreshTokens).toHaveBeenCalledWith(
        'user_id',
        'old_refresh_token',
      );
    });
  });

  describe('logout', () => {
    it('should call authService.logout and return boolean', async () => {
      mockAuthService.logout.mockResolvedValue(true);

      expect(await resolver.logout({ _id: 'user_id' } as any)).toBe(true);
      expect(service.logout).toHaveBeenCalledWith('user_id');
    });
  });
});
