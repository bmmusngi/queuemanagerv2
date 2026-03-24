import { Controller } from '@nestjs/common';
import { QueueingGroupService } from './queueing-group.service';

@Controller('queueing-group')
export class QueueingGroupController {
  constructor(private readonly queueingGroupService: QueueingGroupService) {}
}
