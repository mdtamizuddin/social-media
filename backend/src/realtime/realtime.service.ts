import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Pusher from 'pusher';

@Injectable()
export class RealTimeService {
  private pusher: Pusher;

  constructor(private configService: ConfigService) {
    this.pusher = new Pusher({
      appId: this.configService.get<string>('APINATOR_APP_ID') || 'dummy_id',
      key: this.configService.get<string>('APINATOR_KEY') || 'dummy_key',
      secret:
        this.configService.get<string>('APINATOR_SECRET') || 'dummy_secret',
      cluster: this.configService.get<string>('APINATOR_CLUSTER') || 'us',
      host: 'api.apinator.io',
      useTLS: true,
    });
  }

  async trigger(channel: string, event: string, data: any): Promise<void> {
    try {
      await this.pusher.trigger(channel, event, data);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error(
        `Apinator real-time trigger failed on channel [${channel}], event [${event}]: ${errMsg}`,
      );
    }
  }
}
