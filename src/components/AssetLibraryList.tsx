import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, Trash2, Search, ShieldCheck } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import type { Asset } from '@/hooks/useAssets';

interface AssetLibraryListProps {
  assets: Asset[];
  loading: boolean;
  onDelete: (id: string) => Promise<boolean>;
}

export function AssetLibraryList({ assets, loading, onDelete }: AssetLibraryListProps) {
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2 text-muted-foreground">Loading assets...</span>
      </div>
    );
  }

  const filtered = assets.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.category?.toLowerCase().includes(search.toLowerCase()) ||
    a.brand?.toLowerCase().includes(search.toLowerCase()) ||
    a.property_name?.toLowerCase().includes(search.toLowerCase())
  );

  const conditionColor = (c: string | null) => {
    switch (c) {
      case 'new': return 'default';
      case 'good': return 'secondary';
      case 'fair': return 'outline';
      case 'poor': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search assets..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {assets.length === 0 ? 'No assets yet. Add your first asset above.' : 'No assets match your search.'}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map(asset => (
            <Card key={asset.id} className="py-0">
              <CardContent className="py-3 px-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium text-sm">{asset.name}</h3>
                      {asset.category && <Badge variant="outline" className="text-xs">{asset.category}</Badge>}
                      <Badge variant={conditionColor(asset.condition) as any} className="text-xs capitalize">{asset.condition}</Badge>
                      {asset.warranty_id && (
                        <Badge variant="secondary" className="text-xs">
                          <ShieldCheck className="h-3 w-3 mr-0.5" />
                          Warranty
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground">
                      {asset.brand && <span>Brand: {asset.brand}</span>}
                      {asset.model_number && <span>Model: {asset.model_number}</span>}
                      {asset.color_finish && <span>Finish: {asset.color_finish}</span>}
                      {asset.supplier && <span>Supplier: {asset.supplier}</span>}
                      {asset.cost != null && <span>Cost: ${asset.cost.toFixed(2)}</span>}
                      {asset.property_name && <span>Property: {asset.property_name}</span>}
                      {asset.location_in_property && <span>Location: {asset.location_in_property}</span>}
                      {asset.serial_number && <span>S/N: {asset.serial_number}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {asset.photo_urls?.[0] && (
                      <img src={asset.photo_urls[0]} alt="" className="h-10 w-10 object-cover rounded border" />
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8 inline-btn" onClick={() => setDeleteId(asset.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Asset?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={async () => { if (deleteId) { await onDelete(deleteId); setDeleteId(null); } }}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
