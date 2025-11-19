import axios from 'axios';
import { Platform } from 'react-native';
import { API_URL } from './api';

interface LogoSearchResult {
  url: string;
  source: string;
}

export const searchCarLogo = async (make: string, model?: string): Promise<string> => {
  try {
    const query = model ? `${make} ${model}` : make;
    const response = await axios.get<LogoSearchResult>(
      `${API_URL}/api/logos/search?query=${encodeURIComponent(query)}`
    );
    return response.data.url;
  } catch (error) {
    console.error('Error searching for car logo:', error);
    throw error;
  }
};
