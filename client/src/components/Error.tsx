/**
 * Error Alert Component
 *
 * Displays a dismissible alert message when an error string is provided.
 * Returns nothing if the error string is empty/falsy.
 */

import { Alert } from "react-bootstrap";

interface ErrorProps {
  error: string;
}

export default function Error({ error }: ErrorProps) {
  if (!error) return null;

  return <Alert variant="warning">{error}</Alert>;
}
