import { Controller, Get, Post, Body, Param, Put } from '@nestjs/common';
import { QueueingGroupService } from './queueing-group.service';
import { Prisma } from '@prisma/client';

@Controller('queueing-groups')
export class QueueingGroupController {
  constructor(private readonly queueingGroupService: QueueingGroupService) {}

  // POST http://<YOUR_NAS_IP>:3001/queueing-groups
  /*
  @Post()
  async createGroup(@Body() data: Prisma.QueueingGroupCreateInput) {
    return await this.queueingGroupService.createGroup(data);
  }
  */
    // We use 'any' here temporarily to bypass the strict relation check
  async createGroup(data: any) {
    return await prisma.queueingGroup.create({
      data,
    });
  }


  // GET http://<YOUR_NAS_IP>:3001/queueing-groups
  @Get()
  async getAllGroups() {
    return await this.queueingGroupService.getAllGroups();
  }

  // GET http://<YOUR_NAS_IP>:3001/queueing-groups/:id
  @Get(':id')
  async getGroupById(@Param('id') id: string) {
    return await this.queueingGroupService.getGroupById(id);
  }

  // PUT http://<YOUR_NAS_IP>:3001/queueing-groups/:id
  @Put(':id')
  async updateGroup(
    @Param('id') id: string,
    @Body() data: Prisma.QueueingGroupUpdateInput
  ) {
    return await this.queueingGroupService.updateGroup(id, data);
  }
}
