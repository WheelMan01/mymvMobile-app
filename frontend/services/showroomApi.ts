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
