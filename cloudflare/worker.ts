// ==============================================================================
// FILE: cloudflare/worker.ts (Backend API dengan D1 & JWT) - DIPERBARUI
// ==============================================================================
// TUJUAN: Menambahkan endpoint /api/logout untuk menghapus cookie otentikasi.

import { Hono } from 'hono';
import { sign } from 'hono/jwt';
import { setCookie, deleteCookie } from 'hono/cookie';

type User = {
  id: number;
  email: string;
  name: string;
  password_hash: string;
  role: string;
};

export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  ALLOWED_ORIGIN: string;
}

const app = new Hono<{ Bindings: Env }>();

// Middleware CORS
app.use('*', async (c, next) => {
  await next();
  const origin = c.env.ALLOWED_ORIGIN || '*';
  c.header('Access-Control-Allow-Origin', origin);
  c.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  c.header('Access-Control-Allow-Credentials', 'true');
});

app.options('*', (c) => {
  return c.body(null, 204);
});

// Endpoint login
app.post('/api/login', async (c) => {
  try {
    const { email, password } = await c.req.json<{ email?: string; password?: string }>();

    if (!email || !password) {
      return c.json({ success: false, message: 'Email dan password harus diisi.' }, 400);
    }

    const stmt = c.env.DB.prepare('SELECT * FROM users WHERE email = ?');
    const user = await stmt.bind(email).first<User>();

    if (!user) {
      return c.json({ success: false, message: 'Email tidak ditemukan.' }, 401);
    }

    const passwordMatch = password === user.password_hash;

    if (!passwordMatch) {
      return c.json({ success: false, message: 'Password salah.' }, 401);
    }

    const payload = {
      sub: user.id,
      name: user.name,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24 jam
    };
    const secret = c.env.JWT_SECRET;
    const token = await sign(payload, secret);

    setCookie(c, 'authToken', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 1 hari
    });

    return c.json({
      success: true,
      message: 'Login berhasil!',
    });

  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'Terjadi kesalahan tidak dikenal.';
    console.error('Login error:', errorMessage);
    return c.json({ success: false, message: 'Terjadi kesalahan pada server.' }, 500);
  }
});

// PERUBAHAN: Tambahkan endpoint logout
app.post('/api/logout', async (c) => {
  // Hapus cookie dengan mengatur maxAge ke 0 atau nilai negatif
  deleteCookie(c, 'authToken', {
    path: '/',
  });
  return c.json({ success: true, message: 'Logout berhasil.' });
});


export default app;
