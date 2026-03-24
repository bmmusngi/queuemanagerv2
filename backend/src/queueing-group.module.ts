import { Module } from '@nestjs/common';
import { QueueingGroupService } from './queueing-group.service';
import { QueueingGroupController } from './queueing-group.controller';

@Module({
  providers: [QueueingGroupService],
  controllers: [QueueingGroupController],
})
export class QueueingGroupModule {}
