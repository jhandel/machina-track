import { Navigation } from '@/components/common/Navigation';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppLogo } from '@/components/common/AppLogo';
import { Toaster } from '@/components/ui/toaster';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider defaultOpen={true}>
      <Navigation />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 lg:h-[60px] lg:px-6 md:hidden">
          {/* Mobile Header Content */}
          <SidebarTrigger className="md:hidden" />
          <AppLogo showText={true} className="md:hidden" />
        </header>
        <main className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 overflow-auto">
          {children}
        </main>
        <Toaster />
      </SidebarInset>
    </SidebarProvider>
  );
}
