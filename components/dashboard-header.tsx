"use client"; // Jadikan client component karena ada interaksi (logout)

import { useRouter } from "next/navigation";
import { CircleUser } from "lucide-react"; // PERBAIKAN: Hapus ikon yang tidak digunakan
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { SessionPayload } from "@/lib/session"; // Import tipe data

// Terima props 'user'
export function DashboardHeader({ user }: { user: SessionPayload | null }) {
  const router = useRouter();

  const handleLogout = async () => {
    // Panggil API logout
    await fetch('/api/logout', { method: 'POST' });
    // Redirect ke halaman login
    router.push('/login');
    router.refresh(); // Refresh untuk memastikan cookie terhapus
  };

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
      {/* PERBAIKAN: Hapus elemen Sheet dan Search yang kosong untuk saat ini */}
      <div className="w-full flex-1">
        {/* Form pencarian bisa ditambahkan di sini nanti */}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="icon" className="rounded-full">
            <CircleUser className="h-5 w-5" />
            <span className="sr-only">Toggle user menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>
            {/* Tampilkan nama pengguna jika ada */}
            {user ? user.name : "My Account"}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Settings</DropdownMenuItem>
          <DropdownMenuItem>Support</DropdownMenuItem>
          <DropdownMenuSeparator />
          {/* Tambahkan fungsi onClick ke tombol logout */}
          <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
