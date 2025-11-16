import { useState, useEffect } from 'react';
import api from '../services/api';

export interface Vehicle {
  id: string;
  user_id: string;
  rego: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  body_type?: string;
  color?: string;
  odometer?: number;
  image?: string;
  purchase_date?: string;
  purchase_price?: number;
  dealer_id?: string;
  created_at: string;
}

export const useVehicles = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVehicles = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/vehicles');
      console.log('Vehicles API response:', response.data);
      
      // Handle different response structures from live backend
      const vehiclesData = response.data?.data?.vehicles || response.data?.vehicles || response.data || [];
      console.log('Parsed vehicles:', vehiclesData);
      
      setVehicles(vehiclesData);
    } catch (err: any) {
      console.error('Error fetching vehicles:', err);
      setError(err.response?.data?.detail || 'Failed to fetch vehicles');
    } finally {
      setLoading(false);
    }
  };

  const addVehicle = async (vehicleData: any) => {
    try {
      const response = await api.post('/vehicles', vehicleData);
      await fetchVehicles();
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.detail || 'Failed to add vehicle');
    }
  };

  const deleteVehicle = async (vehicleId: string) => {
    try {
      await api.delete(`/vehicles/${vehicleId}`);
      await fetchVehicles();
    } catch (err: any) {
      throw new Error(err.response?.data?.detail || 'Failed to delete vehicle');
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  return { vehicles, loading, error, fetchVehicles, addVehicle, deleteVehicle };
};