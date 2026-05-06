import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import axios from 'axios';

export interface EmailOptions {
  to: string;
  subject: string;
  body: string;
  html?: string;
}

export interface SlackMessage {
  text: string;
  channel?: string;
  username?: string;
  icon_emoji?: string;
}

export interface DiscordMessage {
  content: string;
  username?: string;
  avatar_url?: string;
  embeds?: Array<{
    title?: string;
    description?: string;
    color?: number;
    fields?: Array<{ name: string; value: string; inline?: boolean }>;
    timestamp?: string;
  }>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private configService: ConfigService) {
    this.initializeEmailTransporter();
  }

  private initializeEmailTransporter() {
    const smtpHost = this.configService.get('SMTP_HOST');
    const smtpPort = this.configService.get('SMTP_PORT');
    const smtpUser = this.configService.get('SMTP_USER');
    const smtpPassword = this.configService.get('SMTP_PASSWORD');

    if (smtpHost && smtpPort && smtpUser && smtpPassword) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort, 10),
        secure: this.configService.get('SMTP_SECURE') === 'true',
        auth: {
          user: smtpUser,
          pass: smtpPassword,
        },
      });

      this.logger.log('Email transporter initialized successfully');
    } else {
      this.logger.warn('Email configuration incomplete, email notifications disabled');
    }
  }

  async sendEmail(options: EmailOptions | string, subject?: string, body?: string) {
    if (!this.transporter) {
      this.logger.warn('Email transporter not configured');
      return { success: false, error: 'Email not configured' };
    }

    try {
      // Support both object and individual parameters
      const emailOptions: EmailOptions = typeof options === 'string' 
        ? { to: options, subject: subject!, body: body! }
        : options;

      const fromName = this.configService.get('SMTP_FROM_NAME') || 'Probe Platform';
      const fromEmail = this.configService.get('SMTP_FROM_EMAIL') || 'noreply@probe.dev';

      const mailOptions = {
        from: `"${fromName}" <${fromEmail}>`,
        to: emailOptions.to,
        subject: emailOptions.subject,
        text: emailOptions.body,
        html: emailOptions.html || `<p>${emailOptions.body}</p>`,
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      this.logger.log(`Email sent successfully to ${emailOptions.to}: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      this.logger.error('Error sending email:', error);
      return { success: false, error: error.message };
    }
  }

  async sendSlack(message: string | SlackMessage) {
    const webhookUrl = this.configService.get('SLACK_WEBHOOK_URL');
    if (!webhookUrl) {
      this.logger.warn('Slack webhook URL not configured');
      return { success: false, error: 'Slack webhook not configured' };
    }

    try {
      const payload: SlackMessage = typeof message === 'string'
        ? {
            text: message,
            channel: this.configService.get('SLACK_CHANNEL') || '#probe-alerts',
            username: this.configService.get('SLACK_USERNAME') || 'Probe Bot',
            icon_emoji: this.configService.get('SLACK_ICON_EMOJI') || ':robot_face:',
          }
        : message;

      const response = await axios.post(webhookUrl, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000,
      });

      if (response.status === 200 && response.data === 'ok') {
        this.logger.log('Slack notification sent successfully');
        return { success: true };
      } else {
        this.logger.warn(`Slack API returned unexpected response: ${response.data}`);
        return { success: false, error: 'Unexpected response from Slack' };
      }
    } catch (error) {
      this.logger.error('Error sending Slack notification:', error);
      return { success: false, error: error.message };
    }
  }

  async sendDiscord(message: string | DiscordMessage) {
    const webhookUrl = this.configService.get('DISCORD_WEBHOOK_URL');
    if (!webhookUrl) {
      this.logger.warn('Discord webhook URL not configured');
      return { success: false, error: 'Discord webhook not configured' };
    }

    try {
      const payload: DiscordMessage = typeof message === 'string'
        ? {
            content: message,
            username: this.configService.get('DISCORD_USERNAME') || 'Probe Bot',
            avatar_url: this.configService.get('DISCORD_AVATAR_URL'),
          }
        : message;

      const response = await axios.post(webhookUrl, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000,
      });

      if (response.status === 204 || response.status === 200) {
        this.logger.log('Discord notification sent successfully');
        return { success: true };
      } else {
        this.logger.warn(`Discord API returned unexpected status: ${response.status}`);
        return { success: false, error: 'Unexpected response from Discord' };
      }
    } catch (error) {
      this.logger.error('Error sending Discord notification:', error);
      return { success: false, error: error.message };
    }
  }

  async sendAlertNotification(alert: any, trigger: any) {
    const message = this.formatAlertMessage(alert, trigger);
    
    const results = await Promise.allSettled([
      this.sendEmail({
        to: alert.email || 'admin@probe.dev',
        subject: `Alert Triggered: ${alert.name}`,
        body: message,
        html: this.formatAlertHtml(alert, trigger),
      }),
      this.sendSlack({
        text: message,
        channel: alert.slackChannel,
      }),
      this.sendDiscord({
        content: message,
        embeds: [{
          title: `🚨 Alert: ${alert.name}`,
          description: alert.description,
          color: 0xff0000, // Red
          fields: [
            { name: 'Condition', value: alert.condition, inline: true },
            { name: 'Threshold', value: alert.threshold.toString(), inline: true },
            { name: 'Current Value', value: trigger.value.toString(), inline: true },
          ],
          timestamp: new Date().toISOString(),
        }],
      }),
    ]);

    const successCount = results.filter(r => r.status === 'fulfilled').length;
    this.logger.log(`Alert notification sent via ${successCount}/${results.length} channels`);

    return {
      success: successCount > 0,
      results: results.map((r, i) => ({
        channel: ['email', 'slack', 'discord'][i],
        status: r.status,
        result: r.status === 'fulfilled' ? r.value : r.reason,
      })),
    };
  }

  private formatAlertMessage(alert: any, trigger: any): string {
    return `
🚨 Alert Triggered: ${alert.name}

Program: ${alert.program?.name || 'Unknown'}
Condition: ${alert.condition} ${alert.comparison} ${alert.threshold}
Current Value: ${trigger.value}
Time: ${new Date(trigger.triggeredAt).toLocaleString()}

${alert.description || ''}
    `.trim();
  }

  private formatAlertHtml(alert: any, trigger: any): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #ff4444; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
    .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-top: none; }
    .footer { background: #333; color: white; padding: 10px; text-align: center; border-radius: 0 0 5px 5px; }
    .metric { background: white; padding: 10px; margin: 10px 0; border-left: 4px solid #ff4444; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>🚨 Alert Triggered</h2>
    </div>
    <div class="content">
      <h3>${alert.name}</h3>
      <p>${alert.description || ''}</p>
      
      <div class="metric">
        <strong>Program:</strong> ${alert.program?.name || 'Unknown'}
      </div>
      
      <div class="metric">
        <strong>Condition:</strong> ${alert.condition} ${alert.comparison} ${alert.threshold}
      </div>
      
      <div class="metric">
        <strong>Current Value:</strong> ${trigger.value}
      </div>
      
      <div class="metric">
        <strong>Time:</strong> ${new Date(trigger.triggeredAt).toLocaleString()}
      </div>
    </div>
    <div class="footer">
      <p>Probe Platform - Solana Observability</p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  async testConnection(channel: 'email' | 'slack' | 'discord') {
    const testMessage = `Test notification from Probe Platform at ${new Date().toISOString()}`;
    
    switch (channel) {
      case 'email':
        return this.sendEmail({
          to: this.configService.get('SMTP_USER') || 'test@example.com',
          subject: 'Probe Platform - Test Email',
          body: testMessage,
        });
      case 'slack':
        return this.sendSlack(testMessage);
      case 'discord':
        return this.sendDiscord(testMessage);
      default:
        return { success: false, error: 'Unknown channel' };
    }
  }
}
