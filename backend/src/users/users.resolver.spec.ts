import { Test, TestingModule } from '@nestjs/testing';
import { UsersResolver } from './users.resolver';
import { UsersService } from './users.service';
import { User } from './user.schema';

describe('UsersResolver', () => {
  let resolver: UsersResolver;
  let service: UsersService;

  const mockUsersService = {
    findByUsername: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersResolver,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    resolver = module.get<UsersResolver>(UsersResolver);
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('me', () => {
    it('should return current user', () => {
      const user = { username: 'testuser' } as User;
      expect(resolver.me(user)).toEqual(user);
    });
  });

  describe('user', () => {
    it('should call usersService.findByUsername and return user', async () => {
      const user = { username: 'testuser' } as User;
      mockUsersService.findByUsername.mockResolvedValue(user);

      expect(await resolver.user('testuser')).toEqual(user);
      expect(service.findByUsername).toHaveBeenCalledWith('testuser');
    });
  });

  describe('updateProfile', () => {
    it('should call usersService.update and return updated user', async () => {
      const user = { _id: 'user_id', username: 'testuser' } as any;
      const updatedUser = {
        username: 'testuser',
        displayName: 'New Name',
      } as User;
      mockUsersService.update.mockResolvedValue(updatedUser);

      expect(await resolver.updateProfile(user, 'New Name', 'new bio')).toEqual(
        updatedUser,
      );
      expect(service.update).toHaveBeenCalledWith('user_id', {
        displayName: 'New Name',
        bio: 'new bio',
      });
    });
  });
});
