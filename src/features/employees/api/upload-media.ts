import { apiClient } from '@/common/network/api-client';
import { ApiResponse } from '@/common/types/api';

export interface MediaUploadResponse {
  storageKey: string;
  storagePath: string;
  originalFilename: string;
  contentType: string;
  size: number;
  message: string;
}

export async function uploadContractDocument(file: File): Promise<MediaUploadResponse> {
  const formData = new FormData();
  formData.append('category', 'EMPLOYEE_CONTRACT');
  formData.append('file', file);

  const response = await apiClient.post<ApiResponse<MediaUploadResponse>>(
    '/media/upload',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return response.data.data;
}
