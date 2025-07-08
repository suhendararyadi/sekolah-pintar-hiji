// ==============================================================================
// FILE: lib/session.ts (Utilitas Sesi Pengguna) - DIPERBAIKI
// ==============================================================================
// TUJUAN: File ini berisi fungsi untuk membaca dan memverifikasi token JWT
//         dari cookie di sisi server (dalam Server Components atau middleware).

import 'server-only'; // Memastikan file ini hanya berjalan di server
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

// Definisikan tipe data untuk payload di dalam JWT
export interface SessionPayload {
  sub: number; // User ID
  name: string;
  role: string;
  exp: number;
}

// Fungsi untuk mendapatkan kunci rahasia dari environment variable
const getJwtSecretKey = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not set in environment variables.');
  }
  return new TextEncoder().encode(secret);
};

// Fungsi utama untuk mendapatkan sesi pengguna saat ini
export async function getCurrentUser(): Promise<SessionPayload | null> {
  // PERBAIKAN: Menambahkan 'await' seperti yang disarankan oleh pesan error.
  // Ini akan "menunggu" fungsi cookies() selesai dan memberikan kita
  // objek cookie yang sebenarnya, sehingga kita bisa memanggil .get().
  const cookieStore = await cookies();
  const token = cookieStore.get('authToken')?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey());
    
    // Lakukan validasi tipe data sebelum mengembalikan payload.
    // Ini adalah cara yang aman untuk memastikan data dari token sesuai
    // dengan yang kita harapkan.
    if (
      typeof payload.sub === 'number' &&
      typeof payload.name === 'string' &&
      typeof payload.role === 'string' &&
      typeof payload.exp === 'number'
    ) {
      return {
        sub: payload.sub,
        name: payload.name,
        role: payload.role,
        exp: payload.exp,
      };
    }
    
    // Jika payload tidak memiliki properti yang kita butuhkan, kembalikan null.
    return null;
  } catch (error) {
    console.error('Failed to verify session token:', error);
    return null;
  }
}
