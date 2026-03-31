/**
 * Winston Logger - Centralized Logging System
 */

const { createLogger, format, transports } = require('winston');
const path = require('path');

const { combine, timestamp, errors, colorize, printf, json } = format;

// Custom log format for development
const devFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true })
  ),
  transports: [
    // Console transport
    new transports.Console({
      format: process.env.NODE_ENV === 'production'
        ? json()
        : combine(colorize(), devFormat)
    }),
    // Error log file
    new transports.File({
      filename: path.join(__dirname, '../logs/error.log'),
      level: 'error',
      format: json(),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Combined log file
    new transports.File({
      filename: path.join(__dirname, '../logs/combined.log'),
      format: json(),
      maxsize: 10485760, // 10MB
      maxFiles: 10
    })
  ],
  exceptionHandlers: [
    new transports.File({
      filename: path.join(__dirname, '../logs/exceptions.log')
    })
  ]
});

module.exports = logger;
