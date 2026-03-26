import { IsString, IsOptional, IsInt } from 'class-validator';

export class CreateSessionDto {
  @IsString()
  groupId: string;

  @IsString()
  venue: string;

  @IsInt()
  courtCount: number;
}

export class UpdateSessionDto {
  @IsOptional()
  @IsString()
  venue?: string;

  @IsOptional()
  @IsString()
  status?: string; 
}

export class AddPlayerToSessionDto {
  @IsOptional()
  @IsString()
  memberId?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  levelWeight?: number;

  @IsOptional()
  @IsString()
  gender?: string;
}
