"use strict";
/**
 * Resolvers Index
 *
 * Merges all resolver modules into a single resolver map.
 * Uses lodash merge for deep merging of resolver objects.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvers = void 0;
const lodash_1 = require("lodash");
const auth_1 = require("./auth");
const event_1 = require("./event");
const booking_1 = require("./booking");
/**
 * Combined resolvers from all modules.
 * Merged using lodash.merge for deep object composition.
 */
exports.resolvers = (0, lodash_1.merge)(auth_1.authResolver, booking_1.bookingResolver, event_1.eventResolver);
//# sourceMappingURL=index.js.map