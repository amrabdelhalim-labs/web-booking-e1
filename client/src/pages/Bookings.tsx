/**
 * Bookings Page
 *
 * Displays the authenticated user's event bookings.
 * Allows cancelling existing bookings.
 *
 * TODO: Implement full bookings page (Phase 5.4)
 */

import { useState } from "react";
import { useQuery, useMutation, useApolloClient } from "@apollo/client";
import { BOOKINGS, CANCEL_BOOKING } from "../graphql/queries";
import BookingItem from "../components/BookingItem";
import Error from "../components/Error";
import Spinner from "../components/Spinner";

/** Shape of a single booking from the GraphQL response */
interface BookingData {
  _id: string;
  createdAt: string;
  event: { _id: string; title: string; description: string; price: number; date: string };
  user: { username: string; email: string };
}

export default function BookingsPage() {
  const [alert, setAlert] = useState("");
  const client = useApolloClient();

  // ─── Bookings list sub-component ────────────────────────────────────────
  function BookingsList() {
    const { loading, error, data } = useQuery(BOOKINGS);

    if (loading) return <Spinner />;
    if (error) {
      setAlert(error.message);
      return null;
    }

    client.refetchQueries({ include: ["Bookings"] });

    return (
      <div>
        <Error error={alert} />
        <div className="row">
          <div className="col-md-8 offset-md-2">
            {data.bookings.map((booking: BookingData) => (
              <BookingItem
                key={booking._id}
                {...booking}
                onCancelBooking={() => {
                  cancelBooking({
                    variables: { bookingId: booking._id },
                  });
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── Cancel booking mutation ────────────────────────────────────────────
  const [cancelBooking] = useMutation(CANCEL_BOOKING, {
    onError: (error) => setAlert(error.message),
    onCompleted: () => setAlert("تم إلغاء حجزك"),
  });

  return (
    <div className="container-fluid">
      <h2>المناسبات التي حجزتها</h2>
      <BookingsList />
    </div>
  );
}
