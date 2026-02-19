/**
 * Booking Item Component
 *
 * Displays a single booking entry with event details
 * and a cancel button.
 *
 * TODO: Implement full booking item (Phase 5.4)
 */

interface BookingItemProps {
  _id: string;
  event: { title: string; price: number };
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
    <li className="bookings-item d-flex">
      <div>
        {event.title} - {new Date(createdAt).toLocaleDateString()} -{" "}
        {event.price}$
      </div>
      <button className="btn" onClick={() => onCancelBooking(_id)}>
        إلغاء
      </button>
    </li>
  );
}
