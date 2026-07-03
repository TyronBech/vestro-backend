import winston from 'winston';
import 'winston-daily-rotate-file';
import fs from 'fs';
import path from 'path';
import { env } from '../config/env'
 
// Check for logs folder existence
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Console Format (Terminal based logs)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message }) => {
    return `[${timestamp}] ${level.toLocaleUpperCase()}: ${message}`;
  })
);

// File Format (Clean JSON for parsing tools)
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);

const transports: winston.transport[] = [];

if (env.NODE_ENV !== 'test') {
  // Create the Daily Rotate Transports
  const dailyAppLogTransport = new winston.transports.DailyRotateFile({
    filename: path.join(logDir, 'vestro-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',      
    maxFiles: '14d',
  });

  // Daily Rotate Transports for Error Logs
  const dailyErrorLogTransport = new winston.transports.DailyRotateFile({
    filename: path.join(logDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    maxFiles: '30d',
  });

  transports.push(dailyAppLogTransport);
  transports.push(dailyErrorLogTransport);
}

// Initialize the Logger
export const logger = winston.createLogger({
  level: 'info',
  format: fileFormat,
  transports,
});

// Environment Switch (Turn Off in Production)
if (env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
  }));
}