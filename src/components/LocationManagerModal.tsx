import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LocationManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  locations: string[];
  onUpdateLocations: (locations: string[]) => void;
}

export const LocationManagerModal: React.FC<LocationManagerModalProps> = ({
  isOpen,
  onClose,
  locations,
  onUpdateLocations
}) => {
  const [newLocation, setNewLocation] = useState('');
  const { toast } = useToast();

  const addLocation = () => {
    if (newLocation.trim() && !locations.includes(newLocation.trim())) {
      const updatedLocations = [...locations, newLocation.trim()];
      onUpdateLocations(updatedLocations);
      setNewLocation('');
      toast({
        title: "Location added",
        description: `"${newLocation.trim()}" has been added to the location list.`,
      });
    } else if (locations.includes(newLocation.trim())) {
      toast({
        title: "Location already exists",
        description: "This location is already in the list.",
        variant: "destructive"
      });
    }
  };

  const removeLocation = (locationToRemove: string) => {
    const updatedLocations = locations.filter(loc => loc !== locationToRemove);
    onUpdateLocations(updatedLocations);
    toast({
      title: "Location removed",
      description: `"${locationToRemove}" has been removed from the location list.`,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addLocation();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Manage Locations</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Add new location */}
          <div className="flex gap-2">
            <Input
              placeholder="Enter new location name"
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <Button onClick={addLocation} disabled={!newLocation.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>

          {/* Current locations */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Current Locations:</h4>
            <div className="flex flex-wrap gap-2">
              {locations.map((location) => (
                <Badge key={location} variant="secondary" className="flex items-center gap-1">
                  {location}
                  <button
                    onClick={() => removeLocation(location)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {locations.length === 0 && (
                <p className="text-sm text-muted-foreground">No locations added yet.</p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};