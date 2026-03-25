import { IsString, IsInt, IsOptional, IsBoolean, Min } from 'class-validator';

export class CreateMemberDto {
  @IsString()
  name: string;

  @IsInt()
  @Min(1)
  levelWeight: number; // 1 = Beginner, 2 = Intermediate, etc.

  @IsString()
  gender: string;

  @IsString()
  groupId: string; // Required for initial registration
}

export class UpdateMemberDto {
  @IsOptional() @IsString()
  name?: string;

  @IsOptional() @IsInt() @Min(1)
  levelWeight?: number;

  @IsOptional() @IsString()
  gender?: string;

  @IsOptional() @IsBoolean()
  isActive?: boolean;
}
