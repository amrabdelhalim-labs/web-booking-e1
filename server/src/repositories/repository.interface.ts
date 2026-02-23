/**
 * Repository Interface
 *
 * Defines the contract that all repositories must implement.
 * Provides a consistent API for data access operations across all entities.
 *
 * This interface serves as documentation and type guidance for
 * building repositories over Mongoose models.
 */

import { Document, FilterQuery, UpdateQuery, QueryOptions } from "mongoose";

/**
 * Base repository interface for Mongoose models.
 * All entity-specific repositories should extend BaseRepository
 * which implements this interface.
 *
 * @template T - The Mongoose document type
 *
 * Available methods:
 * - findAll(filter?, options?)      → Find all matching documents
 * - findOne(filter, options?)       → Find a single document
 * - findById(id, options?)          → Find by MongoDB _id
 * - findPaginated(page, limit, filter?, options?) → Paginated results
 * - create(data)                    → Create a new document
 * - update(id, data)               → Update by _id
 * - updateWhere(filter, data)       → Update matching documents
 * - delete(id)                      → Delete by _id
 * - deleteWhere(filter)             → Delete matching documents
 * - exists(filter)                  → Check if document exists
 * - count(filter?)                  → Count matching documents
 */
export interface IRepository<T extends Document> {
  findAll(filter?: FilterQuery<T>, options?: QueryOptions): Promise<T[]>;
  findOne(filter: FilterQuery<T>, options?: QueryOptions): Promise<T | null>;
  findById(id: string, options?: QueryOptions): Promise<T | null>;
  findPaginated(
    page: number,
    limit: number,
    filter?: FilterQuery<T>,
    options?: QueryOptions
  ): Promise<{ rows: T[]; count: number; page: number; totalPages: number }>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: UpdateQuery<T>): Promise<T | null>;
  updateWhere(filter: FilterQuery<T>, data: UpdateQuery<T>): Promise<number>;
  delete(id: string): Promise<T | null>;
  deleteWhere(filter: FilterQuery<T>): Promise<number>;
  exists(filter: FilterQuery<T>): Promise<boolean>;
  count(filter?: FilterQuery<T>): Promise<number>;
}
