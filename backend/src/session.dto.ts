import { IsString, IsOptional, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

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
  status?: string; // e.g., "COMPLETED", "CANCELLED"
}

// DTO for adding a player to a session (handles both Members and Walk-ins)
export class AddPlayerToSessionDto {
  @IsOptional()
  @IsString()
  memberId?: string; // If provided, we fetch name/level/gender from the DB

  // The following are required ONLY if memberId is not provided (Walk-in)
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
