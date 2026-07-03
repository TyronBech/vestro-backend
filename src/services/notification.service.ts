import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { Result, ok, err } from '../utils/result';
import { PushTokenRepositoryPg } from '../infrastructure/db/push-token.repository.pg';
import { NotificationRepositoryPg } from '../infrastructure/db/notification.repository.pg';
import { CreatePushTokenDto, UpdatePushTokenDto } from '../domain/notification/notification.repository';
import { logger } from '../utils/logger';

const tokenRepo = new PushTokenRepositoryPg();
const notificationRepo = new NotificationRepositoryPg();
const expo = new Expo();

export class NotificationService {
  /**
   * Registers a new push token for a user.
   */
  static async registerToken(
    userId: string,
    token: string,
    deviceType?: string | null,
    deviceName?: string | null,
  ): Promise<Result<any, 'INVALID_TOKEN' | 'DB_ERROR'>> {
    try {
      logger.info(`Executing registerToken service for userId: ${userId}, token: ${token}`);

      if (!Expo.isExpoPushToken(token)) {
        logger.warn(`registerToken failed: Invalid Expo push token: ${token}`);
        return err('INVALID_TOKEN');
      }

      // Check if this token is already registered to anyone
      const existingToken = await tokenRepo.findByToken(token);

      if (existingToken) {
        if (existingToken.userId === userId) {
          // Token is already registered to the same user, just update metadata if changed
          const updateData: UpdatePushTokenDto = {};
          if (deviceType !== undefined) updateData.deviceType = deviceType;
          if (deviceName !== undefined) updateData.deviceName = deviceName;

          const updated = await tokenRepo.update(existingToken.id, updateData);
          return ok(updated);
        } else {
          // Token is registered to someone else (e.g. device changed owners), delete it first
          await tokenRepo.delete(existingToken.id);
        }
      }

      // Create new token mapping
      const createData: CreatePushTokenDto = {
        userId,
        token,
      };
      if (deviceType !== undefined) createData.deviceType = deviceType;
      if (deviceName !== undefined) createData.deviceName = deviceName;

      const newToken = await tokenRepo.create(createData);

      logger.info(`registerToken service completed successfully for userId: ${userId}, tokenId: ${newToken.id}`);
      return ok(newToken);
    } catch (error) {
      logger.error(`registerToken service DB_ERROR for userId ${userId}:`, error);
      return err('DB_ERROR');
    }
  }

  /**
   * Unregisters/removes a push token.
   */
  static async unregisterToken(
    userId: string,
    token: string,
  ): Promise<Result<boolean, 'NOT_FOUND' | 'DB_ERROR'>> {
    try {
      logger.info(`Executing unregisterToken service for userId: ${userId}, token: ${token}`);

      const existingToken = await tokenRepo.findByToken(token);
      if (!existingToken || existingToken.userId !== userId) {
        logger.warn(`unregisterToken failed: Token not found or user mismatch for token: ${token}`);
        return err('NOT_FOUND');
      }

      await tokenRepo.delete(existingToken.id);
      logger.info(`unregisterToken service completed successfully for userId: ${userId}, tokenId: ${existingToken.id}`);
      return ok(true);
    } catch (error) {
      logger.error(`unregisterToken service DB_ERROR for userId ${userId}:`, error);
      return err('DB_ERROR');
    }
  }

  /**
   * Lists all notifications for a user.
   */
  static async listNotifications(
    userId: string,
  ): Promise<Result<any[], 'DB_ERROR'>> {
    try {
      logger.info(`Executing listNotifications service for userId: ${userId}`);
      const notifications = await notificationRepo.findByUserId(userId);
      return ok(notifications);
    } catch (error) {
      logger.error(`listNotifications service DB_ERROR for userId ${userId}:`, error);
      return err('DB_ERROR');
    }
  }

  /**
   * Marks a specific notification as read.
   */
  static async markAsRead(
    userId: string,
    notificationId: string,
  ): Promise<Result<any, 'NOT_FOUND' | 'DB_ERROR'>> {
    try {
      logger.info(`Executing markAsRead service for userId: ${userId}, notificationId: ${notificationId}`);
      const existing = await notificationRepo.findById(notificationId);
      if (!existing || existing.userId !== userId) {
        logger.warn(`markAsRead failed: Notification not found or user mismatch for notificationId: ${notificationId}`);
        return err('NOT_FOUND');
      }

      const updated = await notificationRepo.markAsRead(notificationId);
      return ok(updated);
    } catch (error) {
      logger.error(`markAsRead service DB_ERROR for userId ${userId}, notificationId ${notificationId}:`, error);
      return err('DB_ERROR');
    }
  }

  /**
   * Marks all notifications for a user as read.
   */
  static async markAllAsRead(
    userId: string,
  ): Promise<Result<boolean, 'DB_ERROR'>> {
    try {
      logger.info(`Executing markAllAsRead service for userId: ${userId}`);
      await notificationRepo.markAllAsRead(userId);
      return ok(true);
    } catch (error) {
      logger.error(`markAllAsRead service DB_ERROR for userId ${userId}:`, error);
      return err('DB_ERROR');
    }
  }

  /**
   * Saves a notification log in the database and pushes it to all registered user devices.
   */
  static async sendToUser(
    userId: string,
    title: string,
    body: string,
    data?: any,
  ): Promise<Result<boolean, 'DB_ERROR'>> {
    try {
      logger.info(`Sending notification to user: ${userId}. Title: "${title}"`);

      // 1. Log notification in database
      await notificationRepo.create({
        userId,
        title,
        body,
        data: data || null,
        isRead: false,
      });

      // 2. Fetch push tokens
      const tokens = await tokenRepo.findByUserId(userId);
      if (tokens.length === 0) {
        logger.info(`No active push tokens found for userId: ${userId}. Saved to DB inbox only.`);
        return ok(true);
      }

      const tokenStrings = tokens.map((t) => t.token);

      // 3. Send physical push notifications
      await this.sendPush(tokenStrings, title, body, data);

      return ok(true);
    } catch (error) {
      logger.error(`sendToUser service DB_ERROR for userId ${userId}:`, error);
      return err('DB_ERROR');
    }
  }

  /**
   * Low-level helper to trigger Expo push notifications.
   */
  private static async sendPush(
    tokens: string[],
    title: string,
    body: string,
    data?: any,
  ): Promise<void> {
    const messages: ExpoPushMessage[] = [];

    for (const token of tokens) {
      if (!Expo.isExpoPushToken(token)) {
        logger.error(`Push token ${token} is not a valid Expo token. Skipping.`);
        continue;
      }

      messages.push({
        to: token,
        sound: 'default',
        title,
        body,
        data,
      });
    }

    const chunks = expo.chunkPushNotifications(messages);

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        logger.info(`Sent push notifications. Response tickets: ${JSON.stringify(ticketChunk)}`);
      } catch (error) {
        logger.error('Failed to send push notifications to Expo API:', error);
      }
    }
  }
}
