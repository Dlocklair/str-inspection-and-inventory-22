import { Building2, FileText } from 'lucide-react';
import { usePropertyContext } from '@/contexts/PropertyContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
export function PropertySelector() {
  const {
    selectedProperty,
    propertyMode,
    setSelectedProperty,
    setPropertyMode,
    userProperties,
    isLoading
  } = usePropertyContext();
  if (isLoading) {
    return <Card className="p-4 mb-6">
        <Skeleton className="h-10 w-full" />
      </Card>;
  }
  if (userProperties.length === 0) {
    return <Card className="p-4 mb-6 bg-muted/50">
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
    return <Card className="p-4 mb-6 bg-primary/5 border-primary/20">
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
  return <Card className="p-4 mb-4 cyan bg-sky-950">
      <div className="flex items-center gap-3 ">
        <Building2 className="h-5 w-5 text-primary" />
        <div className="flex-1 bg-[#000095]/0">
          <label className="font-medium mb-2 block text-sm text-">Current Property</label>
          <Select value={propertyMode === 'all' ? '__show_all__' : propertyMode === 'unassigned' ? '__unassigned__' : selectedProperty?.id || ''} onValueChange={value => {
          if (value === '__show_all__') {
            setPropertyMode('all');
          } else if (value === '__unassigned__') {
            setPropertyMode('unassigned');
          } else {
            const property = userProperties.find(p => p.id === value);
            if (property) {
              setSelectedProperty(property);
            }
          }
        }}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a property">
                {propertyMode === 'all' && <span className="font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Show All Properties
                  </span>}
                {propertyMode === 'unassigned' && <span className="font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Unassigned Templates
                  </span>}
                {propertyMode === 'property' && selectedProperty && <span className="font-medium">
                    {selectedProperty.name} - {selectedProperty.address}
                  </span>}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__show_all__">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="font-medium">Show All Properties</span>
                </div>
              </SelectItem>
              <SelectItem value="__unassigned__">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="font-medium">Unassigned Templates</span>
                </div>
              </SelectItem>
              <div className="border-t my-1" />
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