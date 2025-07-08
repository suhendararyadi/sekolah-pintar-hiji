// ==============================================================================
// FILE: app/dashboard/users/page.tsx (Halaman Manajemen Pengguna) - DIPERBARUI
// ==============================================================================
// TUJUAN: Memperbaiki error TypeScript dengan menambahkan 'await' pada cookies()
//         dan mendefinisikan tipe data untuk respons API.

import { cookies } from "next/headers";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";

// Definisikan tipe data untuk pengguna
type User = {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'guru' | 'siswa';
  created_at: string;
};

// PERBAIKAN: Definisikan tipe untuk respons API
type GetUsersApiResponse = {
  success: boolean;
  users?: User[];
  message?: string;
}

// Fungsi untuk mengambil data pengguna dari API Worker kita
async function getUsers(): Promise<User[]> {
  // PERBAIKAN 1: Tambahkan 'await' saat memanggil cookies()
  const cookieStore = await cookies();
  const authToken = cookieStore.get('authToken')?.value;
  
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.CLOUDFLARE_WORKER_URL;

  if (!apiUrl) {
    console.error("API URL is not configured.");
    return [];
  }

  const response = await fetch(`${apiUrl}/api/users`, {
    headers: {
      'Authorization': `Bearer ${authToken}`,
    },
    // Menambahkan cache: 'no-store' untuk memastikan data selalu baru
    cache: 'no-store',
  });

  if (!response.ok) {
    console.error("Failed to fetch users:", response.statusText);
    return [];
  }

  // PERBAIKAN 2: Beri tahu TypeScript bentuk data yang kita harapkan
  const data: GetUsersApiResponse = await response.json();
  
  // Kembalikan data.users jika ada, jika tidak kembalikan array kosong
  return data.users || [];
}

export default async function UserManagementPage() {
  const user = await getCurrentUser();
  if (user?.role !== 'admin') {
    redirect('/dashboard');
  }

  const users = await getUsers();

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Manajemen Pengguna</CardTitle>
          <CardDescription>
            Daftar semua pengguna yang terdaftar di sistem.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Peran</TableHead>
                <TableHead>Tanggal Bergabung</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length > 0 ? (
                users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                        {u.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(u.created_at).toLocaleDateString("id-ID", {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    Tidak ada data pengguna.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
