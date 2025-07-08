'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { School, LayoutDashboard, Users, ChevronLeft, FileText } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";

// Definisikan item-item navigasi utama
const mainNavItems = [
    { href: "/dashboard/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/admin/user-management", label: "Manajemen Pengguna", icon: Users },
];

// Definisikan item-item navigasi sekunder (contoh untuk Laporan)
const secondaryNavItems = [
    { href: "#", label: "Rekapan", icon: FileText },
];

// Definisikan props yang diterima oleh komponen
interface AdminSidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (isCollapsed: boolean) => void;
}

export function AdminSidebar({ isCollapsed, setIsCollapsed }: AdminSidebarProps) {
    const pathname = usePathname();

    return (
      <TooltipProvider delayDuration={0}>
        <div className="flex h-full max-h-screen flex-col">
            {/* Header Sidebar */}
            <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                <Link href="/dashboard/admin" className="flex items-center gap-3 font-semibold">
                    <School className="h-6 w-6 text-primary" />
                    <span className={cn(
                        "transition-all duration-300 whitespace-nowrap",
                        isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                    )}>
                        Admin SPMB
                    </span>
                </Link>
            </div>
            
            {/* Konten Navigasi */}
            <div className="flex-1 overflow-auto py-2">
                {/* Navigasi Utama */}
                <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
                    {mainNavItems.map((item) => 
                      isCollapsed ? (
                        <Tooltip key={item.label}>
                          <TooltipTrigger asChild>
                            <Link
                              href={item.href}
                              className={cn(
                                "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-primary md:h-8 md:w-8",
                                pathname.startsWith(item.href) && "bg-muted text-primary"
                              )}
                            >
                              <item.icon className="h-5 w-5" />
                              <span className="sr-only">{item.label}</span>
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent side="right">{item.label}</TooltipContent>
                        </Tooltip>
                      ) : (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                                pathname.startsWith(item.href) && "bg-muted text-primary"
                            )}
                        >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                        </Link>
                      )
                    )}
                </nav>

                <Separator className="my-4" />

                {/* Navigasi Sekunder (Laporan) */}
                <div className="px-2 lg:px-4">
                  {!isCollapsed && <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">Laporan</h2>}
                  <nav className="grid items-start text-sm font-medium">
                      {secondaryNavItems.map((item) => 
                        isCollapsed ? (
                          <Tooltip key={item.label}>
                            <TooltipTrigger asChild>
                              <Link
                                href={item.href}
                                className={cn(
                                  "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-primary md:h-8 md:w-8",
                                  pathname.startsWith(item.href) && "bg-muted text-primary"
                                )}
                              >
                                <item.icon className="h-5 w-5" />
                                <span className="sr-only">{item.label}</span>
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent side="right">{item.label}</TooltipContent>
                          </Tooltip>
                        ) : (
                          <Link
                              key={item.label}
                              href={item.href}
                              className={cn(
                                  "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                                  pathname.startsWith(item.href) && "bg-muted text-primary"
                              )}
                          >
                              <item.icon className="h-4 w-4" />
                              {item.label}
                          </Link>
                        )
                      )}
                  </nav>
                </div>
            </div>

            {/* Footer Sidebar dengan Tombol Toggle */}
            <div className="mt-auto border-t p-2 lg:p-4">
              <Button variant="ghost" size="icon" className="w-full justify-center" onClick={() => setIsCollapsed(!isCollapsed)}>
                <ChevronLeft className={cn("h-5 w-5 transition-transform duration-300", isCollapsed && "rotate-180")} />
                <span className="sr-only">Toggle Sidebar</span>
              </Button>
            </div>
        </div>
      </TooltipProvider>
    );
}
