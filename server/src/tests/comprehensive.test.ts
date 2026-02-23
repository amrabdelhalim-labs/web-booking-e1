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

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { config } from "../config";
import { getRepositoryManager } from "../repositories";
import {
  validateUserInput,
  validateEventInput,
  validateLoginInput,
  validateUpdateUserInput,
  validateUpdateEventInput,
} from "../validators";
import {
  assert,
  logSection,
  logStep,
  logInfo,
  printSummary,
} from "./test.helpers";

const TEST_DB_URL =
  process.env.TEST_DB_URL ||
  config.dbUrl.replace(/\/[^/]+$/, "/event-booking-test");

async function runTests(): Promise<void> {
  logSection("Comprehensive Integration Tests");
  logInfo(`Connecting to: ${TEST_DB_URL}`);

  try {
    await mongoose.connect(TEST_DB_URL);
    logStep("Database connected");
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
  }

  const repos = getRepositoryManager();

  // ─── Clean Up ─────────────────────────────────────────────────────────
  await repos.booking.deleteWhere({});
  await repos.event.deleteWhere({});
  await repos.user.deleteWhere({});

  // ═══ Phase 1: User Registration ═══════════════════════════════════════

  logSection("Phase 1: User Registration");

  logStep("Creating 3 users...");
  const hashedPass = await bcrypt.hash("Test123!", 12);

  const user1 = await repos.user.create({
    username: "عمرو",
    email: "amr@test.com",
    password: hashedPass,
  });
  assert(user1.username === "عمرو", "User 1 (عمرو) created");

  const user2 = await repos.user.create({
    username: "نورة",
    email: "noura@test.com",
    password: hashedPass,
  });
  assert(user2.username === "نورة", "User 2 (نورة) created");

  const user3 = await repos.user.create({
    username: "خالد",
    email: "khaled@test.com",
    password: hashedPass,
  });
  assert(user3.username === "خالد", "User 3 (خالد) created");

  // Verify password hashing
  logStep("Verifying password hashing...");
  const isCorrect = await bcrypt.compare("Test123!", user1.password);
  assert(isCorrect === true, "Password hash comparison works");

  // Duplicate email check
  logStep("Checking duplicate email prevention...");
  const emailTaken = await repos.user.emailExists("amr@test.com");
  assert(emailTaken === true, "Duplicate email detected");

  const userCount = await repos.user.count();
  assert(userCount === 3, `All 3 users created (got ${userCount})`);

  // ═══ Phase 2: Event Creation ══════════════════════════════════════════

  logSection("Phase 2: Event Creation");

  logStep("Creating events...");
  const event1 = await repos.event.create({
    title: "مؤتمر التقنية السنوي",
    description: "مؤتمر شامل يغطي أحدث التقنيات والابتكارات",
    price: 200,
    date: new Date("2026-06-15T10:00:00"),
    creator: user1._id,
  } as any);
  assert(event1.title === "مؤتمر التقنية السنوي", "Event 1 created");

  const event2 = await repos.event.create({
    title: "ورشة تطوير الويب",
    description: "ورشة عملية لتعلم تطوير تطبيقات الويب الحديثة",
    price: 75,
    date: new Date("2026-07-20T14:00:00"),
    creator: user1._id,
  } as any);
  assert(event2.title === "ورشة تطوير الويب", "Event 2 created");

  const event3 = await repos.event.create({
    title: "حفل خيري",
    description: "حفل خيري لدعم الأسر المحتاجة في المنطقة",
    price: 30,
    date: new Date("2026-08-05T18:00:00"),
    creator: user2._id,
  } as any);
  assert(event3.title === "حفل خيري", "Event 3 created");

  // Title uniqueness
  logStep("Checking title uniqueness...");
  const titleTaken = await repos.event.titleExists("مؤتمر التقنية السنوي");
  assert(titleTaken === true, "Duplicate title detected");

  const eventCount = await repos.event.count();
  assert(eventCount === 3, `All 3 events created (got ${eventCount})`);

  // ═══ Phase 3: Event Search & Queries ══════════════════════════════════

  logSection("Phase 3: Event Search & Queries");

  logStep("Searching events...");
  const searchTech = await repos.event.search("تقنية");
  assert(searchTech.length === 1, `Search 'تقنية' → 1 result (got ${searchTech.length})`);

  const searchAll = await repos.event.search("ال");
  assert(searchAll.length >= 2, `Search 'ال' → multiple results (got ${searchAll.length})`);

  const searchNone = await repos.event.search("zzzzzzzzz");
  assert(searchNone.length === 0, `Search 'zzzzzzzzz' → 0 results`);

  // Find by creator
  logStep("Finding events by creator...");
  const user1Events = await repos.event.findByCreator(user1._id.toString());
  assert(user1Events.length === 2, `User1 has 2 events (got ${user1Events.length})`);

  const user2Events = await repos.event.findByCreator(user2._id.toString());
  assert(user2Events.length === 1, `User2 has 1 event (got ${user2Events.length})`);

  const user3Events = await repos.event.findByCreator(user3._id.toString());
  assert(user3Events.length === 0, `User3 has 0 events (got ${user3Events.length})`);

  // Pagination
  logStep("Testing pagination...");
  const page1 = await repos.event.findAllWithCreator({}, 0, 2);
  assert(page1.length === 2, `Page 1 (limit 2) → 2 events (got ${page1.length})`);

  const page2 = await repos.event.findAllWithCreator({}, 2, 2);
  assert(page2.length === 1, `Page 2 (skip 2, limit 2) → 1 event (got ${page2.length})`);

  // ═══ Phase 4: Bookings ════════════════════════════════════════════════

  logSection("Phase 4: Bookings");

  logStep("Creating bookings...");
  const booking1 = await repos.booking.createAndPopulate(
    user2._id.toString(),
    event1._id.toString()
  );
  assert(booking1 !== null, "User2 booked Event1");

  const booking2 = await repos.booking.createAndPopulate(
    user3._id.toString(),
    event1._id.toString()
  );
  assert(booking2 !== null, "User3 booked Event1");

  const booking3 = await repos.booking.createAndPopulate(
    user3._id.toString(),
    event3._id.toString()
  );
  assert(booking3 !== null, "User3 booked Event3");

  // Duplicate prevention
  logStep("Testing duplicate booking prevention...");
  const alreadyBooked = await repos.booking.userHasBooked(
    user2._id.toString(),
    event1._id.toString()
  );
  assert(alreadyBooked === true, "Duplicate booking detected");

  const notBooked = await repos.booking.userHasBooked(
    user1._id.toString(),
    event1._id.toString()
  );
  assert(notBooked === false, "Creator has not booked own event");

  // Find user bookings
  logStep("Finding user bookings...");
  const user2Bookings = await repos.booking.findByUser(user2._id.toString());
  assert(user2Bookings.length === 1, `User2 has 1 booking (got ${user2Bookings.length})`);

  const user3Bookings = await repos.booking.findByUser(user3._id.toString());
  assert(user3Bookings.length === 2, `User3 has 2 bookings (got ${user3Bookings.length})`);

  // Count by event
  logStep("Counting bookings by event...");
  const event1BookingCount = await repos.booking.countByEvent(
    event1._id.toString()
  );
  assert(
    event1BookingCount === 2,
    `Event1 has 2 bookings (got ${event1BookingCount})`
  );

  // ═══ Phase 5: Event Updates ═══════════════════════════════════════════

  logSection("Phase 5: Event Updates");

  logStep("Updating event...");
  const updatedEvent = await repos.event.updateWithCreator(
    event1._id.toString(),
    { price: 250, title: "مؤتمر التقنية السنوي (محدث)" }
  );
  assert(updatedEvent !== null, "Event updated successfully");
  assert(updatedEvent!.price === 250, "Price updated to 250");
  assert(
    updatedEvent!.title === "مؤتمر التقنية السنوي (محدث)",
    "Title updated correctly"
  );

  // ═══ Phase 6: Booking Cancellation ════════════════════════════════════

  logSection("Phase 6: Booking Cancellation");

  logStep("Cancelling booking...");
  const cancelledBooking = await repos.booking.delete(booking1._id.toString());
  assert(cancelledBooking !== null, "Booking cancelled successfully");

  const remainingBookings = await repos.booking.count();
  assert(
    remainingBookings === 2,
    `2 bookings remaining (got ${remainingBookings})`
  );

  // ═══ Phase 7: Cascade Delete ══════════════════════════════════════════

  logSection("Phase 7: Cascade Delete");

  logStep("Cascade deleting user1 (has 2 events)...");
  const user1EventIds = await repos.event.getEventIdsByCreator(
    user1._id.toString()
  );
  logInfo(`User1 has ${user1EventIds.length} events to cascade`);

  const cascadeBookings = await repos.booking.deleteByUserCascade(
    user1._id.toString(),
    user1EventIds
  );
  logInfo(`Cascade deleted ${cascadeBookings} bookings`);

  await repos.event.deleteWhere({ creator: user1._id });
  await repos.user.delete(user1._id.toString());

  const usersAfter = await repos.user.count();
  assert(usersAfter === 2, `2 users remaining (got ${usersAfter})`);

  const eventsAfter = await repos.event.count();
  assert(eventsAfter === 1, `1 event remaining (got ${eventsAfter})`);

  const bookingsAfter = await repos.booking.count();
  assert(
    bookingsAfter === 1,
    `1 booking remaining (got ${bookingsAfter})`
  );

  // ═══ Phase 8: Validator Tests ═════════════════════════════════════════

  logSection("Phase 8: Input Validation");

  // User input validation
  logStep("Testing user input validation...");
  try {
    validateUserInput({ username: "ab", email: "bad", password: "123" });
    assert(false, "Should have thrown on invalid user input");
  } catch (err: any) {
    assert(err.extensions?.code === "BAD_USER_INPUT", "Invalid user input throws BAD_USER_INPUT");
  }

  try {
    validateUserInput({
      username: "أحمد",
      email: "ahmed@test.com",
      password: "SecurePass123",
    });
    assert(true, "Valid user input passes validation");
  } catch {
    assert(false, "Valid user input should not throw");
  }

  // Login validation
  logStep("Testing login validation...");
  try {
    validateLoginInput("", "");
    assert(false, "Should have thrown on empty login");
  } catch (err: any) {
    assert(err.extensions?.code === "BAD_USER_INPUT", "Empty login throws BAD_USER_INPUT");
  }

  // Update user validation
  logStep("Testing update user validation...");
  try {
    validateUpdateUserInput({ username: "ab" });
    assert(false, "Should have thrown on short username");
  } catch (err: any) {
    assert(err.extensions?.code === "BAD_USER_INPUT", "Short username throws BAD_USER_INPUT");
  }

  try {
    validateUpdateUserInput({ username: "أحمد الكبير" });
    assert(true, "Valid update user input passes");
  } catch {
    assert(false, "Valid update should not throw");
  }

  // Event input validation
  logStep("Testing event input validation...");
  try {
    validateEventInput({
      title: "ab",
      description: "short",
      price: -5,
      date: "invalid",
    });
    assert(false, "Should have thrown on invalid event input");
  } catch (err: any) {
    assert(err.extensions?.code === "BAD_USER_INPUT", "Invalid event input throws BAD_USER_INPUT");
    const errors = err.extensions?.errors as string[];
    assert(errors.length >= 3, `Multiple validation errors reported (got ${errors.length})`);
  }

  try {
    validateEventInput({
      title: "مؤتمر جيد",
      description: "وصف مفصل للمؤتمر يحتوي على معلومات كافية",
      price: 100,
      date: "2026-06-15T10:00:00",
    });
    assert(true, "Valid event input passes validation");
  } catch {
    assert(false, "Valid event input should not throw");
  }

  // Update event validation
  logStep("Testing update event validation...");
  try {
    validateUpdateEventInput({ price: -10 });
    assert(false, "Should have thrown on negative price");
  } catch (err: any) {
    assert(err.extensions?.code === "BAD_USER_INPUT", "Negative price throws BAD_USER_INPUT");
  }

  try {
    validateUpdateEventInput({ title: "عنوان محدث" });
    assert(true, "Valid update event input passes");
  } catch {
    assert(false, "Valid update event input should not throw");
  }

  // ═══ Clean Up ═════════════════════════════════════════════════════════

  logSection("Cleanup");
  logStep("Cleaning test database...");
  await repos.booking.deleteWhere({});
  await repos.event.deleteWhere({});
  await repos.user.deleteWhere({});
  logStep("Done");

  // ─── Summary ──────────────────────────────────────────────────────────
  const exitCode = printSummary();

  await mongoose.disconnect();
  process.exit(exitCode);
}

runTests().catch((err) => {
  console.error("Test runner error:", err);
  process.exit(1);
});
