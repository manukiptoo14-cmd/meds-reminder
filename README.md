# Meds Reminder

A calm, accessible medication reminder app designed to support patients and trusted family caregivers.

## Features

- Add medications with dose, time, and repeat schedule
- Daily and weekly reminder planning
- Large, clear interface with simple actions
- “Taken” and “Mark missed” controls
- Caregiver alert log for missed doses
- Browser notification support for reminders
- Medication history tracking
- Local browser storage so the schedule remains available on the same device

## Purpose

This app is built for patients who need consistent reminders and for family members who want reassurance that a medication was missed or taken.

## Run locally

Because this is a lightweight client-side app, you can run it with any local static web server.

### Option 1: Python

```bash
cd meds-reminder
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

### Option 2: VS Code Live Server

Open the folder in VS Code and run the app with a static preview or Live Server extension.

## App overview

- Add medication names, dosages, times, and caregiver contact details.
- Mark medications as taken when the patient confirms them.
- If a reminder is missed, the app logs the missed dose and adds a caregiver alert.
- Weekly or daily reminders can be adjusted in the medication form.

## Suggested next improvements

- Add SMS or email caregiver notifications
- Create a login for patient and caregiver accounts
- Add an admin dashboard for multiple family members
- Add refill reminders and side effect tracking
- Add mobile install support with a PWA

## License

MIT
