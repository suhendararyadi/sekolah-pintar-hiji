'use client';

import { useState } from 'react';
// import { AuthButton } from "@/components/auth-button";
// import { ThemeSwitcher } from "@/components/theme-switcher";
import { AdminSidebar } from "@/components/admin-sidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { PanelLeft } from "lucide-react";
import { cn } from '@/lib/utils';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className={cn(
      "grid min-h-screen w-full transition-all duration-300",
      isCollapsed ? "md:grid-cols-[72px_1fr]" : "md:grid-cols-[280px_1fr]"
    )}>
      {/* Sidebar untuk Desktop */}
      <div className={cn(
          "hidden border-r bg-muted/40 md:block transition-all duration-300",
          isCollapsed ? "w-[72px]" : "w-[280px]"
      )}>
        <AdminSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      </div>
      
      {/* Konten Utama */}
      <div className="flex flex-col">
        {/* Header Konten */}
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          {/* Tombol Menu untuk Mobile */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <PanelLeft className="h-5 w-5" />
                <span className="sr-only">Buka menu navigasi</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0">
              <AdminSidebar isCollapsed={false} setIsCollapsed={() => {}} />
            </SheetContent>
          </Sheet>
          
          <div className="w-full flex-1"></div>
          
          {/* <AuthButton />
          <ThemeSwitcher /> */}
        </header>
        
        {/* Isi Halaman */}
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
