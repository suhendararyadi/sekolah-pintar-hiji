-- Hapus tabel dalam urutan yang benar untuk menghindari error foreign key
DROP TABLE IF EXISTS student_grades;
DROP TABLE IF EXISTS grade_components;
DROP TABLE IF EXISTS attendance_records;
DROP TABLE IF EXISTS schedules;
DROP TABLE IF EXISTS subjects;
DROP TABLE IF EXISTS student_profiles;
DROP TABLE IF EXISTS classes;
DROP TABLE IF EXISTS users;

-- Tabel untuk data login dan peran pengguna
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'siswa' CHECK(role IN ('admin', 'guru', 'siswa')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel untuk daftar kelas
CREATE TABLE classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    major TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel untuk biodata lengkap siswa
CREATE TABLE student_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  class_id INTEGER,
  nisn TEXT UNIQUE,
  address TEXT,
  phone_number TEXT,
  parent_name TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL
);

-- Tabel untuk daftar mata pelajaran
CREATE TABLE subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel untuk jadwal pelajaran
CREATE TABLE schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_id INTEGER NOT NULL,
    subject_id INTEGER NOT NULL,
    teacher_id INTEGER NOT NULL,
    day_of_week INTEGER NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ===================================================================
-- PERUBAHAN DI SINI: Tabel Absensi Disederhanakan
-- ===================================================================
CREATE TABLE attendance_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    class_id INTEGER NOT NULL,
    attendance_date TEXT NOT NULL, -- Format YYYY-MM-DD
    status TEXT NOT NULL CHECK(status IN ('Hadir', 'Sakit', 'Izin', 'Alfa')),
    notes TEXT,
    recorded_by_admin_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, attendance_date), -- Setiap siswa hanya punya 1 record per hari
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (recorded_by_admin_id) REFERENCES users(id) ON DELETE CASCADE
);


-- ===================================================================
-- DATA CONTOH (SEEDING)
-- ===================================================================
-- (Data contoh lainnya tetap sama)
INSERT INTO users (name, email, password_hash, role) VALUES 
('Admin Utama', 'admin@sekolah.id', 'admin123', 'admin'),
('Budi Santoso', 'guru.budi@sekolah.id', 'guru123', 'guru'),
('Siswa Cerdas', 'siswa.cerdas@sekolah.id', 'siswa123', 'siswa');
INSERT INTO classes (id, name, major) VALUES (101, 'Kelas 10-A', 'IPA');
INSERT INTO student_profiles (user_id, class_id, nisn) VALUES (3, 101, '12345');
INSERT INTO subjects (id, name, code) VALUES (201, 'Matematika Wajib', 'MTK-01');
INSERT INTO schedules (id, class_id, subject_id, teacher_id, day_of_week, start_time, end_time) VALUES (1, 101, 201, 2, 1, '07:30', '09:00');
