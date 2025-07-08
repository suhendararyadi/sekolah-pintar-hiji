// ==============================================================================
// FILE: app/dashboard/layout.tsx (Wadah Utama Dashboard)
// ==============================================================================
// TUJUAN: File ini menjadi layout utama untuk semua halaman di bawah /dashboard.
//         Ia memanggil sidebar dan header, serta mengambil data pengguna.

import { getCurrentUser } from "@/lib/session";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard-sidebar";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Ambil data pengguna saat ini dari server
  const user = await getCurrentUser();

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <DashboardSidebar />
      <div className="flex flex-col">
        {/* Kirim data pengguna ke header agar bisa ditampilkan */}
        <DashboardHeader user={user} />
        {/* 'children' di sini adalah konten dari page.tsx */}
        {children}
      </div>
    </div>
  );
}
