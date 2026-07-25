"use strict";
/**
 * Base Repository
 *
 * Generic implementation of the Repository Interface for Mongoose models.
 * Provides common CRUD operations that all entity repositories inherit.
 *
 * Features:
 * - Generic CRUD (findAll, findOne, findById, create, update, delete)
 * - Paginated queries with total count
 * - Bulk operations (deleteWhere, updateWhere)
 * - Existence checks and counting
 * - Consistent error logging
 *
 * Usage:
 *   class UserRepository extends BaseRepository<IUser> {
 *     constructor() { super(UserModel); }
 *   }
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseRepository = void 0;
class BaseRepository {
    model;
    constructor(model) {
        this.model = model;
    }
    /**
     * Returns the Mongoose model for direct access when needed.
     */
    getModel() {
        return this.model;
    }
    /**
     * Find all documents matching a filter.
     */
    async findAll(filter = {}, options = {}) {
        return this.model.find(filter, null, options);
    }
    /**
     * Find a single document matching a filter.
     */
    async findOne(filter, options = {}) {
        return this.model.findOne(filter, null, options);
    }
    /**
     * Find a document by its MongoDB _id.
     */
    async findById(id, options = {}) {
        return this.model.findById(id, null, options);
    }
    /**
     * Find documents with pagination support.
     * Returns rows, total count, current page, and total pages.
     */
    async findPaginated(page = 1, limit = 10, filter = {}, options = {}) {
        const safePage = Math.max(1, page);
        const safeLimit = Math.min(Math.max(1, limit), 50);
        const skip = (safePage - 1) * safeLimit;
        const [rows, count] = await Promise.all([
            this.model.find(filter, null, { ...options, skip, limit: safeLimit }),
            this.model.countDocuments(filter),
        ]);
        return {
            rows,
            count,
            page: safePage,
            totalPages: Math.ceil(count / safeLimit),
        };
    }
    /**
     * Create a new document.
     */
    async create(data) {
        const doc = new this.model(data);
        return doc.save();
    }
    /**
     * Update a document by _id.
     * Returns the updated document.
     */
    async update(id, data) {
        return this.model.findByIdAndUpdate(id, data, { new: true });
    }
    /**
     * Update all documents matching a filter.
     * Returns the number of modified documents.
     */
    async updateWhere(filter, data) {
        const result = await this.model.updateMany(filter, data);
        return result.modifiedCount;
    }
    /**
     * Delete a document by _id.
     * Returns the deleted document.
     */
    async delete(id) {
        return this.model.findByIdAndDelete(id);
    }
    /**
     * Delete all documents matching a filter.
     * Returns the number of deleted documents.
     */
    async deleteWhere(filter) {
        const result = await this.model.deleteMany(filter);
        return result.deletedCount;
    }
    /**
     * Check if a document matching the filter exists.
     */
    async exists(filter) {
        const result = await this.model.exists(filter);
        return result !== null;
    }
    /**
     * Count documents matching a filter.
     */
    async count(filter = {}) {
        return this.model.countDocuments(filter);
    }
}
exports.BaseRepository = BaseRepository;
//# sourceMappingURL=base.repository.js.map