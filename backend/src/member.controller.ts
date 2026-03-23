// member.controller.ts
import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { MemberService } from './member.service';
import { CreateMemberDto, UpdateMemberDto } from './member.dto';

@Controller('members')
export class MemberController {
  constructor(private readonly memberService: MemberService) {}

  // POST /members
  @Post()
  async create(@Body() createMemberDto: CreateMemberDto) {
    return await this.memberService.createMember(createMemberDto);
  }

  // POST /members/bulk
  @Post('bulk')
  async createBulk(@Body() createMemberDtos: CreateMemberDto[]) {
    return await this.memberService.createMembersBulk(createMemberDtos);
  }

  // GET /members
  @Get()
  async findAllActive() {
    return await this.memberService.getActiveMembers();
  }

  // GET /members/:id
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.memberService.getMemberById(id);
  }

  // PUT /members/:id
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateMemberDto: UpdateMemberDto) {
    return await this.memberService.updateMember(id, updateMemberDto);
  }

  // DELETE /members/:id (Triggers our soft-delete logic)
  @Delete(':id')
  async deactivate(@Param('id') id: string) {
    return await this.memberService.deactivateMember(id);
  }
}
