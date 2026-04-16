# RCZ Donor Fund Tracking & Grant Management System

> A comprehensive web application for the Reformed Church in Zimbabwe to track donor funds, manage grants, enforce internal controls, and generate financial reports — promoting transparency, accountability, and donor confidence.

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ installed
- **MongoDB** — You need a MongoDB Atlas account (free tier works)
  - Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) → Create a free cluster
  - Get your connection string

### Setup

1. **Clone & Install**
   From the project root (`rcz-donor-tracker`), install all dependencies:
   ```bash
   npm run install-all
   ```

2. **Configure MongoDB**
   In the `server` directory, create a file named `.env` and add the following, replacing the `MONGO_URI` with your MongoDB Atlas connection string:
   ```
   MONGO_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster.mongodb.net/rcz-donor-tracker?retryWrites=true&w=majority
   JWT_SECRET=rcz_donor_tracker_secret_key_2024
   PORT=5000
   NODE_ENV=development
   ```

3. **Seed the Database** (creates demo data)
   From the project root, run the seed script:
   ```bash
   npm run seed
   ```

4. **Run in Development**
   From the project root, start the client and server concurrently:
   ```bash
   npm run dev
   ```
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

### Demo Login Credentials
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@rcz.org.zw | password123 |
| Finance Officer | finance@rcz.org.zw | password123 |
| Treasurer | treasurer@rcz.org.zw | password123 |
| Auditor | auditor@rcz.org.zw | password123 |
| Project Manager | projects@rcz.org.zw | password123 |

---

## 📋 Features

### Dashboard
- KPI cards with animated counters (Total Received, Active Grants, Active Donors, Pending Approvals)
- Monthly fund flow chart (Received vs Spent)
- Fund allocation doughnut chart by category
- Recent transactions and audit activity feeds

### Donor Management
- Full CRUD operations for donor profiles
- Donor types: International, NGO, Faith-Based, Local, Government, Individual
- Confidence score tracking with visual progress bars
- Communication history per donor

### Grant Lifecycle Management
- Status pipeline: Applied → Approved → Active → Reporting → Closed
- Milestone tracking with progress indicators
- Budget utilization visualization
- Compliance checklist tracking
- Fund type categorization (Restricted / Unrestricted / Temporarily Restricted)

### Fund Tracking (Transaction Ledger)
- Real-time transaction recording and tracking
- Approval workflow: Initiate → Review → Approve
- Transaction flagging for suspicious activity
- Reconciliation tracking
- Filter by type, status, category, and date range

### Reports & Transparency
- Financial overview with charts
- Grant financial summary reports
- Transparency dashboard with governance indicators
- Print-friendly report views

### Audit Trail
- Complete log of all system actions
- Severity-based classification (Low, Medium, High, Critical)
- Filter by action, entity, severity, and date
- Audit statistics dashboard

### Settings & Access Control
- User management with role-based access
- Segregation of duties matrix (COSO framework)
- System information panel

---

## 🏗 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite |
| Charts | Chart.js + react-chartjs-2 |
| Animations | Framer Motion, CSS Animations |
| Icons | Lucide React |
| Routing | React Router v6 |
| Backend | Express.js, Node.js |
| Database | MongoDB (Mongoose ODM) |
| Auth | JWT (JSON Web Tokens) + bcrypt |
| Deployment | Render (free tier) |

---

## 🌐 Deploy to Render

1. Push your code to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your GitHub repo
4. Settings:
   - **Build Command**: `cd client && npm install && npm run build && cd ../server && npm install`
   - **Start Command**: `cd server && node server.js`
5. Add Environment Variables:
   - `MONGO_URI` = your MongoDB Atlas connection string
   - `JWT_SECRET` = any random secret string
   - `NODE_ENV` = production

---

## 📐 Research Framework Alignment

This system was designed based on research findings and maps to:

| Theory/Framework | System Feature |
|-----------------|----------------|
| **Principal-Agent Theory** | Transparent reporting, real-time fund tracking reduces information asymmetry |
| **Stewardship Theory** | Accountability mechanisms, compliance checklists, responsible stewardship tools |
| **COSO Framework** | Internal controls, segregation of duties, monitoring activities, audit trail |

| Research Finding | System Response |
|-----------------|----------------|
| 47% disagree manual system ensures transparency | Digital real-time tracking dashboard |
| Transparency (β=0.42) strongest influence | Transparency indicators, donor-facing reports |
| Accountability (β=0.37) significant influence | Approval workflows, audit trails |
| Internal controls (β=0.31) significant influence | Role-based access, segregation of duties |
| Delayed reporting challenge | Automated report generation |
| Fragmented documentation | Centralized integrated system |

---

## 📁 Project Structure

```
rcz-donor-tracker/
├── client/                     # React Frontend
│   ├── src/
│   │   ├── api/                # API client
│   │   ├── components/         # Reusable components
│   │   │   └── layout/         # Sidebar, Header, Layout
│   │   ├── context/            # Global state (Auth)
│   │   ├── pages/              # Route pages
│   │   └── types/              # TypeScript interfaces
│   └── index.html
├── server/                     # Express Backend
│   ├── config/                 # DB connection
│   ├── middleware/              # JWT auth
│   ├── models/                 # Mongoose schemas
│   ├── routes/                 # API routes
│   └── seed/                   # Demo data
├── render.yaml                 # Render deployment config
└── package.json                # Root scripts
```

---

**Built for the Reformed Church in Zimbabwe** · Transparency · Accountability · Stewardship
