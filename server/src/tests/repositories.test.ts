/**
 * Repository Tests
 *
 * Tests all repository CRUD operations against a real MongoDB instance.
 * Tests the Repository Pattern implementation with:
 * - User Repository (create, find, update, delete)
 * - Event Repository (create, search, find by creator)
 * - Booking Repository (create, find, duplicate check, cascade delete)
 * - Repository Manager health check
 *
 * Run: npm run test
 * Requires: MongoDB running on localhost:27017
 */

import mongoose from 'mongoose';
import { config } from '../config';
import { getRepositoryManager } from '../repositories';
import { assert, logSection, logStep, logInfo, printSummary } from './test.helpers';

const TEST_DB_URL =
  process.env.TEST_DB_URL || config.dbUrl.replace(/\/[^/]+$/, '/event-booking-test');

async function runTests(): Promise<void> {
  logSection('Repository Tests — Event Booking');
  logInfo(`Connecting to: ${TEST_DB_URL}`);

  try {
    await mongoose.connect(TEST_DB_URL);
    logStep('Database connected');
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  }

  const repos = getRepositoryManager();

  // ─── Clean Up Before Tests ────────────────────────────────────────────
  logStep('Cleaning test database...');
  await repos.booking.deleteWhere({});
  await repos.event.deleteWhere({});
  await repos.user.deleteWhere({});

  // ═══ Repository Manager ═══════════════════════════════════════════════

  logSection('Repository Manager');

  logStep('Health check...');
  const health = await repos.healthCheck();
  assert(health.status === 'healthy', 'Health check returns healthy status');
  assert(health.repositories.user === true, 'User repository is accessible');
  assert(health.repositories.event === true, 'Event repository is accessible');
  assert(health.repositories.booking === true, 'Booking repository is accessible');

  // ═══ User Repository Tests ════════════════════════════════════════════

  logSection('User Repository');

  // Create
  logStep('Creating user...');
  const user1 = await repos.user.create({
    username: 'أحمد',
    email: 'ahmed@test.com',
    password: 'hashed_password_1',
  });
  assert(user1 !== null, 'User created successfully');
  assert(user1.username === 'أحمد', 'Username is correct');
  assert(user1.email === 'ahmed@test.com', 'Email is correct');

  const user2 = await repos.user.create({
    username: 'سارة',
    email: 'sara@test.com',
    password: 'hashed_password_2',
  });
  assert(user2 !== null, 'Second user created successfully');

  // Find by email
  logStep('Finding user by email...');
  const foundUser = await repos.user.findByEmail('ahmed@test.com');
  assert(foundUser !== null, 'User found by email');
  assert(foundUser!.username === 'أحمد', 'Found user has correct username');

  // Email exists
  logStep('Checking email existence...');
  const emailExists = await repos.user.emailExists('ahmed@test.com');
  assert(emailExists === true, 'Existing email returns true');

  const emailNotExists = await repos.user.emailExists('nonexistent@test.com');
  assert(emailNotExists === false, 'Non-existing email returns false');

  // Find by ID
  logStep('Finding user by ID...');
  const foundById = await repos.user.findById(user1._id.toString());
  assert(foundById !== null, 'User found by ID');
  assert(foundById!.email === 'ahmed@test.com', 'Found user has correct email');

  // Update profile
  logStep('Updating user profile...');
  const updated = await repos.user.updateProfile(user1._id.toString(), {
    username: 'أحمد المحدث',
  });
  assert(updated !== null, 'User updated successfully');
  assert(updated!.username === 'أحمد المحدث', 'Username updated correctly');

  // Count
  logStep('Counting users...');
  const userCount = await repos.user.count();
  assert(userCount === 2, `User count is 2 (got ${userCount})`);

  // ═══ Event Repository Tests ═══════════════════════════════════════════

  logSection('Event Repository');

  // Create
  logStep('Creating events...');
  const event1 = await repos.event.create({
    title: 'مؤتمر التقنية',
    description: 'مؤتمر سنوي للتقنية والابتكار في العالم العربي',
    price: 150,
    date: new Date('2026-06-15'),
    creator: user1._id,
  } as any);
  assert(event1 !== null, 'Event 1 created successfully');
  assert(event1.title === 'مؤتمر التقنية', 'Event title is correct');

  const event2 = await repos.event.create({
    title: 'ورشة البرمجة',
    description: 'ورشة عمل لتعلم البرمجة وتطوير التطبيقات',
    price: 50,
    date: new Date('2026-07-20'),
    creator: user1._id,
  } as any);
  assert(event2 !== null, 'Event 2 created successfully');

  const event3 = await repos.event.create({
    title: 'حفل التخرج',
    description: 'حفل تخرج الدفعة الجديدة من طلاب الجامعة',
    price: 25,
    date: new Date('2026-08-01'),
    creator: user2._id,
  } as any);
  assert(event3 !== null, 'Event 3 created successfully');

  // Find all with creator
  logStep('Finding all events with creator...');
  const allEvents = await repos.event.findAllWithCreator();
  assert(allEvents.length === 3, `Found 3 events (got ${allEvents.length})`);
  assert(allEvents[0].creator !== undefined, 'Event has populated creator field');

  // Find by creator
  logStep('Finding events by creator...');
  const userEvents = await repos.event.findByCreator(user1._id.toString());
  assert(userEvents.length === 2, `Found 2 events for user1 (got ${userEvents.length})`);

  // Search
  logStep('Searching events...');
  const searchResults = await repos.event.search('مؤتمر');
  assert(
    searchResults.length === 1,
    `Search 'مؤتمر' returns 1 result (got ${searchResults.length})`
  );
  assert(searchResults[0].title === 'مؤتمر التقنية', 'Search result has correct title');

  const searchAll = await repos.event.search('ال');
  assert(searchAll.length >= 2, `Search 'ال' returns multiple results (got ${searchAll.length})`);

  // Title exists
  logStep('Checking title existence...');
  const titleExists = await repos.event.titleExists('مؤتمر التقنية');
  assert(titleExists === true, 'Existing title returns true');

  const titleNotExists = await repos.event.titleExists('عنوان غير موجود');
  assert(titleNotExists === false, 'Non-existing title returns false');

  // Get event IDs by creator
  logStep('Getting event IDs by creator...');
  const eventIds = await repos.event.getEventIdsByCreator(user1._id.toString());
  assert(eventIds.length === 2, `Got 2 event IDs for user1 (got ${eventIds.length})`);

  // Count
  logStep('Counting events...');
  const eventCount = await repos.event.count();
  assert(eventCount === 3, `Event count is 3 (got ${eventCount})`);

  // ═══ Booking Repository Tests ═════════════════════════════════════════

  logSection('Booking Repository');

  // Create booking
  logStep('Creating bookings...');
  const booking1 = await repos.booking.createAndPopulate(
    user2._id.toString(),
    event1._id.toString()
  );
  assert(booking1 !== null, 'Booking 1 created successfully');

  const booking2 = await repos.booking.createAndPopulate(
    user2._id.toString(),
    event2._id.toString()
  );
  assert(booking2 !== null, 'Booking 2 created successfully');

  // User has booked
  logStep('Checking duplicate booking...');
  const hasBooked = await repos.booking.userHasBooked(user2._id.toString(), event1._id.toString());
  assert(hasBooked === true, 'User has already booked event1');

  const hasNotBooked = await repos.booking.userHasBooked(
    user1._id.toString(),
    event1._id.toString()
  );
  assert(hasNotBooked === false, 'User1 has not booked event1');

  // Find by user
  logStep('Finding bookings by user...');
  const userBookings = await repos.booking.findByUser(user2._id.toString());
  assert(userBookings.length === 2, `Found 2 bookings for user2 (got ${userBookings.length})`);

  // Find by ID with details
  logStep('Finding booking by ID with details...');
  const foundBooking = await repos.booking.findByIdWithDetails(booking1._id.toString());
  assert(foundBooking !== null, 'Booking found by ID');

  // Count by event
  logStep('Counting bookings by event...');
  const bookingCount = await repos.booking.countByEvent(event1._id.toString());
  assert(bookingCount === 1, `Event1 has 1 booking (got ${bookingCount})`);

  // Delete by event
  logStep('Deleting bookings by event...');
  const deletedByEvent = await repos.booking.deleteByEvent(event1._id.toString());
  assert(deletedByEvent === 1, `Deleted 1 booking for event1 (got ${deletedByEvent})`);

  // Verify deletion
  const remainingBookings = await repos.booking.count();
  assert(remainingBookings === 1, `1 booking remaining (got ${remainingBookings})`);

  // ═══ Cascade Delete Tests ═════════════════════════════════════════════

  logSection('Cascade Delete');

  // Re-create bookings for cascade test
  logStep('Setting up cascade test data...');
  await repos.booking.createAndPopulate(user2._id.toString(), event1._id.toString());
  await repos.booking.createAndPopulate(user1._id.toString(), event3._id.toString());

  const bookingsBefore = await repos.booking.count();
  logInfo(`Bookings before cascade: ${bookingsBefore}`);

  // Cascade delete user1 (has events + bookings)
  logStep('Cascade deleting user1...');
  const user1EventIds = await repos.event.getEventIdsByCreator(user1._id.toString());
  await repos.booking.deleteByUserCascade(user1._id.toString(), user1EventIds);
  await repos.event.deleteWhere({ creator: user1._id });
  await repos.user.delete(user1._id.toString());

  const usersAfter = await repos.user.count();
  assert(usersAfter === 1, `1 user remaining after cascade (got ${usersAfter})`);

  const eventsAfter = await repos.event.count();
  assert(eventsAfter === 1, `1 event remaining after cascade (got ${eventsAfter})`);

  const bookingsAfter = await repos.booking.count();
  assert(bookingsAfter === 0, `0 bookings remaining after cascade (got ${bookingsAfter})`);

  // ═══ Clean Up ═════════════════════════════════════════════════════════

  logSection('Cleanup');
  logStep('Cleaning test database...');
  await repos.booking.deleteWhere({});
  await repos.event.deleteWhere({});
  await repos.user.deleteWhere({});
  logStep('Done');

  // ─── Summary ──────────────────────────────────────────────────────────
  const exitCode = printSummary();

  await mongoose.disconnect();
  process.exit(exitCode);
}

runTests().catch((err) => {
  console.error('Test runner error:', err);
  process.exit(1);
});
