// CareSync Client-Side Rendering Service

const CareSyncViews = {
  // Helper to format date strings nicely
  formatDate: (dateStr) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateStr).toLocaleDateString('en-US', options);
  },

  // Helper to get short date (e.g., Jun 12, 2026)
  formatDateShort: (dateStr) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateStr).toLocaleDateString('en-US', options);
  },

  // Helper to format currency
  formatCurrency: (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
  },

  // Helper for Doctor Initials
  getInitials: (name) => {
    return name.replace(/Dr\.\s+/i, '').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  },

  // Render Doctor Stack Cards (Find Specialist view)
  renderDoctorsList: (doctors, selectedDoctorId, selectedSlot, onSelectSlot) => {
    const container = document.getElementById('doctors-list-target');
    if (!doctors || doctors.length === 0) {
      container.innerHTML = `<div class="glass-panel text-center" style="padding: 40px; color: var(--text-muted);">No doctors matching search criteria found.</div>`;
      document.getElementById('doctors-count-label').innerText = '0 Doctors Available';
      return;
    }

    document.getElementById('doctors-count-label').innerText = `${doctors.length} Doctors Available`;

    container.innerHTML = doctors.map(doc => {
      const isSelectedDoctor = selectedDoctorId === doc.userId._id;
      const initials = CareSyncViews.getInitials(doc.userId.name);
      
      const slotsHtml = doc.availableSlots.map(slot => {
        const isSelectedSlot = isSelectedDoctor && selectedSlot === slot;
        return `
          <button 
            type="button" 
            class="slot-btn ${isSelectedSlot ? 'active-slot' : ''}" 
            data-doctor-id="${doc.userId._id}" 
            data-slot="${slot}"
          >
            ${slot}
          </button>
        `;
      }).join('');

      return `
        <div class="doctor-profile-card glass-panel" id="doc-card-${doc.userId._id}">
          <div class="doctor-avatar-circle">${initials}</div>
          <div class="doctor-details-info">
            <div class="doctor-header-row">
              <h4>${doc.userId.name}</h4>
              <span class="rating-badge">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" stroke="currentColor" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                <span>${doc.rating.toFixed(1)} (${Math.floor(doc.rating * 25)} reviews)</span>
              </span>
            </div>
            
            <p class="dept-tag">${doc.specialization} • ${doc.department}</p>
            
            <div class="location-row">
              <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              <span>Metro General Hospital, North Wing, Suite 402</span>
            </div>
            
            <div class="avail-slots-row">
              <h5>Available Today</h5>
              <div class="slots-grid-wrapper">
                ${slotsHtml}
                <button type="button" class="slot-btn more-slots" data-doctor-id="${doc.userId._id}">More Slots &rsaquo;</button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Bind event listeners to slot buttons
    container.querySelectorAll('.slot-btn:not(.more-slots)').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const doctorId = e.currentTarget.getAttribute('data-doctor-id');
        const slot = e.currentTarget.getAttribute('data-slot');
        onSelectSlot(doctorId, slot);
      });
    });
  },

  // Render Upcoming Appointments Table (Patient Dashboard)
  renderAppointmentsTable: (appointments, onDetails, onCancel) => {
    const tbody = document.getElementById('upcoming-appts-tbody');
    
    // Filter scheduled ones for dashboard table
    const activeAppts = appointments.filter(a => a.status === 'Scheduled');

    if (!activeAppts || activeAppts.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="no-data">No upcoming appointments scheduled.</td></tr>`;
      return;
    }

    tbody.innerHTML = activeAppts.map(appt => {
      const dateFormatted = CareSyncViews.formatDateShort(appt.appointmentDate);
      const isCardio = appt.doctorProfile && appt.doctorProfile.department === 'Cardiology';
      const specialty = appt.doctorProfile ? appt.doctorProfile.specialization : 'Specialist';
      
      return `
        <tr>
          <td>
            <div style="font-weight: 600;">${appt.doctorId.name}</div>
          </td>
          <td>${specialty}</td>
          <td>${dateFormatted}</td>
          <td>${appt.appointmentTime}</td>
          <td>
            <span class="badge badge-success">Scheduled</span>
          </td>
          <td>
            <div style="display: flex; gap: 8px;">
              <button class="btn btn-sm btn-outline btn-tbl-details" data-id="${appt._id}">Details</button>
              <button class="btn btn-sm btn-outline danger-text btn-tbl-cancel" data-id="${appt._id}">Cancel</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Bind listeners
    tbody.querySelectorAll('.btn-tbl-details').forEach(btn => {
      btn.addEventListener('click', (e) => onDetails(e.currentTarget.getAttribute('data-id')));
    });

    tbody.querySelectorAll('.btn-tbl-cancel').forEach(btn => {
      btn.addEventListener('click', (e) => onCancel(e.currentTarget.getAttribute('data-id')));
    });
  },

  // Render Medical Records (Patient View)
  renderMedicalRecords: (records) => {
    const container = document.getElementById('medical-records-target');
    if (!records || records.length === 0) {
      container.innerHTML = `<div class="glass-panel text-center" style="padding: 40px; color: var(--text-muted);">No diagnostics history on record.</div>`;
      return;
    }

    container.innerHTML = records.map(rec => {
      const dateFormatted = CareSyncViews.formatDate(rec.recordDate);
      const docsHtml = rec.relatedDocuments.map(doc => `
        <div class="document-item">
          <div class="doc-icon"><svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path></svg></div>
          <div class="doc-info">
            <h5>${doc.name}</h5>
            <span>${doc.size}</span>
          </div>
        </div>
      `).join('');

      return `
        <div class="record-card glass-panel">
          <div class="record-header-row">
            <div>
              <h3>${rec.diagnosis}</h3>
              <span class="record-date-label">Diagnostic Date: ${dateFormatted}</span>
            </div>
            <span class="badge badge-success">Verified Record</span>
          </div>
          
          <div class="record-body-row">
            <div class="record-meta-info">
              <div class="record-meta-row">
                <strong>Clinician:</strong>
                <span>${rec.doctorId.name}</span>
              </div>
              <div class="record-meta-row">
                <strong>Prescription:</strong>
                <span class="accent-time" style="color: var(--primary); font-weight: 500;">${rec.prescription}</span>
              </div>
              <div class="record-meta-row">
                <strong>Clinical Notes:</strong>
                <span>${rec.notes || 'No notes added'}</span>
              </div>
            </div>
            
            <div class="record-documents-area">
              <h5>Attached Files (${rec.relatedDocuments.length})</h5>
              <div class="documents-grid">
                ${docsHtml || '<span style="color: var(--text-muted); font-size:12px;">No document links attached.</span>'}
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  // Render Doctor Queue Tab (Doctor Clinic view)
  renderDoctorQueue: (appointments, onComplete, onCancel) => {
    const tbody = document.getElementById('doctor-queue-tbody');
    const activeAppts = appointments.filter(a => a.status === 'Scheduled');

    if (!activeAppts || activeAppts.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="no-data">No consultation sessions booked for today.</td></tr>`;
      return;
    }

    tbody.innerHTML = activeAppts.map(appt => {
      const dateFormatted = CareSyncViews.formatDateShort(appt.appointmentDate);
      return `
        <tr>
          <td><strong style="color: var(--text-primary);">${appt.patientId.name}</strong></td>
          <td>${dateFormatted} | <span style="color:var(--primary); font-weight:500;">${appt.appointmentTime}</span></td>
          <td><span style="font-size:13px; color: var(--text-secondary);">${appt.symptoms}</span></td>
          <td><span class="badge badge-warning">Awaiting</span></td>
          <td>
            <div style="display: flex; gap: 8px;">
              <button class="btn btn-sm btn-primary btn-q-complete" data-id="${appt._id}">Complete</button>
              <button class="btn btn-sm btn-outline danger-text btn-q-cancel" data-id="${appt._id}">Cancel</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('.btn-q-complete').forEach(btn => {
      btn.addEventListener('click', (e) => onComplete(e.currentTarget.getAttribute('data-id')));
    });

    tbody.querySelectorAll('.btn-q-cancel').forEach(btn => {
      btn.addEventListener('click', (e) => onCancel(e.currentTarget.getAttribute('data-id')));
    });
  },

  // Render Patient select in Doctor view
  renderPatientSelect: (patients) => {
    const select = document.getElementById('record-patient-select');
    if (!patients || patients.length === 0) {
      select.innerHTML = '<option value="">-- No Patients Available --</option>';
      return;
    }

    select.innerHTML = '<option value="">-- Choose Patient --</option>' + 
      patients.map(p => `<option value="${p.userId._id}">${p.userId.name} (Age: ${p.age})</option>`).join('');
  },

  // Render Admin Procurement Report Dashboard
  renderAdminDashboard: (statsData) => {
    const { metrics, departments, spendTrends, procurements } = statsData;

    // Metrics cards
    document.getElementById('admin-total-spend').innerText = CareSyncViews.formatCurrency(metrics.totalSpend);
    document.getElementById('admin-active-suppliers').innerText = metrics.activeSuppliers;
    document.getElementById('admin-purchase-orders').innerText = metrics.purchaseOrdersCount;
    document.getElementById('admin-cost-savings').innerText = CareSyncViews.formatCurrency(metrics.costSavings);

    // Supplier table
    const tbody = document.getElementById('suppliers-tbody');
    if (!procurements || procurements.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="no-data">No invoices recorded.</td></tr>`;
      return;
    }

    tbody.innerHTML = procurements.map(item => `
      <tr>
        <td>
          <div style="font-weight:600; display:flex; align-items:center; gap:8px;">
            <div class="patient-avatar" style="background:var(--primary-glow); color:var(--primary); font-size:10px; font-weight:700; width:28px; height:28px;">
              ${item.supplierName.substring(0, 2).toUpperCase()}
            </div>
            <span>${item.supplierName}</span>
          </div>
        </td>
        <td><span class="badge" style="background:rgba(255,255,255,0.03); color:var(--text-secondary); border:1px solid var(--border-color);">${item.category}</span></td>
        <td><strong>${item.itemsProvided}</strong></td>
        <td>${CareSyncViews.formatCurrency(item.totalSpend)}</td>
        <td><span style="color:var(--success); font-weight:600;">${item.leadTimeScore}</span></td>
        <td><button class="btn btn-sm btn-outline">Invoice</button></td>
      </tr>
    `).join('');

    // Recent purchase order cards
    const grid = document.getElementById('po-cards-grid');
    grid.innerHTML = procurements.slice(0, 4).map(item => {
      const orderDate = CareSyncViews.formatDateShort(item.orderDate);
      return `
        <div class="po-card glass-panel">
          <div class="po-card-top">
            <span class="po-id">PO-${Math.floor(1000 + Math.random() * 9000)}</span>
            <span class="badge badge-success">Fulfilled</span>
          </div>
          <h4>${item.supplierName}</h4>
          <p class="po-category">${item.category}</p>
          <div class="po-meta">
            <span class="date" style="color:var(--text-muted); font-size:12px;">${orderDate}</span>
            <span class="price">${CareSyncViews.formatCurrency(item.totalSpend)}</span>
          </div>
        </div>
      `;
    }).join('');
  },

  // Render Detailed Appointment view
  renderAppointmentDetails: (appt, onReschedule, onCancel, onChecklistToggle) => {
    document.getElementById('details-title').innerText = appt.doctorProfile && appt.doctorProfile.department === 'Cardiology' 
      ? 'Annual Cardiovascular Screening' 
      : `General Medical Consultation`;
    
    const dateFormatted = CareSyncViews.formatDate(appt.appointmentDate);
    document.getElementById('details-date-time').innerText = `${dateFormatted} | ${appt.appointmentTime} (45 mins)`;
    document.getElementById('details-appt-id').innerText = `ID: APT-${appt._id.substring(appt._id.length - 6).toUpperCase()}`;

    // Status Badge
    const badge = document.getElementById('details-status-badge');
    badge.innerText = appt.status;
    badge.className = 'badge'; // reset
    if (appt.status === 'Scheduled') badge.classList.add('badge-success');
    else if (appt.status === 'Completed') badge.classList.add('badge-success');
    else badge.classList.add('badge-danger');

    // Doctor profile details
    document.getElementById('details-doctor-avatar').innerText = CareSyncViews.getInitials(appt.doctorId.name);
    document.getElementById('details-doctor-name').innerText = appt.doctorId.name;
    document.getElementById('details-doctor-specialization').innerText = appt.doctorProfile ? appt.doctorProfile.specialization : 'Specialist';

    // Symptoms description
    document.getElementById('details-appt-symptoms').innerText = `"${appt.symptoms}"`;

    // History Timeline
    const timelineContainer = document.getElementById('details-timeline-target');
    timelineContainer.innerHTML = appt.history.map((log, index) => {
      const logDate = new Date(log.timestamp).toLocaleString();
      return `
        <div class="timeline-step ${index === appt.history.length - 1 ? 'active' : ''}">
          <div class="step-bullet"></div>
          <div class="step-content">
            <h5>${log.action}</h5>
            <p>${logDate}</p>
            <span>Performed by: ${log.performedBy}</span>
          </div>
        </div>
      `;
    }).join('');

    // Related Documents list
    const docsContainer = document.getElementById('details-documents-target');
    docsContainer.innerHTML = `
      <div class="document-item">
        <div class="doc-icon"><svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path></svg></div>
        <div class="doc-info">
          <h5>Previous_Lab_Results_Oct.pdf</h5>
          <span>PDF • 1.2 MB</span>
        </div>
      </div>
      <div class="document-item">
        <div class="doc-icon" style="color:var(--success); background:rgba(16,185,129,0.1);"><svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path></svg></div>
        <div class="doc-info">
          <h5>Insurance_Verification.png</h5>
          <span>IMAGE • 850 KB</span>
        </div>
      </div>
    `;

    // Bind reschedule and cancel clicks
    const reschBtn = document.getElementById('btn-details-reschedule');
    const cancelBtn = document.getElementById('btn-details-cancel');
    
    // Reset listeners by cloning buttons
    const newReschBtn = reschBtn.cloneNode(true);
    const newCancelBtn = cancelBtn.cloneNode(true);
    reschBtn.parentNode.replaceChild(newReschBtn, reschBtn);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

    // Hide actions if completed or cancelled
    if (appt.status !== 'Scheduled') {
      newReschBtn.classList.add('hidden');
      newCancelBtn.classList.add('hidden');
    } else {
      newReschBtn.classList.remove('hidden');
      newCancelBtn.classList.remove('hidden');
      newReschBtn.addEventListener('click', () => onReschedule(appt._id));
      newCancelBtn.addEventListener('click', () => onCancel(appt._id));
    }
  }
};
