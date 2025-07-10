// ==============================================================================
// FILE: cloudflare/worker.ts (Versi Lengkap dan Final) - DIPERBARUI
// ==============================================================================
// TUJUAN: Memperbaiki semua peringatan ESLint dengan menggunakan tipe data yang
//         aman ('unknown' pada catch block) dan membersihkan variabel yang
//         tidak terpakai.

import { Hono, type Context, type Next } from 'hono';
import { sign, verify } from 'hono/jwt';
import { setCookie, deleteCookie, getCookie } from 'hono/cookie';
import { cors } from 'hono/cors';

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

// PERBAIKAN: Definisikan tipe data untuk data import siswa
type StudentImportData = {
  name: string;
  email: string;
  password?: string;
  nisn?: string;
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
app.use('*', (c, next) => {
  const corsMiddleware = cors({
    origin: c.env.ALLOWED_ORIGIN || '*',
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['POST', 'GET', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  });
  return corsMiddleware(c, next);
});

// Middleware untuk otentikasi
const authMiddleware = async (c: Context<{ Bindings: Env, Variables: HonoVariables }>, next: Next) => {
  const token = getCookie(c, 'authToken') || c.req.header('Authorization')?.split(' ')[1];
  if (!token) {
    return c.json({ success: false, message: 'Unauthorized' }, 401);
  }
  try {
    const decoded = await verify(token, c.env.JWT_SECRET) as unknown as AppJWTPayload;
    c.set('user', decoded);
    await next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    return c.json({ success: false, message: 'Invalid token' }, 401);
  }
};

// Endpoint untuk Login
app.post('/api/login', async (c) => {
  try {
    const { email, password } = await c.req.json<{ email?: string; password?: string }>();
    if (!email || !password) return c.json({ success: false, message: 'Email dan password harus diisi.' }, 400);
    
    const user = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first<UserFromDB>();
    if (!user) return c.json({ success: false, message: 'Email tidak ditemukan.' }, 401);

    if (password !== user.password_hash) return c.json({ success: false, message: 'Password salah.' }, 401);

    const payload = { sub: user.id, name: user.name, role: user.role, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 };
    const token = await sign(payload, c.env.JWT_SECRET);
    setCookie(c, 'authToken', token, { httpOnly: true, secure: true, sameSite: 'Lax', path: '/', maxAge: 60 * 60 * 24 });
    return c.json({ success: true, message: 'Login berhasil!' });
  } catch (e) {
    console.error("Login Error: ", e);
    return c.json({ success: false, message: 'Terjadi kesalahan server' }, 500);
  }
});

// Endpoint untuk Logout
app.post('/api/logout', async (c) => {
  deleteCookie(c, 'authToken', { path: '/' });
  return c.json({ success: true, message: 'Logout berhasil.' });
});

// Endpoint untuk READ (mendapatkan semua pengguna)
app.get('/api/users', authMiddleware, async (c) => {
  const user = c.get('user');
  if (user.role !== 'admin') return c.json({ success: false, message: 'Forbidden' }, 403);

  try {
    const { results } = await c.env.DB.prepare(`
      SELECT u.id, u.name, u.email, u.role, u.created_at, sp.nisn, c.name as class_name
      FROM users u
      LEFT JOIN student_profiles sp ON u.id = sp.user_id
      LEFT JOIN classes c ON sp.class_id = c.id
    `).all();
    return c.json({ success: true, users: results });
  } catch (e) {
    console.error("Fetch Users Error: ", e);
    return c.json({ success: false, message: 'Gagal mengambil data pengguna' }, 500);
  }
});

// Endpoint untuk CREATE (pengguna non-siswa)
app.post('/api/users', authMiddleware, async (c) => {
    const user = c.get('user');
    if (user.role !== 'admin') return c.json({ success: false, message: 'Forbidden' }, 403);

    try {
        const { name, email, password, role } = await c.req.json();
        if (!name || !email || !password || !role || role === 'siswa') {
            return c.json({ success: false, message: 'Data tidak lengkap atau peran tidak valid untuk endpoint ini' }, 400);
        }
        const password_hash = password;

        await c.env.DB.prepare(
            'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)'
        ).bind(name, email, password_hash, role).run();

        return c.json({ success: true, message: 'Pengguna berhasil dibuat' }, 201);
    } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        if (errorMessage.includes('UNIQUE constraint failed')) {
            return c.json({ success: false, message: 'Email sudah terdaftar' }, 409);
        }
        console.error("Create User Error: ", e);
        return c.json({ success: false, message: 'Terjadi kesalahan server' }, 500);
    }
});

// Endpoint untuk CREATE (Siswa)
app.post('/api/students', authMiddleware, async (c) => {
    const user = c.get('user');
    if (user.role !== 'admin') return c.json({ success: false, message: 'Forbidden' }, 403);

    try {
        const { name, email, password, nisn, address, phone_number, parent_name, class_id } = await c.req.json();
        if (!name || !email || !password) {
            return c.json({ success: false, message: 'Nama, email, dan password wajib diisi.' }, 400);
        }
        
        const password_hash = password;

        const createUserStmt = c.env.DB.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, \'siswa\') RETURNING id');
        const createProfileStmt = c.env.DB.prepare('INSERT INTO student_profiles (user_id, nisn, address, phone_number, parent_name, class_id) VALUES (?, ?, ?, ?, ?, ?)');

        const [userResult] = await c.env.DB.batch([createUserStmt.bind(name, email, password_hash)]);
        
        type InsertResult = { id: number };
        const newUserId = (userResult.results as InsertResult[])?.[0]?.id;
        
        if (!newUserId) {
            throw new Error("Gagal membuat akun pengguna.");
        }

        await createProfileStmt.bind(newUserId, nisn, address, phone_number, parent_name, class_id).run();

        return c.json({ success: true, message: 'Siswa berhasil ditambahkan' }, 201);
    } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        if (errorMessage.includes('UNIQUE constraint failed')) {
            return c.json({ success: false, message: 'Email atau NISN sudah terdaftar' }, 409);
        }
        console.error("Create Student Error: ", e);
        return c.json({ success: false, message: 'Terjadi kesalahan server' }, 500);
    }
});

// Endpoint untuk UPDATE (pengguna)
app.put('/api/users/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  if (user.role !== 'admin') return c.json({ success: false, message: 'Forbidden' }, 403);
  
  const userId = c.req.param('id');
  try {
    const { name, email, role } = await c.req.json();
    if (!name || !email || !role) {
      return c.json({ success: false, message: 'Nama, email, dan peran harus diisi' }, 400);
    }

    await c.env.DB.prepare(
      'UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?'
    ).bind(name, email, role, userId).run();

    return c.json({ success: true, message: 'Pengguna berhasil diperbarui' });
  } catch (e: unknown) {
     const errorMessage = e instanceof Error ? e.message : String(e);
     if (errorMessage.includes('UNIQUE constraint failed')) {
      return c.json({ success: false, message: 'Email sudah digunakan oleh pengguna lain' }, 409);
    }
    console.error("Update User Error: ", e);
    return c.json({ success: false, message: 'Terjadi kesalahan server' }, 500);
  }
});

// Endpoint untuk DELETE (pengguna)
app.delete('/api/users/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  if (user.role !== 'admin') return c.json({ success: false, message: 'Forbidden' }, 403);

  const userId = c.req.param('id');
  if (user.sub === parseInt(userId)) {
    return c.json({ success: false, message: 'Anda tidak bisa menghapus akun Anda sendiri' }, 400);
  }

  try {
    await c.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(userId).run();
    return c.json({ success: true, message: 'Pengguna berhasil dihapus' });
  } catch (e: unknown) {
    console.error("Delete User Error: ", e);
    return c.json({ success: false, message: 'Terjadi kesalahan server' }, 500);
  }
});

// Endpoint untuk import pengguna secara massal (bulk)
app.post('/api/students/bulk', authMiddleware, async (c) => {
  const user = c.get('user');
  if (user.role !== 'admin') return c.json({ success: false, message: 'Forbidden' }, 403);

  try {
    // PERBAIKAN: Gunakan tipe data StudentImportData yang sudah kita definisikan
    const { students } = await c.req.json<{ students: StudentImportData[] }>();
    if (!students || !Array.isArray(students) || students.length === 0) {
      return c.json({ success: false, message: 'Data siswa tidak valid atau kosong.' }, 400);
    }

    const userStmts = students.map(student => {
      const password_hash = student.password || Math.random().toString(36).slice(-8);
      return c.env.DB.prepare(
        'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, \'siswa\')'
      ).bind(student.name, student.email, password_hash);
    });

    await c.env.DB.batch(userStmts);
    
    return c.json({ success: true, message: `${students.length} pengguna berhasil dibuat. Profil akan dibuat di proses berikutnya.` });

  } catch (e: unknown) {
    console.error("Bulk Import Error: ", e);
    return c.json({ success: false, message: 'Terjadi kesalahan server saat import massal.' }, 500);
  }
});

// Endpoint untuk mengambil daftar kelas
app.get('/api/classes', authMiddleware, async (c) => {
  try {
    const { results } = await c.env.DB.prepare("SELECT id, name FROM classes ORDER BY name ASC").all();
    return c.json({ success: true, classes: results });
  } catch (e) {
    console.error("Fetch Classes Error: ", e);
    return c.json({ success: false, message: 'Gagal mengambil data kelas' }, 500);
  }
});


export default app;
