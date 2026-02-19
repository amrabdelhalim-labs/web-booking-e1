/**
 * Application Configuration
 *
 * Centralizes all environment variables and configuration settings.
 * Uses dotenv to load variables from .env file.
 */

import dotenv from "dotenv";
dotenv.config();

export const config = {
  /** Server port number */
  port: process.env.PORT || 4000,

  /** MongoDB connection URL */
  dbUrl: process.env.DB_URL || "mongodb://localhost:27017/event-booking",

  /** JWT secret key for token signing */
  jwtSecret: process.env.JWT_SECRET || "default_secret",

  /** Allowed client origin URL for CORS */
  appUrl: process.env.APP_URL || "http://localhost:5173",
};
