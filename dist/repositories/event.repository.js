"use strict";
/**
 * Event Repository
 *
 * Extends BaseRepository with event-specific data operations.
 * Handles event queries with search, pagination, and creator population.
 *
 * Singleton: Use getEventRepository() to get the shared instance.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventRepository = void 0;
exports.getEventRepository = getEventRepository;
const base_repository_1 = require("./base.repository");
const event_1 = __importDefault(require("../models/event"));
class EventRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(event_1.default);
    }
    /**
     * Find all events with populated creator info, sorted by newest first.
     */
    async findAllWithCreator(filter = {}, skip = 0, limit = 8) {
        return event_1.default.find(filter).sort({ _id: -1 }).skip(skip).limit(limit).populate('creator');
    }
    /**
     * Find events by creator with populated creator info.
     */
    async findByCreator(creatorId) {
        return event_1.default.find({ creator: creatorId }).populate('creator');
    }
    /**
     * Search events by title or description (case-insensitive).
     */
    async search(searchTerm, skip = 0, limit = 8) {
        const escaped = searchTerm.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escaped, 'i');
        return this.findAllWithCreator({ $or: [{ title: regex }, { description: regex }] }, skip, limit);
    }
    /**
     * Check if an event with the given title already exists.
     */
    async titleExists(title) {
        return this.exists({ title });
    }
    /**
     * Find a single event with populated creator info.
     */
    async findByIdWithCreator(id) {
        return event_1.default.findById(id).populate('creator');
    }
    /**
     * Update event fields and return the updated event with populated creator.
     */
    async updateWithCreator(id, data) {
        return event_1.default.findByIdAndUpdate(id, data, { new: true }).populate('creator');
    }
    /**
     * Get all event IDs created by a specific user.
     */
    async getEventIdsByCreator(creatorId) {
        const events = await event_1.default.find({ creator: creatorId }).select('_id');
        return events.map((e) => e._id.toString());
    }
}
exports.EventRepository = EventRepository;
// ─── Singleton ───────────────────────────────────────────────────────────────
let instance = null;
/**
 * Returns the singleton EventRepository instance.
 */
function getEventRepository() {
    if (!instance) {
        instance = new EventRepository();
    }
    return instance;
}
//# sourceMappingURL=event.repository.js.map