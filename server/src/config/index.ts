/**
 * Application Configuration
 *
 * Centralizes all environment variables and configuration settings.
 * Uses dotenv to load variables from .env file.
 */

import dotenv from 'dotenv';
dotenv.config();

export const config = {
  /** Server port number */
  port: process.env.PORT || 4000,

  /**
   * MongoDB connection URL
   * Checks multiple environment variables in order of priority:
   * 1. DATABASE_URL (Heroku standard)
   * 2. MONGODB_URI (MongoDB Atlas standard)
   * 3. DB_URL (custom)
   * Falls back to localhost for local development
   */
  dbUrl:
    process.env.DATABASE_URL ||
    process.env.MONGODB_URI ||
    process.env.DB_URL ||
    'mongodb://localhost:27017/event-booking',

  /** JWT secret key for token signing */
  jwtSecret: process.env.JWT_SECRET || 'default_secret',

  /** Allowed client origin URLs for CORS */
  appUrls: (process.env.APP_URLS || process.env.APP_URL || 'http://localhost:5173')
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean),
};
