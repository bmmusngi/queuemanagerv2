import { IsString, IsOptional, IsArray, IsInt, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSessionDto {
  @IsString()
  id: string; // Your YYYYMMDDXXXXXX format

  @IsString()
  queueingGroupId: string;

  @IsString()
  venue: string;

  // Instead of passing raw court objects, the frontend just tells the API what to name them
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  courtNames: string[]; // e.g., ["Court 1", "Court 2", "Center Court"]
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
