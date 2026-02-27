"use strict";
/**
 * Authentication Resolvers
 *
 * Handles user registration (createUser), login, profile update, and account deletion.
 * Uses bcrypt for password hashing and JWT for token generation.
 * Cascade deletion removes all user's events and bookings on account delete.
 *
 * Data access is abstracted through the Repository Pattern.
 * Input validation is handled by dedicated validators.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authResolver = void 0;
const graphql_1 = require("graphql");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const graphql_resolvers_1 = require("graphql-resolvers");
const config_1 = require("../config");
const isAuth_1 = require("../middlewares/isAuth");
const repositories_1 = require("../repositories");
const validators_1 = require("../validators");
exports.authResolver = {
    Mutation: {
        /**
         * Authenticates a user with email and password.
         * Returns AuthData with JWT token on success.
         */
        login: async (_parent, { email, password }) => {
            (0, validators_1.validateLoginInput)(email, password);
            const repos = (0, repositories_1.getRepositoryManager)();
            const user = await repos.user.findByEmail(email);
            if (!user) {
                throw new graphql_1.GraphQLError('هذا الحساب غير موجود لدينا!!', {
                    extensions: { code: 'BAD_USER_INPUT' },
                });
            }
            const isEqual = await bcryptjs_1.default.compare(password, user.password);
            if (!isEqual) {
                throw new graphql_1.GraphQLError('خطأ في البريد الإلكتروني أو كلمة المرور!!', {
                    extensions: { code: 'BAD_USER_INPUT' },
                });
            }
            const token = jsonwebtoken_1.default.sign({ id: user.id }, config_1.config.jwtSecret);
            return { userId: user.id, token, username: user.username };
        },
        /**
         * Creates a new user account.
         * Hashes the password and returns AuthData with JWT token.
         */
        createUser: async (_parent, { userInput }) => {
            (0, validators_1.validateUserInput)(userInput);
            const repos = (0, repositories_1.getRepositoryManager)();
            const emailTaken = await repos.user.emailExists(userInput.email);
            if (emailTaken) {
                throw new graphql_1.GraphQLError('هذا الحساب موجود مسبقًا لدينا!!', {
                    extensions: { code: 'BAD_USER_INPUT' },
                });
            }
            const hashedPassword = await bcryptjs_1.default.hash(userInput.password, 12);
            const user = await repos.user.create({
                username: userInput.username,
                email: userInput.email,
                password: hashedPassword,
            });
            const token = jsonwebtoken_1.default.sign({ id: user.id }, config_1.config.jwtSecret);
            return { userId: user.id, token, username: user.username };
        },
        /**
         * Updates the authenticated user's profile data (username and/or password).
         * Email cannot be changed.
         */
        updateUser: (0, graphql_resolvers_1.combineResolvers)(isAuth_1.isAuthenticated, async (_parent, { updateUserInput }, context) => {
            (0, validators_1.validateUpdateUserInput)(updateUserInput);
            const repos = (0, repositories_1.getRepositoryManager)();
            const user = await repos.user.findById(context.user._id.toString());
            if (!user) {
                throw new graphql_1.GraphQLError('المستخدم غير موجود!', {
                    extensions: { code: 'NOT_FOUND' },
                });
            }
            if (updateUserInput.username) {
                user.username = updateUserInput.username;
            }
            if (updateUserInput.password) {
                user.password = await bcryptjs_1.default.hash(updateUserInput.password, 12);
            }
            await user.save();
            return user;
        }),
        /**
         * Deletes the authenticated user's account.
         * Cascade: removes all user's events and all bookings
         * (both bookings by the user and bookings on the user's events).
         */
        deleteUser: (0, graphql_resolvers_1.combineResolvers)(isAuth_1.isAuthenticated, async (_parent, _args, context) => {
            const repos = (0, repositories_1.getRepositoryManager)();
            const userId = context.user._id.toString();
            // Find all event IDs created by this user
            const userEventIds = await repos.event.getEventIdsByCreator(userId);
            // Delete all bookings on user's events + all bookings made by user
            await repos.booking.deleteByUserCascade(userId, userEventIds);
            // Delete all events created by user
            await repos.event.deleteWhere({ creator: userId });
            // Delete the user account
            await repos.user.delete(userId);
            return true;
        }),
    },
};
//# sourceMappingURL=auth.js.map