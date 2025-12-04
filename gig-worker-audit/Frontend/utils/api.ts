import axios, { AxiosInstance, AxiosResponse, AxiosError } from "axios";

// Define a type for structured API response data (optional, but good practice)
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

// Custom error structure for better front-end handling
export interface ApiError {
  status: number;
  message: string;
  details?: any;
}

// 1. Create the Axios Instance
const axiosInstance: AxiosInstance = axios.create({
  // Use the environment variable for the backend URL
  // Falls back to a relative path for client-side API routes if the env var is missing
  baseURL: process.env.NEXT_PUBLIC_APP_URL || '/', 
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 seconds timeout
});

// 2. Define the Wrapper Functions
const api = {
  /**
   * Handles GET requests
   * @param url The endpoint path
   * @param config Axios request configuration
   * @returns Promise resolving to the response data (T)
   */
  get: async <T>(url: string, config = {}): Promise<T> => {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await axiosInstance.get(url, config);
      return response.data.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  /**
   * Handles POST requests (for JSON body)
   * @param url The endpoint path
   * @param data The JSON payload to send
   * @param config Axios request configuration
   * @returns Promise resolving to the response data (T)
   */
  post: async <T, D = any>(url: string, data?: D, config = {}): Promise<T> => {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await axiosInstance.post(url, data, config);
      return response.data.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  /**
   * Utility function to handle Axios errors and transform them into a standardized format.
   * @param error The AxiosError or generic Error object
   * @returns A standardized ApiError object
   */
  postFormData: async <T>(url: string, formData: FormData, config = {}): Promise<T> => {
    try {
        const response: AxiosResponse<ApiResponse<T>> = await axiosInstance.post(url, formData, {
            ...config,
            headers: {
                // Axios will automatically set Content-Type to multipart/form-data with the correct boundary
                // when a FormData object is provided as the body.
                'Content-Type': 'multipart/form-data', 
                // Merge any custom headers from config
                ...config.headers 
            }
        });
        return response.data.data;
    } catch (error) {
        throw handleError(error);
    }
  }
};

// 3. Centralized Error Handler
function handleError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    const status = axiosError.response?.status || 500;
    
    // Attempt to extract error message from the response body
    let message = 'An unexpected error occurred.';
    let details = axiosError.response?.data;

    // Check if the response data has a standard structure (e.g., { message: '...' })
    if (typeof axiosError.response?.data === 'object' && axiosError.response.data !== null && 'message' in axiosError.response.data) {
        message = (axiosError.response.data as any).message;
    } else if (axiosError.request) {
      // The request was made but no response was received
      message = 'No response received from server. Check your network connection.';
      details = undefined;
    } else {
      // Something happened in setting up the request that triggered an Error
      message = axiosError.message;
      details = undefined;
    }

    return {
      status,
      message,
      details,
    };
  }
  
  // Handle non-Axios errors (e.g., standard JavaScript errors)
  return {
    status: 500,
    message: (error as Error).message || 'An unknown error occurred.',
    details: error,
  };
}

export default api;