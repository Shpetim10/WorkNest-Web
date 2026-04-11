"use client";

/**
 * Thin wrapper kept for backwards-compatibility / ergonomics.
 * All logic lives in LocationFormModal.
 */
import { LocationFormModal } from './LocationFormModal';

interface AddLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId?: string | null;
  onCompleted?: () => void;
}

export function AddLocationModal({ isOpen, onClose, companyId, onCompleted }: AddLocationModalProps) {
  return (
    <LocationFormModal
      isOpen={isOpen}
      onClose={onClose}
      mode="add"
      companyId={companyId}
      onCompleted={onCompleted}
    />
  );
}
