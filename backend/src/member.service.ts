import { prisma } from './prisma';
import { Prisma } from '@prisma/client';

export class MemberService {
  
  // Create a single member
  async createMember(data: Prisma.MemberCreateInput) {
    return await prisma.member.create({
      data,
    });
  }

  // Create members in bulk
  async createMembersBulk(data: Prisma.MemberCreateManyInput[]) {
    return await prisma.member.createMany({
      data,
      skipDuplicates: true, // Prevents failure if a duplicate sneaks into the batch
    });
  }

  // SOFT DELETE: Deactivate a member
  async deactivateMember(id: string) {
    return await prisma.member.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // HARD DELETE: Completely remove from database
  /*
  async deleteMember(id: string) {
    return await prisma.member.delete({
      where: { id },
    });
  }
  */

  // Fetch all active members
  async getMembers() {
    return await prisma.member.findMany({
      //where: { isActive: true },
    });
  }
  
  // Fetch all active members
  async getActiveMembers() {
    return await prisma.member.findMany({
      where: { isActive: true },
    });
  }
  
    // READ: Get details of an individual member
  async getMemberById(id: string) {
    return await prisma.member.findUnique({
      where: { id },
    });
  }

  // UPDATE: Modify member details (e.g., updating levelWeight or name)
  async updateMember(id: string, data: Prisma.MemberUpdateInput) {
    return await prisma.member.update({
      where: { id },
      data,
    });
  }

}
