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
import { Model, Document, FilterQuery, UpdateQuery, QueryOptions } from 'mongoose';
import { IRepository } from './repository.interface';
export declare class BaseRepository<T extends Document> implements IRepository<T> {
    protected model: Model<T>;
    constructor(model: Model<T>);
    /**
     * Returns the Mongoose model for direct access when needed.
     */
    getModel(): Model<T>;
    /**
     * Find all documents matching a filter.
     */
    findAll(filter?: FilterQuery<T>, options?: QueryOptions): Promise<T[]>;
    /**
     * Find a single document matching a filter.
     */
    findOne(filter: FilterQuery<T>, options?: QueryOptions): Promise<T | null>;
    /**
     * Find a document by its MongoDB _id.
     */
    findById(id: string, options?: QueryOptions): Promise<T | null>;
    /**
     * Find documents with pagination support.
     * Returns rows, total count, current page, and total pages.
     */
    findPaginated(page?: number, limit?: number, filter?: FilterQuery<T>, options?: QueryOptions): Promise<{
        rows: T[];
        count: number;
        page: number;
        totalPages: number;
    }>;
    /**
     * Create a new document.
     */
    create(data: Partial<T>): Promise<T>;
    /**
     * Update a document by _id.
     * Returns the updated document.
     */
    update(id: string, data: UpdateQuery<T>): Promise<T | null>;
    /**
     * Update all documents matching a filter.
     * Returns the number of modified documents.
     */
    updateWhere(filter: FilterQuery<T>, data: UpdateQuery<T>): Promise<number>;
    /**
     * Delete a document by _id.
     * Returns the deleted document.
     */
    delete(id: string): Promise<T | null>;
    /**
     * Delete all documents matching a filter.
     * Returns the number of deleted documents.
     */
    deleteWhere(filter: FilterQuery<T>): Promise<number>;
    /**
     * Check if a document matching the filter exists.
     */
    exists(filter: FilterQuery<T>): Promise<boolean>;
    /**
     * Count documents matching a filter.
     */
    count(filter?: FilterQuery<T>): Promise<number>;
}
//# sourceMappingURL=base.repository.d.ts.map