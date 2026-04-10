"use client";

import { LocationFormModal } from './LocationFormModal';
import { useLocationSetupStatus, mapSetupStatusToLocation } from '../api';

interface EditLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteId: string | null;
  onCompleted?: () => void;
}

export function EditLocationModal({
  isOpen,
  onClose,
  siteId,
  onCompleted,
}: EditLocationModalProps) {
  const { data } = useLocationSetupStatus(isOpen ? siteId : null);

  return (
    <LocationFormModal
      isOpen={isOpen}
      onClose={onClose}
      mode="edit"
      initialLocation={data ? mapSetupStatusToLocation(data) : null}
      onCompleted={onCompleted}
    />
  );
}
