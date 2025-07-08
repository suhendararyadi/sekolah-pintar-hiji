// ==============================================================================
// FILE: middleware.ts (Penjaga Rute Aplikasi)
// ==============================================================================
// TUJUAN: File ini bertindak sebagai penjaga. Ia akan memeriksa setiap request
//         yang masuk ke rute yang kita tentukan (misalnya /dashboard) dan
//         memastikan pengguna sudah login sebelum memberikan akses.

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose'; // Library untuk verifikasi JWT

// Fungsi untuk mendapatkan kunci rahasia dari environment variable
const getJwtSecretKey = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not set in environment variables.');
  }
  return new TextEncoder().encode(secret);
};

export async function middleware(request: NextRequest) {
  // 1. Ambil token dari cookie
  const token = request.cookies.get('authToken')?.value;

  // 2. Jika tidak ada token, arahkan kembali ke halaman login
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 3. Jika ada token, verifikasi keabsahannya
  try {
    await jwtVerify(token, getJwtSecretKey());
    // Jika token valid, lanjutkan ke halaman yang dituju
    return NextResponse.next();
  } catch (error) {
    // Jika token tidak valid (kadaluarsa, salah, dll)
    console.error('JWT Verification Error:', error);
    // Arahkan kembali ke halaman login
    const response = NextResponse.redirect(new URL('/login', request.url));
    // Hapus cookie yang tidak valid
    response.cookies.delete('authToken');
    return response;
  }
}

// Konfigurasi: Tentukan rute mana yang akan dijaga oleh middleware ini
export const config = {
  matcher: '/dashboard/:path*', // Lindungi semua rute di bawah /dashboard
};
