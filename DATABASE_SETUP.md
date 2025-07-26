# Database Setup Guide for BritsEdu

This guide will help you set up a new PostgreSQL database for the BritsEdu application.

## Prerequisites

- PostgreSQL 12+ installed on your system
- Node.js 16+ installed
- npm or yarn package manager

## 1. PostgreSQL Installation

### Ubuntu/Debian:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

### macOS (using Homebrew):
```bash
brew install postgresql
brew services start postgresql
```

### Windows:
Download and install from [PostgreSQL official website](https://www.postgresql.org/download/windows/)

## 2. Database Creation

1. **Connect to PostgreSQL as superuser:**
```bash
sudo -u postgres psql
```

2. **Create a new database:**
```sql
CREATE DATABASE BritsEdu_development;
CREATE DATABASE BritsEdu_test;
CREATE DATABASE BritsEdu_production;
```

3. **Create a new user (optional but recommended):**
```sql
CREATE USER BritsEdu_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE BritsEdu_development TO BritsEdu_user;
GRANT ALL PRIVILEGES ON DATABASE BritsEdu_test TO BritsEdu_user;
GRANT ALL PRIVILEGES ON DATABASE BritsEdu_production TO BritsEdu_user;
```

4. **Exit PostgreSQL:**
```sql
\q
```

## 3. Environment Configuration

Create a `.env` file in the project root with the following variables:

```bash
# Development Database
DB_NAME=BritsEdu_development
DB_USERNAME=BritsEdu_user
DB_PASSWORD=your_secure_password
DB_HOST=localhost
DB_PORT=5432

# Test Database  
TEST_DB_NAME=BritsEdu_test
TEST_DB_USERNAME=BritsEdu_user
TEST_DB_PASSWORD=your_secure_password
TEST_DB_HOST=localhost
TEST_DB_PORT=5432

# Production Database
PROD_DB_NAME=BritsEdu_production
PROD_DB_USERNAME=BritsEdu_user
PROD_DB_PASSWORD=your_secure_password
PROD_DB_HOST=localhost
PROD_DB_PORT=5432

# Session Configuration
SESSION_SECRET=your_very_long_and_secure_session_secret_here

# Application Environment
NODE_ENV=development
```

## 4. Update Configuration Files

### 4.1 Update `config/config.json`:
```json
{
  "development": {
    "username": "BritsEdu_user",
    "password": "your_secure_password",
    "database": "BritsEdu_development",
    "host": "localhost",
    "dialect": "postgres",
    "port": "5432"
  },
  "test": {
    "username": "BritsEdu_user",
    "password": "your_secure_password",
    "database": "BritsEdu_test",
    "host": "localhost",
    "dialect": "postgres",
    "port": "5432"
  },
  "production": {
    "username": "BritsEdu_user",
    "password": "your_secure_password",
    "database": "BritsEdu_production",
    "host": "localhost",
    "dialect": "postgres",
    "port": "5432"
  }
}
```

## 5. Database Schema Setup

The application uses Sequelize ORM with the following models:

### Core Models:
- **User**: Student user accounts with authentication
- **Mapel**: Subject/course information
- **ContentSoal**: Question content for exams
- **Token**: Access tokens for exam participation
- **Tentor**: Teacher/tutor information
- **Siswa**: Student profile information
- **Schedule**: Class scheduling
- **Class**: Class/group management
- **Session**: User session management

### Database Tables Structure:

#### 1. Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nama_ortu VARCHAR(255),
    no_hp_ortu VARCHAR(255),
    nama VARCHAR(255),
    asal_sekolah VARCHAR(255),
    paket VARCHAR(255),
    jenjang VARCHAR(255),
    program VARCHAR(255),
    phone VARCHAR(255),
    tokens TEXT[],
    answers JSONB,
    exam_taken JSONB,
    exam_completed JSONB,
    disqualified_exams TEXT[],
    active_session_id VARCHAR(255),
    is_member BOOLEAN DEFAULT false,
    created_at TIMESTAMP
);
```

#### 2. Mapel (Subjects) Table
```sql
CREATE TABLE mapels (
    id SERIAL PRIMARY KEY,
    order_num INTEGER,
    kategori VARCHAR(255),
    mapel VARCHAR(255),
    owner VARCHAR(255),
    kodekategori VARCHAR(255) UNIQUE,
    jenis_waktu VARCHAR(255),
    tanggal_mulai DATE,
    tanggal_berakhir DATE,
    prasyarat VARCHAR(255),
    durasi INTEGER
);
```

#### 3. ContentSoal (Questions) Table
```sql
CREATE TABLE content_soals (
    id SERIAL PRIMARY KEY,
    mapel_id INTEGER REFERENCES mapels(id),
    no INTEGER,
    content TEXT,
    a TEXT,
    b TEXT,
    c TEXT,
    d TEXT,
    e TEXT,
    answer VARCHAR(255),
    score_a INTEGER,
    score_b INTEGER,
    score_c INTEGER,
    score_d INTEGER,
    score_e INTEGER,
    tipe_soal VARCHAR(255),
    materi VARCHAR(255)
);
```

#### 4. Tokens Table
```sql
CREATE TABLE tokens (
    id SERIAL PRIMARY KEY,
    token VARCHAR(255) UNIQUE,
    nama VARCHAR(255),
    kuota INTEGER,
    max_subtest INTEGER,
    user_registered TEXT[],
    kode_kategori TEXT[]
);
```

## 6. Database Initialization

### 6.1 Install Dependencies:
```bash
npm install
```

### 6.2 Initialize Database with Sample Data:

**Option A: Using the seed script (recommended for development):**
```bash
node seed.js
```

**Option B: Using Sequelize seeders:**
```bash
npx sequelize-cli db:seed:all
```

This will create all necessary tables and populate them with sample data including:
- Sample exam categories (TPS, Literasi, TKA Wajib, TKA Pilihan)
- Sample questions for each category
- Sample tokens for testing

## 7. Running Migrations (if needed)

If there are future database schema changes:

```bash
npx sequelize-cli db:migrate
```

## 8. Database Verification

To verify your database setup:

1. **Connect to your database:**
```bash
psql -U BritsEdu_user -d BritsEdu_development
```

2. **Check if tables were created:**
```sql
\dt
```

3. **Verify sample data:**
```sql
SELECT * FROM mapels LIMIT 5;
SELECT * FROM content_soals LIMIT 5;
SELECT * FROM tokens LIMIT 5;
```

## 9. Admin Account Setup

To create an admin account for the system:

1. **Create admin user in database:**
```sql
INSERT INTO users (email, password, nama, created_at, is_member) 
VALUES ('admin@BritsEdu.com', '$2b$10$hashed_password_here', 'Admin User', NOW(), true);
```

2. **Or use the application registration form** and then manually update the user to admin status.

## 10. Troubleshooting

### Common Issues:

1. **Connection refused:**
   - Check if PostgreSQL service is running: `sudo systemctl status postgresql`
   - Verify port number (default: 5432)

2. **Authentication failed:**
   - Check username/password in `.env` file
   - Verify user permissions in PostgreSQL

3. **Database does not exist:**
   - Ensure database was created with correct name
   - Check database name in configuration files

4. **Permission denied:**
   - Grant proper privileges to the database user
   - Check PostgreSQL pg_hba.conf for authentication settings

### Reset Database:
If you need to start fresh:
```sql
DROP DATABASE BritsEdu_development;
CREATE DATABASE BritsEdu_development;
GRANT ALL PRIVILEGES ON DATABASE BritsEdu_development TO BritsEdu_user;
```

Then run the seed script again:
```bash
node seed.js
```

## 11. Production Considerations

For production deployment:

1. **Use strong passwords** for database users
2. **Enable SSL** connections to PostgreSQL
3. **Set up regular backups**:
   ```bash
   pg_dump -U BritsEdu_user BritsEdu_production > backup.sql
   ```
4. **Configure proper firewall rules**
5. **Use environment variables** for sensitive data
6. **Enable logging** for monitoring

## 12. Backup and Restore

### Create Backup:
```bash
pg_dump -U BritsEdu_user -h localhost BritsEdu_development > BritsEdu_backup.sql
```

### Restore from Backup:
```bash
psql -U BritsEdu_user -h localhost BritsEdu_development < BritsEdu_backup.sql
```

---

**Note**: Replace `BritsEdu_user` and `your_secure_password` with your actual database credentials. Keep your credentials secure and never commit them to version control.