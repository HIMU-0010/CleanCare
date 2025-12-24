import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NotificationsService } from './notifications.service';
import { RegisterTokenDto } from './dto/register-token.dto';

@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('register-token')
  @HttpCode(HttpStatus.OK)
  async registerToken(@Request() req, @Body() registerTokenDto: RegisterTokenDto) {
    await this.notificationsService.registerToken(req.user.id, registerTokenDto.token);
    return { message: 'Push token registered successfully' };
  }

  @Delete('token')
  @HttpCode(HttpStatus.OK)
  async removeToken(@Request() req) {
    await this.notificationsService.removeToken(req.user.id);
    return { message: 'Push token removed successfully' };
  }

  @Get('history')
  async getHistory(@Request() req) {
    const notifications = await this.notificationsService.getNotificationHistory(req.user.id);
    return notifications;
  }

  @Get('unread-count')
  async getUnreadCount(@Request() req) {
    const count = await this.notificationsService.getUnreadCount(req.user.id);
    return { count };
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  async markAsRead(@Request() req, @Param('id') id: string) {
    await this.notificationsService.markAsRead(id, req.user.id);
    return { message: 'Notification marked as read' };
  }

  @Post('mark-all-read')
  @HttpCode(HttpStatus.OK)
  async markAllAsRead(@Request() req) {
    await this.notificationsService.markAllAsRead(req.user.id);
    return { message: 'All notifications marked as read' };
  }
}
