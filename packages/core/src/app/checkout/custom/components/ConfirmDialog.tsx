import React from "react";

interface ConfirmDialogProps {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog = ({
  isOpen,
  message,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  if (!isOpen) return null;

  return (
    <div className="confirm-overlay">
      <div className="confirm-modal">
        <p className="confirm-message">{message}</p>

        <div className="confirm-actions">
          <button
            className="confirm-button cancel"
            onClick={onCancel}
          >
            NO
          </button>

          <button
            className="confirm-button confirm"
            onClick={onConfirm}
          >
            YES
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
