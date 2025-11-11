import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Building2, Plus, Edit, Trash2, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  image_url?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export const PropertyManager = () => {
  const { toast } = useToast();
  const { profile, isOwner, isManager } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    image_url: ''
  });

  useEffect(() => {
    fetchProperties();
  }, [profile]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      
      // Fetch properties - RLS will handle filtering based on user role and assignments
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('name');

      if (error) throw error;
      setProperties(data || []);
    } catch (error: any) {
      console.error('Error fetching properties:', error);
      toast({
        title: 'Error',
        description: 'Failed to load properties',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.address.trim() || !formData.city.trim() || !formData.state.trim() || !formData.zip.trim()) {
      toast({
        title: 'Validation Error',
        description: 'All fields are required',
        variant: 'destructive'
      });
      return;
    }

    try {
      if (editingProperty) {
        // Update existing property
        const { error } = await supabase
          .from('properties')
          .update({
            name: formData.name.trim(),
            address: formData.address.trim(),
            city: formData.city.trim(),
            state: formData.state.trim(),
            zip: formData.zip.trim(),
            image_url: formData.image_url.trim() || null
          })
          .eq('id', editingProperty.id);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Property updated successfully'
        });
      } else {
        // Create new property
        const { error } = await supabase
          .from('properties')
          .insert({
            name: formData.name.trim(),
            address: formData.address.trim(),
            city: formData.city.trim(),
            state: formData.state.trim(),
            zip: formData.zip.trim(),
            image_url: formData.image_url.trim() || null,
            created_by: profile?.user_id
          });

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Property created successfully'
        });
      }

      resetForm();
      fetchProperties();
      setIsAddDialogOpen(false);
    } catch (error: any) {
      console.error('Error saving property:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save property',
        variant: 'destructive'
      });
    }
  };

  const handleEdit = (property: Property) => {
    setEditingProperty(property);
    setFormData({
      name: property.name,
      address: property.address,
      city: property.city,
      state: property.state,
      zip: property.zip,
      image_url: property.image_url || ''
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = async (propertyId: string) => {
    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Property deleted successfully'
      });

      fetchProperties();
    } catch (error: any) {
      console.error('Error deleting property:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete property',
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      image_url: ''
    });
    setEditingProperty(null);
  };

  const filteredProperties = properties.filter(property =>
    property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.zip.includes(searchTerm)
  );

  const canModify = isOwner() || isManager();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-8 w-8" />
            Properties
          </h2>
          <p className="text-muted-foreground mt-1">
            Manage your property locations
          </p>
        </div>
        {canModify && (
          <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
            setIsAddDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Property
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingProperty ? 'Edit Property' : 'Add New Property'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Property Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Downtown Apartment 123"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Street Address *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="e.g., 123 Main Street"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="e.g., San Francisco"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      placeholder="e.g., CA"
                      maxLength={2}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip">ZIP Code *</Label>
                  <Input
                    id="zip"
                    value={formData.zip}
                    onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                    placeholder="e.g., 94102"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image_url">Property Image URL</Label>
                  <Input
                    id="image_url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="e.g., https://example.com/property.jpg"
                  />
                  {formData.image_url && (
                    <div className="mt-2 rounded-md overflow-hidden border">
                      <img 
                        src={formData.image_url} 
                        alt="Property preview" 
                        className="w-full h-32 object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E';
                        }}
                      />
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    {editingProperty ? 'Update Property' : 'Add Property'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => {
                    resetForm();
                    setIsAddDialogOpen(false);
                  }}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search properties..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading properties...</div>
          ) : filteredProperties.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'No properties match your search.' : 'No properties yet. Add your first property to get started.'}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Image</TableHead>
                    <TableHead>Property Name</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>ZIP</TableHead>
                    {canModify && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProperties.map((property) => (
                    <TableRow key={property.id}>
                      <TableCell>
                        {property.image_url ? (
                          <img 
                            src={property.image_url} 
                            alt={property.name}
                            className="w-16 h-16 object-cover rounded"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64"%3E%3Crect fill="%23ddd" width="64" height="64"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-size="10"%3ENo Image%3C/text%3E%3C/svg%3E';
                            }}
                          />
                        ) : (
                          <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                            <Building2 className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{property.name}</TableCell>
                      <TableCell>{property.address}</TableCell>
                      <TableCell>{property.city}</TableCell>
                      <TableCell>{property.state}</TableCell>
                      <TableCell>{property.zip}</TableCell>
                      {canModify && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(property)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {isOwner() && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="outline">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Property</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{property.name}"? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(property.id)}>
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};