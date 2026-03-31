# 🎓 AcademiaX — Academic Management System

A **production-grade, full-stack Academic Management System** with three role-based portals:
**Student** | **Teacher** | **Admin**

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js, Express.js, MongoDB, Mongoose |
| Auth | JWT (Access + Refresh Tokens), bcryptjs |
| Security | Helmet, CORS, Rate Limiting, Mongo Sanitize |
| Frontend | React 18, React Router v6, TailwindCSS |
| Charts | Chart.js + react-chartjs-2 |
| File Uploads | Multer |
| Logging | Winston, Morgan |
| CSV Export | csv-writer |

---

## 📁 Project Structure

```
academic-system/
├── backend/
│   ├── config/         # MongoDB connection
│   ├── controllers/    # Business logic
│   ├── middlewares/    # Auth, roles, errors, rate limiting, uploads
│   ├── models/         # Mongoose schemas
│   ├── routes/         # API routes
│   ├── utils/          # JWT, logger, CSV export
│   ├── uploads/        # File storage
│   └── server.js
└── frontend/
    └── src/
        ├── components/ # Layout, Sidebar
        ├── context/    # AuthContext (token refresh)
        ├── pages/
        │   ├── student/
        │   ├── teacher/
        │   └── admin/
        └── services/   # Axios API layer
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- npm or yarn

---

### 1. Clone & Setup

```bash
git clone <your-repo>
cd academic-system
```

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your values
mkdir -p logs exports
```

**Configure `.env`:**
```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/academic_management
JWT_ACCESS_SECRET=your_secret_here_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_ACCESS_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d
CLIENT_URL=http://localhost:3000
SUPER_ADMIN_KEY=your_super_admin_key_here
```

```bash
npm run dev   # Development (nodemon)
npm start     # Production
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install
npm start     # Starts on http://localhost:3000
```

---

## 🔑 Authentication Flow

```
Login → POST /api/v1/auth/login → { accessToken (15m), refreshToken (7d) }
  ↓
Request with Bearer token → Protected route
  ↓ (token expires)
Auto-refresh → POST /api/v1/auth/refresh → new token pair
  ↓ (refresh expires)
Force logout → redirect to /login
```

Page refresh **never** logs out the user (refresh token persists in localStorage).

---

## 📡 API Reference

### Auth (`/api/v1/auth`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register/student` | Student registration |
| POST | `/register/teacher` | Teacher registration |
| POST | `/register/admin` | Admin creation (requires SUPER_ADMIN_KEY) |
| POST | `/login` | Universal login (role + identifier + password) |
| POST | `/refresh` | Refresh access token |
| POST | `/logout` | Logout (clears refresh token) |
| GET | `/me` | Get current user |

### Students (`/api/v1/students`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Admin/Teacher | List students (paginated, filtered) |
| GET | `/:id` | Admin/Teacher | Get student by ID |
| PUT | `/:id` | Admin | Update student |
| DELETE | `/:id` | Admin | Deactivate student |
| GET | `/dashboard` | Student | Student dashboard stats |
| PUT | `/profile` | Student | Update own profile |

### Attendance (`/api/v1/attendance`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | Teacher/Admin | Mark attendance |
| GET | `/student/:id?` | All | Student attendance (filtered) |
| GET | `/class` | Teacher/Admin | Class attendance |
| GET | `/stats` | Teacher/Admin | Attendance statistics |
| PUT | `/:id` | Admin | Edit attendance record |
| GET | `/export` | Admin | Download CSV |

### Marks (`/api/v1/marks`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | Teacher/Admin | Upload marks (bulk) |
| GET | `/student/:id?` | All | Student marks |
| GET | `/class` | Teacher/Admin | Class marks |
| PUT | `/:id` | Admin | Edit marks |
| GET | `/export` | Admin | Download CSV |

### Assignments (`/api/v1/assignments`)
| POST | `/` | Teacher | Create assignment |
| GET | `/` | All | List assignments |
| POST | `/:id/submit` | Student | Submit PDF |
| PUT | `/:id/review` | Teacher | Grade submission |
| DELETE | `/:id` | Teacher | Remove assignment |

### And more: `/notices`, `/timetable`, `/feedback`, `/fees`, `/notes`, `/teachers`, `/admin`

---

## 🛡️ Security Features

- ✅ **JWT** with short-lived access tokens (15min) + long-lived refresh tokens (7d)
- ✅ **bcrypt** password hashing (salt rounds: 12)
- ✅ **Rate limiting** — 100 req/15min global, 10 login attempts/15min
- ✅ **Helmet** — security headers
- ✅ **mongo-sanitize** — NoSQL injection prevention
- ✅ **CORS** — configured for specific origin
- ✅ **Role-based access control** — student / teacher / admin
- ✅ **Input validation** via express-validator
- ✅ **Centralized error handling**
- ✅ **Winston logging** with log rotation

---

## 📊 Role Capabilities

### 🎓 Student
- View attendance (subject-wise, lab, daily/weekly/monthly, charts)
- View marks (by exam type, subject; overall grade calculation)
- Submit assignments (PDF only)
- Download notes
- View timetable
- View notices
- Submit anonymous teacher feedback

### 👨‍🏫 Teacher
- Mark daily attendance (today only, not past)
- Upload marks (within admin deadline)
- Create/manage assignments + grade submissions
- Upload study notes
- View notices
- See assigned subjects & class stats

### 🔧 Admin
- Full CRUD on students and teachers
- Approve teacher registrations
- Assign subjects to teachers
- Edit attendance (any date)
- Edit marks
- Upload/manage timetable
- Publish notices (target: all/students/teachers)
- Manage fee records + CSV export
- View anonymous feedback analytics (radar charts)
- Set academic policies (attendance threshold, marks deadline, feedback toggle)
- Dashboard analytics with trend charts

---

## 📂 Database Models

| Model | Key Fields |
|-------|-----------|
| Student | rollNumber, email, branch, year, section, password |
| Teacher | teacherId, email, assignedSubjects[], password |
| Admin | adminId, email, academicPolicies, permissions |
| Attendance | student, subject, date, status, markedBy |
| Marks | student, subject, examType, marksObtained, totalMarks |
| Assignment | title, deadline, submissions[], createdBy |
| Notice | title, targetAudience, type, isPinned |
| Timetable | branch, year, section, schedule{day:[periods]} |
| Feedback | teacher, ratings{...}, studentHash (anonymous) |
| Fee | student, feeType, amount, status, paidAmount |
| Notes | title, subject, fileUrl, uploadedBy |

---

## 🚢 Production Deployment

### Docker Compose

```yaml
version: '3.8'
services:
  mongo:
    image: mongo:7
    volumes:
      - mongo_data:/data/db
    environment:
      MONGO_INITDB_ROOT_USERNAME: root
      MONGO_INITDB_ROOT_PASSWORD: secret

  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      NODE_ENV: production
      MONGO_URI: mongodb://root:secret@mongo:27017/academic_management?authSource=admin
    depends_on:
      - mongo
    volumes:
      - ./backend/uploads:/app/uploads
      - ./backend/logs:/app/logs

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend

volumes:
  mongo_data:
```

### Backend Dockerfile

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]
```

### Frontend Dockerfile

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### Nginx config

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 🌱 Creating First Admin

```bash
# POST /api/v1/auth/register/admin
curl -X POST http://localhost:5000/api/v1/auth/register/admin \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "System",
    "lastName": "Admin",
    "adminId": "ADM001",
    "email": "admin@school.edu",
    "password": "Admin@1234",
    "superAdminKey": "your_super_admin_key"
  }'
```

---

## 📝 Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/db` |
| `JWT_ACCESS_SECRET` | Access token secret (min 32 chars) | `s3cr3t_k3y_...` |
| `JWT_REFRESH_SECRET` | Refresh token secret | `r3fr3sh_s3cr3t_...` |
| `JWT_ACCESS_EXPIRE` | Access token lifetime | `15m` |
| `JWT_REFRESH_EXPIRE` | Refresh token lifetime | `7d` |
| `CLIENT_URL` | Frontend URL for CORS | `https://yourdomain.com` |
| `SUPER_ADMIN_KEY` | Key to create admin accounts | `your_key` |
| `MAX_FILE_SIZE` | Max upload size in bytes | `10485760` (10MB) |
| `RATE_LIMIT_MAX` | Max requests per window | `100` |

---

## 🤝 Contributing

1. Fork the repo
2. Create feature branch: `git checkout -b feature/my-feature`
3. Commit: `git commit -m 'feat: add feature'`
4. Push: `git push origin feature/my-feature`
5. Open a Pull Request

---

© 2025 AcademiaX. MIT License.
