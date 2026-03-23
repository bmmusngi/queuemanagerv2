import { prisma } from './prisma';
import { Prisma } from '@prisma/client';

export class SportService {
  
  // CREATE: Add a single sport
  async createSport(data: Prisma.SportCreateInput) {
    return await prisma.sport.create({
      data,
    });
  }

  // CREATE: Bulk add multiple sports (e.g., Badminton, Tennis, Table Tennis)
  async createSportsBulk(data: Prisma.PrismaPromise<Prisma.SportCreateManyInput[]>) {
    return await prisma.sport.createMany({
      data,
      skipDuplicates: true,
    });
  }

  // READ: Get all sports
  async getAllSports() {
    return await prisma.sport.findMany({
      orderBy: { name: 'asc' },
    });
  }

  // READ: Get details of a specific sport
  async getSportById(id: string) {
    return await prisma.sport.findUnique({
      where: { id },
      include: {
        queueingGroups: true // See which groups are playing this sport
      }
    });
  }

  // UPDATE: Modify a sport's name
  async updateSport(id: string, data: Prisma.SportUpdateInput) {
    return await prisma.sport.update({
      where: { id },
      data,
    });
  }

  // HARD DELETE: Completely remove the sport (Commented out)
  /*
  async deleteSport(id: string) {
    return await prisma.sport.delete({
      where: { id },
    });
  }
  */
}
