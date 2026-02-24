/**
 * Resolvers Index
 *
 * Merges all resolver modules into a single resolver map.
 * Uses lodash merge for deep merging of resolver objects.
 */

import { merge } from 'lodash';
import { authResolver } from './auth';
import { eventResolver } from './event';
import { bookingResolver } from './booking';

/**
 * Combined resolvers from all modules.
 * Merged using lodash.merge for deep object composition.
 */
export const resolvers = merge(authResolver, bookingResolver, eventResolver);
