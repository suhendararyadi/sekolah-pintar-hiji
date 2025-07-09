-- Hapus tabel jika sudah ada untuk memastikan skema bersih
DROP TABLE IF EXISTS student_profiles;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS classes;

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
  FOREIGN KEY (class_id) REFERENCES classes(id)
);

-- Masukkan beberapa data contoh untuk kelas
INSERT INTO classes (name, major) VALUES ('Kelas 10-A', 'IPA');
INSERT INTO classes (name, major) VALUES ('Kelas 10-B', 'IPS');
INSERT INTO classes (name, major) VALUES ('Kelas 11-A', 'IPA');

