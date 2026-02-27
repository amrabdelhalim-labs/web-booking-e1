/**
 * Application Configuration
 *
 * Centralizes all environment variables and configuration settings.
 * Uses dotenv to load variables from .env file.
 */
export declare const config: {
    /** Server port number */
    port: string | number;
    /**
     * MongoDB connection URL
     * Checks multiple environment variables in order of priority:
     * 1. DATABASE_URL (Heroku standard)
     * 2. MONGODB_URI (MongoDB Atlas standard)
     * 3. DB_URL (custom)
     * Falls back to localhost for local development
     */
    dbUrl: string;
    /** JWT secret key for token signing */
    jwtSecret: string;
    /** Allowed client origin URLs for CORS */
    appUrls: string[];
};
//# sourceMappingURL=index.d.ts.map