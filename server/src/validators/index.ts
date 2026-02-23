/**
 * Input Validators
 *
 * Server-side validation functions for GraphQL inputs.
 * Returns Arabic error messages for user-facing validation errors.
 *
 * Validation rules mirror client-side validation:
 * - Username: min 3 characters
 * - Email: valid email format
 * - Password: min 6 characters
 * - Event title: 3-200 characters
 * - Event description: min 10 characters
 * - Event price: positive number
 * - Event date: valid date string
 */

import { GraphQLError } from "graphql";
import { UserInput, UpdateUserInput, EventInput, UpdateEventInput } from "../types";

// ─── User Validators ─────────────────────────────────────────────────────────

/**
 * Validates user registration input.
 * Throws GraphQLError with Arabic messages on validation failure.
 */
export function validateUserInput(input: UserInput): void {
  const errors: string[] = [];

  if (!input.username || input.username.trim().length < 3) {
    errors.push("اسم المستخدم يجب أن يكون 3 أحرف على الأقل");
  }

  if (!input.email || !isValidEmail(input.email)) {
    errors.push("البريد الإلكتروني غير صالح");
  }

  if (!input.password || input.password.trim().length < 6) {
    errors.push("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
  }

  if (errors.length > 0) {
    throw new GraphQLError(errors.join("، "), {
      extensions: { code: "BAD_USER_INPUT", errors },
    });
  }
}

/**
 * Validates user profile update input.
 * All fields are optional but must be valid if provided.
 */
export function validateUpdateUserInput(input: UpdateUserInput): void {
  const errors: string[] = [];

  if (input.username !== undefined && input.username.trim().length < 3) {
    errors.push("اسم المستخدم يجب أن يكون 3 أحرف على الأقل");
  }

  if (input.password !== undefined && input.password.trim().length < 6) {
    errors.push("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
  }

  if (errors.length > 0) {
    throw new GraphQLError(errors.join("، "), {
      extensions: { code: "BAD_USER_INPUT", errors },
    });
  }
}

/**
 * Validates login credentials format (not authentication).
 */
export function validateLoginInput(email: string, password: string): void {
  const errors: string[] = [];

  if (!email || !isValidEmail(email)) {
    errors.push("البريد الإلكتروني غير صالح");
  }

  if (!password || password.trim().length < 6) {
    errors.push("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
  }

  if (errors.length > 0) {
    throw new GraphQLError(errors.join("، "), {
      extensions: { code: "BAD_USER_INPUT", errors },
    });
  }
}

// ─── Event Validators ────────────────────────────────────────────────────────

/**
 * Validates event creation input.
 */
export function validateEventInput(input: EventInput): void {
  const errors: string[] = [];

  if (!input.title || input.title.trim().length < 3) {
    errors.push("عنوان المناسبة يجب أن يكون 3 أحرف على الأقل");
  }

  if (input.title && input.title.trim().length > 200) {
    errors.push("عنوان المناسبة يجب ألا يتجاوز 200 حرف");
  }

  if (!input.description || input.description.trim().length < 10) {
    errors.push("وصف المناسبة يجب أن يكون 10 أحرف على الأقل");
  }

  if (input.price === undefined || input.price === null || input.price <= 0) {
    errors.push("سعر المناسبة يجب أن يكون رقمًا موجبًا");
  }

  if (!input.date || isNaN(Date.parse(input.date))) {
    errors.push("تاريخ المناسبة غير صالح");
  }

  if (errors.length > 0) {
    throw new GraphQLError(errors.join("، "), {
      extensions: { code: "BAD_USER_INPUT", errors },
    });
  }
}

/**
 * Validates event update input.
 * All fields are optional but must be valid if provided.
 */
export function validateUpdateEventInput(input: UpdateEventInput): void {
  const errors: string[] = [];

  if (input.title !== undefined) {
    if (input.title.trim().length < 3) {
      errors.push("عنوان المناسبة يجب أن يكون 3 أحرف على الأقل");
    }
    if (input.title.trim().length > 200) {
      errors.push("عنوان المناسبة يجب ألا يتجاوز 200 حرف");
    }
  }

  if (
    input.description !== undefined &&
    input.description.trim().length < 10
  ) {
    errors.push("وصف المناسبة يجب أن يكون 10 أحرف على الأقل");
  }

  if (input.price !== undefined && input.price <= 0) {
    errors.push("سعر المناسبة يجب أن يكون رقمًا موجبًا");
  }

  if (input.date !== undefined && isNaN(Date.parse(input.date))) {
    errors.push("تاريخ المناسبة غير صالح");
  }

  if (errors.length > 0) {
    throw new GraphQLError(errors.join("، "), {
      extensions: { code: "BAD_USER_INPUT", errors },
    });
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Simple email format validation.
 */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
