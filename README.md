# CareSync: Hospital Appointment & Patient Management System

CareSync is a complete, production-ready hospital management platform that connects Patients, Doctors, and Administrators in a unified, modern web interface. Built using **Node.js, Express, and MongoDB**, it follows **SOLID design principles, MVC architecture, and clean code guidelines**.

---

##  Key Features

1. **Patient Portal**:
   - Dashboard with upcoming bookings summary, active prescriptions indicator, and quick actions.
   - Doctor search & selection engine with specialty, department, location filters, and slot selection.
   - Interactive Booking confirmation panel with copay estimates and insurance verification.
   - Diagnostic History: View clinical records, prescriptions, and related doctor files.
   - Appointment details checklist, reschedule timeline, and driving map links.
2. **Doctor (Clinic Management)**:
   - Real-time patient consult queues with completion/cancellation buttons.
   - Medical diagnostic updates: Input diagnosis, prescribe drugs, and add clinical notes.
   - Dynamic schedule management: Alter open time slots.
3. **Administrator (Procurement Report)**:
   - Full spend analytics dashboard displaying Total Monthly Spend, Active Suppliers, Cost Savings, and Purchase Orders counts.
   - Custom Spend Trends line charts (custom-built using responsive SVG paths with hover animations).
   - Spend Distribution breakdown by medical department.
   - Paginated table of supplier invoice items, lead times, and fulfillment cards.

---

##  Project Architecture & File Structure

The project implements a classic **MVC (Model-View-Controller)** separation:

```
caresync/
├── server.js               # Express entry point
├── seed.js                 # Database seeder utility
├── package.json            # Node configuration & scripts
├── .env                    # Port & database connections
├── config/
│   └── db.js               # MongoDB connection logic
├── models/                 # Database Mongoose Schemas (M)
│   ├── User.js             # Base Auth (Patient, Doctor, Admin)
│   ├── Patient.js          # Demographics, Insurance, History
│   ├── Doctor.js           # Specialization, Rating, Slots
│   ├── Appointment.js      # Date, Timeslot, Status, History Log
│   ├── MedicalRecord.js    # Diagnoses, Prescriptions, Attached Files
│   └── Procurement.js      # Supplier analytics rows
├── controllers/            # Request handlers (C)
│   ├── authController.js
│   ├── patientController.js
│   ├── doctorController.js
│   ├── appointmentController.js
│   ├── medicalRecordController.js
│   └── adminController.js
├── middleware/             # Route guards & filters
│   ├── authMiddleware.js   # JWT and Role-based guards
│   └── errorMiddleware.js  # Global error handler
├── routes/                 # Express REST Routers
│   ├── authRoutes.js
│   ├── patientRoutes.js
│   ├── doctorRoutes.js
│   ├── appointmentRoutes.js
│   ├── medicalRecordRoutes.js
│   └── adminRoutes.js
├── public/                 # Static frontend client assets (V)
│   ├── index.html          # Semantic HTML SPA layout
│   ├── css/
│   │   └── style.css       # Premium glassmorphism dark theme
│   └── js/
│       ├── api.js          # Client API fetch calls
│       ├── views.js        # DOM render templates & SVGs
│       └── app.js          # Route navigator & form submission
└── tests/                  # Integration Test Suites
    ├── setup.js            # Database mock configuration
    ├── auth.test.js        # Registration & login tests
    └── appointment.test.js # Collision checks & schedule tests
```

---

## ⚙️ Setup and Run Instructions

### 1. Prerequisites
- **Node.js** (v16.0.0 or higher recommended)
- **MongoDB** running locally on port 27017 (or configure a remote MongoDB connection string in `.env`)

### 2. Install Dependencies
Run from the project root (`caresync/`):
```bash
npm install
```

### 3. Database Seeding
To pre-populate MongoDB with demo records (doctors, patients, appointments, invoices) so the dashboards show interactive charts:
```bash
npm run seed
```

### 4. Start the Application
Boot the Express server:
```bash
npm start
```
Open a browser and navigate to: **[http://localhost:3000](http://localhost:3000)**

### 5. Running Automated Tests
Run integration tests using Jest:
```bash
npm test
```

---

##  Quick Demo Credentials

For convenience, the Login page has **Quick Role Buttons** at the bottom. Clicking them automatically enters the credentials below:

- **Patient View**:
  - Email: `patient@caresync.com`
  - Password: `password123`
- **Doctor View**:
  - Email: `sarah.jenkins@caresync.com`
  - Password: `password123`
- **Administrator View**:
  - Email: `admin@caresync.com`
  - Password: `password123`
