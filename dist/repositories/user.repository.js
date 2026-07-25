"use strict";
/**
 * User Repository
 *
 * Extends BaseRepository with user-specific data operations.
 * Handles user lookups, authentication checks, and profile management.
 *
 * Singleton: Use getUserRepository() to get the shared instance.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
exports.getUserRepository = getUserRepository;
const base_repository_1 = require("./base.repository");
const user_1 = __importDefault(require("../models/user"));
class UserRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(user_1.default);
    }
    /**
     * Find a user by their email address.
     */
    async findByEmail(email) {
        return this.findOne({ email });
    }
    /**
     * Check if an email is already registered.
     */
    async emailExists(email) {
        return this.exists({ email });
    }
    /**
     * Update user profile fields (username and/or password).
     */
    async updateProfile(id, data) {
        return this.update(id, data);
    }
}
exports.UserRepository = UserRepository;
// ─── Singleton ───────────────────────────────────────────────────────────────
let instance = null;
/**
 * Returns the singleton UserRepository instance.
 */
function getUserRepository() {
    if (!instance) {
        instance = new UserRepository();
    }
    return instance;
}
//# sourceMappingURL=user.repository.js.map