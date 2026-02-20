import { InventorySection } from './InventorySection';

export const InventoryReport = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-2">
          <div className="text-center">
            <h1 className="font-bold text-foreground mb-1 text-3xl">
              Inventory Management
            </h1>
            <p className="text-muted-foreground mb-4">
              Manage inventory levels, restock requests, and supplier communications
            </p>
          </div>
          <InventorySection />
        </div>
      </div>
    </div>
  );
};
