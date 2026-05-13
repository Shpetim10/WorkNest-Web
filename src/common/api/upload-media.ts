import { apiClient } from '@/common/network/api-client';
import type { ApiResponse } from '@/common/types/api';

export type MediaUploadCategory = 'COMPANY_LOGO' | 'USER_PROFILE' | 'REGISTRATION_LOGO';

export interface MediaUploadResponse {
  storageKey: string;
  storagePath: string;
  originalFilename?: string;
  contentType?: string;
  size?: number;
  message?: string;
}

export async function uploadMedia(file: File, category: MediaUploadCategory): Promise<MediaUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('category', category);

  const response = await apiClient.post<ApiResponse<MediaUploadResponse>>('/media/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      'X-Silent-Mutation': true,
    },
  });

  return response.data.data;
}
