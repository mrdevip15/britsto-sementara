# CLAUDE.md - Codebase Documentation

This is a tryout-focused educational web application built with Node.js, Express.js, PostgreSQL, and EJS templating. The platform specializes in practice tests and exam simulations.

## Architecture Overview

**Tech Stack:**
- **Backend:** Node.js with Express.js (MVC pattern)
- **Database:** PostgreSQL with Sequelize ORM
- **Frontend:** EJS templating with Bootstrap CSS framework
- **Authentication:** Passport.js with local strategy (email/password)
- **Session Management:** PostgreSQL-backed sessions via connect-pg-simple
- **File Uploads:** Multer middleware

**Key Design Patterns:**
- MVC (Model-View-Controller) architecture
- Dual admin system (main admin + tryout admin)
- Role-based access control
- Database-first approach with Sequelize models

## Project Structure

```
ggweb/
├── app.js                    # Express app configuration
├── server.js                 # Server startup and database sync
├── config/
│   ├── sequelize.js         # Database configuration
│   └── passport.js          # Authentication strategies
├── controllers/             # Business logic handlers
│   ├── adminController.js   # Main admin functionality
│   ├── toAdminController.js # Tryout admin (limited scope)
│   ├── userController.js    # User management
│   └── ...
├── models/                  # Sequelize database models
│   ├── User.js             # User authentication model
│   ├── Soal.js             # Question model
│   ├── Mapel.js            # Subject model
│   ├── associations.js      # Model relationships
│   └── ...
├── routes/                  # Express route definitions
├── views/                   # EJS template files
├── middleware/              # Custom middleware functions
├── seeders/                 # Database seed files
└── public/                  # Static assets
    └── assets/
        ├── css/styles.min.css    # Main stylesheet (purple theme)
        ├── js/                   # JavaScript files
        └── images/               # Image assets
```

## Common Development Commands

```bash
# Start development server
npm start

# Database operations
npm run seed                 # Run all seeders
npx sequelize-cli db:migrate # Run migrations
npx sequelize-cli db:seed:all # Seed database
npx sequelize-cli db:seed:undo:all # Undo all seeds

# Development workflow
git status                  # Check git status
git add .                   # Stage changes
git commit -m "message"     # Commit changes

# Troubleshooting
npm install                 # Install/update dependencies
npx sequelize-cli db:drop   # Drop database (careful!)
npx sequelize-cli db:create # Create database
```

## Database Schema Overview

**Core Models:**
- `User` - Authentication and user profiles
- `Soal` - Questions with categories (TPS, Literasi, TKA Wajib, TKA Pilihan)
- `Mapel` - Subjects organized by categories
- `TryoutSession` - User exam sessions
- `UserAnswers` - Student responses and scoring
- `Class`, `Siswa`, `Tentor`, `Schedule` - Learning management features

**Question Categories (SNBT Structure):**
1. **TPS** - Tes Potensi Skolastik
2. **Literasi** - Literasi dalam Bahasa Indonesia dan Bahasa Inggris
3. **TKA Wajib** - Tes Kemampuan Akademik Wajib
4. **TKA Pilihan** - Tes Kemampuan Akademik Pilihan

## Authentication System

**Dual Admin Architecture:**
1. **Main Admin (`/admin`)** - Full platform access
   - User management, content creation, analytics
   - Email/password authentication
   
2. **Tryout Admin (`/toadmin`)** - Limited to exam features
   - Username: `britsindonesia`, Password: `BritsEdu123`
   - Question management, token generation only
   - Cookie-based authentication (`TOADMIN_SECRET`)

**User Authentication:**
- Local strategy only (Google OAuth removed)
- Email/password with bcrypt hashing
- Session-based with PostgreSQL storage

## Key Features

**Tryout System:**
- Multi-category question management
- Timed exam sessions
- Real-time scoring and analytics
- Performance tracking and statistics
- Token-based access control

**Admin Capabilities:**
- Question bank management (CRUD operations)
- User performance analytics
- Exam session monitoring
- Content categorization and organization

## Environment Configuration

Required `.env` variables:
```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_database
DB_USERNAME=your_username
DB_PASSWORD=your_password

# Production Database (if different)
PROD_DB_HOST=production_host
PROD_DB_PORT=5432
PROD_DB_NAME=prod_database
PROD_DB_USERNAME=prod_username
PROD_DB_PASSWORD=prod_password

# Application Settings
PORT=3972
NODE_ENV=development
SESSION_SECRET=your_session_secret

# Admin Credentials
TOADMIN_SECRET=your_toadmin_secret
```

## Database Setup

1. Install PostgreSQL and create database
2. Configure connection in `.env`
3. Run `npm start` to auto-sync schema
4. Execute seeders for initial data:
   ```bash
   npm run seed
   ```

## Theme and Styling

**Color Scheme (Modern Purple/Blue):**
```css
--bs-primary: #6C5CE7        /* Primary purple */
--bs-secondary: #00D4FF      /* Accent blue */
--gradient-primary: linear-gradient(135deg, #6C5CE7 0%, #00D4FF 100%)
```

**Key Design Elements:**
- Inter + Space Grotesk typography
- Lucide icon system throughout
- Card-based layouts with hover effects
- Gradient backgrounds and modern shadows
- Responsive design with Bootstrap utilities

## Security Considerations

- Bcrypt password hashing
- Session-based authentication
- SQL injection protection via Sequelize
- Rate limiting on sensitive endpoints
- No sensitive data in client-side code
- Environment-based configuration

## Development Patterns

**Controller Pattern:**
```javascript
// Standard controller structure
exports.actionName = async (req, res) => {
  try {
    // Business logic
    const result = await Model.findAll();
    res.render('template', { data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

**Route Protection:**
```javascript
// Admin route protection
router.get('/protected', isAuthenticated, controller.action);

// Tryout admin protection
router.get('/toadmin/*', toAdminAuthMiddleware, controller.action);
```

**Database Relationships:**
- Use Sequelize associations in `models/associations.js`
- Follow naming conventions: `foreignKey`, `through` tables
- Include proper cascade deletions where needed

## Common Issues and Solutions

**Database Connection:**
- Ensure PostgreSQL is running
- Check `.env` configuration
- Verify database exists and credentials are correct

**Authentication Problems:**
- Clear browser cookies and sessions
- Check passport configuration in `config/passport.js`
- Verify middleware order in `app.js`

**Template Rendering Issues:**
- Ensure EJS files exist in correct `views/` subdirectories
- Check variable names passed to templates
- Verify partial includes are correct

## Deployment Notes

- Set `NODE_ENV=production` for production builds
- Use production database credentials
- Enable HTTPS for secure cookies
- Configure proper session store settings
- Set up proper logging and monitoring

## File Structure Details

**Controllers (`/controllers/`):**
- `adminController.js` - Main admin dashboard with analytics and financial metrics
- `toAdminController.js` - Limited tryout admin (questions/tokens only)
- `userController.js` - User dashboard and tryout functionality
- `authController.js` - Login/logout and session management

**Views (`/views/`):**
- `index.ejs` - Landing page (tryout-focused design)
- `dashboard/admin/` - Main admin interface with comprehensive metrics
- `dashboard/toadmin/` - Simple question/token management interface  
- `dashboard/user/` - Student dashboard with practice tests
- `partials/` - Shared components (navbar, footer, head)

**Middleware (`/middleware/`):**
- `authMiddleware.js` - Standard authentication checks
- `toAdminAuthMiddleware.js` - Cookie-based tryout admin auth

**Key Static Files:**
- `public/assets/css/styles.min.css` - Main site theme (modern purple/blue)
- `public/dashboard/css/styles.css` - Dashboard theme with updated color variables
- `public/dashboard/js/scripts.js` - Dashboard JavaScript functionality

## Seeder Structure

**Main Seeder (`seeders/20240101000000-demo-mapel-and-soal.js`):**
- Creates 4 question categories: TPS, Literasi, TKA Wajib, TKA Pilihan
- Defines subjects for each category
- Generates sample questions for testing
- Essential for proper system functionality

## CSS Theme Variables

```css
/* Main Theme Colors */
:root {
  --bs-primary: #6C5CE7;          /* Primary purple */
  --bs-secondary: #00D4FF;         /* Cyan accent */
  --bs-success: #00E676;           /* Green success */
  --bs-danger: #FF5B5B;            /* Red danger */
  --gradient-primary: linear-gradient(135deg, #6C5CE7 0%, #00D4FF 100%);
}

/* Dashboard Theme */
.bg-gradient-primary {
  background: var(--gradient-primary) !important;
}

.btn-modern {
  border-radius: 12px;
  padding: 12px 24px;
  font-weight: 600;
  transition: all 0.3s ease;
}
```

## Authentication Flow

**Main Admin Login:**
1. Email/password via `config/passport.js`
2. Session stored in PostgreSQL
3. Protected by `authMiddleware.js`
4. Access to full dashboard at `/admin`

**Tryout Admin Login:**
1. Username/password: `britsindonesia` / `BritsEdu123`
2. Sets `TOADMIN_SECRET` cookie
3. Protected by `toAdminAuthMiddleware.js`
4. Limited access at `/toadmin`

**User Registration/Login:**
1. Email/password registration
2. Session-based authentication
3. Access to practice tests at `/user/dashboard`

## Recent Major Changes

- **Authentication Overhaul:** Completely removed Google OAuth, streamlined to email/password only
- **Dual Admin System:** Added separate tryout admin with limited question/token management scope
- **Database Expansion:** Added TKA Wajib and TKA Pilihan categories to support full SNBT structure
- **Complete Theme Transformation:** Changed from orange theme to modern purple/blue gradient design
- **Landing Page Redesign:** Focused specifically on tryout/practice test functionality
- **Brand Neutralization:** Removed all brand-specific elements for universal appeal
- **Icon System Modernization:** Standardized on Lucide icons with Feather fallbacks
- **Typography Update:** Implemented Inter + Space Grotesk font pairing

## Development Tips

**Adding New Features:**
1. Create controller in `/controllers/`
2. Add routes in `/routes/`
3. Create views in appropriate `/views/dashboard/` subdirectory
4. Add authentication middleware if needed
5. Update navigation in relevant partials

**Database Changes:**
1. Modify models in `/models/`
2. Update associations in `/models/associations.js`
3. Create migration if schema changes needed
4. Update seeders if initial data changes

**Theme Customization:**
1. Modify CSS variables in `:root` selectors
2. Update both main site and dashboard stylesheets
3. Test across all pages for consistency
4. Consider accessibility and contrast ratios

This documentation should help future Claude Code instances understand the codebase structure, common patterns, and development workflows for this tryout-focused educational platform.