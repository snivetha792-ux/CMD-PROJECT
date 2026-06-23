# CMD Hospital Management System

CMD Hospital Management System is a Node.js, Express and MongoDB project for patient registration, patient login, doctor login, appointment booking, appointment approval/rejection, notifications and report uploads.

## Features

- Patient registration with automatic Patient ID generation, such as `P001`, `P002`.
- Patient login using either email or Patient ID with password.
- Doctor login using email and password, with automatic Doctor ID generation, such as `D001`, `D002`.
- Patient dashboard shows the logged-in patient profile details.
- Patient dashboard loads previous appointments from MongoDB using the logged-in Patient ID.
- Patient dashboard loads appointment approval/rejection notifications using Patient ID, email or phone number.
- Doctor dashboard can approve or reject appointments.
- When a doctor approves or rejects an appointment, a notification is saved for that patient.
- Patient report upload and report viewing by Patient ID.
- Admin dashboard stats and report view.

## Setup

1. Install dependencies:

```bash
node.js installation-node.org(broweser)
npm install
npm install express
npm install express mongoose
```

2. Add MongoDB connection string in `.env`:

```env
MONGO_URI=your_mongodb_connection_string
```

3. Start the server:

```bash
npm start
node server.js
```

4. Open the app:

```text
http://localhost:5000
```

## Login Flow

### Patient

Patients can login with:

- Patient ID and password
- Email and password

After login, the patient dashboard automatically shows:

- Patient name
- Patient ID
- Already booked appointments
- Appointment status notifications

### Doctor

Doctors can login with:

- Email and password

If the doctor email is new, the app creates a new Doctor ID automatically. If the same email logs in again, the same doctor record is reused.

## Appointment Notification Flow

1. Patient books an appointment from the patient dashboard.
2. Appointment is stored in MongoDB with the patient ID.
3. Doctor opens the doctor dashboard.
4. Doctor approves or rejects the appointment.
5. A notification is stored for that patient.
6. Patient logs in with Patient ID or email.
7. Patient dashboard shows the appointment history and notifications.
