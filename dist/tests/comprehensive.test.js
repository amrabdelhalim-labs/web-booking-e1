"use strict";
/**
 * Comprehensive Integration Tests
 *
 * Full workflow test simulating real application usage:
 * 1. Create multiple users
 * 2. Create events for each user
 * 3. Book events (including duplicate prevention)
 * 4. Query events with search and pagination
 * 5. Update events (ownership enforcement)
 * 6. Cancel bookings
 * 7. Cascade delete users (events + bookings cleanup)
 * 8. Validator tests
 *
 * Run: npm run test:comprehensive
 * Requires: MongoDB running on localhost:27017
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const config_1 = require("../config");
const repositories_1 = require("../repositories");
const validators_1 = require("../validators");
const test_helpers_1 = require("./test.helpers");
const TEST_DB_URL = process.env.TEST_DB_URL || config_1.config.dbUrl.replace(/\/[^/]+$/, '/event-booking-test');
async function runTests() {
    (0, test_helpers_1.logSection)('Comprehensive Integration Tests');
    (0, test_helpers_1.logInfo)(`Connecting to: ${TEST_DB_URL}`);
    try {
        await mongoose_1.default.connect(TEST_DB_URL);
        (0, test_helpers_1.logStep)('Database connected');
    }
    catch (err) {
        console.error('Failed to connect to MongoDB:', err);
        process.exit(1);
    }
    const repos = (0, repositories_1.getRepositoryManager)();
    // ─── Clean Up ─────────────────────────────────────────────────────────
    await repos.booking.deleteWhere({});
    await repos.event.deleteWhere({});
    await repos.user.deleteWhere({});
    // ═══ Phase 1: User Registration ═══════════════════════════════════════
    (0, test_helpers_1.logSection)('Phase 1: User Registration');
    (0, test_helpers_1.logStep)('Creating 3 users...');
    const hashedPass = await bcryptjs_1.default.hash('Test123!', 12);
    const user1 = await repos.user.create({
        username: 'عمرو',
        email: 'amr@test.com',
        password: hashedPass,
    });
    (0, test_helpers_1.assert)(user1.username === 'عمرو', 'User 1 (عمرو) created');
    const user2 = await repos.user.create({
        username: 'نورة',
        email: 'noura@test.com',
        password: hashedPass,
    });
    (0, test_helpers_1.assert)(user2.username === 'نورة', 'User 2 (نورة) created');
    const user3 = await repos.user.create({
        username: 'خالد',
        email: 'khaled@test.com',
        password: hashedPass,
    });
    (0, test_helpers_1.assert)(user3.username === 'خالد', 'User 3 (خالد) created');
    // Verify password hashing
    (0, test_helpers_1.logStep)('Verifying password hashing...');
    const isCorrect = await bcryptjs_1.default.compare('Test123!', user1.password);
    (0, test_helpers_1.assert)(isCorrect === true, 'Password hash comparison works');
    // Duplicate email check
    (0, test_helpers_1.logStep)('Checking duplicate email prevention...');
    const emailTaken = await repos.user.emailExists('amr@test.com');
    (0, test_helpers_1.assert)(emailTaken === true, 'Duplicate email detected');
    const userCount = await repos.user.count();
    (0, test_helpers_1.assert)(userCount === 3, `All 3 users created (got ${userCount})`);
    // ═══ Phase 2: Event Creation ══════════════════════════════════════════
    (0, test_helpers_1.logSection)('Phase 2: Event Creation');
    (0, test_helpers_1.logStep)('Creating events...');
    const event1 = await repos.event.create({
        title: 'مؤتمر التقنية السنوي',
        description: 'مؤتمر شامل يغطي أحدث التقنيات والابتكارات',
        price: 200,
        date: new Date('2026-06-15T10:00:00'),
        creator: user1._id,
    });
    (0, test_helpers_1.assert)(event1.title === 'مؤتمر التقنية السنوي', 'Event 1 created');
    const event2 = await repos.event.create({
        title: 'ورشة تطوير الويب',
        description: 'ورشة عملية لتعلم تطوير تطبيقات الويب الحديثة',
        price: 75,
        date: new Date('2026-07-20T14:00:00'),
        creator: user1._id,
    });
    (0, test_helpers_1.assert)(event2.title === 'ورشة تطوير الويب', 'Event 2 created');
    const event3 = await repos.event.create({
        title: 'حفل خيري',
        description: 'حفل خيري لدعم الأسر المحتاجة في المنطقة',
        price: 30,
        date: new Date('2026-08-05T18:00:00'),
        creator: user2._id,
    });
    (0, test_helpers_1.assert)(event3.title === 'حفل خيري', 'Event 3 created');
    // Title uniqueness
    (0, test_helpers_1.logStep)('Checking title uniqueness...');
    const titleTaken = await repos.event.titleExists('مؤتمر التقنية السنوي');
    (0, test_helpers_1.assert)(titleTaken === true, 'Duplicate title detected');
    const eventCount = await repos.event.count();
    (0, test_helpers_1.assert)(eventCount === 3, `All 3 events created (got ${eventCount})`);
    // ═══ Phase 3: Event Search & Queries ══════════════════════════════════
    (0, test_helpers_1.logSection)('Phase 3: Event Search & Queries');
    (0, test_helpers_1.logStep)('Searching events...');
    const searchTech = await repos.event.search('تقنية');
    (0, test_helpers_1.assert)(searchTech.length === 1, `Search 'تقنية' → 1 result (got ${searchTech.length})`);
    const searchAll = await repos.event.search('ال');
    (0, test_helpers_1.assert)(searchAll.length >= 2, `Search 'ال' → multiple results (got ${searchAll.length})`);
    const searchNone = await repos.event.search('zzzzzzzzz');
    (0, test_helpers_1.assert)(searchNone.length === 0, `Search 'zzzzzzzzz' → 0 results`);
    // Find by creator
    (0, test_helpers_1.logStep)('Finding events by creator...');
    const user1Events = await repos.event.findByCreator(user1._id.toString());
    (0, test_helpers_1.assert)(user1Events.length === 2, `User1 has 2 events (got ${user1Events.length})`);
    const user2Events = await repos.event.findByCreator(user2._id.toString());
    (0, test_helpers_1.assert)(user2Events.length === 1, `User2 has 1 event (got ${user2Events.length})`);
    const user3Events = await repos.event.findByCreator(user3._id.toString());
    (0, test_helpers_1.assert)(user3Events.length === 0, `User3 has 0 events (got ${user3Events.length})`);
    // Pagination
    (0, test_helpers_1.logStep)('Testing pagination...');
    const page1 = await repos.event.findAllWithCreator({}, 0, 2);
    (0, test_helpers_1.assert)(page1.length === 2, `Page 1 (limit 2) → 2 events (got ${page1.length})`);
    const page2 = await repos.event.findAllWithCreator({}, 2, 2);
    (0, test_helpers_1.assert)(page2.length === 1, `Page 2 (skip 2, limit 2) → 1 event (got ${page2.length})`);
    // ═══ Phase 4: Bookings ════════════════════════════════════════════════
    (0, test_helpers_1.logSection)('Phase 4: Bookings');
    (0, test_helpers_1.logStep)('Creating bookings...');
    const booking1 = await repos.booking.createAndPopulate(user2._id.toString(), event1._id.toString());
    (0, test_helpers_1.assert)(booking1 !== null, 'User2 booked Event1');
    const booking2 = await repos.booking.createAndPopulate(user3._id.toString(), event1._id.toString());
    (0, test_helpers_1.assert)(booking2 !== null, 'User3 booked Event1');
    const booking3 = await repos.booking.createAndPopulate(user3._id.toString(), event3._id.toString());
    (0, test_helpers_1.assert)(booking3 !== null, 'User3 booked Event3');
    // Duplicate prevention
    (0, test_helpers_1.logStep)('Testing duplicate booking prevention...');
    const alreadyBooked = await repos.booking.userHasBooked(user2._id.toString(), event1._id.toString());
    (0, test_helpers_1.assert)(alreadyBooked === true, 'Duplicate booking detected');
    const notBooked = await repos.booking.userHasBooked(user1._id.toString(), event1._id.toString());
    (0, test_helpers_1.assert)(notBooked === false, 'Creator has not booked own event');
    // Find user bookings
    (0, test_helpers_1.logStep)('Finding user bookings...');
    const user2Bookings = await repos.booking.findByUser(user2._id.toString());
    (0, test_helpers_1.assert)(user2Bookings.length === 1, `User2 has 1 booking (got ${user2Bookings.length})`);
    const user3Bookings = await repos.booking.findByUser(user3._id.toString());
    (0, test_helpers_1.assert)(user3Bookings.length === 2, `User3 has 2 bookings (got ${user3Bookings.length})`);
    // Count by event
    (0, test_helpers_1.logStep)('Counting bookings by event...');
    const event1BookingCount = await repos.booking.countByEvent(event1._id.toString());
    (0, test_helpers_1.assert)(event1BookingCount === 2, `Event1 has 2 bookings (got ${event1BookingCount})`);
    // ═══ Phase 5: Event Updates ═══════════════════════════════════════════
    (0, test_helpers_1.logSection)('Phase 5: Event Updates');
    (0, test_helpers_1.logStep)('Updating event...');
    const updatedEvent = await repos.event.updateWithCreator(event1._id.toString(), {
        price: 250,
        title: 'مؤتمر التقنية السنوي (محدث)',
    });
    (0, test_helpers_1.assert)(updatedEvent !== null, 'Event updated successfully');
    (0, test_helpers_1.assert)(updatedEvent.price === 250, 'Price updated to 250');
    (0, test_helpers_1.assert)(updatedEvent.title === 'مؤتمر التقنية السنوي (محدث)', 'Title updated correctly');
    // ═══ Phase 6: Booking Cancellation ════════════════════════════════════
    (0, test_helpers_1.logSection)('Phase 6: Booking Cancellation');
    (0, test_helpers_1.logStep)('Cancelling booking...');
    const cancelledBooking = await repos.booking.delete(booking1._id.toString());
    (0, test_helpers_1.assert)(cancelledBooking !== null, 'Booking cancelled successfully');
    const remainingBookings = await repos.booking.count();
    (0, test_helpers_1.assert)(remainingBookings === 2, `2 bookings remaining (got ${remainingBookings})`);
    // ═══ Phase 7: Cascade Delete ══════════════════════════════════════════
    (0, test_helpers_1.logSection)('Phase 7: Cascade Delete');
    (0, test_helpers_1.logStep)('Cascade deleting user1 (has 2 events)...');
    const user1EventIds = await repos.event.getEventIdsByCreator(user1._id.toString());
    (0, test_helpers_1.logInfo)(`User1 has ${user1EventIds.length} events to cascade`);
    const cascadeBookings = await repos.booking.deleteByUserCascade(user1._id.toString(), user1EventIds);
    (0, test_helpers_1.logInfo)(`Cascade deleted ${cascadeBookings} bookings`);
    await repos.event.deleteWhere({ creator: user1._id });
    await repos.user.delete(user1._id.toString());
    const usersAfter = await repos.user.count();
    (0, test_helpers_1.assert)(usersAfter === 2, `2 users remaining (got ${usersAfter})`);
    const eventsAfter = await repos.event.count();
    (0, test_helpers_1.assert)(eventsAfter === 1, `1 event remaining (got ${eventsAfter})`);
    const bookingsAfter = await repos.booking.count();
    (0, test_helpers_1.assert)(bookingsAfter === 1, `1 booking remaining (got ${bookingsAfter})`);
    // ═══ Phase 8: Validator Tests ═════════════════════════════════════════
    (0, test_helpers_1.logSection)('Phase 8: Input Validation');
    // User input validation
    (0, test_helpers_1.logStep)('Testing user input validation...');
    try {
        (0, validators_1.validateUserInput)({ username: 'ab', email: 'bad', password: '123' });
        (0, test_helpers_1.assert)(false, 'Should have thrown on invalid user input');
    }
    catch (err) {
        (0, test_helpers_1.assert)(err.extensions?.code === 'BAD_USER_INPUT', 'Invalid user input throws BAD_USER_INPUT');
    }
    try {
        (0, validators_1.validateUserInput)({
            username: 'أحمد',
            email: 'ahmed@test.com',
            password: 'SecurePass123',
        });
        (0, test_helpers_1.assert)(true, 'Valid user input passes validation');
    }
    catch {
        (0, test_helpers_1.assert)(false, 'Valid user input should not throw');
    }
    // Login validation
    (0, test_helpers_1.logStep)('Testing login validation...');
    try {
        (0, validators_1.validateLoginInput)('', '');
        (0, test_helpers_1.assert)(false, 'Should have thrown on empty login');
    }
    catch (err) {
        (0, test_helpers_1.assert)(err.extensions?.code === 'BAD_USER_INPUT', 'Empty login throws BAD_USER_INPUT');
    }
    // Update user validation
    (0, test_helpers_1.logStep)('Testing update user validation...');
    try {
        (0, validators_1.validateUpdateUserInput)({ username: 'ab' });
        (0, test_helpers_1.assert)(false, 'Should have thrown on short username');
    }
    catch (err) {
        (0, test_helpers_1.assert)(err.extensions?.code === 'BAD_USER_INPUT', 'Short username throws BAD_USER_INPUT');
    }
    try {
        (0, validators_1.validateUpdateUserInput)({ username: 'أحمد الكبير' });
        (0, test_helpers_1.assert)(true, 'Valid update user input passes');
    }
    catch {
        (0, test_helpers_1.assert)(false, 'Valid update should not throw');
    }
    // Event input validation
    (0, test_helpers_1.logStep)('Testing event input validation...');
    try {
        (0, validators_1.validateEventInput)({
            title: 'ab',
            description: 'short',
            price: -5,
            date: 'invalid',
        });
        (0, test_helpers_1.assert)(false, 'Should have thrown on invalid event input');
    }
    catch (err) {
        (0, test_helpers_1.assert)(err.extensions?.code === 'BAD_USER_INPUT', 'Invalid event input throws BAD_USER_INPUT');
        const errors = err.extensions?.errors;
        (0, test_helpers_1.assert)(errors.length >= 3, `Multiple validation errors reported (got ${errors.length})`);
    }
    try {
        (0, validators_1.validateEventInput)({
            title: 'مؤتمر جيد',
            description: 'وصف مفصل للمؤتمر يحتوي على معلومات كافية',
            price: 100,
            date: '2026-06-15T10:00:00',
        });
        (0, test_helpers_1.assert)(true, 'Valid event input passes validation');
    }
    catch {
        (0, test_helpers_1.assert)(false, 'Valid event input should not throw');
    }
    // Update event validation
    (0, test_helpers_1.logStep)('Testing update event validation...');
    try {
        (0, validators_1.validateUpdateEventInput)({ price: -10 });
        (0, test_helpers_1.assert)(false, 'Should have thrown on negative price');
    }
    catch (err) {
        (0, test_helpers_1.assert)(err.extensions?.code === 'BAD_USER_INPUT', 'Negative price throws BAD_USER_INPUT');
    }
    try {
        (0, validators_1.validateUpdateEventInput)({ title: 'عنوان محدث' });
        (0, test_helpers_1.assert)(true, 'Valid update event input passes');
    }
    catch {
        (0, test_helpers_1.assert)(false, 'Valid update event input should not throw');
    }
    // ═══ Clean Up ═════════════════════════════════════════════════════════
    (0, test_helpers_1.logSection)('Cleanup');
    (0, test_helpers_1.logStep)('Cleaning test database...');
    await repos.booking.deleteWhere({});
    await repos.event.deleteWhere({});
    await repos.user.deleteWhere({});
    (0, test_helpers_1.logStep)('Done');
    // ─── Summary ──────────────────────────────────────────────────────────
    const exitCode = (0, test_helpers_1.printSummary)();
    await mongoose_1.default.disconnect();
    process.exit(exitCode);
}
runTests().catch((err) => {
    console.error('Test runner error:', err);
    process.exit(1);
});
//# sourceMappingURL=comprehensive.test.js.map