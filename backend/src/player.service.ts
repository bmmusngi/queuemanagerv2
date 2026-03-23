import { prisma } from './prisma';
import { Prisma } from '@prisma/client';

export class PlayerService {
  
  // Create a single player for a session
  async createPlayer(data: Prisma.PlayerUncheckedCreateInput) {
    // If memberId is provided, playerStatus should inherently be 'MEMBER', otherwise 'WALKIN'
    const status = data.memberId ? 'MEMBER' : 'WALKIN';

    return await prisma.player.create({
      data: {
        ...data,
        playerStatus: status,
        playingStatus: 'ACTIVE', // Defaulting to active upon creation
      },
    });
  }

  // Create players in bulk (useful for pre-registering a group for a session)
  async createPlayersBulk(data: Prisma.PlayerUncheckedCreateInput[]) {
    // Map through and ensure proper playerStatus based on memberId presence
    const mappedData = data.map(player => ({
      ...player,
      playerStatus: player.memberId ? 'MEMBER' : 'WALKIN',
      playingStatus: 'ACTIVE'
    }));

    return await prisma.player.createMany({
      data: mappedData,
      skipDuplicates: true,
    });
  }

  // SOFT DELETE: Mark a player as inactive (e.g., they went home early)
  async deactivatePlayer(id: string) {
    return await prisma.player.update({
      where: { id },
      data: { playingStatus: 'INACTIVE' },
    });
  }

  // HARD DELETE: Completely remove player entry from the session
  /*
  async deletePlayer(id: string) {
    // Note: If you eventually uncomment this, you must also handle deleting 
    // the related PlayerStatistics to avoid foreign key constraint errors.
    return await prisma.player.delete({
      where: { id },
    });
  }
  */
  
  
    // READ: Get details of an individual player in a session
  async getPlayerById(id: string) {
    return await prisma.player.findUnique({
      where: { id },
      // Including the linked member profile is often useful for the frontend
      include: { member: true }, 
    });
  }

  // UPDATE: Modify player details for a specific session
  async updatePlayer(id: string, data: Prisma.PlayerUpdateInput) {
    return await prisma.player.update({
      where: { id },
      data,
    });
  }

  

  // Update payment status (e.g., from UNPAID to PAID)
  async updatePaymentStatus(id: string, paymentStatus: string, paymentMode?: string) {
    return await prisma.player.update({
      where: { id },
      data: { 
        paymentStatus,
        paymentMode 
      },
    });
  }
}
