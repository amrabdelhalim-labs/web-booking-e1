/**
 * Events Page
 *
 * Displays all available events with real-time updates via subscriptions.
 * Authenticated users can create new events and book existing ones.
 * Includes server-side search filtering by title or description.
 *
 * Features:
 * - Debounced search bar (server-side filtering via GraphQL)
 * - Infinite scroll pagination: 8 events per page, load more button
 * - Create event modal for authenticated users
 * - Event detail modal with booking capability
 * - Real-time notifications for newly added events (subscription)
 * - Empty state messaging
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useSubscription } from '@apollo/client';
import { EVENTS, BOOK_EVENT, CREATE_EVENT, EVENT_ADDED } from '../graphql/queries';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { formatDateFull } from '../utils/formatDate';
import EventItem from '../components/EventItem';
import SimpleModal from '../components/SimpleModal';
import Alert from '../components/Alert';
import type { EventData } from '../types';

const PAGE_SIZE = 8;

export default function EventsPage() {
  const { token, userId } = useAuth();

  const [alert, setAlert] = useState('');
  const [modalAlert, setModalAlert] = useState('');

  // ─── Search (debounced) ───────────────────────────────────────────────
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setSearchTerm(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // ─── Create event form state ──────────────────────────────────────────
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');

  // ─── Event detail modal state ─────────────────────────────────────────
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);

  // ─── Pagination state ────────────────────────────────────────────────
  const [hasMore, setHasMore] = useState(true);

  // ─── Events query ─────────────────────────────────────────────────────
  const { loading, error, data, fetchMore } = useQuery(EVENTS, {
    variables: { searchTerm, skip: 0, limit: PAGE_SIZE },
  });

  // Reset pagination when search term changes
  useEffect(() => {
    if (searchTerm !== undefined) {
      setHasMore(true);
    }
  }, [searchTerm]);

  // ─── Subscription: new events ─────────────────────────────────────────
  useSubscription(EVENT_ADDED, {
    onData: ({ client, data: subData }) => {
      if (subData.data) {
        const addedEvent = subData.data.eventAdded as EventData;
        if (addedEvent.creator._id !== userId) {
          client.refetchQueries({ include: ['Events'] });
          setAlert(`مناسبة جديدة بعنوان: ${addedEvent.title}، أُضيفت للتو`);
          window.scrollTo(0, 0);
        }
      }
    },
  });

  // ─── Book event mutation ──────────────────────────────────────────────
  const [bookEvent] = useMutation(BOOK_EVENT, {
    onError: (err) => {
      setSelectedEvent(null);
      setAlert(err.message);
      window.scrollTo(0, 0);
    },
    onCompleted: () => {
      setSelectedEvent(null);
      setAlert('تم حجز المناسبة بنجاح');
    },
  });

  // ─── Create event mutation ────────────────────────────────────────────
  const [createEvent, { loading: createLoading }] = useMutation(CREATE_EVENT, {
    onError: (err) => setModalAlert(err.message),
    onCompleted: () => {
      setCreating(false);
      setAlert('تم إضافة المناسبة بنجاح');
      setModalAlert('');
      setTitle('');
      setPrice('');
      setDate('');
      setDescription('');
    },
    refetchQueries: ['Events'],
  });

  // ─── Load more handler ───────────────────────────────────────────────
  const handleLoadMore = useCallback(() => {
    if (!data?.events || loading) return;

    const currentCount = data.events.length;
    fetchMore({
      variables: {
        skip: currentCount,
        limit: PAGE_SIZE,
        searchTerm,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult?.events) return prev;
        if (fetchMoreResult.events.length < PAGE_SIZE) {
          setHasMore(false);
        }
        return {
          events: [...prev.events, ...fetchMoreResult.events],
        };
      },
    });
  }, [data?.events, loading, fetchMore, searchTerm]);

  const handleCreateEvent = () => {
    if (!title.trim() || !description.trim() || !date.trim() || Number(price) <= 0) {
      setModalAlert('يجب ملء جميع الحقول بالشكل الصحيح!');
      return;
    }
    createEvent({
      variables: {
        title: title.trim(),
        price: +price,
        date,
        description: description.trim(),
      },
    });
  };

  const handleShowDetail = (eventId: string) => {
    if (!data?.events) return;
    const event = data.events.find((e: EventData) => e._id === eventId);
    setSelectedEvent(event || null);
  };

  return (
    <div>
      <Alert message={alert} />

      {/* Create event panel for authenticated users */}
      {token && (
        <div className="events-control pt-2 text-center pb-3">
          <h2>شارك مناسباتك الخاصة!</h2>
          <button className="btn btn-create" onClick={() => setCreating(true)}>
            إنشاء مناسبة
          </button>
        </div>
      )}

      {/* Events section header + search */}
      <div className="events-header">
        <h2>المناسبات من حولك!</h2>
        <div className="search-bar">
          <input
            type="text"
            className="form-control"
            placeholder="ابحث عن مناسبة بالعنوان أو الوصف..."
            value={searchInput}
            onChange={({ target }) => setSearchInput(target.value)}
          />
          {searchInput && (
            <button
              className="search-clear"
              type="button"
              onClick={() => setSearchInput('')}
              aria-label="مسح البحث"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Events list */}
      {error && <Alert message={error.message} variant="danger" />}
      {data?.events && (
        <>
          <div className="container-fluid">
            <div className="row justify-content-center">
              {data.events.length === 0 && (
                <p className="text-center text-muted mt-3">
                  لا توجد مناسبات{searchTerm ? ' مطابقة للبحث' : ''}
                </p>
              )}
              {data.events.map((event: EventData) => (
                <EventItem key={event._id} {...event} onDetail={handleShowDetail} />
              ))}
            </div>
          </div>

          {/* Load more button */}
          {hasMore && data.events.length > 0 && (
            <div className="load-more-container">
              <button className="btn btn-load-more" onClick={handleLoadMore} disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner-small"></span> جاري التحميل...
                  </>
                ) : (
                  'تحميل المزيد'
                )}
              </button>
            </div>
          )}
        </>
      )}

      {/* ─── Create event modal ──────────────────────────────────────── */}
      {creating && (
        <SimpleModal
          title="إضافة مناسبة"
          onCancel={() => {
            setCreating(false);
            setModalAlert('');
          }}
          onConfirm={handleCreateEvent}
          confirmText="تأكيد"
          isDisabled={createLoading}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleCreateEvent();
            }}
          >
            <Alert message={modalAlert} />
            <div className="mb-2">
              <label className="form-label" htmlFor="create-title">
                العنوان
              </label>
              <input
                className="form-control"
                id="create-title"
                type="text"
                required
                value={title}
                onChange={({ target }) => setTitle(target.value)}
              />
            </div>
            <div className="mb-2">
              <label className="form-label" htmlFor="create-price">
                السعر
              </label>
              <input
                className="form-control"
                id="create-price"
                type="number"
                required
                min="0"
                step="0.01"
                value={price}
                onChange={({ target }) => setPrice(target.value)}
              />
            </div>
            <div className="mb-2">
              <label className="form-label" htmlFor="create-date">
                التاريخ
              </label>
              <input
                className="form-control"
                id="create-date"
                type="datetime-local"
                required
                value={date}
                onChange={({ target }) => setDate(target.value)}
              />
            </div>
            <div className="mb-2">
              <label className="form-label" htmlFor="create-description">
                التفاصيل
              </label>
              <textarea
                className="form-control"
                id="create-description"
                required
                rows={3}
                value={description}
                onChange={({ target }) => setDescription(target.value)}
              />
            </div>
          </form>
        </SimpleModal>
      )}

      {/* ─── Event detail / booking modal ────────────────────────────── */}
      {selectedEvent && (
        <SimpleModal
          title="تفاصيل المناسبة"
          onCancel={() => setSelectedEvent(null)}
          onConfirm={() => {
            bookEvent({ variables: { eventId: selectedEvent._id } });
          }}
          confirmText={token ? 'احجز' : <NavLink to="/login">سجل دخول لتحجز</NavLink>}
          isDisabled={selectedEvent.creator._id === userId}
        >
          <h4 className="mb-3">{selectedEvent.title}</h4>
          <h5 className="mb-3 text-muted">
            ${selectedEvent.price} - {formatDateFull(selectedEvent.date)}
          </h5>
          <p>{selectedEvent.description}</p>
        </SimpleModal>
      )}
    </div>
  );
}
