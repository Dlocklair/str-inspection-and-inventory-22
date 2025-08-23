import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, X, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LocationManagerProps {
  locations: string[];
  selectedLocation: string;
  onLocationSelect: (location: string) => void;
  onLocationsUpdate: (locations: string[]) => void;
}

const LocationManager: React.FC<LocationManagerProps> = ({
  locations,
  selectedLocation,
  onLocationSelect,
  onLocationsUpdate
}) => {
  const { toast } = useToast();
  const [newLocation, setNewLocation] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const addLocation = () => {
    if (!newLocation.trim()) {
      toast({
        title: "Location required",
        description: "Please enter a location name.",
        variant: "destructive"
      });
      return;
    }

    if (locations.includes(newLocation.trim())) {
      toast({
        title: "Location exists",
        description: "This location already exists.",
        variant: "destructive"
      });
      return;
    }

    const updatedLocations = [...locations, newLocation.trim()];
    onLocationsUpdate(updatedLocations);
    onLocationSelect(newLocation.trim());
    setNewLocation('');
    setShowAddForm(false);
    
    toast({
      title: "Location added",
      description: `${newLocation.trim()} has been added to locations.`
    });
  };

  const removeLocation = (locationToRemove: string) => {
    const updatedLocations = locations.filter(loc => loc !== locationToRemove);
    onLocationsUpdate(updatedLocations);
    
    // If the removed location was selected, clear the selection
    if (selectedLocation === locationToRemove) {
      onLocationSelect('');
    }
    
    toast({
      title: "Location removed",
      description: `${locationToRemove} has been removed from locations.`
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">Location</label>
        <div className="flex gap-2">
          <Select value={selectedLocation} onValueChange={onLocationSelect}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              {locations.map(location => (
                <SelectItem key={location} value={location}>
                  {location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>
      </div>

      {showAddForm && (
        <div className="border rounded-lg p-4 bg-muted/30">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Add New Location
          </h4>
          <div className="flex gap-2">
            <Input
              placeholder="Enter location name"
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') addLocation();
                if (e.key === 'Escape') setShowAddForm(false);
              }}
              className="flex-1"
            />
            <Button onClick={addLocation} className="bg-success hover:bg-success/90 text-success-foreground">
              Add
            </Button>
            <Button variant="ghost" onClick={() => setShowAddForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {locations.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2">Current Locations</h4>
          <div className="flex flex-wrap gap-2">
            {locations.map(location => (
              <Badge key={location} variant="outline" className="flex items-center gap-2">
                {location}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeLocation(location)}
                  className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationManager;