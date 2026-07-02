import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsResolver } from './notifications.resolver';
import { NotificationsService } from './notifications.service';
import { Notification } from './notifications.schema';
import { User } from '../users/user.schema';

describe('NotificationsResolver', () => {
  let resolver: NotificationsResolver;
  let service: NotificationsService;

  const mockNotificationsService = {
    getNotifications: jest.fn(),
    markAsRead: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsResolver,
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
      ],
    }).compile();

    resolver = module.get<NotificationsResolver>(NotificationsResolver);
    service = module.get<NotificationsService>(NotificationsService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('notifications', () => {
    it('should call notificationsService.getNotifications and return list', async () => {
      const user = { _id: 'user_id' } as User;
      const list = [{ read: false }] as Notification[];
      mockNotificationsService.getNotifications.mockResolvedValue(list);

      expect(await resolver.notifications(user)).toEqual(list);
      expect(service.getNotifications).toHaveBeenCalledWith('user_id');
    });
  });

  describe('readNotification', () => {
    it('should call notificationsService.markAsRead and return notification', async () => {
      const user = { _id: 'user_id' } as User;
      const notif = { read: true } as Notification;
      mockNotificationsService.markAsRead.mockResolvedValue(notif);

      expect(await resolver.readNotification(user, 'notif_id')).toEqual(notif);
      expect(service.markAsRead).toHaveBeenCalledWith('notif_id', 'user_id');
    });
  });
});
