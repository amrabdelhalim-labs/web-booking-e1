/**
 * Bookings Page
 *
 * Displays the authenticated user's event bookings.
 * Allows cancelling existing bookings with automatic list refresh.
 *
 * Features:
 * - Lists all bookings with event details and creator info
 * - Cancel booking with refetch
 * - Empty state messaging
 * - Error and loading state handling
 */

import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { BOOKINGS, CANCEL_BOOKING } from "../graphql/queries";
import BookingItem from "../components/BookingItem";
import Alert from "../components/Alert";
import Spinner from "../components/Spinner";
import type { BookingData } from "../types";

export default function BookingsPage() {
  const [alert, setAlert] = useState("");

  const { loading, error, data } = useQuery(BOOKINGS);

  const [cancelBooking] = useMutation(CANCEL_BOOKING, {
    onError: (err) => setAlert(err.message),
    onCompleted: () => setAlert("تم إلغاء حجزك بنجاح"),
    refetchQueries: ["Bookings"],
  });

  if (loading) return <Spinner />;

  return (
    <div className="container-fluid">
      <h2>المناسبات التي حجزتها</h2>
      <Alert message={alert} variant="success" />
      {error && <Alert message={error.message} variant="danger" />}

      <div className="row">
        <div className="col-md-8 offset-md-2">
          {data?.bookings?.length === 0 && (
            <p className="text-center text-muted mt-3">
              لا توجد حجوزات حالياً
            </p>
          )}
          {data?.bookings?.map((booking: BookingData) => (
            <BookingItem
              key={booking._id}
              {...booking}
              onCancelBooking={() =>
                cancelBooking({ variables: { bookingId: booking._id } })
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}
