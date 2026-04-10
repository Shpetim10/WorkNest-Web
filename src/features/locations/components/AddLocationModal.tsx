"use client";

/**
 * Thin wrapper kept for backwards-compatibility / ergonomics.
 * All logic lives in LocationFormModal.
 */
import { LocationFormModal } from './LocationFormModal';

interface AddLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddLocationModal({ isOpen, onClose }: AddLocationModalProps) {
  return <LocationFormModal isOpen={isOpen} onClose={onClose} mode="add" />;
}