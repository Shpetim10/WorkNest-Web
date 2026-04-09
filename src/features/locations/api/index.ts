import { useQuery } from '@tanstack/react-query';
import { LocationListItem } from '../types';

export const useLocations = () => {
  return useQuery<LocationListItem[]>({
    queryKey: ['locations', 'list'],
    queryFn: async () => {
      // TODO: Replace with API call to backend
      // Example: return fetch('/api/locations').then(res => res.json());

      // Simulating network delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 800));

      // Currently returning empty array to prepare for real data integration
      return [];
    },
  });
};
