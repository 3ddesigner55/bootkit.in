import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const isProduction = process.env.NODE_ENV === 'production';
const excludeErrors = winston.format((info) =>
  info.level === 'error' ? false : info,
);

const accessTransport = new DailyRotateFile({
  filename: 'logs/access/access-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxFiles: '30d',
  level: 'debug',
  format: winston.format.combine(
    excludeErrors(),
    winston.format.timestamp(),
    winston.format.json(),
  ),
});

const errorTransport = new DailyRotateFile({
  filename: 'logs/error/error-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxFiles: '30d',
  level: 'error',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
});

const transports: winston.transport[] = [accessTransport, errorTransport];

if (!isProduction) {
  transports.unshift(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),
  );
}

export const logger = winston.createLogger({
  levels: winston.config.npm.levels,
  level: 'debug',
  transports,
});
