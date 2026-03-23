// member.module.ts
import { Module } from '@nestjs/common';
import { MemberController } from './member.controller';
import { MemberService } from './member.service';

@Module({
  controllers: [MemberController],
  providers: [MemberService],
  exports: [MemberService], // We export the service just in case the Session layer needs to verify a member profile later
})
export class MemberModule {}
