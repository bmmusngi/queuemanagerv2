import { IsString, IsInt, IsNotEmpty } from 'class-validator';

export class CreateSessionDto {
  @IsString()
  @IsNotEmpty()
  groupId: string;

  @IsString()
  @IsNotEmpty()
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
