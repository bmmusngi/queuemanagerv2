import { Controller, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Delete('reset-db')
  @HttpCode(HttpStatus.OK)
  async resetDatabase() {
    await this.adminService.resetDatabase();
    return { message: 'Database resetted successfully (Sport preserved)' };
  }
}
