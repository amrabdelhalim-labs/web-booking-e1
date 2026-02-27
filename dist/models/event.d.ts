/**
 * Event Mongoose Model
 *
 * Defines the Event schema and model for MongoDB.
 * Events are created by users and can be booked by other users.
 */
import mongoose from 'mongoose';
import { IEvent } from '../types';
declare const _default: mongoose.Model<IEvent, {}, {}, {}, mongoose.Document<unknown, {}, IEvent, {}, {}> & IEvent & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=event.d.ts.map