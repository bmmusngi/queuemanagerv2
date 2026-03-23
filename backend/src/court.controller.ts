// court.controller.ts
import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { CourtService } from './court.service';
import { Prisma } from '@prisma/client';

@Controller('courts')
export class CourtController {
  constructor(private readonly courtService: CourtService) {}

  // POST /courts
  @Post()
  async create(@Body() createCourtDto: Prisma.CourtUncheckedCreateInput) {
    return await this.courtService.createCourt(createCourtDto);
  }

  // POST /courts/bulk
  @Post('bulk')
  async createBulk(@Body() createCourtDtos: Prisma.CourtUncheckedCreateInput[]) {
    return await this.courtService.createCourtsBulk(createCourtDtos);
  }

  // GET /courts/session/:sessionId (Fetches all courts for a specific session)
  @Get('session/:sessionId')
  async findBySession(@Param('sessionId') sessionId: string) {
    return await this.courtService.getSessionCourts(sessionId);
  }

  // GET /courts/:id
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.courtService.getCourtById(id);
  }

  // PUT /courts/:id
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateCourtDto: Prisma.CourtUpdateInput) {
    return await this.courtService.updateCourt(id, updateCourtDto);
  }

  // DELETE /courts/:id (Marks court as INACTIVE / Out of order)
  @Delete(':id')
  async deactivate(@Param('id') id: string) {
    return await this.courtService.deactivateCourt(id);
  }
}
