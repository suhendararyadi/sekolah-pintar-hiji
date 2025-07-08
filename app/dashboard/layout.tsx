// ==============================================================================
// FILE: app/dashboard/layout.tsx (Wadah Utama Dashboard) - DIPERBARUI
// ==============================================================================
// TUJUAN: Mengirimkan informasi 'user' ke dalam komponen DashboardSidebar
//         agar sidebar bisa menampilkan menu berdasarkan peran.

import { getCurrentUser } from "@/lib/session";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard-sidebar";

// PERBAIKAN: Tambahkan baris ini untuk memberitahu Next.js agar menjalankan
// rute ini di Edge Runtime, yang wajib untuk Cloudflare Pages.
export const runtime = 'edge';

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      {/* Kirim prop 'user' ke DashboardSidebar */}
      <DashboardSidebar user={user} />
      <div className="flex flex-col">
        <DashboardHeader user={user} />
        {/* 'children' di sini adalah konten dari page.tsx */}
        {children}
      </div>
    </div>
  );
}
