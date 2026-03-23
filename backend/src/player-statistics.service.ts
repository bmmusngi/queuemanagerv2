import { prisma } from './prisma';
import { Prisma } from '@prisma/client';

export class PlayerStatisticsService {

  // CREATE / INITIALIZE: Set up a blank statistics record for a player in a session
  // Using upsert ensures we don't accidentally crash if a record already exists
  async initializeStats(playerId: string, sessionId: string) {
    return await prisma.playerStatistics.upsert({
      where: {
        playerId_sessionId: {
          playerId,
          sessionId,
        },
      },
      update: {}, // Do nothing if it already exists
      create: {
        playerId,
        sessionId,
        wins: 0,
        losses: 0,
        ties: 0,
      },
    });
  }

  // READ: Get a player's stats for a specific session
  async getStats(playerId: string, sessionId: string) {
    return await prisma.playerStatistics.findUnique({
      where: {
        playerId_sessionId: {
          playerId,
          sessionId,
        },
      },
    });
  }

  // UPDATE: Atomically increment wins
  async recordWin(playerId: string, sessionId: string) {
    return await prisma.playerStatistics.update({
      where: {
        playerId_sessionId: { playerId, sessionId },
      },
      data: {
        wins: { increment: 1 },
      },
    });
  }

  // UPDATE: Atomically increment losses
  async recordLoss(playerId: string, sessionId: string) {
    return await prisma.playerStatistics.update({
      where: {
        playerId_sessionId: { playerId, sessionId },
      },
      data: {
        losses: { increment: 1 },
      },
    });
  }

  // UPDATE: Atomically increment ties
  async recordTie(playerId: string, sessionId: string) {
    return await prisma.playerStatistics.update({
      where: {
        playerId_sessionId: { playerId, sessionId },
      },
      data: {
        ties: { increment: 1 },
      },
    });
  }

  // HARD DELETE: Remove a stat record entirely (Commented out)
  /*
  async deleteStats(playerId: string, sessionId: string) {
    return await prisma.playerStatistics.delete({
      where: {
        playerId_sessionId: { playerId, sessionId },
      },
    });
  }
  */
}
