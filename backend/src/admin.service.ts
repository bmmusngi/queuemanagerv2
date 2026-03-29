import { Injectable, Logger } from '@nestjs/common';
import { prisma } from './prisma';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  async resetDatabase() {
    this.logger.warn('Initiating full database reset (excluding Sport table)...');

    // Due to foreign key constraints, we must delete from leaves to roots.
    // The Sport table is preserved as requested.
    const result = await prisma.$transaction([
      prisma.playerStatistics.deleteMany(),
      prisma.game.deleteMany(),
      prisma.player.deleteMany(),
      prisma.court.deleteMany(),
      prisma.session.deleteMany(),
      prisma.member.deleteMany(),
      prisma.queueingGroup.deleteMany(),
    ]);

    this.logger.log('Database reset completed successfully.');
    return result;
  }
}
