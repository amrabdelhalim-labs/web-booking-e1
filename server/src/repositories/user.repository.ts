/**
 * User Repository
 *
 * Extends BaseRepository with user-specific data operations.
 * Handles user lookups, authentication checks, and profile management.
 *
 * Singleton: Use getUserRepository() to get the shared instance.
 */

import { BaseRepository } from "./base.repository";
import User from "../models/user";
import { IUser } from "../types";

class UserRepository extends BaseRepository<IUser> {
  constructor() {
    super(User);
  }

  /**
   * Find a user by their email address.
   */
  async findByEmail(email: string): Promise<IUser | null> {
    return this.findOne({ email });
  }

  /**
   * Check if an email is already registered.
   */
  async emailExists(email: string): Promise<boolean> {
    return this.exists({ email });
  }

  /**
   * Update user profile fields (username and/or password).
   */
  async updateProfile(
    id: string,
    data: { username?: string; password?: string }
  ): Promise<IUser | null> {
    return this.update(id, data);
  }
}

// ─── Singleton ───────────────────────────────────────────────────────────────

let instance: UserRepository | null = null;

/**
 * Returns the singleton UserRepository instance.
 */
export function getUserRepository(): UserRepository {
  if (!instance) {
    instance = new UserRepository();
  }
  return instance;
}

export { UserRepository };
