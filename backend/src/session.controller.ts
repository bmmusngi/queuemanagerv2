import { Controller, Get, Post, Body, Param, Put } from '@nestjs/common';
import { SessionService } from './session.service';
import { CreateSessionDto } from './session.dto';

@Controller('sessions')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Post()
  async create(@Body() createSessionDto: CreateSessionDto) {
    return await this.sessionService.createSession(createSessionDto);
  }

  @Get()
  async findActive() {
    return await this.sessionService.getActiveSessions();
  }

  @Put(':id/end')
  async end(@Param('id') id: string) {
    return await this.sessionService.endSession(id);
  }
}
