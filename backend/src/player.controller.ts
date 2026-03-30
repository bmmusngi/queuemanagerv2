import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { PlayerService } from './player.service';
import { Prisma } from '@prisma/client';

@Controller('players')
export class PlayerController {
  constructor(private readonly playerService: PlayerService) {}

  @Post()
  async createPlayer(@Body() data: Prisma.PlayerUncheckedCreateInput) {
    return await this.playerService.createPlayer(data);
  }

  @Get('session/:sessionId')
  async getPlayersBySession(@Param('sessionId') sessionId: string) {
    return await this.playerService.getPlayersBySession(sessionId);
  }

  @Delete(':id')
  async removePlayer(@Param('id') id: string) {
    return await this.playerService.removePlayer(id);
  }

  @Put(':id/status')
  async togglePlayingStatus(@Param('id') id: string, @Body('status') status: 'ACTIVE' | 'INACTIVE') {
    return await this.playerService.togglePlayingStatus(id, status);
  }

  @Put(':id')
  async updatePlayer(@Param('id') id: string, @Body() data: any) {
    const { syncMember, ...updateData } = data;
    return await this.playerService.updatePlayer(id, updateData, syncMember);
  }

  @Put(':id/payment')
  async updatePayment(@Param('id') id: string, @Body('status') status: string, @Body('mode') mode: string) {
    return await this.playerService.updatePayment(id, status, mode);
  }

  @Put(':id/partner')
  async updatePartner(@Param('id') id: string, @Body('partnerId') partnerId: string | null) {
    return await this.playerService.updatePartner(id, partnerId);
  }
}
