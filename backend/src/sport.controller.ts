import { Controller } from '@nestjs/common';
import { SportService } from './sport.service';

@Controller('sport')
export class SportController {
  constructor(private readonly sportService: SportService) {}
}
