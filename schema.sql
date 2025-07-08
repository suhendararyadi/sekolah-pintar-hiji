    -- file: schema.sql
    DROP TABLE IF EXISTS users;
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      -- TAMBAHKAN KOLOM INI
      role TEXT NOT NULL DEFAULT 'siswa' CHECK(role IN ('admin', 'guru', 'siswa')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );