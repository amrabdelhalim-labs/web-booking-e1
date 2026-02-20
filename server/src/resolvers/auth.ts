/**
 * Authentication Resolvers
 *
 * Handles user registration (createUser), login, profile update, and account deletion.
 * Uses bcrypt for password hashing and JWT for token generation.
 * Cascade deletion removes all user's events and bookings on account delete.
 */

import { GraphQLError } from "graphql";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { combineResolvers } from "graphql-resolvers";

import User from "../models/user";
import Event from "../models/event";
import Booking from "../models/booking";
import { config } from "../config";
import { isAuthenticated } from "../middlewares/isAuth";
import { GraphQLContext, UserInput, UpdateUserInput } from "../types";

export const authResolver = {
  Mutation: {
    /**
     * Authenticates a user with email and password.
     * Returns AuthData with JWT token on success.
     */
    login: async (
      _parent: unknown,
      { email, password }: { email: string; password: string }
    ) => {
      const user = await User.findOne({ email });
      if (!user) {
        throw new GraphQLError("هذا الحساب غير موجود لدينا!!", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      const isEqual = await bcrypt.compare(password, user.password);
      if (!isEqual) {
        throw new GraphQLError(
          "خطأ في البريد الإلكتروني أو كلمة المرور!!",
          { extensions: { code: "BAD_USER_INPUT" } }
        );
      }

      const token = jwt.sign(
        { id: user.id },
        config.jwtSecret
      );

      return { userId: user.id, token, username: user.username };
    },

    /**
     * Creates a new user account.
     * Hashes the password and returns AuthData with JWT token.
     */
    createUser: async (
      _parent: unknown,
      { userInput }: { userInput: UserInput }
    ) => {
      const existingUser = await User.findOne({ email: userInput.email });
      if (existingUser) {
        throw new GraphQLError("هذا الحساب موجود مسبقًا لدينا!!", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      const hashedPassword = await bcrypt.hash(userInput.password, 12);
      const user = new User({
        username: userInput.username,
        email: userInput.email,
        password: hashedPassword,
      });
      await user.save();

      const token = jwt.sign(
        { id: user.id },
        config.jwtSecret
      );

      return { userId: user.id, token, username: user.username };
    },

    /**
     * Updates the authenticated user's profile data (username and/or password).
     * Email cannot be changed.
     */
    updateUser: combineResolvers(
      isAuthenticated,
      async (
        _parent: unknown,
        { updateUserInput }: { updateUserInput: UpdateUserInput },
        context: GraphQLContext
      ) => {
        const user = await User.findById(context.user!._id);
        if (!user) {
          throw new GraphQLError("المستخدم غير موجود!", {
            extensions: { code: "NOT_FOUND" },
          });
        }

        if (updateUserInput.username) {
          user.username = updateUserInput.username;
        }

        if (updateUserInput.password) {
          user.password = await bcrypt.hash(updateUserInput.password, 12);
        }

        await user.save();
        return user;
      }
    ),

    /**
     * Deletes the authenticated user's account.
     * Cascade: removes all user's events and all bookings
     * (both bookings by the user and bookings on the user's events).
     */
    deleteUser: combineResolvers(
      isAuthenticated,
      async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
        const userId = context.user!._id;

        // Find all events created by this user
        const userEvents = await Event.find({ creator: userId });
        const userEventIds = userEvents.map((e) => e._id);

        // Delete all bookings on user's events + all bookings made by user
        await Booking.deleteMany({
          $or: [{ user: userId }, { event: { $in: userEventIds } }],
        });

        // Delete all events created by user
        await Event.deleteMany({ creator: userId });

        // Delete the user account
        await User.findByIdAndDelete(userId);

        return true;
      }
    ),
  },
};
