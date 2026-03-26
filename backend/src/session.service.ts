import { Injectable } from '@nestjs/common';
import { prisma } from './prisma';
import { Prisma } from '@prisma/client';
import { CreateSessionDto } from './session.dto';

@Injectable()
export class SessionService {
  
  // CREATE: Start a new session
/*
  async createSession(data: Prisma.SessionUncheckedCreateInput) {
    return await prisma.session.create({
      data,
    });
  }
*/

  async createSession(data: { groupId: string;venue: string;courtCount: number }) {
    // Generate ID: YYYYMMDD + First 4 of GroupID
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const sessionId = `${dateStr}${data.groupId.substring(0, 4).toUpperCase()}`;
    
    // Create the Session and its Courts in a single transaction
    return await prisma.session.create({
      data: {
        id: sessionId,
        venue: data.venue,
        queueingGroupId: data.groupId,
        status: 'ACTIVE',
        courts: {
          create: Array.from({ length: data.courtCount }).map((_, i) => ({
            name: `Court ${i + 1}`,
            status: 'ACTIVE'
          }))
        }
      },
      include: { courts: true, queueingGroup: true }
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
  
  //Complete Session
  async endSession(id: string) {
    return await prisma.session.update({
      where: { id },
      data: { status: 'COMPLETED' }
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