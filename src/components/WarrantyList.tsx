import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ChevronDown, ChevronRight, Plus, Trash2, Paperclip, Search } from 'lucide-react';
import { type Warranty, type WarrantyInsert } from '@/hooks/useWarranties';
import { WarrantyForm } from './WarrantyForm';
import { format, isPast, differenceInDays } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const DURATION_LABELS: Record<string, string> = {
  '90_days': '90 Days',
  '1_year': '1 Year',
  '2_years': '2 Years',
  '3_years': '3 Years',
  '5_years': '5 Years',
  '10_years': '10 Years',
  'custom': 'Custom',
};

interface WarrantyListProps {
  warranties: Warranty[];
  loading: boolean;
  onAdd: (w: WarrantyInsert) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

function getStatusBadge(expirationDate: string) {
  const exp = new Date(expirationDate);
  const today = new Date();
  const daysLeft = differenceInDays(exp, today);

  if (isPast(exp)) {
    return <Badge variant="destructive">Expired</Badge>;
  }
  if (daysLeft <= 30) {
    return <Badge className="bg-warning text-warning-foreground">Expiring Soon</Badge>;
  }
  return <Badge className="bg-success text-success-foreground">Active</Badge>;
}

export function WarrantyList({ warranties, loading, onAdd, onDelete }: WarrantyListProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [addSubFor, setAddSubFor] = useState<{ id: string; name: string; propertyId: string | null } | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('active');
  const [searchQuery, setSearchQuery] = useState('');

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Filter and sort
  const filtered = warranties
    .filter(w => {
      const exp = new Date(w.warranty_expiration_date);
      const isExpired = isPast(exp);
      if (filterStatus === 'active' && isExpired) return false;
      if (filterStatus === 'expired' && !isExpired) return false;
      return true;
    })
    .filter(w => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return w.product_name.toLowerCase().includes(q) ||
        w.vendor?.toLowerCase().includes(q) ||
        w.manufacturer?.toLowerCase().includes(q) ||
        w.property_name?.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      // Active first, then by expiration date
      const aExpired = isPast(new Date(a.warranty_expiration_date));
      const bExpired = isPast(new Date(b.warranty_expiration_date));
      if (aExpired !== bExpired) return aExpired ? 1 : -1;
      return new Date(a.warranty_expiration_date).getTime() - new Date(b.warranty_expiration_date).getTime();
    });

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading warranties...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search warranties..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No warranties found. Add your first warranty above.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="hidden md:table-cell">Property</TableHead>
                    <TableHead className="hidden md:table-cell">Vendor / Manufacturer</TableHead>
                    <TableHead className="hidden sm:table-cell">Purchase Date</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(w => (
                    <WarrantyRow
                      key={w.id}
                      warranty={w}
                      expanded={expandedIds.has(w.id)}
                      onToggle={() => toggleExpand(w.id)}
                      onAddSub={() => setAddSubFor({ id: w.id, name: w.product_name, propertyId: w.property_id })}
                      onDelete={onDelete}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {addSubFor && (
        <WarrantyForm
          onSubmit={onAdd}
          parentWarrantyId={addSubFor.id}
          parentProductName={addSubFor.name}
          initialPropertyId={addSubFor.propertyId}
          onCancel={() => setAddSubFor(null)}
        />
      )}
    </div>
  );
}

function WarrantyRow({ warranty, expanded, onToggle, onAddSub, onDelete }: {
  warranty: Warranty;
  expanded: boolean;
  onToggle: () => void;
  onAddSub: () => void;
  onDelete: (id: string) => Promise<boolean>;
}) {
  const hasSubs = (warranty.sub_warranties?.length || 0) > 0;

  return (
    <>
      <TableRow className="cursor-pointer" onClick={onToggle}>
        <TableCell className="px-2">
          {hasSubs ? (
            expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
          ) : <span className="w-4 inline-block" />}
        </TableCell>
        <TableCell className="font-medium">
          <div className="flex items-center gap-2">
            {warranty.product_name}
            {(warranty.attachment_urls?.length || 0) > 0 && (
              <Paperclip className="h-3 w-3 text-muted-foreground" />
            )}
          </div>
          {warranty.purchased_from && (
            <span className="text-xs text-muted-foreground block">from {warranty.purchased_from}</span>
          )}
        </TableCell>
        <TableCell className="hidden md:table-cell">{warranty.property_name || '—'}</TableCell>
        <TableCell className="hidden md:table-cell">
          <div className="text-sm">
            {warranty.vendor && <div>V: {warranty.vendor}</div>}
            {warranty.manufacturer && <div>M: {warranty.manufacturer}</div>}
          </div>
        </TableCell>
        <TableCell className="hidden sm:table-cell">{format(new Date(warranty.purchase_date), 'MMM d, yyyy')}</TableCell>
        <TableCell>{DURATION_LABELS[warranty.warranty_duration_type] || warranty.warranty_duration_type}</TableCell>
        <TableCell>{format(new Date(warranty.warranty_expiration_date), 'MMM d, yyyy')}</TableCell>
        <TableCell>{getStatusBadge(warranty.warranty_expiration_date)}</TableCell>
        <TableCell>
          <div className="flex gap-1" onClick={e => e.stopPropagation()}>
            <Button variant="ghost" size="icon" onClick={onAddSub} title="Add sub-warranty">
              <Plus className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" title="Delete">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Warranty</AlertDialogTitle>
                  <AlertDialogDescription>
                    Delete "{warranty.product_name}" and all its sub-warranties? This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(warranty.id)}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </TableCell>
      </TableRow>
      {expanded && warranty.sub_warranties?.map(sw => (
        <TableRow key={sw.id} className="bg-muted/30">
          <TableCell></TableCell>
          <TableCell className="pl-8 font-medium">
            <div className="flex items-center gap-2">
              ↳ {sw.product_name}
              {(sw.attachment_urls?.length || 0) > 0 && (
                <Paperclip className="h-3 w-3 text-muted-foreground" />
              )}
            </div>
          </TableCell>
          <TableCell className="hidden md:table-cell">{warranty.property_name || '—'}</TableCell>
          <TableCell className="hidden md:table-cell">
            <div className="text-sm">
              {sw.vendor && <div>V: {sw.vendor}</div>}
              {sw.manufacturer && <div>M: {sw.manufacturer}</div>}
            </div>
          </TableCell>
          <TableCell className="hidden sm:table-cell">{format(new Date(sw.purchase_date), 'MMM d, yyyy')}</TableCell>
          <TableCell>{DURATION_LABELS[sw.warranty_duration_type] || sw.warranty_duration_type}</TableCell>
          <TableCell>{format(new Date(sw.warranty_expiration_date), 'MMM d, yyyy')}</TableCell>
          <TableCell>{getStatusBadge(sw.warranty_expiration_date)}</TableCell>
          <TableCell>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" title="Delete">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Sub-Warranty</AlertDialogTitle>
                  <AlertDialogDescription>
                    Delete "{sw.product_name}"? This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(sw.id)}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}
