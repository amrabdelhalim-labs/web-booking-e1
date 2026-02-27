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
import { UserInput, UpdateUserInput, EventInput, UpdateEventInput } from '../types';
/**
 * Validates user registration input.
 * Throws GraphQLError with Arabic messages on validation failure.
 */
export declare function validateUserInput(input: UserInput): void;
/**
 * Validates user profile update input.
 * All fields are optional but must be valid if provided.
 */
export declare function validateUpdateUserInput(input: UpdateUserInput): void;
/**
 * Validates login credentials format (not authentication).
 */
export declare function validateLoginInput(email: string, password: string): void;
/**
 * Validates event creation input.
 */
export declare function validateEventInput(input: EventInput): void;
/**
 * Validates event update input.
 * All fields are optional but must be valid if provided.
 */
export declare function validateUpdateEventInput(input: UpdateEventInput): void;
//# sourceMappingURL=index.d.ts.map