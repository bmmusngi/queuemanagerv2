import { Injectable } from '@nestjs/common';
import { prisma } from './prisma';
import { Prisma } from '@prisma/client';
import { CreateSessionDto } from './session.dto';

@Injectable()
export class SessionService {
  
  // This signature MUST match the Controller's call
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

  async getActiveSessions() {
    return await prisma.session.findMany({
      where: { status: 'ACTIVE' },
      include: { queueingGroup: true }
    });
  }

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

  async updateSession(id: string, data: Prisma.SessionUpdateInput) {
    return await prisma.session.update({
      where: { id },
      data,
    });
  }

  async cancelSession(id: string) {
    return await prisma.session.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }
  
  async endSession(id: string) {
    return await prisma.session.update({
      where: { id },
      data: { status: 'COMPLETED' }
    });
  }
}
