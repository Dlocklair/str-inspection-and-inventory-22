import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useQueryClient } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { MobileBottomTabs } from "@/components/MobileBottomTabs";
import { MobileProfileMenu } from "@/components/MobileProfileMenu";
import { useIsMobile } from "@/hooks/use-mobile";
import { FirstTimeSetup } from "./components/FirstTimeSetup";
import { ErrorBoundary } from "./components/ErrorBoundary";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Settings from "./pages/Settings";
import InventorySetup from "./pages/InventorySetup";
import { InspectionReport } from "./components/InspectionReport";
import { WarrantyManager } from "./components/WarrantyManager";
import { AssetLibraryManager } from "./components/AssetLibraryManager";
import { InventoryReport } from "./components/InventoryReport";
import { DamageReport } from "./components/DamageReport";
import { PropertyManager } from "./components/PropertyManager";
import AcceptInvitation from "./pages/AcceptInvitation";
import NotFound from "./pages/NotFound";
import Install from "./pages/Install";
import { useMigrateInventory } from "./hooks/useMigrateInventory";
import { DataMigrationWizard } from '@/components/DataMigrationWizard';
import { OneTimeDataMigration } from '@/components/OneTimeDataMigration';
import { SyncStatusIndicator } from '@/components/SyncStatusIndicator';

const LayoutWrapper = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const isMobile = useIsMobile();
  const hideMenuPaths = ['/auth', '/install'];
  const showMenu = !hideMenuPaths.includes(location.pathname);
  
  useMigrateInventory(user, loading);

  useEffect(() => {
    if (!loading && !user && location.pathname !== '/auth') {
      navigate('/auth');
    }
    if (!loading && user && location.pathname === '/auth') {
      navigate('/');
    }
  }, [user, loading, location.pathname, navigate]);

  return (
    <SidebarProvider>
      <FirstTimeSetup />
      <DataMigrationWizard />
      <OneTimeDataMigration />
      <div className="min-h-screen flex w-full">
        {showMenu && !isMobile && <AppSidebar />}
        <main className="flex-1 relative pb-14 md:pb-0">
          {showMenu && (
            <header className="sticky top-0 z-10 h-12 flex items-center justify-between border-b bg-background px-4">
              {!isMobile && <SidebarTrigger />}
              {isMobile ? (
                <div className="flex items-center justify-between w-full">
                  <span className="font-semibold text-sm text-foreground">STR Manager</span>
                  <MobileProfileMenu />
                </div>
              ) : <div />}
            </header>
          )}
          {showMenu && isMobile && <MobileBottomTabs />}
          <Routes>
            <Route path="/" element={<ErrorBoundary fallbackTitle="Dashboard error"><Index /></ErrorBoundary>} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/accept-invitation" element={<AcceptInvitation />} />
            <Route path="/settings" element={<ErrorBoundary fallbackTitle="Settings error"><Settings /></ErrorBoundary>} />
            <Route path="/properties" element={<ErrorBoundary fallbackTitle="Properties error"><PropertyManager /></ErrorBoundary>} />
            <Route path="/inventory-setup" element={<ErrorBoundary fallbackTitle="Inventory setup error"><InventorySetup /></ErrorBoundary>} />
            <Route path="/inspections" element={<ErrorBoundary fallbackTitle="Inspections error"><InspectionReport /></ErrorBoundary>} />
            <Route path="/inventory" element={<ErrorBoundary fallbackTitle="Inventory error"><InventoryReport /></ErrorBoundary>} />
            <Route path="/damage" element={<ErrorBoundary fallbackTitle="Damage reports error"><DamageReport /></ErrorBoundary>} />
            <Route path="/warranties" element={<ErrorBoundary fallbackTitle="Warranties error"><WarrantyManager /></ErrorBoundary>} />
            <Route path="/asset-library" element={<ErrorBoundary fallbackTitle="Asset Library error"><AssetLibraryManager /></ErrorBoundary>} />
            <Route path="/install" element={<Install />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </SidebarProvider>
  );
};

const App = () => (
  <AuthProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <SyncStatusIndicator />
      <BrowserRouter>
        <LayoutWrapper />
      </BrowserRouter>
    </TooltipProvider>
  </AuthProvider>
);

export default App;
