import { prisma } from './prisma';
import { Prisma } from '@prisma/client';

export class SessionService {
  
  // CREATE: Start a new session
  async createSession(data: Prisma.SessionUncheckedCreateInput) {
    return await prisma.session.create({
      data,
    });
  }

  // READ: Get all active sessions
  async getActiveSessions() {
    return await prisma.session.findMany({
      where: { status: 'ACTIVE' },
      include: {
        queueingGroup: true,
      }
    });
  }

  // READ: Get details of a specific session
  async getSessionById(id: string) {
    return await prisma.session.findUnique({
      where: { id },
      include: {
        queueingGroup: true,
        courts: true,
        players: true,
      },
    });
  }

  // UPDATE: Modify session details (e.g., updating the freetext venue or status to COMPLETED)
  async updateSession(id: string, data: Prisma.SessionUpdateInput) {
    return await prisma.session.update({
      where: { id },
      data,
    });
  }

  // SOFT DELETE: Mark a session as cancelled
  async cancelSession(id: string) {
    return await prisma.session.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }

  // HARD DELETE: Completely remove the session
  /*
  async deleteSession(id: string) {
    return await prisma.session.delete({
      where: { id },
    });
  }
  */
}
