// game.controller.ts
import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { GameService } from './game.service';
import { CreateGameDto, CompleteGameDto, AssignCourtDto } from './game.dto';
import { Prisma } from '@prisma/client';

@Controller('games')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  // POST /games (Adds a new game to the queue, defaults to PENDING)
  @Post()
  async create(@Body() createGameDto: Prisma.GameUncheckedCreateInput) {
    return await this.gameService.createGame(createGameDto);
  }

  // GET /games/session/:sessionId (The main endpoint for your Live Queue view)
  @Get('session/:sessionId')
  async findBySession(@Param('sessionId') sessionId: string) {
    return await this.gameService.getSessionGames(sessionId);
  }

  // GET /games/:id
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.gameService.getGameById(id);
  }

  // PUT /games/:id/start (Assigns a court and flips status to ACTIVE)
  @Put(':id/start')
  async startGame(@Param('id') id: string, @Body() assignCourtDto: AssignCourtDto) {
    return await this.gameService.startGame(id, assignCourtDto.courtId);
  }

  // PUT /games/:id/complete (Logs shuttles used, winner, and flips status to COMPLETED)
  @Put(':id/complete')
  async completeGame(@Param('id') id: string, @Body() completeGameDto: CompleteGameDto) {
    return await this.gameService.completeGame(
      id, 
      completeGameDto.shuttlesUsed, 
      completeGameDto.winner as 'TeamA' | 'TeamB'
    );
  }

  // PUT /games/:id (General updates, like fixing a typo in the game setup)
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateGameDto: Prisma.GameUpdateInput) {
    return await this.gameService.updateGame(id, updateGameDto);
  }

  // DELETE /games/:id (Soft-deletes/Cancels the game if players back out)
  @Delete(':id')
  async cancel(@Param('id') id: string) {
    return await this.gameService.cancelGame(id);
  }
}
