/**
 * Logger utility
 * Winston-based logging with different log levels
 */

import winston from 'winston';

const logLevel = process.env.LOG_LEVEL || 'info';
const prettyConsole = (process.env.LOG_PRETTY || '').toLowerCase() === 'true';
const serviceName = process.env.SERVICE_NAME || 'rag-microservice';
const serviceEnv = process.env.NODE_ENV || 'development';

const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: serviceName, env: serviceEnv },
  transports: [
    new winston.transports.Console(
      prettyConsole
        ? {
            format: winston.format.combine(
              winston.format.colorize(),
              winston.format.timestamp(),
              winston.format.printf(({ level, message, timestamp, ...meta }) => {
                return `${timestamp} ${level}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
              })
            ),
          }
        : {}
    ),
  ],
});

export { logger };




