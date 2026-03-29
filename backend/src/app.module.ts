import { Module } from '@nestjs/common';
import { MemberModule } from './member.module'; // Adjust these paths based on your folder structure
import { SessionModule } from './session.module';
import { CourtModule } from './court.module';
import { GameModule } from './game.module';
import { QueueingGroupModule } from './queueing-group.module';
import { SportModule } from './sport.module';
import { PlayerModule } from './player.module';
import { AdminModule } from './admin.module';

@Module({
  imports: [
    MemberModule,
    SessionModule,
    CourtModule,
    GameModule,
    QueueingGroupModule,
    SportModule,
    PlayerModule,
    AdminModule
  ],
  controllers: [], // Left empty because the individual modules handle their own controllers
  providers: [],   // Left empty because the individual modules handle their own services
})
export class AppModule {}
