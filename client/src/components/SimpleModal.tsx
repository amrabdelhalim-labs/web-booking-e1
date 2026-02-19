/**
 * Simple Modal Component
 *
 * A reusable modal dialog using React Bootstrap.
 * Used for event creation forms and event detail/booking views.
 *
 * TODO: Implement full modal with proper typing (Phase 5.3)
 */

import React from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";

interface SimpleModalProps {
  title: string;
  children: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText: React.ReactNode;
  isDisabled?: boolean;
}

export default function SimpleModal({
  title,
  children,
  onConfirm,
  onCancel,
  confirmText,
  isDisabled = false,
}: SimpleModalProps) {
  return (
    <div>
      <Modal show={true} onHide={onCancel} className="custom-modal">
        <Modal.Header closeButton className="custom-modal-header">
          <Modal.Title>{title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>{children}</Modal.Body>
        <Modal.Footer>
          <Button
            variant="primary"
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
    </div>
  );
}
