"use client";

import { mapSetupStatusToLocation, useLocationSetupStatus } from '../api';
import { LocationFormModal } from './LocationFormModal';

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
  // Always fetch fresh setup status when the modal opens.
  // staleTime: 0 ensures we never use a cached version — the network version
  // in the DB may be ahead of the client cache, causing OPTIMISTIC_LOCK_CONFLICT.
  const { data, isLoading } = useLocationSetupStatus(isOpen ? siteId : null);

  const initialLocation = data ? mapSetupStatusToLocation(data) : null;

  // Do NOT open the form until we have a fully-loaded initialLocation.
  // Opening with initialLocation=null would initialize step3Data.version=0,
  // which the backend rejects with 409 if the network already has version>0.
  const isReadyToOpen = isOpen && !isLoading && initialLocation !== null;

  return (
    <LocationFormModal
      isOpen={isReadyToOpen}
      onClose={onClose}
      mode="edit"
      initialLocation={initialLocation}
      onCompleted={onCompleted}
    />
  );
}
