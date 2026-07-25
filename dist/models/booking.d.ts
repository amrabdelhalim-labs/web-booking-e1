/**
 * Booking Mongoose Model
 *
 * Defines the Booking schema and model for MongoDB.
 * Bookings link users to events they have reserved.
 * Timestamps are automatically managed by Mongoose.
 */
import mongoose from 'mongoose';
import { IBooking } from '../types';
declare const _default: mongoose.Model<IBooking, {}, {}, {}, mongoose.Document<unknown, {}, IBooking, {}, {}> & IBooking & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=booking.d.ts.map