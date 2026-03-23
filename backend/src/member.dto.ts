import { IsString, IsInt, IsOptional, IsBoolean, Min } from 'class-validator';

export class CreateMemberDto {
  @IsString()
  name: string;

  @IsInt()
  @Min(1) // Assuming levelWeight is a positive integer 
  levelWeight: number;

  @IsString()
  gender: string;

  @IsOptional()
  @IsString({ each: true })
  queueingGroupIds?: string[]; // Optional: Add them to groups upon creation
}

export class UpdateMemberDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  levelWeight?: number;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
