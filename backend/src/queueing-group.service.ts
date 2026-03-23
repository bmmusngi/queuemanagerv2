import { prisma } from './prisma';
import { Prisma } from '@prisma/client';

export class QueueingGroupService {
  
  // CREATE: Set up a new queueing group (e.g., "Tuesday Smashers")
  async createGroup(data: Prisma.QueueingGroupUncheckedCreateInput) {
    return await prisma.queueingGroup.create({
      data,
    });
  }

  // READ: Get all groups
  async getAllGroups() {
    return await prisma.queueingGroup.findMany({
      include: { sport: true }, // Pulls in the sport name automatically
    });
  }

  // READ: Get details of a specific group
  async getGroupById(id: string) {
    return await prisma.queueingGroup.findUnique({
      where: { id },
      include: { 
        sport: true,
        members: true // Fetch registered members of this group
      },
    });
  }

  // UPDATE: Modify group details (like name or sportId)
  async updateGroup(id: string, data: Prisma.QueueingGroupUpdateInput) {
    return await prisma.queueingGroup.update({
      where: { id },
      data,
    });
  }

  // HARD DELETE: Completely remove the group
  /*
  async deleteGroup(id: string) {
    return await prisma.queueingGroup.delete({
      where: { id },
    });
  }
  */
}
