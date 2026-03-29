import { Module } from '@nestjs/common';
import { PlayerController } from './player.controller';
import { PlayerService } from './player.service';
import { PlayerStatisticsService } from './player-statistics.service';

@Module({
  controllers: [PlayerController],
  providers: [PlayerService, PlayerStatisticsService],
  exports: [PlayerService, PlayerStatisticsService]
})
export class PlayerModule {}
