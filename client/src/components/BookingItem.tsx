/**
 * Booking Item Component
 *
 * Displays a single booking entry with event details,
 * creator info, booking date, and a cancel button.
 *
 * Features:
 * - Shows event title, price, and creator name
 * - Displays booking date
 * - Cancel button triggers confirmation via parent callback
 */

import type { EventData } from "../types";
import { formatDateShort, formatDateArabic } from "../utils/formatDate";

interface BookingItemProps {
  _id: string;
  event: EventData;
  createdAt: string;
  onCancelBooking: (bookingId: string) => void;
}

export default function BookingItem({
  _id,
  event,
  createdAt,
  onCancelBooking,
}: BookingItemProps) {
  return (
    <li className="bookings-item">
      <div className="booking-info">
        <strong>{event.title}</strong>
        <span className="booking-meta">
          {event.creator?.username} · ${event.price} ·{" "}
          {formatDateShort(event.date)}
        </span>
        <small className="booking-date">
          تاريخ الحجز: {formatDateArabic(createdAt)}
        </small>
      </div>
      <button
        className="btn btn-danger btn-sm"
        onClick={() => onCancelBooking(_id)}
      >
        إلغاء
      </button>
    </li>
  );
}
