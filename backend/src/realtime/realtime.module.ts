import { Global, Module } from '@nestjs/common';
import { RealTimeService } from './realtime.service';

@Global()
@Module({
  providers: [RealTimeService],
  exports: [RealTimeService],
})
export class RealTimeModule {}
