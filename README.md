# 📅 SaaS Appointment Booking & Slot Management System

[![Live Website](https://img.shields.io/badge/Personal_Site-CodeWithMission-4f46e5?style=for-the-badge)](https://www.codewithmission.site/)
[![WhatsApp](https://img.shields.io/badge/WhatsApp-9354689368-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)](https://wa.me/919354689368)
[![Stack](https://img.shields.io/badge/Stack-MERN_%7C_Redux_%7C_Tailwind_%7C_Docker-0f172a?style=for-the-badge)](#tech-stack)

A complete, production-ready **MERN SaaS Appointment Booking & Clinic/Business Management Platform** built by **Mission (CodeWithMission)**. It features public booking pages, real-time slot management, multi-role dashboards (Super Admin, Admin, Business Owner, Doctor/Staff, Affiliate), Razorpay subscription billing, and automated SMTP email notifications.

---

## 🔗 Repository & Live Links

- **GitHub Repository:** `https://github.com/missionkuamar/saas-appointment-booking` *(Update with your exact repo URL if different)*
- **Personal Portfolio & SaaS Demos:** [https://www.codewithmission.site/](https://www.codewithmission.site/)
- **Local Frontend URL:** `http://localhost:5173`
- **Local Backend API URL:** `http://localhost:5000/api`

---

## 🎯 Live Demo & Route Walkthrough

Once the project is running locally, you can explore all core SaaS flows using these routes:

| Module / Flow | Route Path | Access Level | Description |
| :--- | :--- | :--- | :--- |
| **Landing Page** | `/` | Public | Product overview, SaaS demos, CodeWithMission showcase, Login & Sign Up |
| **Sign Up (Register)** | `/register` | Public | Create a new account & capture affiliate referral (`?ref=`) |
| **Login** | `/login` | Public | Role-based authentication & automatic dashboard redirection |
| **Business Onboarding** | `/onboarding` | Protected | Clinic/Business setup with clickable avatar & business details |
| **Public Booking Page** | `/book/:slug` | Public | Customer-facing slot selection & appointment booking page |
| **Booking Confirmation** | `/booking-confirmed` | Public | Instant booking receipt & confirmation screen |
| **Manage / Reschedule** | `/manage/:token` | Public | Customer self-service appointment rescheduling/cancellation |
| **Owner Dashboard** | `/dashboard` | Owner | Business analytics, overview, and quick actions |
| **Slot Manager** | `/slots` | Owner | Create, edit, and manage daily appointment time slots |
| **Appointments** | `/appointments` | Owner / Staff | View, update status, and manage all bookings |
| **Doctors & Staff** | `/doctors`, `/staff` | Owner | Add and manage clinic doctors and team members |
| **Subscriptions** | `/subscription` | Owner | Razorpay subscription plans & billing management |
| **Doctor/Staff Portal** | `/doctor-dashboard` | Staff | Dedicated schedule and appointment view for doctors/staff |
| **Affiliate Portal** | `/affiliate` | Protected | Referral link generator, earnings tracking, and `/affiliate/withdrawals` |
| **Admin / Super Admin** | `/admin` | Admin / Super Admin | System-wide users, businesses, doctors, slots, holidays, subscriptions & payouts |

---

## 🛠️ Tech Stack

- **Frontend:** React (Vite), React Router DOM, Redux Toolkit, Tailwind CSS, React Hot Toast
- **Backend:** Node.js, Express.js, Mongoose (MongoDB Atlas)
- **Payments & Billing:** Razorpay Subscriptions & Orders API
- **Authentication & Security:** JWT (JSON Web Tokens), Express Session, Role-Based Protected Routes
- **Notifications:** Nodemailer (Gmail SMTP)
- **DevOps / Deployment:** Docker & Docker Compose

---

## 📁 Project Structure

```text
saas-appointment-booking/
├── client/                 # React + Vite frontend application
│   ├── src/
│   │   ├── components/     # ProtectedRoute, Loader, UI components
│   │   ├── features/       # Redux slices (auth, business, etc.)
│   │   ├── pages/          # LandingPage, Login, Register, Onboarding, Dashboards, Admin
│   │   └── affilate/       # Affiliate dashboard & withdrawal modules
│   ├── Dockerfile
│   └── .env
├── server/                 # Express + MongoDB REST API
│   ├── src/
│   │   ├── controllers/    # Auth, Appointment, Business, Doctor, Staff, Public controllers
│   │   ├── models/         # Mongoose schemas
│   │   └── routes/         # Express API routes
│   ├── Dockerfile
│   └── .env
├── public/                 # Application preview screenshots
├── docker-compose.yml      # Full-stack Docker orchestration
└── README.md
```

---

## ⚙️ Environment Variables Setup

Create `.env` files inside both `client/` and `server/` directories before starting the app.

### 1. Client Environment (`client/.env`)

```env
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
VITE_API_URL=http://localhost:5000/api
VITE_BACKEND_URL=http://localhost:5000
```

### 2. Server Environment (`server/.env`)

```env
PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_super_secret_key_change_this
CLIENT_URL=http://localhost:5173
EMAIL_USER=missionk935@gmail.com
EMAIL_PASS=your_gmail_app_password
SESSION_SECRET=your_session_secret_key
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
NODE_ENV=production
FRONTEND_URL=http://localhost:5173
```

> ⚠️ **Security Note:** Never commit real API secrets, database passwords, or Gmail App Passwords to GitHub. Keep `.env` inside `.gitignore`.

---

## 🚀 How to Start the Project

### Method 1: Manual Local Setup (Recommended for Development)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/missionkuamar/saas-appointment-booking.git
   cd saas-appointment-booking
   ```

2. **Start the Backend Server (`server`):**
   ```bash
   cd server
   npm install
   npm run dev
   ```
   *Server will start on `http://localhost:5000` and initialize MongoDB, Razorpay plans, and SMTP.*

3. **Start the Frontend Client (`client`):**
   Open a new terminal window:
   ```bash
   cd client
   npm install
   npm run dev
   ```
   *Frontend will be live at `http://localhost:5173`.*

---

### Method 2: Run with Docker Compose

Make sure **Docker Desktop** is running, then run from the project root:

```bash
docker compose up -d --build
```

To stop containers:

```bash
docker compose down
```

---

## 📸 Application Screenshots (`public/`)

Below is the complete visual gallery of the application from the `public/` directory:

<details open>
<summary><strong>Click to Expand / Collapse All Screenshots (27 Images)</strong></summary>

### 1. Landing, Authentication & Onboarding
| Screen 1 | Screen 2 | Screen 3 |
| :---: | :---: | :---: |
| ![Screenshot 1](./public/Screenshot%202026-11-22%20215027.png) | ![Screenshot 2](./public/Screenshot%202026-11-22%20215035.png) | ![Screenshot 3](./public/Screenshot%202026-11-22%20215042.png) |
| ![Screenshot 4](./public/Screenshot%202026-11-22%20215119.png) | ![Screenshot 5](./public/Screenshot%202026-11-22%20215127.png) | ![Screenshot 6](./public/Screenshot%202026-11-22%20215133.png) |

### 2. Owner Dashboard, Slots & Appointments
| Screen 7 | Screen 8 | Screen 9 |
| :---: | :---: | :---: |
| ![Screenshot 7](./public/Screenshot%202026-11-22%20215139.png) | ![Screenshot 8](./public/Screenshot%202026-11-22%20215150.png) | ![Screenshot 9](./public/Screenshot%202026-11-22%20215157.png) |
| ![Screenshot 10](./public/Screenshot%202026-11-22%20215205.png) | ![Screenshot 11](./public/Screenshot%202026-11-22%20215214.png) | ![Screenshot 12](./public/Screenshot%202026-11-22%20215221.png) |

### 3. Doctors, Staff & Public Booking Experience
| Screen 13 | Screen 14 | Screen 15 |
| :---: | :---: | :---: |
| ![Screenshot 13](./public/Screenshot%202026-11-22%20215227.png) | ![Screenshot 14](./public/Screenshot%202026-11-22%20215237.png) | ![Screenshot 15](./public/Screenshot%202026-11-22%20215307.png) |
| ![Screenshot 16](./public/Screenshot%202026-11-22%20215314.png) | ![Screenshot 17](./public/Screenshot%202026-11-22%20215340.png) | ![Screenshot 18](./public/Screenshot%202026-11-22%20215346.png) |

### 4. Subscriptions, Affiliate & Admin Controls
| Screen 19 | Screen 20 | Screen 21 |
| :---: | :---: | :---: |
| ![Screenshot 19](./public/Screenshot%202026-11-22%20215352.png) | ![Screenshot 20](./public/Screenshot%202026-11-22%20215356.png) | ![Screenshot 21](./public/Screenshot%202026-11-22%20215402.png) |
| ![Screenshot 22](./public/Screenshot%202026-11-22%20215413.png) | ![Screenshot 23](./public/Screenshot%202026-11-22%20215418.png) | ![Screenshot 24](./public/Screenshot%202026-11-22%20215422.png) |
| ![Screenshot 25](./public/Screenshot%202026-11-22%20215428.png) | ![Screenshot 26](./public/Screenshot%202026-11-22%20215512.png) | ![Screenshot 27](./public/Screenshot%202026-11-22%20215518.png) |

</details>

---

## 👨‍💻 Author & Connect Info

Built and maintained by **Mission** (**CodeWithMission**). Feel free to reach out for SaaS demos, custom full-stack development, or support:

- 🌐 **Personal Website & SaaS Hub:** [https://www.codewithmission.site/](https://www.codewithmission.site/)
- 💬 **WhatsApp Direct:** [+91 9354689368](https://wa.me/919354689368) (`9354689368`)
- 📧 **Primary Email:** [missionk935@gmail.com](mailto:missionk935@gmail.com)
- 📧 **Secondary Email:** [missionk408@gmail.com](mailto:missionk408@gmail.com)