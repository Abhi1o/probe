import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AlertsService } from './alerts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('alerts')
@Controller('alerts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Post()
  @ApiOperation({ summary: 'Create alert' })
  create(@Request() req, @Body() createAlertDto: any) {
    return this.alertsService.create(req.user.id, createAlertDto);
  }

  @Get('program/:programId')
  @ApiOperation({ summary: 'Get alerts for program' })
  findAll(@Param('programId') programId: string) {
    return this.alertsService.findAll(programId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get alert by ID' })
  findOne(@Param('id') id: string) {
    return this.alertsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update alert' })
  update(@Param('id') id: string, @Body() updateAlertDto: any) {
    return this.alertsService.update(id, updateAlertDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete alert' })
  remove(@Param('id') id: string) {
    return this.alertsService.remove(id);
  }
}
