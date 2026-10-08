const STORAGE_KEY = 'meds-reminder-data-v1';

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const defaultState = {
  medications: [
    {
      id: crypto.randomUUID(),
      name: 'Tamoxifen',
      dose: '20 mg',
      time: '08:00',
      repeat: 'daily',
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      caregiverName: 'Sarah',
      caregiverContact: 'Please call if missed',
      notes: 'Take with breakfast',
      history: [
        { date: getDateKey(new Date()), status: 'taken', time: '08:00' }
      ],
      lastTakenAt: getDateKey(new Date())
    },
    {
      id: crypto.randomUUID(),
      name: 'Vitamin D',
      dose: '1000 IU',
      time: '18:30',
      repeat: 'daily',
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      caregiverName: 'Michael',
      caregiverContact: 'Text if missed',
      notes: 'With dinner',
      history: [],
      lastTakenAt: null
    }
  ],
  alerts: [
    {
      id: crypto.randomUUID(),
      medicationId: null,
      medicationName: 'Tamoxifen',
      message: 'Missed dose was recorded. Caregiver has been notified.',
      time: new Date().toISOString(),
      status: 'caregiver'
    }
  ]
};

let state = loadState();
let notificationPermissionRequested = false;

const summaryCardsEl = document.getElementById('summaryCards');
const medicationForm = document.getElementById('medicationForm');
const upcomingListEl = document.getElementById('upcomingList');
const medicineListEl = document.getElementById('medicineList');
const caregiverAlertsEl = document.getElementById('caregiverAlerts');
const historyListEl = document.getElementById('historyList');
const enableNotificationsBtn = document.getElementById('enableNotificationsBtn');

initialize();

function initialize() {
  hydrateFormDefaults();
  medicationForm.addEventListener('submit', handleSubmit);
  enableNotificationsBtn.addEventListener('click', requestNotificationPermission);
  render();
  setInterval(() => {
    checkReminders();
    render();
  }, 30000);
  checkReminders();
}

function hydrateFormDefaults() {
  const timeInput = document.getElementById('medTime');
  if (timeInput && !timeInput.value) {
    timeInput.value = '09:00';
  }
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return structuredClone(defaultState);

  try {
    const parsed = JSON.parse(raw);
    return {
      medications: Array.isArray(parsed.medications) ? parsed.medications : structuredClone(defaultState.medications),
      alerts: Array.isArray(parsed.alerts) ? parsed.alerts : structuredClone(defaultState.alerts)
    };
  } catch (error) {
    console.error('Could not parse saved state', error);
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getDateKey(date) {
  const normalized = new Date(date);
  return normalized.toISOString().slice(0, 10);
}

function handleSubmit(event) {
  event.preventDefault();

  const formData = new FormData(medicationForm);
  const selectedDays = Array.from(document.querySelectorAll('#daysOfWeek input:checked')).map((input) => input.value);

  const medication = {
    id: crypto.randomUUID(),
    name: String(formData.get('name')).trim(),
    dose: String(formData.get('dose')).trim(),
    time: formData.get('time'),
    repeat: formData.get('repeat') || 'daily',
    days: selectedDays.length ? selectedDays : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    caregiverName: String(formData.get('caregiverName')).trim() || 'Family member',
    caregiverContact: String(formData.get('caregiverContact')).trim() || 'Contact caregiver',
    notes: String(formData.get('notes')).trim(),
    history: [],
    lastTakenAt: null
  };

  if (!medication.name || !medication.dose || !medication.time) {
    alert('Medication name, dose, and time are required.');
    return;
  }

  state.medications.push(medication);
  saveState();
  medicationForm.reset();
  hydrateFormDefaults();
  render();
}

function render() {
  renderSummary();
  renderUpcomingReminders();
  renderMedicationList();
  renderCaregiverAlerts();
  renderHistory();
}

function renderSummary() {
  const totalMeds = state.medications.length;
  const takenToday = state.medications.filter((med) => {
    const lastTaken = med.lastTakenAt;
    return lastTaken === getDateKey(new Date());
  }).length;
  const missedToday = state.medications.filter((med) => {
    const todaysHistory = med.history.filter((entry) => entry.date === getDateKey(new Date()) && entry.status === 'missed');
    return todaysHistory.length > 0;
  }).length;
  const nextReminder = getNextReminder();

  const cards = [
    { label: 'Medications', value: totalMeds },
    { label: 'Taken today', value: takenToday },
    { label: 'Missed today', value: missedToday },
    { label: 'Next reminder', value: nextReminder || 'No reminders' }
  ];

  summaryCardsEl.innerHTML = '';
  cards.forEach((card) => {
    const template = document.getElementById('summaryCardTemplate');
    const clone = template.content.cloneNode(true);
    clone.querySelector('.summary-label').textContent = card.label;
    clone.querySelector('.summary-value').textContent = card.value;
    summaryCardsEl.appendChild(clone);
  });
}

function renderUpcomingReminders() {
  const upcoming = state.medications
    .map((med) => ({
      med,
      nextTime: calculateNextOccurrence(med)
    }))
    .filter((entry) => entry.nextTime)
    .sort((a, b) => a.nextTime.localeCompare(b.nextTime))
    .slice(0, 5);

  if (!upcoming.length) {
    upcomingListEl.innerHTML = '<div class="empty-state">No upcoming reminders yet.</div>';
    return;
  }

  upcomingListEl.innerHTML = upcoming
    .map(({ med, nextTime }) => `
      <div class="list-item">
        <div>
          <span class="status upcoming">Upcoming</span>
          <h3>${escapeHtml(med.name)}</h3>
          <p>${escapeHtml(med.dose)} • ${formatDisplayTime(med.time)} • ${escapeHtml(med.caregiverName)}</p>
        </div>
        <div>
          <p><strong>${escapeHtml(nextTime)}</strong></p>
        </div>
      </div>
    `)
    .join('');
}

function renderMedicationList() {
  if (!state.medications.length) {
    medicineListEl.innerHTML = '<div class="empty-state">Add a medication to begin building the schedule.</div>';
    return;
  }

  medicineListEl.innerHTML = state.medications
    .map((med) => {
      const todayStatus = getMedicationStatusForToday(med);
      const statusClass = todayStatus.status;
      const takenButton = `
        <button class="action-button" data-action="taken" data-id="${med.id}">Taken</button>
      `;
      const missedButton = `
        <button class="action-button warning" data-action="missed" data-id="${med.id}">Mark missed</button>
      `;

      return `
        <div class="list-item">
          <div>
            <span class="status ${statusClass}">${todayStatus.label}</span>
            <h3>${escapeHtml(med.name)}</h3>
            <p>${escapeHtml(med.dose)} • ${formatDisplayTime(med.time)}</p>
            <p>${escapeHtml(med.notes || 'No notes')}</p>
            <p>Caregiver: ${escapeHtml(med.caregiverName)} • ${escapeHtml(med.caregiverContact)}</p>
            <div class="item-actions">
              ${takenButton}
              ${missedButton}
            </div>
          </div>
        </div>
      `;
    })
    .join('');

  medicineListEl.querySelectorAll('[data-action]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset.id;
      const action = button.dataset.action;
      handleMedicationAction(id, action);
    });
  });
}

function renderCaregiverAlerts() {
  if (!state.alerts.length) {
    caregiverAlertsEl.innerHTML = '<div class="empty-state">No missed dose alerts yet.</div>';
    return;
  }

  caregiverAlertsEl.innerHTML = state.alerts
    .slice()
    .reverse()
    .map((alert) => `
      <div class="list-item">
        <div>
          <span class="status caregiver">Caregiver alert</span>
          <h3>${escapeHtml(alert.medicationName || 'Medication')}</h3>
          <p>${escapeHtml(alert.message)}</p>
          <p>${new Date(alert.time).toLocaleString()}</p>
        </div>
      </div>
    `)
    .join('');
}

function renderHistory() {
  const allEntries = state.medications
    .flatMap((med) => med.history.map((entry) => ({ ...entry, medicationName: med.name })))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  if (!allEntries.length) {
    historyListEl.innerHTML = '<div class="empty-state">No medication history yet.</div>';
    return;
  }

  historyListEl.innerHTML = allEntries
    .map((entry) => `
      <div class="list-item">
        <div>
          <span class="status ${entry.status === 'missed' ? 'missed' : 'taken'}">${entry.status}</span>
          <h3>${escapeHtml(entry.medicationName)}</h3>
          <p>${escapeHtml(entry.date)} • ${escapeHtml(entry.time || 'No time')}</p>
        </div>
      </div>
    `)
    .join('');
}

function handleMedicationAction(medicationId, action) {
  const medication = state.medications.find((item) => item.id === medicationId);
  if (!medication) return;

  const dateKey = getDateKey(new Date());
  const status = action === 'taken' ? 'taken' : 'missed';

  medication.history = medication.history.filter((entry) => !(entry.date === dateKey && entry.medicationId === medication.id));
  medication.history.push({
    date: dateKey,
    time: medication.time,
    status,
    medicationId: medication.id
  });

  if (action === 'taken') {
    medication.lastTakenAt = dateKey;
    medication.missed = false;
  }

  if (action === 'missed') {
    medication.lastTakenAt = null;
    state.alerts.push({
      id: crypto.randomUUID(),
      medicationId: medication.id,
      medicationName: medication.name,
      message: `${medication.name} was missed at ${formatDisplayTime(medication.time)}. Caregiver alert sent.`,
      time: new Date().toISOString(),
      status: 'caregiver'
    });
  }

  saveState();
  render();
}

function getMedicationStatusForToday(medication) {
  const todayKey = getDateKey(new Date());
  const entry = medication.history.find((item) => item.date === todayKey);
  if (entry?.status === 'taken') {
    return { label: 'Taken', status: 'taken' };
  }
  if (entry?.status === 'missed') {
    return { label: 'Missed', status: 'missed' };
  }
  return { label: 'Upcoming', status: 'upcoming' };
}

function calculateNextOccurrence(medication) {
  const today = new Date();
  const [hours, minutes] = medication.time.split(':').map(Number);
  const medDays = medication.days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const start = new Date(today);
  start.setHours(hours, minutes, 0, 0);

  if (medication.repeat === 'daily') {
    if (start > today) return start.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
    const tomorrow = new Date(start);
    tomorrow.setDate(start.getDate() + 1);
    return tomorrow.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
  }

  for (let offset = 0; offset < 8; offset += 1) {
    const candidate = new Date(today);
    candidate.setDate(today.getDate() + offset);
    candidate.setHours(hours, minutes, 0, 0);
    const dayName = dayNames[candidate.getDay()];
    if (medDays.includes(dayName)) {
      if (candidate > today) {
        return candidate.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
      }
    }
  }

  return null;
}

function getNextReminder() {
  const nextEntries = state.medications
    .map((med) => ({ med, next: calculateNextOccurrence(med) }))
    .filter((entry) => entry.next)
    .sort((a, b) => new Date(a.next).getTime() - new Date(b.next).getTime());

  if (!nextEntries.length) return null;
  return new Date(nextEntries[0].next).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function checkReminders() {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  for (const med of state.medications) {
    const medMinutes = timeStringToMinutes(med.time);
    const diff = currentTime - medMinutes;

    if (diff >= 0 && diff <= 10) {
      const todayKey = getDateKey(now);
      const hasEntry = med.history.some((entry) => entry.date === todayKey);
      if (!hasEntry) {
        med.history.push({
          date: todayKey,
          time: med.time,
          status: 'missed',
          medicationId: med.id
        });

        state.alerts.push({
          id: crypto.randomUUID(),
          medicationId: med.id,
          medicationName: med.name,
          message: `Reminder: ${med.name} (${med.dose}) was not confirmed at ${formatDisplayTime(med.time)}.`,
          time: new Date().toISOString(),
          status: 'caregiver'
        });

        showBrowserNotification(med);
      }
    }
  }

  saveState();
}

function showBrowserNotification(medication) {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    new Notification('Medication reminder', {
      body: `${medication.name} (${medication.dose}) is due now.`,
      tag: medication.id
    });
  }
}

async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    alert('This browser does not support web notifications.');
    return;
  }

  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    enableNotificationsBtn.textContent = 'Notifications enabled';
    new Notification('Meds Reminder ready', {
      body: 'You will now receive reminder notifications.'
    });
  } else {
    enableNotificationsBtn.textContent = 'Permission denied';
  }
}

function timeStringToMinutes(value) {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

function formatDisplayTime(value) {
  const [hours, minutes] = value.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
