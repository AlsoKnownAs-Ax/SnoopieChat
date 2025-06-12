import { Configuration } from '$lib/api';
import { config } from '$lib/core/config';
import axios from 'axios';

// Shared config instance
export const configuration = new Configuration({
	basePath: config.PUBLIC_API_HOST
});

export const apiAxiosInstance = axios.create();

apiAxiosInstance.interceptors.response.use(
	(response) => response,
	(error: any) => {
		// Standardize error format
		const standardError = {
			status: error.response?.status || 500,
			message: error.response?.data?.message || 'Unknown error',
			details: error.response?.data?.error || {},
			originalError: error
		};

		return Promise.reject(standardError);
	}
);
