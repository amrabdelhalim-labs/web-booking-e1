/**
 * Alert Component
 *
 * Displays a dismissible alert message when a message string is provided.
 * Returns nothing if the message string is empty/falsy.
 */

import { Alert as BootstrapAlert } from 'react-bootstrap';

interface AlertProps {
  message: string;
  variant?: 'warning' | 'danger' | 'success' | 'info';
}

export default function Alert({ message, variant = 'warning' }: AlertProps) {
  if (!message) return null;

  return <BootstrapAlert variant={variant}>{message}</BootstrapAlert>;
}
