import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/common/network/api-client';
import { 
  CompanyRegistrationRequest, 
  CompanyRegistrationResponse, 
  MediaUploadResponse, 
  MediaCategory 
} from '../types/registration';
import { ApiResponse } from '@/common/types/api';

/**
 * Hook for public media upload (Step 0)
 */
export const usePublicMediaUpload = () => {
  return useMutation<MediaUploadResponse, Error, { file: File; category: MediaCategory }>({
    mutationFn: async ({ file, category }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);

      const response = await apiClient.post<ApiResponse<MediaUploadResponse>>(
        '/media/public/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return response.data.data;
    },
  });
};

/**
 * Hook for company registration (Step 1 of 2)
 */
export const useRegisterCompany = () => {
  return useMutation({
    mutationFn: async (request: CompanyRegistrationRequest): Promise<CompanyRegistrationResponse> => {
      const response = await apiClient.post<ApiResponse<CompanyRegistrationResponse>>(
        '/companies/register',
        request
      );
      return response.data.data;
    },
  });
};
