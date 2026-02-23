/**
 * Event Repository
 *
 * Extends BaseRepository with event-specific data operations.
 * Handles event queries with search, pagination, and creator population.
 *
 * Singleton: Use getEventRepository() to get the shared instance.
 */

import { BaseRepository } from "./base.repository";
import Event from "../models/event";
import { IEvent } from "../types";

class EventRepository extends BaseRepository<IEvent> {
  constructor() {
    super(Event);
  }

  /**
   * Find all events with populated creator info, sorted by newest first.
   */
  async findAllWithCreator(
    filter: Record<string, unknown> = {},
    skip: number = 0,
    limit: number = 8
  ): Promise<IEvent[]> {
    return Event.find(filter)
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limit)
      .populate("creator");
  }

  /**
   * Find events by creator with populated creator info.
   */
  async findByCreator(creatorId: string): Promise<IEvent[]> {
    return Event.find({ creator: creatorId }).populate("creator");
  }

  /**
   * Search events by title or description (case-insensitive).
   */
  async search(
    searchTerm: string,
    skip: number = 0,
    limit: number = 8
  ): Promise<IEvent[]> {
    const escaped = searchTerm.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, "i");
    return this.findAllWithCreator(
      { $or: [{ title: regex }, { description: regex }] },
      skip,
      limit
    );
  }

  /**
   * Check if an event with the given title already exists.
   */
  async titleExists(title: string): Promise<boolean> {
    return this.exists({ title });
  }

  /**
   * Find a single event with populated creator info.
   */
  async findByIdWithCreator(id: string): Promise<IEvent | null> {
    return Event.findById(id).populate("creator");
  }

  /**
   * Update event fields and return the updated event with populated creator.
   */
  async updateWithCreator(
    id: string,
    data: Record<string, unknown>
  ): Promise<IEvent | null> {
    return Event.findByIdAndUpdate(id, data, { new: true }).populate("creator");
  }

  /**
   * Get all event IDs created by a specific user.
   */
  async getEventIdsByCreator(creatorId: string): Promise<string[]> {
    const events = await Event.find({ creator: creatorId }).select("_id");
    return events.map((e) => e._id.toString());
  }
}

// ─── Singleton ───────────────────────────────────────────────────────────────

let instance: EventRepository | null = null;

/**
 * Returns the singleton EventRepository instance.
 */
export function getEventRepository(): EventRepository {
  if (!instance) {
    instance = new EventRepository();
  }
  return instance;
}

export { EventRepository };
