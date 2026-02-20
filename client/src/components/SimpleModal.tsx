/**
 * Simple Modal Component
 *
 * A reusable modal dialog using React Bootstrap.
 * Used for event creation, event detail/booking, and profile editing.
 *
 * Features:
 * - Configurable title, confirm text, and confirm button variant
 * - Optional extra footer actions (e.g., delete account button)
 * - Disabled state for confirm button
 * - RTL-aware layout
 */

import type { ReactNode } from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";

interface SimpleModalProps {
  /** Modal header title */
  title: string;
  /** Modal body content */
  children: ReactNode;
  /** Callback when confirm button is clicked */
  onConfirm: () => void;
  /** Callback when cancel/close button is clicked */
  onCancel: () => void;
  /** Text or element shown on the confirm button */
  confirmText: ReactNode;
  /** Bootstrap variant for the confirm button */
  confirmVariant?: string;
  /** Whether the confirm button is disabled */
  isDisabled?: boolean;
  /** Optional extra actions rendered at the start of the footer */
  footerExtra?: ReactNode;
}

export default function SimpleModal({
  title,
  children,
  onConfirm,
  onCancel,
  confirmText,
  confirmVariant = "primary",
  isDisabled = false,
  footerExtra,
}: SimpleModalProps) {
  return (
    <Modal show onHide={onCancel} className="custom-modal" centered>
      <Modal.Header closeButton className="custom-modal-header">
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{children}</Modal.Body>
      <Modal.Footer>
        {footerExtra}
        <Button
          variant={confirmVariant}
          onClick={onConfirm}
          disabled={isDisabled}
        >
          {confirmText}
        </Button>
        <Button variant="secondary" onClick={onCancel}>
          إغلاق
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
