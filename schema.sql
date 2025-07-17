-- Hapus tabel dalam urutan yang benar untuk menghindari error foreign key
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
    name TEXT NOT NULL UNIQUE, -- Contoh: "Kelas 10-A", "Kelas 11-B"
    major TEXT, -- Jurusan, contoh: "IPA", "IPS", bisa NULL
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

-- ===================================================================
-- TABEL BARU UNTUK FITUR ABSENSI
-- ===================================================================

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
    day_of_week INTEGER NOT NULL, -- 1 untuk Senin, 2 untuk Selasa, dst.
    start_time TEXT NOT NULL, -- Format HH:MM
    end_time TEXT NOT NULL, -- Format HH:MM
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabel untuk catatan kehadiran
CREATE TABLE attendance_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    schedule_id INTEGER NOT NULL,
    attendance_date TEXT NOT NULL, -- Format YYYY-MM-DD
    status TEXT NOT NULL CHECK(status IN ('Hadir', 'Sakit', 'Izin', 'Alfa')),
    notes TEXT,
    recorded_by_teacher_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, schedule_id, attendance_date), -- Mencegah data ganda
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE,
    FOREIGN KEY (recorded_by_teacher_id) REFERENCES users(id) ON DELETE CASCADE
);


-- ===================================================================
-- DATA CONTOH (SEEDING)
-- ===================================================================

-- Masukkan data pengguna contoh
INSERT INTO users (name, email, password_hash, role) VALUES 
('Admin Utama', 'admin@sekolah.id', 'admin123', 'admin'),
('Budi Santoso', 'guru.budi@sekolah.id', 'guru123', 'guru'),
('Siti Aminah', 'guru.siti@sekolah.id', 'guru123', 'guru'),
('Siswa Cerdas', 'siswa.cerdas@sekolah.id', 'siswa123', 'siswa'),
('Ani Pintar', 'siswa.ani@sekolah.id', 'siswa123', 'siswa');

-- Masukkan data kelas contoh
INSERT INTO classes (id, name, major) VALUES (101, 'Kelas 10-A', 'IPA'), (102, 'Kelas 10-B', 'IPS');

-- Masukkan data profil siswa contoh
INSERT INTO student_profiles (user_id, class_id, nisn) VALUES (4, 101, '12345'), (5, 101, '67890');

-- Masukkan data mata pelajaran contoh
INSERT INTO subjects (id, name, code) VALUES (201, 'Matematika Wajib', 'MTK-01'), (202, 'Bahasa Indonesia', 'IND-01');

-- Masukkan data jadwal contoh
-- Guru Budi (ID 2) mengajar Matematika (ID 201) di Kelas 10-A (ID 101) pada hari Senin jam 07:30
INSERT INTO schedules (class_id, subject_id, teacher_id, day_of_week, start_time, end_time) VALUES (101, 201, 2, 1, '07:30', '09:00');
-- Guru Siti (ID 3) mengajar Bahasa Indonesia (ID 202) di Kelas 10-A (ID 101) pada hari Senin jam 09:00
INSERT INTO schedules (class_id, subject_id, teacher_id, day_of_week, start_time, end_time) VALUES (101, 202, 3, 1, '09:00', '10:30');

