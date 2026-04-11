"use client";

import { mapDetailsToLocation, useSiteDetails } from '../api';
import { LocationFormModal } from './LocationFormModal';

interface EditLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteId: string | null;
  companyId: string | null;
  initialStep?: number;
  onCompleted?: () => void;
  isStandalone?: boolean;
}

export function EditLocationModal({
  isOpen,
  onClose,
  siteId,
  companyId,
  initialStep,
  onCompleted,
  isStandalone = false,
}: EditLocationModalProps) {
  // Switch to useSiteDetails as the setup-status endpoint is currently unstable.
  // We use staleTime: 0 to ensure we always get the latest version for optimistic locking.
  const { data, isLoading } = useSiteDetails(companyId, isOpen ? siteId : null);

  const initialLocation = data ? mapDetailsToLocation(data) : null;

  // Do NOT open the form until we have a fully-loaded initialLocation.
  const isReadyToOpen = isOpen && !isLoading && initialLocation !== null;

  return (
    <LocationFormModal
      isOpen={isReadyToOpen}
      onClose={onClose}
      mode="edit"
      initialLocation={initialLocation}
      initialStep={initialStep}
      onCompleted={onCompleted}
      isStandalone={isStandalone}
    />
  );
}
