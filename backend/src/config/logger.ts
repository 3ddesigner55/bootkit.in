import winston from 'winston';

const isProduction = process.env.NODE_ENV === 'production';

const consoleFormat = isProduction
  ? winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
    )
  : winston.format.combine(
      winston.format.colorize(),
      winston.format.simple(),
    );

export const logger = winston.createLogger({
  levels: winston.config.npm.levels,
  level: isProduction ? 'http' : 'debug',
  transports: [
    new winston.transports.Console({
      format: consoleFormat,
    }),
  ],
});