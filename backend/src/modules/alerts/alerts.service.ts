import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

export enum AlertCondition {
  TRANSACTION_COUNT = 'transaction_count',
  SUCCESS_RATE = 'success_rate',
  FAILURE_RATE = 'failure_rate',
  AVG_COMPUTE_UNITS = 'avg_compute_units',
  AVG_FEE = 'avg_fee',
  ERROR_COUNT = 'error_count',
}

export enum AlertComparison {
  GREATER_THAN = 'GREATER_THAN',
  LESS_THAN = 'LESS_THAN',
  EQUAL_TO = 'EQUAL_TO',
  GREATER_THAN_OR_EQUAL = 'GREATER_THAN_OR_EQUAL',
  LESS_THAN_OR_EQUAL = 'LESS_THAN_OR_EQUAL',
}

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async create(userId: string, data: any) {
    return this.prisma.alert.create({
      data: {
        ...data,
        program: {
          connect: { id: data.programId },
        },
      },
      include: {
        program: true,
      },
    });
  }

  async findAll(programId: string) {
    return this.prisma.alert.findMany({
      where: { programId },
      include: {
        program: true,
        _count: {
          select: {
            triggers: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.alert.findUnique({
      where: { id },
      include: {
        program: true,
        triggers: {
          take: 10,
          orderBy: {
            triggeredAt: 'desc',
          },
        },
      },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.alert.update({
      where: { id },
      data,
      include: {
        program: true,
      },
    });
  }

  async remove(id: string) {
    await this.prisma.alert.delete({
      where: { id },
    });
    return { message: 'Alert deleted successfully' };
  }

  async checkAlerts(programId: string, metrics?: any) {
    try {
      const alerts = await this.prisma.alert.findMany({
        where: {
          programId,
          enabled: true,
        },
        include: {
          program: true,
        },
      });

      if (alerts.length === 0) {
        return;
      }

      // If metrics not provided, fetch them
      const programMetrics = metrics || await this.getProgramMetrics(programId);

      for (const alert of alerts) {
        const shouldTrigger = this.evaluateCondition(alert, programMetrics);
        
        if (shouldTrigger) {
          await this.triggerAlert(alert, programMetrics);
        }
      }
    } catch (error) {
      this.logger.error(`Error checking alerts for program ${programId}:`, error);
    }
  }

  private async getProgramMetrics(programId: string) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    // Get transaction statistics for the last hour
    const stats = await this.prisma.transaction.aggregate({
      where: {
        programId,
        blockTime: {
          gte: oneHourAgo,
        },
      },
      _count: {
        _all: true,
      },
      _avg: {
        computeUnits: true,
        fee: true,
      },
    });

    const successCount = await this.prisma.transaction.count({
      where: {
        programId,
        blockTime: { gte: oneHourAgo },
        status: 'SUCCESS',
      },
    });

    const failureCount = await this.prisma.transaction.count({
      where: {
        programId,
        blockTime: { gte: oneHourAgo },
        status: 'FAILED',
      },
    });

    const totalCount = stats._count._all;
    const successRate = totalCount > 0 ? (successCount / totalCount) * 100 : 0;
    const failureRate = totalCount > 0 ? (failureCount / totalCount) * 100 : 0;

    return {
      transaction_count: totalCount,
      success_count: successCount,
      failure_count: failureCount,
      success_rate: successRate,
      failure_rate: failureRate,
      avg_compute_units: stats._avg.computeUnits || 0,
      avg_fee: Number(stats._avg.fee) || 0,
      error_count: failureCount,
    };
  }

  private evaluateCondition(alert: any, metrics: any): boolean {
    try {
      const metricValue = metrics[alert.condition];
      
      if (metricValue === undefined || metricValue === null) {
        this.logger.warn(`Metric ${alert.condition} not found in metrics`);
        return false;
      }

      const threshold = Number(alert.threshold);
      const value = Number(metricValue);

      switch (alert.comparison) {
        case AlertComparison.GREATER_THAN:
          return value > threshold;
        
        case AlertComparison.LESS_THAN:
          return value < threshold;
        
        case AlertComparison.EQUAL_TO:
          return value === threshold;
        
        case AlertComparison.GREATER_THAN_OR_EQUAL:
          return value >= threshold;
        
        case AlertComparison.LESS_THAN_OR_EQUAL:
          return value <= threshold;
        
        default:
          this.logger.warn(`Unknown comparison operator: ${alert.comparison}`);
          return false;
      }
    } catch (error) {
      this.logger.error(`Error evaluating condition for alert ${alert.id}:`, error);
      return false;
    }
  }

  private async triggerAlert(alert: any, metrics: any) {
    try {
      const metricValue = metrics[alert.condition];
      
      // Check if alert was recently triggered (cooldown period: 5 minutes)
      const cooldownMinutes = 5;
      const cooldownTime = new Date(Date.now() - cooldownMinutes * 60 * 1000);
      
      const recentTrigger = await this.prisma.alertTrigger.findFirst({
        where: {
          alertId: alert.id,
          triggeredAt: {
            gte: cooldownTime,
          },
        },
        orderBy: {
          triggeredAt: 'desc',
        },
      });

      if (recentTrigger) {
        this.logger.debug(`Alert ${alert.id} in cooldown period, skipping trigger`);
        return;
      }

      // Create alert trigger record
      const trigger = await this.prisma.alertTrigger.create({
        data: {
          alertId: alert.id,
          value: metricValue,
          notified: false,
        },
      });

      this.logger.log(`Alert triggered: ${alert.name} (${alert.id})`);

      // Send notifications
      const notificationResult = await this.notificationsService.sendAlertNotification(
        alert,
        trigger,
      );

      // Update trigger with notification status
      await this.prisma.alertTrigger.update({
        where: { id: trigger.id },
        data: {
          notified: notificationResult.success,
        },
      });

      this.logger.log(`Alert notification sent for ${alert.name}: ${notificationResult.success}`);
    } catch (error) {
      this.logger.error(`Error triggering alert ${alert.id}:`, error);
    }
  }

  async getAlertHistory(alertId: string, limit: number = 50) {
    return this.prisma.alertTrigger.findMany({
      where: { alertId },
      orderBy: { triggeredAt: 'desc' },
      take: limit,
    });
  }

  async getAlertStatistics(alertId: string) {
    const alert = await this.prisma.alert.findUnique({
      where: { id: alertId },
      include: {
        triggers: {
          orderBy: { triggeredAt: 'desc' },
        },
      },
    });

    if (!alert) {
      return null;
    }

    const totalTriggers = alert.triggers.length;
    const notifiedCount = alert.triggers.filter(t => t.notified).length;
    const lastTriggered = alert.triggers[0]?.triggeredAt || null;

    return {
      alertId,
      totalTriggers,
      notifiedCount,
      notificationRate: totalTriggers > 0 ? (notifiedCount / totalTriggers) * 100 : 0,
      lastTriggered,
      enabled: alert.enabled,
    };
  }
}
