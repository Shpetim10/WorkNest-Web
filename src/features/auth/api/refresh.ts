import axios from 'axios';
import { RefreshTokenResponse, RefreshTokenRequest } from '../types';
import { ApiResponse } from '@/common/types/api';

/**
 * Dedicated refresh token call using a clean axios instance to avoid interceptor loops
 */
export const refreshAuthTokens = async (refreshToken: string): Promise<RefreshTokenResponse> => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
  
  const response = await axios.post<ApiResponse<RefreshTokenResponse>>(
    `${API_URL}/auth/refresh`,
    { refreshToken } as RefreshTokenRequest,
    {
      headers: {
        'Content-Type': 'application/json',
      }
    }
  );

  return response.data.data;
};
