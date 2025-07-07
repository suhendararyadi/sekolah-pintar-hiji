// ==============================================================================
// FILE: cloudflare/worker.ts (Backend API dengan D1 & JWT) - DIPERBAIKI
// ==============================================================================
// TUJUAN: Meng-upgrade backend kita untuk berkomunikasi dengan D1 Database
//         dan menghasilkan JSON Web Token (JWT) yang aman saat login berhasil.

import { Hono } from 'hono';
import { sign } from 'hono/jwt';

// Tipe data ini sekarang akan dikenali setelah menginstall @cloudflare/workers-types
// dan mengupdate tsconfig.json.

// Mendefinisikan tipe data untuk tabel 'users' kita
type User = {
	id: number;
	email: string;
	name: string;
	password_hash: string;
	role: string;
};

// Env sekarang akan otomatis mengenali D1Database dari @cloudflare/workers-types
export interface Env {
	DB: D1Database;
	JWT_SECRET: string; // Secret untuk menandatangani JWT
}

const app = new Hono<{ Bindings: Env }>();

// Middleware untuk menangani CORS
app.use('*', async (c, next) => {
	await next();
	// Menambahkan header CORS ke setiap response yang keluar
	c.header('Access-Control-Allow-Origin', '*'); // Di produksi, ganti dengan URL Next.js Anda
	c.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
	c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
});

// Handler untuk pre-flight request (OPTIONS) dari browser
app.options('*', (c) => {
	// PERBAIKAN: Menggunakan c.body(null, 204) untuk mengirim response 'No Content'
	// yang sesuai dengan standar CORS pre-flight.
	return c.body(null, 204);
});


// Endpoint untuk login
app.post('/api/login', async (c) => {
	try {
		const { email, password } = await c.req.json<{ email?: string; password?: string }>();

		if (!email || !password) {
			return c.json({ success: false, message: 'Email dan password harus diisi.' }, 400);
		}

		// --- LOGIKA AUTENTIKASI DENGAN D1 ---
		const stmt = c.env.DB.prepare('SELECT * FROM users WHERE email = ?');
		const user = await stmt.bind(email).first<User>();

		if (!user) {
			return c.json({ success: false, message: 'Email tidak ditemukan.' }, 401);
		}

		// --- PERBANDINGAN PASSWORD ---
		// PENTING: Di aplikasi nyata, JANGAN bandingkan password secara langsung.
		// Gunakan library seperti bcrypt untuk membandingkan hash.
		const passwordMatch = password === user.password_hash;

		if (!passwordMatch) {
			return c.json({ success: false, message: 'Password salah.' }, 401);
		}

		// --- PEMBUATAN JWT ---
		const payload = {
			sub: user.id, // Subject (user id)
			name: user.name,
			role: user.role,
			exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // Token berlaku 24 jam
		};
		const secret = c.env.JWT_SECRET;
		const token = await sign(payload, secret);

		return c.json({
			success: true,
			message: 'Login berhasil!',
			token: token,
		});

	} catch (e: unknown) { // PERBAIKAN: Menggunakan 'unknown' bukan 'any'
		// Lakukan pengecekan tipe untuk penanganan error yang aman
		const errorMessage = e instanceof Error ? e.message : 'Terjadi kesalahan tidak dikenal.';
		console.error('Login error:', errorMessage);
		return c.json({ success: false, message: 'Terjadi kesalahan pada server.' }, 500);
	}
});

export default app;
