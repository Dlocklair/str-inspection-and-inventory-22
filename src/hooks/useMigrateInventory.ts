import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { User } from '@supabase/supabase-js';

interface LocalStorageItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  restockLevel: number;
  cost: number;
  supplier?: string;
  notes?: string;
  image_url?: string;
  supplierUrl?: string;
  asin?: string;
  lastUpdated?: string;
  restockRequested?: boolean;
  unit?: string;
  unitsPerPackage?: number;
  costPerPackage?: number;
}

export const useMigrateInventory = (user: User | null, authLoading: boolean) => {
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationComplete, setMigrationComplete] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Don't run migration until auth is loaded
    if (authLoading) {
      return;
    }

    const checkAndMigrate = async () => {
      // Check if migration has already been done
      const migrationFlag = localStorage.getItem('inventory-migrated-to-supabase');
      if (migrationFlag === 'true') {
        setMigrationComplete(true);
        return;
      }

      // Check if there's data in localStorage
      const localData = localStorage.getItem('inventory-items');
      if (!localData) {
        localStorage.setItem('inventory-migrated-to-supabase', 'true');
        setMigrationComplete(true);
        return;
      }

      // Check if user is authenticated
      if (!user) {
        return;
      }

      // Check if Supabase already has data
      const { data: existingItems } = await supabase
        .from('inventory_items')
        .select('id')
        .limit(1);

      if (existingItems && existingItems.length > 0) {
        localStorage.setItem('inventory-migrated-to-supabase', 'true');
        setMigrationComplete(true);
        return;
      }

      // Perform migration
      await migrateData(localData);
    };

    checkAndMigrate();
  }, [user, authLoading]);

  const migrateData = async (localData: string) => {
    setIsMigrating(true);
    
    try {
      const items: LocalStorageItem[] = JSON.parse(localData);
      
      // Get user profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      // Get all categories
      const { data: categories } = await supabase
        .from('inventory_categories')
        .select('*');

      const categoryMap = new Map(categories?.map(c => [c.name.toLowerCase(), c.id]) || []);

      // Get or create "Other" category
      let otherCategoryId = categoryMap.get('other');
      if (!otherCategoryId) {
        const { data: otherCategory } = await supabase
          .from('inventory_categories')
          .insert([{
            name: 'Other',
            description: 'Default category for uncategorized items',
            is_predefined: true,
            created_by: profile.id
          }])
          .select()
          .single();
        
        if (otherCategory) {
          otherCategoryId = otherCategory.id;
          categoryMap.set('other', otherCategoryId);
        }
      }

      // Migrate items
      for (const item of items) {
        let categoryId = categoryMap.get(item.category?.toLowerCase() || '');
        
        // If category doesn't exist, create it
        if (!categoryId && item.category && item.category !== 'Other') {
          const { data: newCategory } = await supabase
            .from('inventory_categories')
            .insert([{
              name: item.category,
              description: null,
              is_predefined: false,
              created_by: profile.id
            }])
            .select()
            .single();
          
          if (newCategory) {
            categoryId = newCategory.id;
            categoryMap.set(item.category.toLowerCase(), categoryId);
          }
        }

        // Use "Other" category if still no category
        if (!categoryId) {
          categoryId = otherCategoryId;
        }

        // Calculate unit_price if we have cost_per_package and units_per_package
        let unitPrice = item.cost || null;
        if (item.costPerPackage && item.unitsPerPackage && item.unitsPerPackage > 0) {
          unitPrice = item.costPerPackage / item.unitsPerPackage;
        }

        await supabase
          .from('inventory_items')
          .insert([{
            name: item.name,
            category_id: categoryId,
            current_quantity: item.currentStock || 0,
            restock_threshold: item.restockLevel || 5,
            reorder_quantity: 10,
            unit_price: unitPrice,
            unit: item.unit || null,
            units_per_package: item.unitsPerPackage || null,
            cost_per_package: item.costPerPackage || null,
            supplier: item.supplier || null,
            description: item.notes || null,
            notes: item.notes || null,
            amazon_image_url: item.image_url || null,
            amazon_link: item.supplierUrl || null,
            asin: item.asin || null,
            reorder_link: item.supplierUrl || null,
            restock_requested: item.restockRequested || false,
            created_by: profile.id
          }]);
      }

      // Mark migration as complete
      localStorage.setItem('inventory-migrated-to-supabase', 'true');
      setMigrationComplete(true);
      
      toast({
        title: "Migration Complete",
        description: `Successfully migrated ${items.length} inventory items to Supabase`,
      });
    } catch (error: any) {
      console.error('Migration error:', error);
      toast({
        title: "Migration Error",
        description: error.message || "Failed to migrate data",
        variant: "destructive",
      });
    } finally {
      setIsMigrating(false);
    }
  };

  return { isMigrating, migrationComplete };
};