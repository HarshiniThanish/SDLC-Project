// CareSync Main Application Controller & Router

// Application State Store
const AppState = {
  user: null, // logged-in User details
  profile: null, // Patient/Doctor details
  activeView: 'auth', // current visible view container
  
  // Booking page state
  selectedDoctorId: null,
  selectedSlot: null,
  selectedDate: null,
  doctorsList: [],

  // Detail view state
  activeAppointmentId: null,
  appointmentsList: []
};

// ========================================================
// STARTUP BOOTSTRAP
// ========================================================
document.addEventListener('DOMContentLoaded', () => {
  initEventListeners();
  checkAuthSession();
});

// Check if JWT token exists and fetch user details
async function checkAuthSession() {
  const token = localStorage.getItem('caresync_token');
  if (!token) {
    navigate('auth');
    return;
  }

  try {
    const data = await CareSyncAPI.auth.getMe();
    if (data.success) {
      AppState.user = data.user;
      AppState.profile = data.profile;
      
      // Update UI components
      updateHeaderProfileUI();
      configureRoleSidebar();
      
      // Navigate to home dashboard
      if (AppState.user.role === 'admin') {
        navigate('admin-analytics');
      } else if (AppState.user.role === 'doctor') {
        navigate('clinic-mgmt');
      } else {
        navigate('dashboard');
      }
    } else {
      localStorage.removeItem('caresync_token');
      navigate('auth');
    }
  } catch (error) {
    localStorage.removeItem('caresync_token');
    navigate('auth');
  }
}

// ========================================================
// VIEW ROUTER (NAVIATION)
// ========================================================
function navigate(viewName) {
  AppState.activeView = viewName;
  
  // Hide all sections
  document.querySelectorAll('.view-section').forEach(sec => {
    sec.classList.add('hidden');
  });
  
  // Show target section
  const targetSection = document.getElementById(`view-${viewName}`);
  if (targetSection) {
    targetSection.classList.remove('hidden');
  }

  // Handle Container Layout toggles
  const appContainer = document.getElementById('app');
  const header = document.getElementById('main-header');
  const sidebar = document.getElementById('main-sidebar');

  if (viewName === 'auth') {
    appContainer.classList.add('guest-mode');
    header.classList.add('header-hidden');
    sidebar.classList.add('sidebar-hidden');
  } else {
    appContainer.classList.remove('guest-mode');
    header.classList.remove('header-hidden');
    sidebar.classList.remove('sidebar-hidden');
  }

  // Update active sidebar nav indicators
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('data-view') === viewName) {
      link.classList.add('active');
    }
  });

  // Load contextual data for views
  loadViewData(viewName);
}

// Load view-specific backend data
async function loadViewData(viewName) {
  try {
    switch (viewName) {
      case 'dashboard':
        await loadDashboardData();
        break;
      case 'book-appointment':
        await searchDoctors();
        break;
      case 'medical-records':
        await loadMedicalRecords();
        break;
      case 'clinic-mgmt':
        await loadClinicMgmtData();
        break;
      case 'admin-analytics':
        await loadAdminStats();
        break;
      case 'appointment-details':
        if (AppState.activeAppointmentId) {
          await loadAppointmentDetails(AppState.activeAppointmentId);
        }
        break;
    }
  } catch (error) {
    console.error(`Error loading data for view ${viewName}:`, error.message);
  }
}

// ========================================================
// CORE VIEW LOADERS
// ========================================================

// 1. Patient Dashboard Loader
async function loadDashboardData() {
  document.getElementById('dash-user-name').innerText = AppState.user.name;
  
  const apptsRes = await CareSyncAPI.appointments.getAll();
  if (apptsRes.success) {
    AppState.appointmentsList = apptsRes.data;
    
    // Render Appointments
    CareSyncViews.renderAppointmentsTable(
      AppState.appointmentsList,
      (id) => { // Details Action
        AppState.activeAppointmentId = id;
        navigate('appointment-details');
      },
      async (id) => { // Cancel Action
        if (confirm('Are you sure you want to cancel this appointment?')) {
          const res = await CareSyncAPI.appointments.updateStatus(id, 'Cancelled', 'Cancelled by patient.');
          if (res.success) {
            loadDashboardData();
          }
        }
      }
    );

    // Total Count
    document.getElementById('stats-total-appointments').innerText = AppState.appointmentsList.length;

    // Next scheduled appointment
    const nextApptObj = AppState.appointmentsList.find(a => a.status === 'Scheduled');
    if (nextApptObj) {
      const dateStr = CareSyncViews.formatDateShort(nextApptObj.appointmentDate);
      document.getElementById('stats-next-appt').innerText = `${dateStr} @ ${nextApptObj.appointmentTime}`;
    } else {
      document.getElementById('stats-next-appt').innerText = 'None';
    }
  }

  // Active Prescriptions count based on medical record entries
  const recordsRes = await CareSyncAPI.medicalRecords.getAll();
  if (recordsRes.success) {
    const rxCount = recordsRes.data.filter(r => r.prescription && r.prescription !== 'No prescription added').length;
    document.getElementById('stats-prescriptions').innerText = rxCount;
  }
}

// 2. Specialty Search Loader
async function searchDoctors() {
  const spec = document.getElementById('filter-specialty').value;
  const loc = document.getElementById('filter-location').value;
  
  const filters = { search: spec };
  const res = await CareSyncAPI.doctors.getAll(filters);
  if (res.success) {
    AppState.doctorsList = res.data;
    CareSyncViews.renderDoctorsList(
      AppState.doctorsList,
      AppState.selectedDoctorId,
      AppState.selectedSlot,
      (doctorId, slot) => {
        // Slot clicked callback
        AppState.selectedDoctorId = doctorId;
        AppState.selectedSlot = slot;
        
        // Redraw lists to show active slot check
        CareSyncViews.renderDoctorsList(
          AppState.doctorsList,
          AppState.selectedDoctorId,
          AppState.selectedSlot,
          (id, slt) => selectBookingSlot(id, slt)
        );

        // Update Side Confirmation Panel
        updateBookingSummaryPanel();
      }
    );
  }
}

function selectBookingSlot(doctorId, slot) {
  AppState.selectedDoctorId = doctorId;
  AppState.selectedSlot = slot;
  
  // Re-render
  CareSyncViews.renderDoctorsList(
    AppState.doctorsList,
    AppState.selectedDoctorId,
    AppState.selectedSlot,
    (id, slt) => selectBookingSlot(id, slt)
  );

  updateBookingSummaryPanel();
}

// Helper to update summary booking sidebar
function updateBookingSummaryPanel() {
  const placeholder = document.getElementById('panel-placeholder-msg');
  const content = document.getElementById('panel-booking-content');
  
  if (!AppState.selectedDoctorId || !AppState.selectedSlot) {
    placeholder.classList.remove('hidden');
    content.classList.add('hidden');
    return;
  }

  placeholder.classList.add('hidden');
  content.classList.remove('hidden');

  const doc = AppState.doctorsList.find(d => d.userId._id === AppState.selectedDoctorId);
  if (!doc) return;

  // Selected Date
  const filterDateInput = document.getElementById('filter-date');
  let selectedDateVal = filterDateInput.value;
  if (!selectedDateVal) {
    // Default to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    selectedDateVal = tomorrow.toISOString().split('T')[0];
    filterDateInput.value = selectedDateVal;
  }
  AppState.selectedDate = selectedDateVal;

  document.getElementById('summary-doctor-name').innerText = doc.userId.name;
  document.getElementById('summary-doctor-specialty').innerText = `${doc.specialization} • ${doc.department}`;
  document.getElementById('summary-doctor-avatar').innerText = CareSyncViews.getInitials(doc.userId.name);
  document.getElementById('summary-appt-date').innerText = CareSyncViews.formatDate(AppState.selectedDate);
  document.getElementById('summary-appt-time').innerText = AppState.selectedSlot;
  document.getElementById('summary-patient-name').innerText = AppState.user.name;

  // Copay calculation
  const isInsured = AppState.profile && AppState.profile.insuranceProvider && AppState.profile.insuranceProvider !== 'None';
  document.getElementById('summary-insurance-provider').innerText = isInsured ? AppState.profile.insuranceProvider : 'No Insurance Coverage';
  document.getElementById('summary-estimated-copay').innerText = isInsured ? 'Estimated Co-Pay: $15.00' : 'Estimated Co-Pay: $25.00';
}

// Submit Booking to DB
async function confirmAppointmentBooking() {
  const symptoms = document.getElementById('booking-symptoms').value;
  if (!symptoms) {
    alert('Please describe your symptoms or reason for visit.');
    return;
  }

  const payload = {
    doctorId: AppState.selectedDoctorId,
    appointmentDate: AppState.selectedDate,
    appointmentTime: AppState.selectedSlot,
    symptoms
  };

  try {
    const res = await CareSyncAPI.appointments.create(payload);
    if (res.success) {
      alert('Appointment booked successfully!');
      
      // Reset selections
      AppState.selectedDoctorId = null;
      AppState.selectedSlot = null;
      document.getElementById('booking-symptoms').value = '';
      
      navigate('dashboard');
    }
  } catch (error) {
    alert(error.message || 'Booking failed.');
  }
}

// 3. Medical Records Loader
async function loadMedicalRecords() {
  const res = await CareSyncAPI.medicalRecords.getAll();
  if (res.success) {
    CareSyncViews.renderMedicalRecords(res.data);
  }
}

// 4. Appointment Details View Loader
async function loadAppointmentDetails(id) {
  const res = await CareSyncAPI.appointments.getById(id);
  if (res.success) {
    CareSyncViews.renderAppointmentDetails(
      res.data,
      (apptId) => {
        // Open Reschedule Modal
        document.getElementById('reschedule-modal').classList.remove('hidden');
        document.getElementById('reschedule-date').value = new Date(res.data.appointmentDate).toISOString().split('T')[0];
      },
      async (apptId) => {
        // Cancel Action
        if (confirm('Are you sure you want to cancel this appointment?')) {
          const cancelRes = await CareSyncAPI.appointments.updateStatus(apptId, 'Cancelled', 'Cancelled from Details panel.');
          if (cancelRes.success) {
            loadAppointmentDetails(apptId);
          }
        }
      }
    );
  }
}

// 5. Clinic Management Loader (Doctor view)
async function loadClinicMgmtData() {
  // Load queue appointments
  const apptsRes = await CareSyncAPI.appointments.getAll();
  if (apptsRes.success) {
    CareSyncViews.renderDoctorQueue(
      apptsRes.data,
      async (id) => { // Complete
        const notes = prompt('Add clinical follow-up notes (optional):');
        const res = await CareSyncAPI.appointments.updateStatus(id, 'Completed', notes || '');
        if (res.success) {
          loadClinicMgmtData();
        }
      },
      async (id) => { // Cancel
        if (confirm('Are you sure you want to cancel this session?')) {
          const res = await CareSyncAPI.appointments.updateStatus(id, 'Cancelled', 'Cancelled by doctor.');
          if (res.success) {
            loadClinicMgmtData();
          }
        }
      }
    );
  }

  // Load patients for medical records logging dropdown
  const patientsRes = await CareSyncAPI.patients.getAll();
  if (patientsRes.success) {
    CareSyncViews.renderPatientSelect(patientsRes.data);
  }
}

// Log clinical diagnosis from doctor
async function logMedicalRecordFromForm() {
  const patientId = document.getElementById('record-patient-select').value;
  const diagnosis = document.getElementById('record-diagnosis').value;
  const prescription = document.getElementById('record-prescription').value;
  const notes = document.getElementById('record-notes').value;

  if (!patientId || !diagnosis) {
    alert('Patient selection and diagnosis are required.');
    return;
  }

  try {
    const res = await CareSyncAPI.medicalRecords.create({
      patientId,
      diagnosis,
      prescription,
      notes
    });

    if (res.success) {
      alert('Diagnosis and medical record logged successfully!');
      // Reset form
      document.getElementById('doctor-record-form').reset();
      loadClinicMgmtData();
    }
  } catch (error) {
    alert(error.message);
  }
}

// 6. Admin Analytics Loader
async function loadAdminStats() {
  const res = await CareSyncAPI.admin.getStats();
  if (res.success) {
    CareSyncViews.renderAdminDashboard(res.data);
  }
}

// ========================================================
// GENERAL EVENT LISTENERS
// ========================================================
function initEventListeners() {
  
  // Navigation Sidebar link handlers
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetView = e.currentTarget.getAttribute('data-view');
      navigate(targetView);
    });
  });

  // Login Form submit intercept
  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errAlert = document.getElementById('auth-error-alert');

    errAlert.classList.add('hidden');

    try {
      const res = await CareSyncAPI.auth.login(email, password);
      if (res.success) {
        checkAuthSession();
      }
    } catch (error) {
      errAlert.innerText = error.message || 'Login failed.';
      errAlert.classList.remove('hidden');
    }
  });

  // Register Form submit intercept
  document.getElementById('signup-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const phone = document.getElementById('signup-phone').value;
    const role = document.getElementById('signup-role').value;
    
    // extra Patient profile fields
    const age = document.getElementById('signup-age').value;
    const insuranceProvider = document.getElementById('signup-insurance').value;
    
    // extra Doctor profile fields
    const department = document.getElementById('signup-dept').value;
    const specialization = document.getElementById('signup-spec').value;

    const payload = {
      name, email, password, phone, role,
      age, insuranceProvider,
      department, specialization
    };

    try {
      const res = await CareSyncAPI.auth.register(payload);
      if (res.success) {
        alert('Account created successfully!');
        checkAuthSession();
      }
    } catch (error) {
      alert(error.message || 'Registration failed.');
    }
  });

  // Toggle Login/Signup view forms
  document.getElementById('auth-switch-btn').addEventListener('click', (e) => {
    e.preventDefault();
    const isSignup = document.getElementById('signup-form').classList.contains('hidden');
    if (isSignup) {
      document.getElementById('signup-form').classList.remove('hidden');
      document.getElementById('login-form').classList.add('hidden');
      document.getElementById('auth-title').innerText = 'Create your CareSync account';
      document.getElementById('auth-switch-text').innerText = 'Already have an account?';
      document.getElementById('auth-switch-btn').innerText = 'Sign in here';
    } else {
      document.getElementById('signup-form').classList.add('hidden');
      document.getElementById('login-form').classList.remove('hidden');
      document.getElementById('auth-title').innerText = 'Sign in to CareSync';
      document.getElementById('auth-switch-text').innerText = "Don't have an account?";
      document.getElementById('auth-switch-btn').innerText = 'Create an account';
    }
  });

  // Signup role toggler
  document.getElementById('signup-role').addEventListener('change', (e) => {
    const role = e.target.value;
    if (role === 'doctor') {
      document.getElementById('signup-doctor-fields').classList.remove('hidden');
      document.getElementById('signup-patient-fields').classList.add('hidden');
    } else {
      document.getElementById('signup-doctor-fields').classList.add('hidden');
      document.getElementById('signup-patient-fields').classList.remove('hidden');
    }
  });

  // Doctor search form trigger
  document.getElementById('doctor-search-form').addEventListener('submit', (e) => {
    e.preventDefault();
    searchDoctors();
  });

  // Confirm booking button
  document.getElementById('btn-confirm-booking').addEventListener('click', () => {
    confirmAppointmentBooking();
  });

  // Reschedule Form trigger
  document.getElementById('reschedule-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const newDate = document.getElementById('reschedule-date').value;
    const activeSlotBtn = document.querySelector('#reschedule-slots-container .slot-btn.active-slot');
    if (!activeSlotBtn) {
      alert('Please choose a reschedule time slot.');
      return;
    }
    const newTime = activeSlotBtn.innerText;

    try {
      const res = await CareSyncAPI.appointments.reschedule(AppState.activeAppointmentId, newDate, newTime);
      if (res.success) {
        alert('Rescheduled successfully!');
        document.getElementById('reschedule-modal').classList.add('hidden');
        loadAppointmentDetails(AppState.activeAppointmentId);
      }
    } catch (error) {
      alert(error.message);
    }
  });

  // Reschedule modal time slot selector helper
  document.querySelectorAll('#reschedule-slots-container .slot-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('#reschedule-slots-container .slot-btn').forEach(b => b.classList.remove('active-slot'));
      e.currentTarget.classList.add('active-slot');
    });
  });

  // Doctor clinic diagnosis submission
  document.getElementById('doctor-record-form').addEventListener('submit', (e) => {
    e.preventDefault();
    logMedicalRecordFromForm();
  });

  // Modal closers
  document.getElementById('close-reschedule-btn').addEventListener('click', () => {
    document.getElementById('reschedule-modal').classList.add('hidden');
  });

  // Logout Click
  document.getElementById('logout-btn').addEventListener('click', () => {
    CareSyncAPI.auth.logout();
    AppState.user = null;
    AppState.profile = null;
    navigate('auth');
  });

  // Quick Action Redirects
  document.getElementById('btn-quick-book').addEventListener('click', () => navigate('book-appointment'));
  document.getElementById('btn-quick-records').addEventListener('click', () => navigate('medical-records'));

  // Quick demo role credentials clicking
  document.querySelectorAll('.demo-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const email = e.currentTarget.getAttribute('data-email');
      document.getElementById('login-email').value = email;
      document.getElementById('login-password').value = 'password123';
      
      // Auto trigger form submit
      document.getElementById('login-form').dispatchEvent(new Event('submit'));
    });
  });

  // Details Back Link
  document.getElementById('btn-details-back').addEventListener('click', (e) => {
    e.preventDefault();
    navigate('dashboard');
  });
}

// Helper to configure sidebar options based on role
function configureRoleSidebar() {
  const mgmtTitle = document.getElementById('mgmt-section-title');
  const analyticsNav = document.getElementById('nav-analytics').parentNode;
  const clinicNav = document.getElementById('nav-clinic').parentNode;

  if (AppState.user.role === 'admin') {
    mgmtTitle.classList.remove('hidden');
    analyticsNav.classList.remove('hidden');
    clinicNav.classList.add('hidden'); // admin has no clinic schedule queue
  } else if (AppState.user.role === 'doctor') {
    mgmtTitle.classList.remove('hidden');
    analyticsNav.classList.add('hidden'); // doctors can't view procurement spending
    clinicNav.classList.remove('hidden');
  } else {
    // patient has no management views
    mgmtTitle.classList.add('hidden');
    analyticsNav.classList.add('hidden');
    clinicNav.classList.add('hidden');
  }
}

// Update header tags and avatar initials
function updateHeaderProfileUI() {
  document.getElementById('avatar-initials').innerText = CareSyncViews.getInitials(AppState.user.name);
  document.getElementById('top-role-label').innerText = AppState.user.role;
}
