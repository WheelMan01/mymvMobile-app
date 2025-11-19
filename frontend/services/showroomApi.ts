import axios from 'axios';
import api from './api';

const API_URL = 'https://photo-showroom-app.preview.emergentagent.com';

export interface ShowroomVehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  body_type: string;
  state: string;
  image?: string;
  images: string[];
  showroom_likes: number;
  has_liked: boolean;
  is_favorited: boolean;
  created_at: string;
  source: 'showroom' | 'marketplace';
  marketplace_listing_id?: string;
}

export interface Comment {
  id: string;
  vehicle_id: string;
  user_id: string;
  user_name: string;
  comment_text: string;
  created_at: string;
}

export interface MarketplaceListing {
  id: string;
  photos: string[];
  vehicle_details: {
    year: number;
    make: string;
    model: string;
    body_type: string;
    state: string;
  };
  source: string;
}

// Get user-uploaded showroom vehicles
export const getShowroomVehicles = async (): Promise<ShowroomVehicle[]> => {
  try {
    const response = await api.get('/showroom');
    return response.data.data.vehicles.map((v: any) => ({
      ...v,
      images: v.images || (v.image ? [v.image] : []),
      source: 'showroom'
    }));
  } catch (error) {
    console.error('Error fetching showroom vehicles:', error);
    return [];
  }
};

// Get marketplace listings for showroom
export const getMarketplaceListings = async (): Promise<ShowroomVehicle[]> => {
  try {
    const response = await axios.get(`${API_URL}/api/marketplace/showroom-listings`);
    console.log('Marketplace listings response:', response.data);
    
    const listings = response.data?.data?.listings || response.data?.listings || [];
    console.log('Parsed listings:', listings.length);
    
    return listings
      .filter((listing: any) => listing && listing.vehicle_details) // Filter out invalid entries
      .map((listing: MarketplaceListing) => ({
        id: listing.id,
        images: listing.photos || [],
        year: listing.vehicle_details?.year || 0,
        make: listing.vehicle_details?.make || 'Unknown',
        model: listing.vehicle_details?.model || 'Unknown',
        body_type: listing.vehicle_details?.body_type || '',
        state: listing.vehicle_details?.state || '',
        showroom_likes: 0,
        has_liked: false,
        is_favorited: false,
        source: 'marketplace' as const,
        marketplace_listing_id: listing.id
      }));
  } catch (error) {
    console.error('Error fetching marketplace listings:', error);
    return [];
  }
};

// Get all showroom vehicles (using marketplace listings like web version)
export const getAllShowroomVehicles = async (): Promise<ShowroomVehicle[]> => {
  // Use only marketplace listings for now (like web version)
  // User vehicles require admin approval which isn't ready yet
  return await getMarketplaceListings();
};

// Get favorite vehicles only
export const getFavoriteVehicles = async (): Promise<ShowroomVehicle[]> => {
  try {
    const response = await api.get('/showroom/favorites');
    return response.data.data.vehicles.map((v: any) => ({
      ...v,
      images: v.images || (v.image ? [v.image] : []),
      source: 'showroom'
    }));
  } catch (error) {
    console.error('Error fetching favorite vehicles:', error);
    return [];
  }
};

// Like/Unlike a vehicle
export const toggleLike = async (vehicleId: string): Promise<{ liked: boolean; likes_count: number }> => {
  const response = await api.post(`/showroom/${vehicleId}/like`);
  return response.data.data;
};

// Favorite/Unfavorite a vehicle
export const toggleFavorite = async (vehicleId: string): Promise<{ is_favorited: boolean }> => {
  const response = await api.post(`/showroom/${vehicleId}/favorite`);
  return response.data.data;
};

// Get comments for a vehicle
export const getComments = async (vehicleId: string): Promise<Comment[]> => {
  try {
    const response = await api.get(`/showroom/${vehicleId}/comments`);
    return response.data.data.comments;
  } catch (error) {
    console.error('Error fetching comments:', error);
    return [];
  }
};

// Add a comment
export const addComment = async (vehicleId: string, commentText: string): Promise<Comment> => {
  const response = await api.post(`/showroom/${vehicleId}/comments`, {
    comment_text: commentText
  });
  return response.data.data.comment;
};