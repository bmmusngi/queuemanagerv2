import { Injectable, BadRequestException } from '@nestjs/common';
import { prisma } from './prisma';
import { Prisma } from '@prisma/client';

@Injectable()
export class PlayerService {
  
  // CREATE: Add a single player to the session
  async createPlayer(data: Prisma.PlayerUncheckedCreateInput) {
    // If memberId is provided, playerStatus is 'MEMBER', otherwise 'WALKIN'
    const status = data.memberId ? 'MEMBER' : 'WALKIN';

    return await prisma.player.create({
      data: {
        ...data,
        playerStatus: status,
        playingStatus: 'ACTIVE', 
      },
    });
  }

  // CREATE: Bulk add players (e.g., checking in multiple members at once)
  async createPlayersBulk(data: Prisma.PlayerUncheckedCreateInput[]) {
    const mappedData = data.map(player => ({
      ...player,
      playerStatus: player.memberId ? 'MEMBER' : 'WALKIN',
      playingStatus: 'ACTIVE',
      paymentStatus: 'UNPAID' // Ensuring default state for bulk imports
    }));

    return await prisma.player.createMany({
      data: mappedData,
      skipDuplicates: true,
    });
  }

  // SAFE DELETE: Only remove if they haven't played a game yet
  async removePlayer(id: string) {
    // 1. Check for existing game associations
    const player = await prisma.player.findUnique({
      where: { id },
      include: {
        _count: {
          select: { 
            gamesAsTeamA: true, 
            gamesAsTeamB: true 
          }
        }
      }
    });

    if (!player) throw new BadRequestException("Player not found.");

    // 2. The Guard: If they have games, stop the deletion
    const gameCount = player._count.gamesAsTeamA + player._count.gamesAsTeamB;
    if (gameCount > 0) {
      throw new BadRequestException(
        `Cannot delete ${player.name}: they have ${gameCount} game(s) recorded. Use 'Deactivate' instead.`
      );
    }

    // 3. Safe to remove
    return await prisma.player.delete({
      where: { id },
    });
  }

  // SOFT DELETE: Toggle playing status (for players taking a break or done early)
  async togglePlayingStatus(id: string, status: 'ACTIVE' | 'INACTIVE') {
    return await prisma.player.update({
      where: { id },
      data: { playingStatus: status },
    });
  }

  // READ: Get all players for a specific session
  async getPlayersBySession(sessionId: string) {
    return await prisma.player.findMany({
      where: { sessionId },
      include: { member: true }, // Ties back to their permanent profile
      orderBy: { createdAt: 'asc' }
    });
  }

  // UPDATE: Modify session-specific player details
  async updatePlayer(id: string, data: Prisma.PlayerUpdateInput, syncMember: boolean = false) {
    const updatedPlayer = await prisma.player.update({
      where: { id },
      data,
    });

    // If syncMember is true and this is a MEMBER, update the source Member profile
    if (syncMember && updatedPlayer.memberId) {
      await prisma.member.update({
        where: { id: updatedPlayer.memberId },
        data: {
          name: updatedPlayer.name as string,
          gender: updatedPlayer.gender as string,
          levelWeight: updatedPlayer.levelWeight as number,
        },
      });
    }

    return updatedPlayer;
  }

  // UPDATE: Payment Tracking
  async updatePayment(id: string, status: string, mode?: string) {
    return await prisma.player.update({
      where: { id },
      data: { 
        paymentStatus: status,
        paymentMode: mode 
      },
    });
  }

  // UPDATE: Partnership management
  async updatePartner(playerId: string, partnerId: string | null) {
    // 1. If clearing a partner
    if (!partnerId) {
      const player = await prisma.player.findUnique({ where: { id: playerId } });
      if (player?.partnerId) {
        // Clear the other side too
        await prisma.player.update({
          where: { id: player.partnerId },
          data: { partnerId: null }
        });
      }
      return await prisma.player.update({
        where: { id: playerId },
        data: { partnerId: null }
      });
    }

    // 2. If setting a partner
    // First, clear any existing partners they might have had
    const p1 = await prisma.player.findUnique({ where: { id: playerId } });
    const p2 = await prisma.player.findUnique({ where: { id: partnerId } });

    if (p1?.partnerId) await this.updatePartner(playerId, null);
    if (p2?.partnerId) await this.updatePartner(partnerId, null);

    // Set reciprocally
    await prisma.player.update({
      where: { id: partnerId },
      data: { partnerId: playerId }
    });

    return await prisma.player.update({
      where: { id: playerId },
      data: { partnerId: partnerId }
    });
  }
}
