# Question Categories Documentation

## Updated Question Categories

The tryout system now supports 4 main categories of questions:

### 1. **TPS (Tes Potensi Skolastik)**
**Subtests:**
- Penalaran Umum
- Pengetahuan Kuantitatif  
- Pemahaman Bacaan dan Menulis
- Pengetahuan dan Pemahaman Umum

### 2. **Literasi**
**Subtests:**
- Literasi Bahasa Indonesia
- Literasi Bahasa Inggris
- Penalaran Matematika

### 3. **TKA Wajib (Tes Kemampuan Akademik Wajib)**
**Subtests:**
- Matematika
- Bahasa Indonesia
- Bahasa Inggris
- Sejarah

### 4. **TKA Pilihan (Tes Kemampuan Akademik Pilihan)**
**Subtests:**
- Fisika
- Kimia
- Biologi
- Geografi
- Ekonomi
- Sosiologi

## Token Categories

Tokens can be created for:
- **TPS** - Access to TPS subtests only
- **Literasi** - Access to Literasi subtests only  
- **TKA Wajib** - Access to TKA Wajib subtests only
- **TKA Pilihan** - Access to TKA Pilihan subtests only
- **Campur** - Access to all categories

## Database Changes

### Updated Seeder Data
The seeder now creates sample data for all 4 categories with their respective subtests.

### Form Updates
- Add/Edit Question Package forms now include all 4 categories
- Token creation forms include the new categories
- Both admin and toadmin interfaces updated

### Files Modified
1. `seeders/20240101000000-demo-mapel-and-soal.js` - Updated categories and subjects
2. `views/dashboard/admin/add-paket-soal.ejs` - Updated category dropdown
3. `views/dashboard/admin/edit-paket-soal.ejs` - Updated category dropdown
4. `views/dashboard/admin/add-token.ejs` - Updated token categories
5. `views/dashboard/toadmin/*` - All corresponding toadmin templates

## Usage

### Creating Question Packages
1. Login to admin or toadmin panel
2. Go to "Manajemen Soal" → "Tambah paket soal"
3. Select from the 4 available categories
4. Add appropriate subtest name from the category

### Creating Tokens
1. Go to "Manajemen Token" → "Tambah token"
2. Select category to restrict access or choose "Campur" for all access
3. Set appropriate maxSubtest limit based on category

## Migration Notes

- Existing data with old category names will still work
- Recommended to update existing data to use new category names
- The system is backward compatible with old category names