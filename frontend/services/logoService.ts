import axios from 'axios';
import { Platform } from 'react-native';

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://app-bridge-api.preview.emergentagent.com';

interface LogoSearchResult {
  url: string;
  source: string;
}

export const searchCarLogo = async (make: string, model?: string): Promise<string> => {
  try {
    const query = model ? `${make} ${model}` : make;
    const response = await axios.get<LogoSearchResult>(
      `${API_BASE}/api/logos/search?query=${encodeURIComponent(query)}`
    );
    return response.data.url;
  } catch (error) {
    console.error('Error searching for car logo:', error);
    throw error;
  }
};
