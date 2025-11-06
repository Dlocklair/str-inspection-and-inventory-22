import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { usePropertyContext } from '@/contexts/PropertyContext';
import { InventoryItem } from '@/hooks/useInventory';
import { Copy } from 'lucide-react';

interface InventoryPropertyAssignmentProps {
  item: InventoryItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssign: (item: InventoryItem, propertyIds: string[]) => void;
}

export const InventoryPropertyAssignment = ({
  item,
  open,
  onOpenChange,
  onAssign
}: InventoryPropertyAssignmentProps) => {
  const { userProperties } = usePropertyContext();
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);

  // Filter out the current property if the item is already assigned
  const availableProperties = userProperties.filter(p => p.id !== item.property_id);

  const handlePropertyToggle = (propertyId: string) => {
    setSelectedProperties(prev =>
      prev.includes(propertyId)
        ? prev.filter(id => id !== propertyId)
        : [...prev, propertyId]
    );
  };

  const handleAssign = () => {
    if (selectedProperties.length > 0) {
      onAssign(item, selectedProperties);
      setSelectedProperties([]);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Assign to Properties
          </DialogTitle>
          <DialogDescription>
            Select properties to create a copy of "{item.name}" for. Each copy will be independent and can be managed separately.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {availableProperties.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No other properties available. This item is {item.property_id ? 'already assigned to a property' : 'unassigned'}.
            </p>
          ) : (
            availableProperties.map(property => (
              <div key={property.id} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                <Checkbox
                  id={`property-${property.id}`}
                  checked={selectedProperties.includes(property.id)}
                  onCheckedChange={() => handlePropertyToggle(property.id)}
                />
                <Label
                  htmlFor={`property-${property.id}`}
                  className="flex-1 cursor-pointer"
                >
                  <div className="font-medium">{property.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {property.address}, {property.city}
                  </div>
                </Label>
              </div>
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleAssign}
            disabled={selectedProperties.length === 0}
          >
            Create Copies ({selectedProperties.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
