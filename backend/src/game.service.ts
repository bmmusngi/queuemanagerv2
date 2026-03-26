import { prisma } from './prisma';
import { Prisma } from '@prisma/client';

export class GameService {
  
  // CREATE: Set up a new game in the queue (Defaults to 'PENDING' status)
  async createGame(data: any) {
    // Extract team player IDs to handle Prisma's nested connection logic
    const { teamA, teamB, ...gameDetails } = data;

    return await prisma.game.create({
      data: {
        ...gameDetails,
        teamA: {
          connect: (teamA || []).map((id: string) => ({ id }))
        },
        teamB: {
          connect: (teamB || []).map((id: string) => ({ id }))
        }
      },
      // Include the nested player relations when returning the created game
      include: {
        teamA: true,
        teamB: true
      }
    });
  }

  // READ: Get details of a specific game
  async getGameById(id: string) {
    return await prisma.game.findUnique({
      where: { id },
      include: {
        court: true,
        teamA: true,
        teamB: true
      },
    });
  }

  // READ: Get all games for a specific session (useful for the queue display)
  async getSessionGames(sessionId: string) {
    return await prisma.game.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' }, // Orders by oldest first for the queue
      include: {
        teamA: true,
        teamB: true,
        court: true
      }
    });
  }

  // UPDATE: General update for game details (e.g., adding a player if someone dropped out before starting)
  async updateGame(id: string, data: Prisma.GameUpdateInput) {
    return await prisma.game.update({
      where: { id },
      data,
    });
  }

  // OPERATIONAL UPDATE: Assign a court and start the game
  async startGame(id: string, courtId: string) {
    return await prisma.game.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        courtId: courtId,
        startedAt: new Date(),
      },
      include: { // Include team players and court details
        teamA: true,
        teamB: true,
        court: true,
      },
    });
  }

  // OPERATIONAL UPDATE: Complete the game and log the results
  async completeGame(id: string, shuttlesUsed: number, winner: 'TeamA' | 'TeamB') {
    return await prisma.game.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        endedAt: new Date(),
        shuttlesUsed: shuttlesUsed,
        winner: winner,
      },
    });
  }

  // SOFT DELETE: Cancel a queued game
  async cancelGame(id: string) {
    return await prisma.game.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }

  // HARD DELETE: Completely remove the game from history
  /*
  async deleteGame(id: string) {
    return await prisma.game.delete({
      where: { id },
    });
  }
  */
}
