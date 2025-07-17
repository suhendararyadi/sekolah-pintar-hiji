"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  LineChart,
  Package2,
  BookOpen,
  CalendarDays,
  Users,
  ListTodo,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { SessionPayload } from "@/lib/session";

// Definisikan semua item navigasi dalam sebuah array
const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home, roles: ["admin", "guru", "siswa"] },
  
  // PERUBAHAN: Jadwal sekarang bisa diakses oleh admin dan guru
  { href: "/dashboard/schedules", label: "Jadwal", icon: CalendarDays, roles: ["admin", "guru"] },
  
  { href: "/dashboard/users", label: "Manajemen Pengguna", icon: Users, roles: ["admin"] },
  { href: "/dashboard/attendance", label: "Absensi", icon: LineChart, roles: ["guru"] },
  { href: "#", label: "Tugas", icon: ListTodo, roles: ["guru", "siswa"] },
  { href: "#", label: "Nilai", icon: BookOpen, roles: ["guru", "siswa"] },
];

export function DashboardSidebar({ user }: { user: SessionPayload | null }) {
  const pathname = usePathname();

  const accessibleNavItems = navItems.filter(item => 
    user?.role && item.roles.includes(user.role)
  );

  return (
    <div className="hidden border-r bg-muted/40 md:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <Package2 className="h-6 w-6" />
            <span className="">Sekolah Pintar</span>
          </Link>
        </div>
        <div className="flex-1">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            {accessibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href + item.label}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                    isActive && "bg-muted text-primary"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="mt-auto p-4">
          <Card>
            <CardHeader className="p-2 pt-0 md:p-4">
              <CardTitle>Bantuan & Dukungan</CardTitle>
              <CardDescription>
                Butuh bantuan? Hubungi tim support kami.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-2 pt-0 md:p-4 md:pt-0">
              <Button size="sm" className="w-full">
                Hubungi Support
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
