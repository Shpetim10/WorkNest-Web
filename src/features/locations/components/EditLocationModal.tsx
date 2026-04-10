"use client";

import { LocationFormModal } from './LocationFormModal';
import { Location } from '../types';

interface EditLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  location: Location | null;
  onSubmit?: (data: {
    step1: import('../types').LocationFormData;
    step2: import('../types').LocationStep2Data;
    step3: import('../types').LocationStep3Data;
  }) => void;
}

export function EditLocationModal({
  isOpen,
  onClose,
  location,
  onSubmit,
}: EditLocationModalProps) {
  return (
    <LocationFormModal
      isOpen={isOpen}
      onClose={onClose}
      mode="edit"
      initialLocation={location}
      onSubmit={onSubmit}
    />
  );
}
