import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/Dashboard";

export default function App() {
  return (
    <TooltipProvider>
      <Toaster position="top-right" richColors />
      <Dashboard />
    </TooltipProvider>
  );
}
