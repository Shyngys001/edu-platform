# EduPlatform — Python Learning Education Platform

Full-stack education platform with Student Panel + Teacher Panel for learning Python text programming.

## Tech Stack

- **Backend**: Python FastAPI + SQLAlchemy + SQLite
- **Auth**: JWT + bcrypt password hashing
- **Frontend**: React 19 + Vite
- **Charts**: Recharts
- **Code Editor**: Monaco Editor
- **PDF Export**: ReportLab

---

## Folder Structure

```
edu-platform/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── config.py          # Settings (SECRET_KEY, DB URL)
│   │   ├── database.py        # SQLAlchemy engine + session
│   │   ├── main.py            # FastAPI app entry point
│   │   ├── models/
│   │   │   └── models.py      # All SQLAlchemy models
│   │   ├── schemas/
│   │   │   └── schemas.py     # Pydantic request/response schemas
│   │   ├── routers/
│   │   │   ├── auth.py        # /api/auth/* endpoints
│   │   │   ├── student.py     # /api/student/* endpoints
│   │   │   └── teacher.py     # /api/teacher/* endpoints
│   │   └── utils/
│   │       ├── auth.py        # JWT + password utilities
│   │       ├── badges.py      # Badge award logic
│   │       └── ai_helper.py   # Rule-based AI chatbot
│   ├── seed.py                # Database seed script
│   ├── requirements.txt
│   └── edu_platform.db        # SQLite database (auto-created)
│
└── frontend/
    ├── src/
    │   ├── main.jsx
    │   ├── App.jsx             # React Router setup
    │   ├── index.css           # Global styles
    │   ├── utils/
    │   │   └── api.js          # API client + auth helpers
    │   ├── components/
    │   │   ├── Layout.jsx      # App layout with sidebar
    │   │   ├── Sidebar.jsx     # Navigation sidebar
    │   │   └── MarkdownRenderer.jsx
    │   └── pages/
    │       ├── auth/
    │       │   ├── Login.jsx
    │       │   └── Register.jsx
    │       ├── student/
    │       │   ├── Dashboard.jsx
    │       │   ├── Lessons.jsx
    │       │   ├── LessonView.jsx
    │       │   ├── Tests.jsx
    │       │   ├── TestTake.jsx
    │       │   ├── CodeTasks.jsx
    │       │   ├── CodeEditor.jsx
    │       │   ├── Leaderboard.jsx
    │       │   ├── Chat.jsx
    │       │   ├── Statistics.jsx
    │       │   └── Inbox.jsx
    │       └── teacher/
    │           ├── Dashboard.jsx
    │           ├── Students.jsx
    │           ├── LessonsCMS.jsx
    │           ├── TestsCMS.jsx
    │           ├── CodeTasksCMS.jsx
    │           ├── Analytics.jsx
    │           ├── Feedback.jsx
    │           └── Export.jsx
    ├── package.json
    └── vite.config.js
```

---

## Deploy to Render.com

1. **Push project to GitHub** (если ещё не сделано):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/edu-platform.git
   git push -u origin main
   ```

2. **Создать Blueprint в Render**:
   - Зайти на [render.com](https://render.com) и войти
   - Dashboard → **New** → **Blueprint**
   - Подключить GitHub-репозиторий и выбрать `render.yaml`
   - В **Environment** для `edu-platform-api` добавить `OPENAI_API_KEY` (если нужен AI чат)
   - Нажать **Apply**

3. **После деплоя**:
   - Backend: `https://edu-platform-api.onrender.com`
   - Frontend: `https://edu-platform-web.onrender.com`
   - База данных PostgreSQL создаётся автоматически, таблицы — при первом запуске API

4. **Seed данных** (опционально): после деплоя можно зайти в Backend shell и выполнить:
   ```bash
   python seed.py
   ```
   Или добавить seed в `startCommand` для первоначальной загрузки.

---

## Setup Instructions

### 1. Backend

```bash
cd edu-platform/backend

# Create virtual environment (recommended)
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Seed the database
python seed.py

# Start the server
uvicorn app.main:app --reload --port 8000
```

Backend runs at: **http://localhost:8000**

### 2. Frontend

```bash
cd edu-platform/frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend runs at: **http://localhost:5173**

---

## Login Credentials (Seed Data)

| Role    | Username  | Password     |
|---------|-----------|--------------|
| Teacher | teacher   | teacher123   |
| Student | alice     | alice123     |
| Student | bob       | bob123       |
| Student | charlie   | charlie123   |

---

## API Documentation

### Auth (`/api/auth`)

| Method | Endpoint          | Description              |
|--------|-------------------|--------------------------|
| POST   | /api/auth/register | Register new user        |
| POST   | /api/auth/login    | Login, returns JWT token |

### Student (`/api/student`) — requires JWT with role=student

| Method | Endpoint                          | Description                    |
|--------|-----------------------------------|--------------------------------|
| GET    | /api/student/profile              | Get student profile + badges   |
| GET    | /api/student/modules              | List all modules with lessons  |
| GET    | /api/student/lessons/{id}         | Get lesson content             |
| POST   | /api/student/lessons/complete     | Mark lesson as completed       |
| GET    | /api/student/tests                | List all tests                 |
| GET    | /api/student/tests/{id}           | Get test questions             |
| POST   | /api/student/tests/{id}/submit    | Submit test answers            |
| GET    | /api/student/test-history         | Get test attempt history       |
| GET    | /api/student/tasks                | List code tasks                |
| GET    | /api/student/tasks/{id}           | Get task details               |
| POST   | /api/student/tasks/{id}/submit    | Submit code for auto-check     |
| GET    | /api/student/task-history         | Get code attempt history       |
| POST   | /api/student/chat                 | Send message to AI helper      |
| GET    | /api/student/chat/history         | Get chat history               |
| GET    | /api/student/feedback             | Get inbox messages             |
| POST   | /api/student/feedback/{id}/read   | Mark feedback as read          |
| GET    | /api/student/leaderboard          | Get top 10 students            |
| GET    | /api/student/statistics           | Get personal statistics        |

### Teacher (`/api/teacher`) — requires JWT with role=teacher

| Method | Endpoint                          | Description                    |
|--------|-----------------------------------|--------------------------------|
| GET    | /api/teacher/dashboard            | Dashboard stats                |
| GET    | /api/teacher/students             | List students (filter by grade)|
| GET    | /api/teacher/students/{id}        | Student detail + weak topics   |
| GET    | /api/teacher/modules              | List modules                   |
| POST   | /api/teacher/modules              | Create module                  |
| GET    | /api/teacher/lessons              | List all lessons               |
| POST   | /api/teacher/lessons              | Create lesson                  |
| PUT    | /api/teacher/lessons/{id}         | Update lesson                  |
| DELETE | /api/teacher/lessons/{id}         | Delete lesson                  |
| GET    | /api/teacher/tests                | List tests                     |
| POST   | /api/teacher/tests                | Create test with questions     |
| GET    | /api/teacher/tests/{id}           | Get test with answers          |
| DELETE | /api/teacher/tests/{id}           | Delete test                    |
| GET    | /api/teacher/code-tasks           | List code tasks                |
| POST   | /api/teacher/code-tasks           | Create code task               |
| DELETE | /api/teacher/code-tasks/{id}      | Delete code task               |
| GET    | /api/teacher/analytics            | Module analytics + weak topics |
| GET    | /api/teacher/export/csv           | Download CSV report            |
| GET    | /api/teacher/export/pdf           | Download PDF report            |
| POST   | /api/teacher/feedback             | Send feedback to student       |
| GET    | /api/teacher/feedback             | List sent feedback             |

### Health Check

| Method | Endpoint      | Description    |
|--------|---------------|----------------|
| GET    | /api/health   | Server status  |

---

## Features

### Student Panel
- Registration & login with JWT auth
- Profile with level (Beginner/Intermediate/Advanced), points, streak
- 7 Python modules with rich markdown lessons
- 4 test types: MCQ, Find Bug, Choose Code, Matching
- Monaco code editor with server-side auto-checking (5+ test cases)
- AI chatbot (rule-based, swappable with OpenAI)
- Gamification: points, levels, leaderboard, 6 badges
- Progress charts and weak topic analysis
- Inbox for teacher feedback

### Teacher Panel
- Dashboard with student count, avg scores, recent activity
- Student management with grade filter, detail view, weak topics
- Full CMS for lessons, tests, and code tasks
- 4 question type support in test creation
- Analytics with charts
- CSV + PDF report export
- Feedback messaging system
