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

export interface Comment {
  id: string;
  user_id: string;
  user_name?: string;
  comment_text: string;
  created_at: string;
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

// Add a comment - checks vehicle source and uses correct endpoint
export const addComment = async (vehicleId: string, text: string, source?: 'user' | 'marketplace', marketplaceListingId?: string): Promise<void> => {
  // Determine the correct endpoint based on source
  let endpoint;
  let payload;
  let actualId;
  
  if (source === 'marketplace') {
    // Dealer listings - use vehicleId (listing ID)
    actualId = vehicleId;
    endpoint = `/marketplace/listings/${actualId}/comments`;
    payload = { comment_text: text };
    console.log('📱 Posting MARKETPLACE comment:', endpoint, payload);
  } else {
    // Customer vehicles - use marketplaceListingId (which is actually vehicle_id)
    actualId = marketplaceListingId || vehicleId;
    endpoint = `/showroom/${actualId}/comments`;
    payload = { comment_text: text };
    console.log('📱 Posting USER comment:', endpoint, payload);
  }
  
  await api.post(endpoint, payload);
};

// Fetch comments - checks vehicle source and uses correct endpoint
export const fetchComments = async (vehicleId: string, source?: 'user' | 'marketplace', marketplaceListingId?: string): Promise<Comment[]> => {
  // Determine the correct endpoint based on source
  let endpoint;
  let actualId;
  
  if (source === 'marketplace') {
    // Dealer listings - use vehicleId (listing ID)
    actualId = vehicleId;
    endpoint = `/marketplace/listings/${actualId}/comments`;
    console.log('📱 Fetching MARKETPLACE comments:', endpoint);
  } else {
    // Customer vehicles - use marketplaceListingId (which is actually vehicle_id)
    actualId = marketplaceListingId || vehicleId;
    endpoint = `/showroom/${actualId}/comments`;
    console.log('📱 Fetching USER comments:', endpoint);
  }
  
  const response = await api.get(endpoint);
  console.log('📱 Comments response RAW:', JSON.stringify(response.data, null, 2));
  console.log('📱 Comments response type:', typeof response.data);
  console.log('📱 Is array?', Array.isArray(response.data));
  
  // Handle different response structures
  if (response.data && response.data.data && response.data.data.comments) {
    console.log('📱 Returning nested comments:', response.data.data.comments);
    return response.data.data.comments;
  } else if (response.data && response.data.comments) {
    console.log('📱 Returning data.comments:', response.data.comments);
    return response.data.comments;
  } else if (Array.isArray(response.data)) {
    console.log('📱 Returning direct array:', response.data);
    return response.data;
  } else {
    console.log('📱 Returning response.data as-is');
    return response.data;
  }
};

// Alias for compatibility
export const getComments = fetchComments;

// Get all showroom vehicles (used by showroom screen)
export const getAllShowroomVehicles = async (): Promise<ShowroomVehicle[]> => {
  try {
    const response = await api.get(`/marketplace/showroom-listings`);
    console.log('🔴 RAW Showroom API response:', JSON.stringify(response.data, null, 2));
    
    // Handle nested response structure
    let listings = response.data;
    if (listings.data && listings.data.listings) {
      listings = listings.data.listings;
    } else if (listings.data) {
      listings = listings.data;
    } else if (listings.listings) {
      listings = listings.listings;
    }
    
    console.log('🔴 Extracted listings array length:', listings?.length);
    
    if (!Array.isArray(listings)) {
      console.warn('Unexpected showroom response format:', listings);
      return [];
    }
    
    // Transform API response to ShowroomVehicle format
    return listings.map((item: any) => {
      // Determine source based on item properties
      let actualSource: 'user' | 'marketplace';
      let commentId: string;
      
      if (item.source === 'customer' && item.vehicle_id) {
        // Customer vehicles use vehicle_id with /api/showroom endpoint
        actualSource = 'user';
        commentId = item.vehicle_id;
      } else if (item.source === 'dealer' || item.dealer_id) {
        // Dealer/marketplace listings use listing id with /api/marketplace endpoint
        actualSource = 'marketplace';
        commentId = item.id;
      } else {
        // Fallback: if vehicle_id exists, treat as customer vehicle
        actualSource = item.vehicle_id ? 'user' : 'marketplace';
        commentId = item.vehicle_id || item.id;
      }
      
      console.log('🔍 Processing item:', {
        id: item.id,
        source: item.source,
        vehicle_id: item.vehicle_id,
        dealer_id: item.dealer_id,
        actualSource,
        commentId
      });
      
      // Extract vehicle details from various possible structures
      let vehicleDetails = null;
      if (item.vehicle_details) {
        vehicleDetails = item.vehicle_details;
      } else if (item.vehicle) {
        vehicleDetails = item.vehicle;
      } else {
        vehicleDetails = item;
      }
      
      const result = {
        id: item.id,
        year: vehicleDetails?.year || item.year || 0,
        make: vehicleDetails?.make || item.make || 'Unknown',
        model: vehicleDetails?.model || item.model || 'Unknown',
        body_type: vehicleDetails?.body_type || item.body_type,
        state: vehicleDetails?.state || item.state,
        images: item.photos || vehicleDetails?.photos || [],
        has_liked: item.liked_by_current_user || false,
        is_favorited: item.favorited_by_current_user || false,
        showroom_likes: item.likes || 0,
        source: actualSource,
        marketplace_listing_id: actualSource === 'marketplace' ? item.id : commentId
      };
      
      console.log('✅ Mapped vehicle:', {
        make: result.make,
        model: result.model,
        source: result.source,
        marketplace_listing_id: result.marketplace_listing_id
      });
      
      return result;
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
