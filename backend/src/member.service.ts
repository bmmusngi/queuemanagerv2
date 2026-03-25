import { Injectable } from '@nestjs/common';
import { prisma } from './prisma';
import { CreateMemberDto, UpdateMemberDto } from './member.dto';

@Injectable()
export class MemberService {
  
  // CREATE: Register a member and link them to their first group
  async createMember(dto: CreateMemberDto) {
    return await prisma.member.create({
      data: {
        name: dto.name,
        levelWeight: dto.levelWeight,
        gender: dto.gender,
        queueingGroups: {
          // This "connects" the member to the existing group ID
          connect: [{ id: dto.groupId }] 
        }
      },
    });
  }

  // BULK CREATE: Handles a list of players for a specific group
  async createMembersBulk(dtos: CreateMemberDto[]) {
    // For bulk, we'll iterate so we can handle the M:N connection properly
    const creations = dtos.map(dto => this.createMember(dto));
    return await Promise.all(creations);
  }

  // READ: Get members filtered by a specific group
  async getMembersByGroup(groupId: string) {
    return await prisma.member.findMany({
      where: {
      //  isActive: true,   //removed to show all members for reactivation
        queueingGroups: {
          // Prisma: "Find members where SOME of their groups match this ID"
          some: { id: groupId }
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  async getActiveMembers() {
    return await prisma.member.findMany({
      where: { isActive: true },
      include: { queueingGroups: true }
    });
  }

  async deactivateMember(id: string) {
    return await prisma.member.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async updateMember(id: string, dto: UpdateMemberDto) {
    return await prisma.member.update({
      where: { id },
      data: dto,
    });
  }
}
