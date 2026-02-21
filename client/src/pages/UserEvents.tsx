/**
 * User Events Page
 *
 * Displays events for a specific user. Serves two routes:
 * - /my-events — current user's events (with edit/delete)
 * - /events/user/:userId — any user's events (read-only / bookable)
 *
 * Features:
 * - Edit event via modal (creator only)
 * - Delete event with inline confirmation (creator only)
 * - Book event from another user's events page
 * - Dynamic page title based on creator name
 * - Empty state messaging
 */

import { useState, useContext, useCallback } from "react";
import { useParams } from "react-router-dom";
import { NavLink } from "react-router-dom";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_USER_EVENTS,
  UPDATE_EVENT,
  DELETE_EVENT,
  BOOK_EVENT,
} from "../graphql/queries";
import AuthContext from "../context/auth-context";
import SimpleModal from "../components/SimpleModal";
import Alert from "../components/Alert";
import Spinner from "../components/Spinner";
import type { EventData } from "../types";

export default function UserEventsPage() {
  const { token, userId: currentUserId } = useContext(AuthContext);
  const { userId: paramUserId } = useParams<{ userId: string }>();

  const targetUserId = paramUserId || currentUserId;
  const isOwnEvents = !!token && targetUserId === currentUserId;

  const [alert, setAlert] = useState("");
  const [modalAlert, setModalAlert] = useState("");

  // ─── Detail modal (for non-owner viewing) ─────────────────────────────
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);

  // ─── Edit modal state ─────────────────────────────────────────────────
  const [editingEvent, setEditingEvent] = useState<EventData | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editDescription, setEditDescription] = useState("");

  // ─── Inline delete confirmation ───────────────────────────────────────
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);

  // ─── Query ────────────────────────────────────────────────────────────
  const { loading, data } = useQuery(GET_USER_EVENTS, {
    variables: { userId: targetUserId },
    skip: !targetUserId,
  });

  // ─── Update mutation ──────────────────────────────────────────────────
  const [updateEvent, { loading: updating }] = useMutation(UPDATE_EVENT, {
    onError: (err) => setModalAlert(err.message),
    onCompleted: () => {
      setEditingEvent(null);
      setAlert("تم تحديث المناسبة بنجاح");
      setModalAlert("");
    },
    refetchQueries: ["GetUserEvents", "Events"],
  });

  // ─── Delete mutation ──────────────────────────────────────────────────
  const [deleteEvent] = useMutation(DELETE_EVENT, {
    onError: (err) => setAlert(err.message),
    onCompleted: () => {
      setAlert("تم حذف المناسبة بنجاح");
      setDeletingEventId(null);
    },
    refetchQueries: ["GetUserEvents", "Events"],
  });

  // ─── Book event mutation ──────────────────────────────────────────────
  const [bookEvent] = useMutation(BOOK_EVENT, {
    onError: (err) => {
      setSelectedEvent(null);
      setAlert(err.message);
    },
    onCompleted: () => {
      setSelectedEvent(null);
      setAlert("تم حجز المناسبة بنجاح");
    },
  });

  // ─── Handlers ─────────────────────────────────────────────────────────

  const startEditing = useCallback((event: EventData) => {
    setEditingEvent(event);
    setEditTitle(event.title);
    setEditPrice(String(event.price));
    // Format date for datetime-local input
    const dateStr = event.date.split(".")[0].replace(" ", "T");
    setEditDate(dateStr);
    setEditDescription(event.description);
    setModalAlert("");
  }, []);

  const handleUpdate = () => {
    if (!editingEvent) return;
    if (
      !editTitle.trim() ||
      !editDescription.trim() ||
      !editDate.trim() ||
      Number(editPrice) <= 0
    ) {
      setModalAlert("يجب ملء جميع الحقول بالشكل الصحيح!");
      return;
    }

    const variables: Record<string, unknown> = { eventId: editingEvent._id };
    if (editTitle.trim() !== editingEvent.title)
      variables.title = editTitle.trim();
    if (editDescription.trim() !== editingEvent.description)
      variables.description = editDescription.trim();
    if (Number(editPrice) !== editingEvent.price)
      variables.price = +editPrice;
    if (editDate !== editingEvent.date.split(".")[0].replace(" ", "T"))
      variables.date = editDate;

    // Check if any field actually changed
    if (Object.keys(variables).length === 1) {
      setModalAlert("لم يتم إجراء أي تغيير");
      return;
    }

    updateEvent({ variables });
  };

  const handleDelete = (eventId: string) => {
    deleteEvent({ variables: { eventId } });
  };

  // ─── Derive page title ────────────────────────────────────────────────
  const creatorName = data?.getUserEvents?.[0]?.creator?.username;
  const pageTitle = isOwnEvents
    ? "مناسباتي"
    : creatorName
      ? `مناسبات ${creatorName}`
      : "مناسبات المستخدم";

  if (loading) return <Spinner />;

  return (
    <div>
      <Alert message={alert} />
      <h2 className="mb-4 text-center">{pageTitle}</h2>

      {data?.getUserEvents?.length === 0 && (
        <p className="text-center text-muted mt-3">لا توجد مناسبات</p>
      )}

      <div className="container-fluid">
        <div className="row justify-content-center">
          {data?.getUserEvents?.map((event: EventData) => (
            <div
              key={event._id}
              className="events-list-item col-md-4 col-lg-3 col-6"
            >
              <div className="text-center align-items-center flex-column d-grid gap-2">
                <div className="p-1">
                  <h1>{event.title}</h1>
                </div>
                <div className="p-1">
                  <h2>
                    ${event.price} -{" "}
                    {event.date
                      .split(".")[0]
                      .split(" ")[0]
                      .replace(/-/g, "/")}
                  </h2>
                </div>
                <div className="p-2 d-flex gap-2 justify-content-center flex-wrap">
                  {isOwnEvents ? (
                    <>
                      {deletingEventId === event._id ? (
                        <>
                          <span className="text-danger small align-self-center">
                            هل أنت متأكد؟
                          </span>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(event._id)}
                          >
                            نعم، احذف
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => setDeletingEventId(null)}
                          >
                            لا
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="btn btn-sm"
                            onClick={() => startEditing(event)}
                          >
                            تعديل
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => setDeletingEventId(event._id)}
                          >
                            حذف
                          </button>
                        </>
                      )}
                    </>
                  ) : (
                    <button
                      className="btn btn-sm"
                      onClick={() => setSelectedEvent(event)}
                    >
                      عرض التفاصيل
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Edit event modal ────────────────────────────────────────── */}
      {editingEvent && (
        <SimpleModal
          title="تعديل المناسبة"
          onCancel={() => {
            setEditingEvent(null);
            setModalAlert("");
          }}
          onConfirm={handleUpdate}
          confirmText="حفظ التعديلات"
          isDisabled={updating}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleUpdate();
            }}
          >
            <Alert message={modalAlert} />
            <div className="mb-2">
              <label className="form-label" htmlFor="edit-title">
                العنوان
              </label>
              <input
                className="form-control"
                id="edit-title"
                type="text"
                required
                value={editTitle}
                onChange={({ target }) => setEditTitle(target.value)}
              />
            </div>
            <div className="mb-2">
              <label className="form-label" htmlFor="edit-price">
                السعر
              </label>
              <input
                className="form-control"
                id="edit-price"
                type="number"
                required
                min="0"
                step="0.01"
                value={editPrice}
                onChange={({ target }) => setEditPrice(target.value)}
              />
            </div>
            <div className="mb-2">
              <label className="form-label" htmlFor="edit-date">
                التاريخ
              </label>
              <input
                className="form-control"
                id="edit-date"
                type="datetime-local"
                required
                value={editDate}
                onChange={({ target }) => setEditDate(target.value)}
              />
            </div>
            <div className="mb-2">
              <label className="form-label" htmlFor="edit-description">
                التفاصيل
              </label>
              <textarea
                className="form-control"
                id="edit-description"
                required
                rows={3}
                value={editDescription}
                onChange={({ target }) => setEditDescription(target.value)}
              />
            </div>
          </form>
        </SimpleModal>
      )}

      {/* ─── Detail/book modal (non-owner view) ─────────────────────── */}
      {selectedEvent && !isOwnEvents && (
        <SimpleModal
          title="تفاصيل المناسبة"
          onCancel={() => setSelectedEvent(null)}
          onConfirm={() => {
            bookEvent({ variables: { eventId: selectedEvent._id } });
          }}
          confirmText={
            token ? (
              "احجز"
            ) : (
              <NavLink to="/login">سجل دخول لتحجز</NavLink>
            )
          }
          isDisabled={!token}
        >
          <h4 className="mb-3">{selectedEvent.title}</h4>
          <h5 className="mb-3 text-muted">
            ${selectedEvent.price} -{" "}
            {selectedEvent.date.split(".")[0].replace(/-/g, "/")}
          </h5>
          <p>{selectedEvent.description}</p>
        </SimpleModal>
      )}
    </div>
  );
}
