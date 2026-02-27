/**
 * User Repository
 *
 * Extends BaseRepository with user-specific data operations.
 * Handles user lookups, authentication checks, and profile management.
 *
 * Singleton: Use getUserRepository() to get the shared instance.
 */
import { BaseRepository } from './base.repository';
import { IUser } from '../types';
declare class UserRepository extends BaseRepository<IUser> {
    constructor();
    /**
     * Find a user by their email address.
     */
    findByEmail(email: string): Promise<IUser | null>;
    /**
     * Check if an email is already registered.
     */
    emailExists(email: string): Promise<boolean>;
    /**
     * Update user profile fields (username and/or password).
     */
    updateProfile(id: string, data: {
        username?: string;
        password?: string;
    }): Promise<IUser | null>;
}
/**
 * Returns the singleton UserRepository instance.
 */
export declare function getUserRepository(): UserRepository;
export { UserRepository };
//# sourceMappingURL=user.repository.d.ts.map