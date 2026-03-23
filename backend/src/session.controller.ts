// session.controller.ts
import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { SessionService } from './session.service';
import { CreateSessionDto, UpdateSessionDto } from './session.dto';

@Controller('sessions')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  // POST /sessions
  @Post()
  async create(@Body() createSessionDto: CreateSessionDto) {
    return await this.sessionService.createSession(createSessionDto);
  }

  // GET /sessions (Fetches all active sessions to populate the dashboard)
  @Get()
  async findActive() {
    return await this.sessionService.getActiveSessions();
  }

  // GET /sessions/:id (Fetches a specific session, including courts and players)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.sessionService.getSessionById(id);
  }

  // PUT /sessions/:id
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateSessionDto: UpdateSessionDto) {
    return await this.sessionService.updateSession(id, updateSessionDto);
  }

  // DELETE /sessions/:id (Soft-deletes/Cancels the session)
  @Delete(':id')
  async cancel(@Param('id') id: string) {
    return await this.sessionService.cancelSession(id);
  }
}
