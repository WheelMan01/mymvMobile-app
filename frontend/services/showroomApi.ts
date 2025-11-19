import axios from 'axios';
import api from './api';

const API_URL = 'https://vehicle-photo-app.preview.emergentagent.com';

export interface ShowroomListing {
  id: string;
  vehicle_id?: string;
  user_id?: string;
  title?: string;
  description?: string;
  photos: string[];
  likes: number;
  liked_by_current_user?: boolean;
  favorited_by_current_user?: boolean;
  type: 'user' | 'marketplace';
  comments?: any[];
}

// Alias for ShowroomVehicle (used by showroom screen)
export interface ShowroomVehicle {
  id: string;
  year: number;
  make: string;
  model: string;
  body_type?: string;
  state?: string;
  images: string[];
  has_liked: boolean;
  is_favorited: boolean;
  showroom_likes: number;
  source: 'user' | 'marketplace';
  marketplace_listing_id?: string;
}

// Fetch all showroom listings (includes both user vehicles and marketplace listings)
export const fetchShowroomListings = async (): Promise<ShowroomListing[]> => {
  try {
    // Updated to use marketplace endpoint to include dealer vehicles
    const response = await api.get(`/marketplace/showroom-listings`);
    
    // Parse the response - handle both flat arrays and nested structures
    let listings = response.data;
    
    // If data is nested, extract the listings array
    if (listings.listings) {
      listings = listings.listings;
    } else if (listings.data) {
      listings = listings.data;
    }
    
    // Ensure listings is an array
    if (!Array.isArray(listings)) {
      console.warn('Unexpected showroom listings format:', listings);
      return [];
    }
    
    // Normalize the listing structure
    return listings.map((listing: any) => {
      // Handle marketplace listing structure
      if (listing.type === 'marketplace' && listing.marketplace_listing) {
        const mlListing = listing.marketplace_listing;
        return {
          id: listing.id || mlListing.id,
          vehicle_id: mlListing.id,
          user_id: mlListing.dealer_id,
          title: mlListing.title,
          description: mlListing.description,
          photos: mlListing.photos || [],
          likes: listing.likes || 0,
          liked_by_current_user: listing.liked_by_current_user || false,
          favorited_by_current_user: listing.favorited_by_current_user || false,
          type: 'marketplace' as const,
          comments: listing.comments || [],
        };
      }
      
      // Handle user vehicle structure
      if (listing.type === 'user' && listing.vehicle) {
        const vehicle = listing.vehicle;
        return {
          id: listing.id,
          vehicle_id: vehicle.id,
          user_id: vehicle.user_id,
          title: vehicle.title || `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
          description: vehicle.description,
          photos: vehicle.photos || [],
          likes: listing.likes || 0,
          liked_by_current_user: listing.liked_by_current_user || false,
          favorited_by_current_user: listing.favorited_by_current_user || false,
          type: 'user' as const,
          comments: listing.comments || [],
        };
      }
      
      // Fallback for unexpected structure
      return {
        id: listing.id,
        vehicle_id: listing.vehicle_id,
        user_id: listing.user_id,
        title: listing.title,
        description: listing.description,
        photos: listing.photos || [],
        likes: listing.likes || 0,
        liked_by_current_user: listing.liked_by_current_user || false,
        favorited_by_current_user: listing.favorited_by_current_user || false,
        type: listing.type || 'user',
        comments: listing.comments || [],
      };
    });
  } catch (error: any) {
    console.error('Error fetching showroom listings:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    throw error;
  }
};

// Toggle like on a showroom listing
export const toggleLike = async (listingId: string): Promise<void> => {
  await api.post(`/showroom/${listingId}/like`);
};

// Toggle favorite on a showroom listing
export const toggleFavorite = async (listingId: string): Promise<void> => {
  await api.post(`/showroom/${listingId}/favorite`);
};

// Add a comment to a showroom listing
export const addComment = async (listingId: string, text: string): Promise<void> => {
  await api.post(`/showroom/${listingId}/comments`, { text });
};

// Fetch comments for a listing
export const fetchComments = async (listingId: string): Promise<any[]> => {
  const response = await api.get(`/showroom/${listingId}/comments`);
  return response.data;
};

// Get all showroom vehicles (used by showroom screen)
export const getAllShowroomVehicles = async (): Promise<ShowroomVehicle[]> => {
  try {
    const response = await api.get(`/marketplace/showroom-listings`);
    console.log('Showroom API response:', response.data);
    
    // Handle nested response structure
    let listings = response.data;
    if (listings.data && listings.data.listings) {
      listings = listings.data.listings;
    } else if (listings.data) {
      listings = listings.data;
    } else if (listings.listings) {
      listings = listings.listings;
    }
    
    if (!Array.isArray(listings)) {
      console.warn('Unexpected showroom response format:', listings);
      return [];
    }
    
    // Transform API response to ShowroomVehicle format
    return listings.map((item: any) => {
      // Extract vehicle details from various possible structures
      let vehicleDetails = null;
      if (item.vehicle_details) {
        vehicleDetails = item.vehicle_details;
      } else if (item.vehicle) {
        vehicleDetails = item.vehicle;
      } else if (item.marketplace_listing) {
        vehicleDetails = item.marketplace_listing.vehicle_details || item.marketplace_listing;
      }
      
      return {
        id: item.id || item.vehicle_id,
        year: vehicleDetails?.year || 0,
        make: vehicleDetails?.make || 'Unknown',
        model: vehicleDetails?.model || 'Unknown',
        body_type: vehicleDetails?.body_type,
        state: vehicleDetails?.state,
        images: item.photos || vehicleDetails?.photos || [],
        has_liked: item.liked_by_current_user || false,
        is_favorited: item.favorited_by_current_user || false,
        showroom_likes: item.likes || 0,
        source: item.type === 'marketplace' ? 'marketplace' : 'user',
        marketplace_listing_id: item.type === 'marketplace' ? item.vehicle_id : undefined
      };
    });
  } catch (error: any) {
    console.error('Error fetching showroom vehicles:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    return [];
  }
};

// Get favorite vehicles (placeholder - implement when backend is ready)
export const getFavoriteVehicles = async (): Promise<ShowroomVehicle[]> => {
  try {
    const allVehicles = await getAllShowroomVehicles();
    return allVehicles.filter(v => v.is_favorited);
  } catch (error) {
    console.error('Error fetching favorite vehicles:', error);
    return [];
  }
};
