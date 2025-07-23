// ==============================================================================
// FILE: cloudflare/worker.ts (Versi Lengkap dengan Perbaikan Delete Jadwal)
// ==============================================================================

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

// Definisikan tipe data untuk data import siswa
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
  const userContext = c.get('user');
  if (userContext.role !== 'admin') return c.json({ success: false, message: 'Forbidden' }, 403);
  
  const userId = c.req.param('id');
  try {
    const { name, email, role, nisn, address, phone_number, parent_name, class_id } = await c.req.json();
    if (!name || !email || !role) {
      return c.json({ success: false, message: 'Nama, email, dan peran harus diisi' }, 400);
    }

    const batch = [];

    batch.push(c.env.DB.prepare(
      'UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?'
    ).bind(name, email, role, userId));

    if (role === 'siswa') {
      batch.push(c.env.DB.prepare(
        `INSERT INTO student_profiles (user_id, nisn, address, phone_number, parent_name, class_id)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(user_id) DO UPDATE SET
           nisn=excluded.nisn, address=excluded.address, phone_number=excluded.phone_number,
           parent_name=excluded.parent_name, class_id=excluded.class_id`
      ).bind(userId, nisn, address, phone_number, parent_name, class_id));
    }

    await c.env.DB.batch(batch);
    return c.json({ success: true, message: 'Pengguna berhasil diperbarui' });
  } catch (e: unknown) {
     const errorMessage = e instanceof Error ? e.message : String(e);
     if (errorMessage.includes('UNIQUE constraint failed')) {
      return c.json({ success: false, message: 'Email atau NISN sudah digunakan oleh pengguna lain' }, 409);
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
    const { students } = await c.req.json<{ students: StudentImportData[] }>();
    if (!students || !Array.isArray(students) || students.length === 0) {
      return c.json({ success: false, message: 'Data siswa tidak valid atau kosong.' }, 400);
    }

    for (const student of students) {
        const password_hash = student.password || Math.random().toString(36).slice(-8);
        
        const userResult = await c.env.DB.prepare(
            'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, \'siswa\') RETURNING id'
        ).bind(student.name, student.email, password_hash).first<{id: number}>();

        const newUserId = userResult?.id;

        if (newUserId) {
            await c.env.DB.prepare(
                'INSERT INTO student_profiles (user_id, nisn) VALUES (?, ?)'
            ).bind(newUserId, student.nisn).run();
        }
    }
    
    return c.json({ success: true, message: `${students.length} siswa berhasil diimpor.` });

  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    if (errorMessage.includes('UNIQUE constraint failed')) {
        return c.json({ success: false, message: 'Satu atau lebih email/NISN sudah ada di database.' }, 409);
    }
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


// BARU: Endpoint untuk mendapatkan data pengguna yang sedang login
app.get('/api/me', authMiddleware, async (c) => {
  const user = c.get('user');
  return c.json({ success: true, user });
});

// Endpoint untuk mengambil daftar jadwal pelajaran
// DIPERBARUI: Endpoint ini sekarang "pintar" dan bisa membedakan admin/guru
app.get('/api/schedules', authMiddleware, async (c) => {
  const user = c.get('user');
  
  try {
    let query;
    // Jika admin, ambil semua jadwal. Jika guru, ambil jadwal miliknya saja.
    if (user.role === 'admin') {
      query = c.env.DB.prepare(`
        SELECT s.id, s.day_of_week, s.start_time, s.end_time,
               c.name as class_name, sub.name as subject_name, t.name as teacher_name
        FROM schedules s
        JOIN classes c ON s.class_id = c.id
        JOIN subjects sub ON s.subject_id = sub.id
        JOIN users t ON s.teacher_id = t.id
        ORDER BY s.day_of_week, s.start_time
      `);
    } else if (user.role === 'guru') {
      query = c.env.DB.prepare(`
        SELECT s.id, s.day_of_week, s.start_time, s.end_time,
               c.name as class_name, sub.name as subject_name, t.name as teacher_name
        FROM schedules s
        JOIN classes c ON s.class_id = c.id
        JOIN subjects sub ON s.subject_id = sub.id
        JOIN users t ON s.teacher_id = t.id
        WHERE s.teacher_id = ?
        ORDER BY s.day_of_week, s.start_time
      `).bind(user.sub);
    } else {
      // Jika bukan admin atau guru, kembalikan array kosong
      return c.json({ success: true, schedules: [] });
    }

    const { results } = await query.all();
    return c.json({ success: true, schedules: results });
  } catch (e) {
    console.error("Fetch Schedules Error:", e);
    return c.json({ success: false, message: 'Gagal mengambil data jadwal' }, 500);
  }
});

// Endpoint untuk mengambil daftar guru
app.get('/api/teachers', authMiddleware, async (c) => {
    try {
        const { results } = await c.env.DB.prepare("SELECT id, name FROM users WHERE role = 'guru' ORDER BY name ASC").all();
        return c.json({ success: true, teachers: results });
    } catch (e) {
        console.error("Fetch Teachers Error:", e);
        return c.json({ success: false, message: 'Gagal mengambil data guru' }, 500);
    }
});

// Endpoint untuk mengambil daftar mata pelajaran
app.get('/api/subjects', authMiddleware, async (c) => {
    try {
        const { results } = await c.env.DB.prepare("SELECT id, name FROM subjects ORDER BY name ASC").all();
        return c.json({ success: true, subjects: results });
    } catch (e) {
        console.error("Fetch Subjects Error:", e);
        return c.json({ success: false, message: 'Gagal mengambil data mata pelajaran' }, 500);
    }
});

// Endpoint untuk membuat jadwal baru
app.post('/api/schedules', authMiddleware, async (c) => {
  const user = c.get('user');
  if (user.role !== 'admin') return c.json({ success: false, message: 'Forbidden' }, 403);
  
  try {
    const { class_id, subject_id, teacher_id, day_of_week, start_time, end_time } = await c.req.json();
    await c.env.DB.prepare(
      'INSERT INTO schedules (class_id, subject_id, teacher_id, day_of_week, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(class_id, subject_id, teacher_id, day_of_week, start_time, end_time).run();
    return c.json({ success: true, message: 'Jadwal berhasil dibuat' }, 201);
  } catch (e) {
    console.error("Create Schedule Error:", e);
    return c.json({ success: false, message: 'Gagal membuat jadwal' }, 500);
  }
});

// ===================================================================
// PERBAIKAN DI SINI
// ===================================================================
// DELETE: Menghapus jadwal
app.delete('/api/schedules/:id', authMiddleware, async (c) => {
    const user = c.get('user');
    if (user.role !== 'admin') return c.json({ success: false, message: 'Forbidden' }, 403);

    const scheduleId = c.req.param('id');
    try {
        // PERBAIKAN: Kita hanya perlu menghapus jadwalnya.
        // Aturan 'ON DELETE CASCADE' di database akan secara otomatis
        // menghapus semua catatan kehadiran yang terkait.
        await c.env.DB.prepare('DELETE FROM schedules WHERE id = ?').bind(scheduleId).run();
        return c.json({ success: true, message: 'Jadwal berhasil dihapus' });
    } catch (e) {
        console.error("Delete Schedule Error:", e);
        return c.json({ success: false, message: 'Gagal menghapus jadwal' }, 500);
    }
});


// ===================================================================
// PERUBAHAN TOTAL PADA FITUR ABSENSI
// ===================================================================

// Endpoint untuk mengambil siswa dan status kehadiran mereka berdasarkan kelas dan tanggal
app.get('/api/attendance/class/:classId', authMiddleware, async (c) => {
  const classId = c.req.param('classId');
  const date = c.req.query('date'); // Format YYYY-MM-DD

  if (!date) {
    return c.json({ success: false, message: 'Parameter tanggal wajib diisi.' }, 400);
  }

  try {
    const { results } = await c.env.DB.prepare(`
      SELECT
        u.id,
        u.name,
        ar.status
      FROM users u
      JOIN student_profiles sp ON u.id = sp.user_id
      LEFT JOIN attendance_records ar ON u.id = ar.student_id
                                     AND ar.attendance_date = ?
      WHERE sp.class_id = ? AND u.role = 'siswa'
      ORDER BY u.name ASC
    `).bind(date, classId).all();

    return c.json({ success: true, students: results });
  } catch (e) {
    console.error("Fetch Students for Attendance Error:", e);
    return c.json({ success: false, message: 'Gagal mengambil data siswa' }, 500);
  }
});

// Endpoint untuk menyimpan catatan absensi harian
app.post('/api/attendance/records', authMiddleware, async (c) => {
  const user = c.get('user');
  if (user.role !== 'admin') return c.json({ success: false, message: 'Forbidden' }, 403);

  const { class_id, date, records } = await c.req.json<{ class_id: number, date: string, records: { student_id: number, status: string }[] }>();

  if (!class_id || !date || !records || records.length === 0) {
    return c.json({ success: false, message: 'Data tidak lengkap' }, 400);
  }

  try {
    const stmts = records.map(record => {
      return c.env.DB.prepare(`
        INSERT INTO attendance_records (student_id, class_id, attendance_date, status, recorded_by_admin_id)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(student_id, attendance_date) DO UPDATE SET
          status=excluded.status
      `).bind(record.student_id, class_id, date, record.status, user.sub);
    });

    await c.env.DB.batch(stmts);
    return c.json({ success: true, message: 'Absensi berhasil disimpan' });
  } catch (e) {
    console.error("Save Attendance Error:", e);
    return c.json({ success: false, message: 'Gagal menyimpan absensi' }, 500);
  }
});


// ===================================================================
// PERUBAHAN BARU: Endpoint untuk Laporan Absensi
// ===================================================================

app.get('/api/attendance/summary', authMiddleware, async (c) => {
  const user = c.get('user');
  if (user.role !== 'admin' && user.role !== 'guru') {
    return c.json({ success: false, message: 'Forbidden' }, 403);
  }

  const classId = c.req.query('class_id');
  const month = c.req.query('month'); // Format: 1-12
  const year = c.req.query('year');   // Format: YYYY

  if (!classId || !month || !year) {
    return c.json({ success: false, message: 'Parameter class_id, month, dan year wajib diisi.' }, 400);
  }

  // Hitung tanggal awal dan akhir bulan
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = new Date(parseInt(year), parseInt(month), 0).getDate();
  const lastDate = `${year}-${String(month).padStart(2, '0')}-${endDate}`;

  try {
    // 1. Ambil semua siswa di kelas tersebut
    const studentsResponse = await c.env.DB.prepare(
      `SELECT id, name FROM users WHERE id IN (SELECT user_id FROM student_profiles WHERE class_id = ?)`
    ).bind(classId).all<{id: number, name: string}>();
    
    if (!studentsResponse.results || studentsResponse.results.length === 0) {
        return c.json({ success: true, summary: [] });
    }

    // 2. Ambil semua catatan kehadiran untuk kelas tersebut di bulan yang dipilih
    const attendanceResponse = await c.env.DB.prepare(
      `SELECT student_id, attendance_date, status
       FROM attendance_records
       WHERE student_id IN (SELECT user_id FROM student_profiles WHERE class_id = ?)
       AND attendance_date BETWEEN ? AND ?`
    ).bind(classId, startDate, lastDate).all<{student_id: number, attendance_date: string, status: string}>();

    // 3. Olah data di server untuk memudahkan frontend
    const attendanceMap = new Map<number, Map<string, string>>();
    (attendanceResponse.results || []).forEach(record => {
        if (!attendanceMap.has(record.student_id)) {
            attendanceMap.set(record.student_id, new Map());
        }
        attendanceMap.get(record.student_id)?.set(record.attendance_date, record.status);
    });

    const summary = studentsResponse.results.map(student => {
        const records = attendanceMap.get(student.id) || new Map();
        return {
            student_id: student.id,
            student_name: student.name,
            records: Object.fromEntries(records.entries()) // Ubah Map menjadi objek { 'YYYY-MM-DD': 'Status' }
        };
    });

    return c.json({ success: true, summary });

  } catch (e) {
    console.error("Fetch Attendance Summary Error:", e);
    return c.json({ success: false, message: 'Gagal mengambil laporan absensi' }, 500);
  }
});


export default app;
