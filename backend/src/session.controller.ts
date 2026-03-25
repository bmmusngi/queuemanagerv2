import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { SessionService } from './session.service';
import { CreateSessionDto, UpdateSessionDto } from './session.dto';

@Controller('sessions')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Post()
  async create(@Body() createSessionDto: CreateSessionDto) {
    return await this.sessionService.createSession(createSessionDto);
  }
  
  @Put(':id/end')
  async end(@Param('id') id: string) {
    return await this.sessionService.endSession(id);
  }

  @Get()
  async findActive() {
    return await this.sessionService.getActiveSessions();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.sessionService.getSessionById(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateSessionDto: UpdateSessionDto) {
    return await this.sessionService.updateSession(id, updateSessionDto);
  }

  @Delete(':id')
  async cancel(@Param('id') id: string) {
    return await this.sessionService.cancelSession(id);
  }
}
