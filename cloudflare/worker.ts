// ==============================================================================
// FILE: cloudflare/worker.ts (Backend API dengan D1 & JWT) - DIPERBARUI
// ==============================================================================
// TUJUAN: Memperbaiki semua error TypeScript dan ESLint dengan membersihkan
//         kode dan mendefinisikan tipe data yang benar untuk Hono.

import { Hono, type Context, type Next } from 'hono';
import { sign, verify } from 'hono/jwt';
import { setCookie, deleteCookie, getCookie } from 'hono/cookie';

// Definisikan tipe data untuk payload JWT kita
interface AppJWTPayload {
  sub: number; // User ID
  name: string;
  role: string;
  exp: number; // Expiration time
}

// Definisikan tipe data untuk objek pengguna yang datang dari database
type UserFromDB = {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: 'admin' | 'guru' | 'siswa';
  created_at: string;
};

// Definisikan tipe data untuk Environment Bindings
export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  ALLOWED_ORIGIN: string;
}

// Definisikan tipe data untuk variabel di dalam context Hono
type HonoVariables = {
  user: AppJWTPayload;
}

const app = new Hono<{ Bindings: Env, Variables: HonoVariables }>();

// Middleware CORS
app.use('*', async (c, next) => {
  const origin = c.env.ALLOWED_ORIGIN || '*';
  c.header('Access-Control-Allow-Origin', origin);
  c.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  c.header('Access-Control-Allow-Credentials', 'true');
  await next();
});

app.options('*', (c) => c.body(null, 204));

// Middleware untuk otentikasi
const authMiddleware = async (c: Context<{ Bindings: Env, Variables: HonoVariables }>, next: Next) => {
  const token = getCookie(c, 'authToken') || c.req.header('Authorization')?.split(' ')[1];
  if (!token) {
    return c.json({ success: false, message: 'Unauthorized' }, 401);
  }
  try {
    // PERBAIKAN 1: Lakukan konversi tipe melalui 'unknown' terlebih dahulu.
    // Ini memberitahu TypeScript bahwa kita yakin dengan bentuk data yang kita harapkan.
    const decoded = await verify(token, c.env.JWT_SECRET) as unknown as AppJWTPayload;
    c.set('user', decoded);
    await next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    return c.json({ success: false, message: 'Invalid token' }, 401);
  }
};

// Endpoint login
app.post('/api/login', async (c) => {
  const { email, password } = await c.req.json<{ email?: string; password?: string }>();
  if (!email || !password) return c.json({ success: false, message: 'Email dan password harus diisi.' }, 400);
  
  const user = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first<UserFromDB>();
  if (!user) return c.json({ success: false, message: 'Email tidak ditemukan.' }, 401);

  if (password !== user.password_hash) return c.json({ success: false, message: 'Password salah.' }, 401);

  // PERBAIKAN 2: Hapus anotasi tipe ': AppJWTPayload' dari konstanta payload.
  // Objek yang kita buat sudah sesuai, tetapi tipe kustom kita tidak memiliki
  // 'index signature' yang diharapkan oleh fungsi 'sign'.
  const payload = { sub: user.id, name: user.name, role: user.role, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 };
  const token = await sign(payload, c.env.JWT_SECRET);
  setCookie(c, 'authToken', token, { httpOnly: true, secure: true, sameSite: 'Lax', path: '/', maxAge: 60 * 60 * 24 });
  return c.json({ success: true, message: 'Login berhasil!' });
});

// Endpoint logout
app.post('/api/logout', async (c) => {
  deleteCookie(c, 'authToken', { path: '/' });
  return c.json({ success: true, message: 'Logout berhasil.' });
});

// Endpoint untuk mendapatkan semua pengguna (dilindungi middleware)
app.get('/api/users', authMiddleware, async (c) => {
  const user = c.get('user');

  if (user.role !== 'admin') {
    return c.json({ success: false, message: 'Forbidden' }, 403);
  }

  try {
    const { results } = await c.env.DB.prepare("SELECT id, name, email, role, created_at FROM users").all<UserFromDB>();
    return c.json({ success: true, users: results });
  } catch (err) {
    console.error("Fetch users error:", err);
    return c.json({ success: false, message: 'Failed to fetch users' }, 500);
  }
});

export default app;
