import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Layers, Plus } from 'lucide-react';
import { useAssets, type AssetInsert } from '@/hooks/useAssets';
import { useWarranties, type WarrantyInsert } from '@/hooks/useWarranties';
import { AssetLibraryForm } from './AssetLibraryForm';
import { AssetLibraryList } from './AssetLibraryList';
import { supabase } from '@/integrations/supabase/client';

export function AssetLibraryManager() {
  const { assets, loading, addAsset, deleteAsset, refetch } = useAssets();
  const { addWarranty } = useWarranties();
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async (asset: AssetInsert, warranty?: WarrantyInsert): Promise<boolean> => {
    let warrantyId: string | null = null;

    // If warranty info provided, create warranty first
    if (warranty) {
      const { data, error } = await supabase.from('warranties').insert(warranty as any).select('id').single();
      if (error) {
        return false;
      }
      warrantyId = data.id;
    }

    const success = await addAsset({ ...asset, warranty_id: warrantyId });
    if (success) {
      setShowForm(false);
    }
    return success;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center justify-center gap-2">
              <Layers className="h-8 w-8 text-primary" />
              Asset Library
            </h1>
            <p className="text-muted-foreground">
              Material, Finish, & Equipment Register
            </p>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => setShowForm(!showForm)}>
              <Plus className="h-4 w-4 mr-1" />
              {showForm ? 'Hide Form' : 'Add Asset'}
            </Button>
          </div>

          {showForm && (
            <AssetLibraryForm
              onSubmit={handleSubmit}
              onCancel={() => setShowForm(false)}
            />
          )}

          <AssetLibraryList
            assets={assets}
            loading={loading}
            onDelete={deleteAsset}
          />
        </div>
      </div>
    </div>
  );
}
