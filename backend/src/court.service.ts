import { prisma } from './prisma';
import { Prisma, CourtStatus } from '@prisma/client';

export class CourtService {
  
  // CREATE: Add a single court to a session
  async createCourt(data: Prisma.CourtUncheckedCreateInput) {
    return await prisma.court.create({
      data,
    });
  }

  // CREATE: Bulk create courts (e.g., generating "Court 1", "Court 2", "Court 3" at the start of a session)
  async createCourtsBulk(data: Prisma.CourtUncheckedCreateInput[]) {
    return await prisma.court.createMany({
      data,
      skipDuplicates: true,
    });
  }

  // READ: Get details of a specific court
  async getCourtById(id: string) {
    return await prisma.court.findUnique({
      where: { id },
      include: {
        games: {
          where: { status: 'ACTIVE' } // Useful to see what is currently playing on this court
        }
      }
    });
  }

  // READ: Get all courts for a specific session
  async getSessionCourts(sessionId: string) {
    return await prisma.court.findMany({
      where: { sessionId },
    });
  }

  // UPDATE: Modify court details (e.g., renaming)
  async updateCourt(id: string, data: Prisma.CourtUpdateInput) {
    return await prisma.court.update({
      where: { id },
      data,
    });
  }

  // SOFT DELETE / STATUS UPDATE: Mark a court as inactive (e.g., rental time expired or floor is slippery)
  async deactivateCourt(id: string) {
    return await prisma.court.update({
      where: { id },
      data: { status: CourtStatus.INACTIVE },
    });
  }

  // HARD DELETE: Completely remove the court
  /*
  async deleteCourt(id: string) {
    return await prisma.court.delete({
      where: { id },
    });
  }
  */
}
