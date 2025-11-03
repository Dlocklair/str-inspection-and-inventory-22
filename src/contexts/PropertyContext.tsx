import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
}

export type PropertyMode = 'property' | 'all' | 'unassigned';

interface PropertyContextType {
  selectedProperty: Property | null;
  propertyMode: PropertyMode;
  setSelectedProperty: (property: Property | null) => void;
  setPropertyMode: (mode: PropertyMode, property?: Property | null) => void;
  userProperties: Property[];
  isLoading: boolean;
  refreshProperties: () => Promise<void>;
}

const PropertyContext = createContext<PropertyContextType | undefined>(undefined);

const STORAGE_KEY = 'selected_property_id';

export function PropertyProvider({ children }: { children: ReactNode }) {
  const [selectedProperty, setSelectedPropertyState] = useState<Property | null>(null);
  const [propertyMode, setPropertyModeState] = useState<PropertyMode>('property');
  const [userProperties, setUserProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('name');

      if (error) throw error;

      setUserProperties(data || []);

      // Auto-select logic
      const storedPropertyId = localStorage.getItem(STORAGE_KEY);
      
      if (data && data.length > 0) {
        if (data.length === 1) {
          // Only one property - auto-select
          setSelectedPropertyState(data[0]);
          localStorage.setItem(STORAGE_KEY, data[0].id);
        } else if (storedPropertyId) {
          // Find stored property
          const storedProperty = data.find(p => p.id === storedPropertyId);
          if (storedProperty) {
            setSelectedPropertyState(storedProperty);
          } else {
            // Stored property no longer accessible, clear it
            localStorage.removeItem(STORAGE_KEY);
          }
        }
      } else {
        // No properties available
        setSelectedPropertyState(null);
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast({
        title: "Error",
        description: "Failed to load properties",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const setSelectedProperty = (property: Property | null) => {
    setSelectedPropertyState(property);
    setPropertyModeState('property');
    if (property) {
      localStorage.setItem(STORAGE_KEY, property.id);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const setPropertyMode = (mode: PropertyMode, property?: Property | null) => {
    setPropertyModeState(mode);
    if (mode === 'property' && property) {
      setSelectedPropertyState(property);
      localStorage.setItem(STORAGE_KEY, property.id);
    } else {
      setSelectedPropertyState(null);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const refreshProperties = async () => {
    setIsLoading(true);
    await fetchProperties();
  };

  return (
    <PropertyContext.Provider
      value={{
        selectedProperty,
        propertyMode,
        setSelectedProperty,
        setPropertyMode,
        userProperties,
        isLoading,
        refreshProperties,
      }}
    >
      {children}
    </PropertyContext.Provider>
  );
}

export function usePropertyContext() {
  const context = useContext(PropertyContext);
  if (context === undefined) {
    throw new Error('usePropertyContext must be used within a PropertyProvider');
  }
  return context;
}
