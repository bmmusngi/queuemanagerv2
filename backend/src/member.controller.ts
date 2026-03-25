import { Controller, Get, Post, Body, Param, Put, Delete, Query } from '@nestjs/common';
import { MemberService } from './member.service';
import { CreateMemberDto, UpdateMemberDto } from './member.dto';

@Controller('members')
export class MemberController {
  constructor(private readonly memberService: MemberService) {}

  @Post()
  async create(@Body() createMemberDto: CreateMemberDto) {
    return await this.memberService.createMember(createMemberDto);
  }

  @Post('bulk')
  async createBulk(@Body() dtos: CreateMemberDto[]) {
    return await this.memberService.createMembersBulk(dtos);
  }

  @Get()
  async find(@Query('groupId') groupId?: string) {
    if (groupId) {
      return await this.memberService.getMembersByGroup(groupId);
    }
    return await this.memberService.getActiveMembers();
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateMemberDto: UpdateMemberDto) {
    return await this.memberService.updateMember(id, updateMemberDto);
  }

  @Delete(':id')
  async deactivate(@Param('id') id: string) {
    return await this.memberService.deactivateMember(id);
  }
}
