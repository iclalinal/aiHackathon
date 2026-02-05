# Road Damage Reporting System - Backend

Node.js/Express backend for the road damage reporting system.

## Features

- **Citizen Reporting**: Submit road damage photos with GPS coordinates
- **AI Analysis**: Automatic damage classification via external AI service
- **Admin Dashboard**: JWT-protected endpoints for municipal administrators
- **SQLite Database**: Lightweight, file-based storage

## Quick Start

### 1. Install Dependencies

```bash
cd backend-node
npm install
```

### 2. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your settings
```

### 3. Initialize Database

```bash
npm run init-db

# With sample data:
npm run init-db -- --with-samples
```

### 4. Start Server

```bash
# Development (with hot reload)
npm run dev

# Production
npm start
```

## API Endpoints

### Public Endpoints (No Authentication)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/reports` | Submit new damage report |
| GET | `/api/reports/:id` | Get report status |
| GET | `/api/reports/:id/status` | Get just status (polling) |
| GET | `/api/reports/map/markers` | Get map markers |
| GET | `/api/health` | Health check |

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Admin login |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/change-password` | Change password |
| POST | `/api/auth/logout` | Logout |

### Admin Endpoints (JWT Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/reports` | List all reports |
| GET | `/api/admin/reports/:id` | Get report details |
| PATCH | `/api/admin/reports/:id/status` | Update status |
| POST | `/api/admin/reports/:id/repair` | Mark as repaired |
| GET | `/api/admin/statistics` | Dashboard stats |
| GET | `/api/admin/map` | Admin map data |

## Usage Examples

### Submit a Damage Report

```bash
curl -X POST http://localhost:3001/api/reports \
  -F "image=@damage_photo.jpg" \
  -F "latitude=52.5200" \
  -F "longitude=13.4050" \
  -F "description=Large pothole on main street"
```

### Admin Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

### Get Reports (Admin)

```bash
curl http://localhost:3001/api/admin/reports \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Mark Report as Repaired

```bash
curl -X POST http://localhost:3001/api/admin/reports/REPORT_ID/repair \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"notes": "Repaired on 2026-02-06"}'
```

## Folder Structure

```
backend-node/
├── src/
│   ├── index.js              # Entry point
│   ├── config/
│   │   └── index.js          # Configuration
│   ├── database/
│   │   ├── db.js             # Database connection
│   │   ├── schema.sql        # Database schema
│   │   └── init.js           # Initialization script
│   ├── middleware/
│   │   ├── auth.js           # JWT authentication
│   │   ├── upload.js         # File upload handling
│   │   ├── validate.js       # Request validation
│   │   └── errorHandler.js   # Error handling
│   ├── routes/
│   │   ├── auth.routes.js    # Auth endpoints
│   │   ├── report.routes.js  # Report endpoints
│   │   └── admin.routes.js   # Admin endpoints
│   └── services/
│       ├── ai.service.js     # AI integration
│       ├── report.service.js # Report logic
│       └── admin.service.js  # Admin logic
├── data/                     # SQLite database
├── uploads/                  # Uploaded images
├── package.json
├── .env.example
└── README.md
```

## Database Schema

### administrators
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| username | TEXT | Unique username |
| password_hash | TEXT | Bcrypt hash |
| full_name | TEXT | Display name |
| email | TEXT | Email address |
| created_at | DATETIME | Creation timestamp |
| last_login | DATETIME | Last login time |

### damage_reports
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | UUID primary key |
| image_path | TEXT | Path to image |
| latitude | REAL | GPS latitude |
| longitude | REAL | GPS longitude |
| status | TEXT | pending/analyzing/analyzed/repaired/rejected |
| damage_type | TEXT | AI-detected type |
| severity | TEXT | low/medium/high |
| estimated_cost | REAL | Repair estimate |
| description | TEXT | Citizen description |
| repaired_by | INTEGER | Admin who repaired |
| repaired_at | DATETIME | Repair timestamp |
| created_at | DATETIME | Report creation |
| analyzed_at | DATETIME | AI analysis time |

## Default Admin Credentials

```
Username: admin
Password: admin123
```

⚠️ **Change these immediately in production!**

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 3001 | Server port |
| NODE_ENV | development | Environment |
| JWT_SECRET | - | JWT signing key |
| JWT_EXPIRES_IN | 24h | Token expiry |
| DATABASE_PATH | ./data/road_damage.db | SQLite path |
| AI_SERVICE_URL | http://localhost:8000/analyze | AI service |
| UPLOAD_DIR | ./uploads | Upload directory |
| MAX_FILE_SIZE | 10485760 | Max upload (10MB) |

## License

MIT
