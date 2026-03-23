import { IsString, IsOptional } from 'class-validator';

export class CreateQueueingGroupDto {
  @IsString()
  name: string; // e.g., "Tuesday Smashers"

  @IsString()
  sportId: string; // Links the group to Badminton, Tennis, etc.
}

export class UpdateQueueingGroupDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  sportId?: string;
}
