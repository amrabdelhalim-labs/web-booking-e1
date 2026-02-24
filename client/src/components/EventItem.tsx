/**
 * Event Item Component
 *
 * Displays a single event card with title, price, date,
 * creator name (clickable link), and a detail/action button.
 *
 * Features:
 * - Shows creator name as a link to their events page
 * - Different button text based on event ownership
 * - Responsive grid sizing: 4 per row (lg), 3 per row (md), 2 per row (sm)
 */

import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { formatDateShort } from '../utils/formatDate';
import type { EventData } from '../types';

interface EventItemProps extends EventData {
  /** Callback to show event details in a modal */
  onDetail: (eventId: string) => void;
}

export default function EventItem({ _id, title, price, date, creator, onDetail }: EventItemProps) {
  const { userId } = useAuth();
  const isOwner = userId === creator._id;

  return (
    <div className="col-6 col-sm-6 col-md-4 col-lg-3">
      <div className="events-list-item">
        <div className="event-card-inner">
          <div className="event-title">
            <h1>{title}</h1>
          </div>
          <div className="event-meta">
            <h2>
              ${price} - {formatDateShort(date)}
            </h2>
          </div>
          <div className="event-creator">
            <Link to={`/events/user/${creator._id}`} className="event-creator-link">
              {creator.username}
            </Link>
          </div>
          <div className="event-action">
            <button
              className={`btn btn-detail ${isOwner ? 'btn-owned' : ''}`}
              onClick={() => onDetail(_id)}
            >
              {isOwner ? 'مناسبتك' : 'التفاصيل'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
