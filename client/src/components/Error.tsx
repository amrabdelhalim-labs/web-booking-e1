/**
 * Error Alert Component
 *
 * Displays an alert message when an error string is provided.
 * Returns nothing if the error string is empty/null.
 *
 * TODO: Implement full error display (Phase 5.2)
 */

import { Alert } from "react-bootstrap";

interface ErrorProps {
  error: string;
}

export default function Error({ error }: ErrorProps) {
  if (!error) return null;

  return <Alert variant="warning">{error}</Alert>;
}
