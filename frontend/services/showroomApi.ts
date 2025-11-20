import axios from 'axios';
import api from './api';

const API_URL = 'https://fork-safe-auth.preview.emergentagent.com';

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
  comments_count: number;
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

// Toggle favorite - uses different endpoints based on vehicle source
// Customer vehicles: /api/showroom/{vehicle_id}/favorite
// Marketplace listings: /api/marketplace/listings/{listing_id}/favorite
export const toggleFavorite = async (
  vehicleId: string, 
  source?: 'user' | 'marketplace', 
  marketplaceListingId?: string
): Promise<{ is_favorited: boolean }> => {
  let endpoint;
  let actualId;
  
  if (source === 'marketplace') {
    // Dealer/marketplace listings - use listing ID with marketplace endpoint
    actualId = vehicleId;
    endpoint = `/marketplace/listings/${actualId}/favorite`;
    console.log('📑 Toggling MARKETPLACE favorite:', endpoint);
  } else {
    // Customer vehicles - use vehicle_id with showroom endpoint
    actualId = marketplaceListingId || vehicleId;
    endpoint = `/showroom/${actualId}/favorite`;
    console.log('📑 Toggling USER favorite:', endpoint);
  }
  
  const response = await api.post(endpoint, {});
  console.log('📑 Toggle favorite response FULL:', JSON.stringify(response.data, null, 2));
  console.log('📑 is_favorited value:', response.data.data?.is_favorited);
  
  // Handle different response structures
  let isFavorited = false;
  if (response.data.data && typeof response.data.data.is_favorited === 'boolean') {
    isFavorited = response.data.data.is_favorited;
  } else if (typeof response.data.is_favorited === 'boolean') {
    isFavorited = response.data.is_favorited;
  }
  
  console.log('📑 Returning is_favorited:', isFavorited);
  return { is_favorited: isFavorited };
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
  
  const response = await api.post(endpoint, payload);
  console.log('📱 Comment POST response:', JSON.stringify(response.data, null, 2));
  return response;
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
    console.log('🔴 Fetching showroom vehicles from BOTH endpoints...');
    
    // Fetch from BOTH endpoints like web app does
    const [vehiclesResponse, marketplaceResponse] = await Promise.all([
      api.get(`/vehicles`).catch(err => {
        console.log('⚠️ Error fetching regular vehicles:', err);
        return { data: [] };
      }),
      api.get(`/marketplace/showroom-listings`).catch(err => {
        console.log('⚠️ Error fetching marketplace listings:', err);
        return { data: [] };
      })
    ]);
    
    console.log('🔴 RAW Vehicles response:', JSON.stringify(vehiclesResponse.data, null, 2));
    console.log('🔴 RAW Marketplace response:', JSON.stringify(marketplaceResponse.data, null, 2));
    
    // Process regular vehicles (filter for showroom-enabled ones)
    let regularVehicles = [];
    let vehiclesData = vehiclesResponse.data;
    if (vehiclesData.data && vehiclesData.data.vehicles) {
      vehiclesData = vehiclesData.data.vehicles;
    } else if (vehiclesData.data) {
      vehiclesData = vehiclesData.data;
    } else if (vehiclesData.vehicles) {
      vehiclesData = vehiclesData.vehicles;
    }
    
    if (Array.isArray(vehiclesData)) {
      console.log('🚗 TOTAL vehicles from API:', vehiclesData.length);
      console.log('🚗 ALL vehicles data:', JSON.stringify(vehiclesData, null, 2));
      
      // Check each vehicle's showroom status
      vehiclesData.forEach((v: any, index: number) => {
        console.log(`🚗 Vehicle ${index + 1}:`, {
          id: v.id,
          make: v.make,
          model: v.model,
          show_in_showroom: v.show_in_showroom,
          showroom_approval_status: v.showroom_approval_status,
          approval_status: v.approval_status
        });
      });
      
      regularVehicles = vehiclesData.filter((v: any) => v.show_in_showroom === true);
      console.log('✅ FILTERED showroom vehicles count:', regularVehicles.length);
      console.log('✅ FILTERED showroom vehicles:', JSON.stringify(regularVehicles, null, 2));
    }
    
    // Process marketplace listings
    let marketplaceListings = [];
    let marketplaceData = marketplaceResponse.data;
    if (marketplaceData.data && marketplaceData.data.listings) {
      marketplaceListings = marketplaceData.data.listings;
    } else if (marketplaceData.data) {
      marketplaceListings = marketplaceData.data;
    } else if (marketplaceData.listings) {
      marketplaceListings = marketplaceData.listings;
    }
    
    if (!Array.isArray(marketplaceListings)) {
      marketplaceListings = [];
    }
    
    console.log('🔴 Marketplace listings count:', marketplaceListings.length);
    
    // Combine both arrays
    const allListings = [
      ...regularVehicles.map((v: any) => ({
        ...v,
        source: 'customer',
        vehicle_id: v.id,
        photos: v.photos || []
      })),
      ...marketplaceListings
    ];
    
    console.log('🔴 Combined total listings:', allListings.length);
    
    if (allListings.length === 0) {
      console.warn('No showroom vehicles found');
      return [];
    }
    
    // Transform combined data to ShowroomVehicle format
    return allListings.map((item: any) => {
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
      
      // Extract images - check multiple possible field names
      let images = [];
      if (item.photos && Array.isArray(item.photos) && item.photos.length > 0) {
        images = item.photos;
      } else if (vehicleDetails?.photos && Array.isArray(vehicleDetails.photos) && vehicleDetails.photos.length > 0) {
        images = vehicleDetails.photos;
      } else if (item.image) {
        // Single image field - convert to array
        images = [item.image];
      } else if (vehicleDetails?.image) {
        images = [vehicleDetails.image];
      } else if (item.images && Array.isArray(item.images) && item.images.length > 0) {
        images = item.images;
      } else if (vehicleDetails?.images && Array.isArray(vehicleDetails.images) && vehicleDetails.images.length > 0) {
        images = vehicleDetails.images;
      }
      
      console.log(`📸 Images for ${item.make} ${item.model}:`, images);
      
      // Only set marketplace_listing_id if this is actually a marketplace listing
      // or if the customer vehicle has a marketplace_listing_id field
      let marketplaceListingId = undefined;
      if (actualSource === 'marketplace') {
        marketplaceListingId = item.id;
      } else if (item.marketplace_listing_id) {
        // Customer vehicle that's also listed in marketplace
        marketplaceListingId = item.marketplace_listing_id;
      }
      
      const result = {
        id: item.id,
        year: vehicleDetails?.year || item.year || 0,
        make: vehicleDetails?.make || item.make || 'Unknown',
        model: vehicleDetails?.model || item.model || 'Unknown',
        body_type: vehicleDetails?.body_type || item.body_type,
        state: vehicleDetails?.state || item.state,
        images: images,
        has_liked: item.liked_by_current_user || false,
        is_favorited: item.favorited_by_current_user || false,
        showroom_likes: item.likes || 0,
        comments_count: item.comments_count || 0,
        source: actualSource,
        marketplace_listing_id: marketplaceListingId
      };
      
      console.log('✅ Mapped vehicle:', {
        make: result.make,
        model: result.model,
        source: result.source,
        marketplace_listing_id: result.marketplace_listing_id,
        comments_count: result.comments_count
      });
      
      return result;
    }).filter((vehicle: ShowroomVehicle) => {
      // Only show vehicles with images in the showroom
      const hasImages = vehicle.images && vehicle.images.length > 0;
      if (!hasImages) {
        console.log(`⚠️ Filtering out ${vehicle.make} ${vehicle.model} - no images`);
      }
      return hasImages;
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
// Fetch user's favorite vehicles from API
export const getFavoriteVehicles = async (): Promise<ShowroomVehicle[]> => {
  try {
    console.log('🔖 Fetching favorites from API...');
    const response = await api.get('/showroom/favorites');
    console.log('🔖 Favorites API response:', JSON.stringify(response.data, null, 2));
    
    // Handle response structure
    let favorites = [];
    if (response.data.data && response.data.data.vehicles) {
      favorites = response.data.data.vehicles;
    } else if (response.data.vehicles) {
      favorites = response.data.vehicles;
    } else if (Array.isArray(response.data.data)) {
      favorites = response.data.data;
    } else if (Array.isArray(response.data)) {
      favorites = response.data;
    }
    
    console.log('🔖 Parsed favorites count:', favorites.length);
    console.log('🔖 First favorite raw:', favorites[0]);
    
    // Map to ShowroomVehicle format
    return favorites.map((item: any) => {
      console.log('🔖 Mapping favorite item:', item);
      
      // Get vehicle details - might be nested
      const vehicleData = item.vehicle || item.vehicle_details || item;
      
      const mapped = {
        id: vehicleData.id || item.vehicle_id || item.id,
        year: vehicleData.year || 0,
        make: vehicleData.make || 'Unknown',
        model: vehicleData.model || 'Unknown',
        body_type: vehicleData.body_type,
        state: vehicleData.state,
        images: vehicleData.photos || vehicleData.images || item.photos || item.images || [],
        has_liked: item.has_liked || vehicleData.has_liked || false,
        is_favorited: true, // Always true for favorites
        showroom_likes: item.showroom_likes || vehicleData.showroom_likes || 0,
        comments_count: item.comments_count || vehicleData.comments_count || 0,
        source: item.source || 'user',
        marketplace_listing_id: item.vehicle_id || vehicleData.id
      };
      
      console.log('🔖 Mapped favorite:', mapped);
      return mapped;
    });
  } catch (error) {
    console.error('❌ Error fetching favorite vehicles:', error);
    return [];
  }
};
