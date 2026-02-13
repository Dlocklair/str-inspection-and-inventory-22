import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { FirstTimeSetup } from "./components/FirstTimeSetup";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Settings from "./pages/Settings";
import InventorySetup from "./pages/InventorySetup";
import { InspectionReport } from "./components/InspectionReport";
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

const queryClient = new QueryClient();

const LayoutWrapper = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const hideMenuPaths = ['/auth', '/install'];
  const showMenu = !hideMenuPaths.includes(location.pathname);
  
  // Run inventory migration on app load (after auth is ready)
  useMigrateInventory(user, loading);

  // Redirect to auth if not logged in (except on auth page)
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
        {showMenu && <AppSidebar />}
        <main className="flex-1 relative">
          {showMenu && (
            <header className="sticky top-0 z-10 h-12 flex items-center border-b bg-background px-4">
              <SidebarTrigger />
            </header>
          )}
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/accept-invitation" element={<AcceptInvitation />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/properties" element={<PropertyManager />} />
            <Route path="/inventory-setup" element={<InventorySetup />} />
            <Route path="/inspections" element={<InspectionReport />} />
            <Route path="/inventory" element={<InventoryReport />} />
            <Route path="/damage" element={<DamageReport />} />
            <Route path="/install" element={<Install />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </SidebarProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
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
  </QueryClientProvider>
);

export default App;
