import { Injectable } from '@nestjs/common';
import { prisma } from './prisma';
import { Prisma } from '@prisma/client';
import { CreateSessionDto } from './session.dto';

@Injectable()
export class SessionService {
  
  // CREATE: Start a new session using the DTO
  async createSession(dto: CreateSessionDto) {
    return await prisma.session.create({
      data: {
        id: dto.id,
        venue: dto.venue,
        queueingGroupId: dto.queueingGroupId,
        status: 'ACTIVE',
        courts: {
          create: dto.courtNames.map((name) => ({
            name: name,
            status: 'ACTIVE'
          }))
        }
      },
      include: { courts: true }
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

  // UPDATE: Modify session details
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
  
  // COMPLETE SESSION
  async endSession(id: string) {
    return await prisma.session.update({
      where: { id },
      data: { status: 'COMPLETED' }
    });
  }
} // <--- Only ONE closing brace at the very end of the class
