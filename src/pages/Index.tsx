import { ChecklistSection } from '@/components/ChecklistSection';
import { InventorySection } from '@/components/InventorySection';
import { ClipboardList, Package } from 'lucide-react';
const Index = () => {
  return <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            STR Cleaner Management System
          </h1>
          <p className="text-muted-foreground text-lg">
            Manage cleaning checklists and inventory for your short-term rental properties
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Checklist Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-semibold text-foreground">Checklists</h2>
            </div>
            <ChecklistSection />
          </div>

          {/* Inventory Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Package className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-semibold text-foreground">Inventory Management</h2>
            </div>
            <InventorySection />
          </div>
        </div>
      </div>
    </div>;
};
export default Index;