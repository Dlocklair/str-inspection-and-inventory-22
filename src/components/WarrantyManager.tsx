import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Plus } from 'lucide-react';
import { useWarranties } from '@/hooks/useWarranties';
import { WarrantyForm } from './WarrantyForm';
import { WarrantyList } from './WarrantyList';

export function WarrantyManager() {
  const { warranties, loading, addWarranty, deleteWarranty } = useWarranties();
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center justify-center gap-2">
              <ShieldCheck className="h-8 w-8 text-primary" />
              Warranty Tracker
            </h1>
            <p className="text-muted-foreground">
              Track product warranties, expiration dates, and sub-warranties
            </p>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => setShowForm(!showForm)}>
              <Plus className="h-4 w-4 mr-1" />
              {showForm ? 'Hide Form' : 'Add Warranty'}
            </Button>
          </div>

          {showForm && (
            <WarrantyForm
              onSubmit={async (w) => {
                const ok = await addWarranty(w);
                if (ok) setShowForm(false);
                return ok;
              }}
              onCancel={() => setShowForm(false)}
            />
          )}

          <WarrantyList
            warranties={warranties}
            loading={loading}
            onAdd={addWarranty}
            onDelete={deleteWarranty}
          />
        </div>
      </div>
    </div>
  );
}
