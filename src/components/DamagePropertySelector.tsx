import { Building2 } from 'lucide-react';
import { usePropertyContext } from '@/contexts/PropertyContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
export function DamagePropertySelector() {
  const {
    selectedProperty,
    setSelectedProperty,
    setPropertyMode,
    userProperties,
    isLoading
  } = usePropertyContext();
  if (isLoading) {
    return <Card className="p-4 mb-4">
        <Skeleton className="h-10 w-full" />
      </Card>;
  }
  if (userProperties.length === 0) {
    return <Card className="p-4 mb-4 bg-muted/50">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Building2 className="h-5 w-5" />
          <div>
            <p className="font-medium">No Properties Available</p>
            <p className="text-sm">Please contact your administrator to assign properties.</p>
          </div>
        </div>
      </Card>;
  }
  if (userProperties.length === 1) {
    return <Card className="p-4 mb-4 bg-primary/5 border-primary/20">
        <div className="flex items-center gap-3">
          <Building2 className="h-5 w-5 text-primary" />
          <div className="flex-1">
            <p className="font-semibold text-lg">{selectedProperty?.name}</p>
            <p className="text-sm text-muted-foreground">
              {selectedProperty?.address}, {selectedProperty?.city}, {selectedProperty?.state} {selectedProperty?.zip}
            </p>
          </div>
        </div>
      </Card>;
  }
  return <Card className="p-4 mb-4 bg-primary/10 border-primary/30 shadow-sm">
      <div className="flex items-center gap-3">
        <Building2 className="h-5 w-5 text-primary" />
        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">Current Property</label>
          <Select value={selectedProperty?.id || ''} onValueChange={value => {
          const property = userProperties.find(p => p.id === value);
          if (property) {
            setSelectedProperty(property);
            setPropertyMode('property'); // Always use 'property' mode for damage reports
          }
        }}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a property">
                {selectedProperty && <span className="font-medium">
                    {selectedProperty.name} - {selectedProperty.address}
                  </span>}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {userProperties.map(property => <SelectItem key={property.id} value={property.id}>
                  <div className="flex flex-col">
                    <span className="font-medium">{property.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {property.address}, {property.city}, {property.state} {property.zip}
                    </span>
                  </div>
                </SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
    </Card>;
}