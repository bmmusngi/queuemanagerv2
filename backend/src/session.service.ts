import { Injectable } from '@nestjs/common';
import { prisma } from './prisma';
import { CreateSessionDto } from './session.dto';

@Injectable()
export class SessionService {
  
  async createSession(dto: CreateSessionDto) {
    return await prisma.session.create({
      data: {
        id: dto.id,
        venue: dto.venue,
        queueingGroupId: dto.queueingGroupId,
        status: 'ACTIVE',
        courts: {
          create: dto.courtNames.map((name: string) => ({
            name: name,
            status: 'ACTIVE'
          }))
        }
      },
      include: { 
        courts: true,
        queueingGroup: true 
      }
    });
  }

  async getActiveSessions() {
    return await prisma.session.findMany({
      where: { status: 'ACTIVE' },
      include: { queueingGroup: true }
    });
  }

  async endSession(id: string) {
    return await prisma.session.update({
      where: { id },
      data: { status: 'COMPLETED' }
    });
  }
}
