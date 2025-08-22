import { InventorySection } from './InventorySection';

export const InventoryReport = () => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Inventory Reports
        </h1>
        <p className="text-muted-foreground">
          Manage inventory levels, restock requests, and supplier communications
        </p>
      </div>
      <InventorySection />
    </div>
  );
};