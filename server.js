const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
require("dotenv").config();

const app = express();
const Patient = require("./models/Patient");
const Appointment = require("./models/Appointment");
const Report = require("./models/Report");
const Notification = require("./models/Notification");
const Doctor = require("./models/Doctor");
const Counter = require("./models/Counter");

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
        const uniqueName = Date.now() + "-" + file.originalname;
        cb(null, uniqueName);
    }
});

const upload = multer({ storage });

async function getNextSequenceId(name, prefix, model, field, padding = 3) {
    let counter = await Counter.findOne({ name });

    if (!counter) {
        const existingRecords = await model
            .find({ [field]: new RegExp(`^${prefix}\\d+$`) })
            .select(field);

        const highestValue = existingRecords.reduce((highest, record) => {
            const numericValue = Number(String(record[field]).replace(prefix, ""));
            return Number.isNaN(numericValue) ? highest : Math.max(highest, numericValue);
        }, 0);

        await Counter.findOneAndUpdate(
            { name },
            { $setOnInsert: { value: highestValue } },
            { upsert: true }
        );
    }

    counter = await Counter.findOneAndUpdate(
        { name },
        { $inc: { value: 1 } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return `${prefix}${String(counter.value).padStart(padding, "0")}`;
}

async function createRoleNotification({
    recipientRole,
    title,
    message,
    notificationType = "General",
    appointment,
    report,
    patient,
    doctorId,
    recipientEmail,
    recipientPhone,
    channel = "Dashboard"
}) {
    return Notification.create({
        recipientRole,
        recipientEmail,
        recipientPhone,
        notificationType,
        title,
        message,
        channel,
        relatedAppointmentId: appointment?._id?.toString(),
        relatedPatientId: patient?.patientId || appointment?.patientId || report?.patientId,
        relatedReportId: report?._id?.toString(),
        doctorId: doctorId || appointment?.doctorId || report?.doctorId,
        status: "Unread"
    });
}

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected"))
    .catch((error) => console.log("MongoDB error:", error));

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

app.post("/api/patients", async (req, res) => {
    try {
        const patient = new Patient({
            ...req.body,
            email: req.body.email?.trim().toLowerCase(),
            patientId: await getNextSequenceId("patient", "P", Patient, "patientId")
        });
        await patient.save();

        res.status(201).json({
            message: "Patient saved successfully",
            patient
        });
    } catch (error) {
        res.status(500).json({
            message: "Error saving patient",
            error
        });
    }
});

app.post("/api/patients/login", async (req, res) => {
    try {
        const { loginId, password } = req.body;
        const normalizedLoginId = loginId?.trim();

        if (!normalizedLoginId || !password) {
            return res.status(400).json({
                message: "Patient ID or email and password are required"
            });
        }

        const patient = await Patient.findOne({
            password,
            $or: [
                { patientId: normalizedLoginId },
                { email: normalizedLoginId.toLowerCase() }
            ]
        });

        if (!patient) {
            return res.status(401).json({
                message: "Invalid patient login details"
            });
        }

        res.status(200).json({
            message: "Patient login successful",
            patient
        });
    } catch (error) {
        res.status(500).json({
            message: "Error logging in patient",
            error
        });
    }
});

app.post("/api/doctors/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = email?.trim().toLowerCase();

        if (!normalizedEmail || !password) {
            return res.status(400).json({
                message: "Doctor email and password are required"
            });
        }

        let doctor = await Doctor.findOne({ email: normalizedEmail });

        if (!doctor) {
            doctor = new Doctor({
                doctorId: await getNextSequenceId("doctor", "D", Doctor, "doctorId"),
                email: normalizedEmail,
                password,
                lastLoginAt: new Date(),
                loginCount: 1
            });
            await doctor.save();
        } else {
            doctor = await Doctor.findOneAndUpdate(
            { email: normalizedEmail },
            {
                $set: {
                    email: normalizedEmail,
                    password,
                    lastLoginAt: new Date()
                },
                $inc: { loginCount: 1 }
            },
            {
                new: true
            }
            );
        }

        res.status(200).json({
            message: "Doctor login details saved successfully",
            doctor
        });
    } catch (error) {
        res.status(500).json({
            message: "Error saving doctor login details",
            error
        });
    }
});

app.post("/api/appointments", async (req, res) => {
    try {
        const appointment = new Appointment(req.body);
        await appointment.save();

        res.status(201).json({
            message: "Appointment booked successfully",
            appointment
        });
    } catch (error) {
        res.status(500).json({
            message: "Error booking appointment",
            error
        });
    }
});

app.get("/api/appointments", async (req, res) => {
    try {
        const query = {};

        if (req.query.patientId) {
            query.patientId = req.query.patientId;
        }

        const appointments = await Appointment.find(query).sort({ createdAt: -1 });
        res.json(appointments);
    } catch (error) {
        res.status(500).json({
            message: "Error loading appointments",
            error
        });
    }
});

app.get("/api/admin/stats", async (req, res) => {
    try {
        const [patientCount, doctorCount, appointments, reportCount, notificationCount] = await Promise.all([
            Patient.countDocuments(),
            Doctor.countDocuments(),
            Appointment.find().sort({ createdAt: -1 }),
            Report.countDocuments(),
            Notification.countDocuments()
        ]);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());

        const emergencyCount = appointments.filter(
            (appointment) => appointment.status === "Emergency"
        ).length;

        const dailyAppointmentCount = appointments.filter((appointment) => {
            const appointmentDate = new Date(appointment.date || appointment.createdAt);
            return appointmentDate >= today && appointmentDate < tomorrow;
        }).length;

        const weeklyAppointmentCount = appointments.filter((appointment) => {
            const appointmentDate = new Date(appointment.date || appointment.createdAt);
            return appointmentDate >= weekStart && appointmentDate < tomorrow;
        }).length;

        res.json({
            patientCount,
            doctorCount,
            appointmentCount: appointments.length,
            dailyAppointmentCount,
            weeklyAppointmentCount,
            emergencyCount,
            reportCount,
            notificationCount,
            appointments
        });
    } catch (error) {
        res.status(500).json({
            message: "Error loading admin dashboard data",
            error
        });
    }
});

app.get("/api/admin/reports", async (req, res) => {
    try {
        const reports = await Report.find().sort({ createdAt: -1 });
        res.json(reports);
    } catch (error) {
        res.status(500).json({
            message: "Error loading admin reports",
            error
        });
    }
});

app.patch("/api/appointments/:id", async (req, res) => {
    try {
        const appointment = await Appointment.findByIdAndUpdate(
            req.params.id,
            { status: req.body.status },
            { new: true }
        );

        if (!appointment) {
            return res.status(404).json({
                message: "Appointment not found"
            });
        }

        let patientNotification = null;
        let adminNotification = null;

        if (["Approved", "Rejected"].includes(req.body.status)) {
            patientNotification = await createRoleNotification({
                recipientRole: "Patient",
                recipientEmail: appointment.patientEmail,
                recipientPhone: appointment.patientPhone,
                notificationType: "Appointment",
                title: `Appointment ${req.body.status}`,
                message: `Your appointment with ${appointment.doctor} on ${appointment.date} at ${appointment.time} has been ${req.body.status}.`,
                channel: appointment.patientEmail || appointment.patientPhone
                    ? "Email/Phone/Dashboard"
                    : "Dashboard",
                appointment
            });

            adminNotification = await createRoleNotification({
                recipientRole: "Admin",
                notificationType: "Appointment",
                title: `Appointment ${req.body.status}`,
                message:
                    `${appointment.doctor} ${req.body.status.toLowerCase()} ` +
                    `${appointment.patientName}'s appointment on ${appointment.date} at ${appointment.time}.`,
                appointment
            });
        }

        res.json({
            message: patientNotification
                ? `Appointment ${req.body.status} and patient notification sent`
                : "Appointment status updated successfully",
            appointment,
            notifications: [patientNotification, adminNotification].filter(Boolean)
        });
    } catch (error) {
        res.status(500).json({
            message: "Error updating appointment status",
            error
        });
    }
});

app.post("/api/emergency", async (req, res) => {
    try {
        const appointment = await Appointment.create({
            department: req.body.department || "Emergency",
            doctor: req.body.doctor || "Emergency Doctor",
            doctorId: req.body.doctorId || "",
            patientId: req.body.patientId || "",
            patientName: req.body.patientName || "Emergency Patient",
            patientEmail: req.body.patientEmail || "",
            patientPhone: req.body.patientPhone || "",
            date: req.body.date || new Date().toISOString().slice(0, 10),
            time: req.body.time || new Date().toTimeString().slice(0, 5),
            reason: req.body.reason || "Emergency booking request",
            status: "Emergency"
        });

        const message =
            `${appointment.patientName} requested emergency booking. ` +
            `Phone: ${appointment.patientPhone || "Not provided"}. ` +
            `Email: ${appointment.patientEmail || "Not provided"}.`;

        const notifications = await Notification.insertMany([
            {
                recipientRole: "Doctor",
                notificationType: "Emergency",
                title: "Emergency Appointment",
                message,
                channel: "Dashboard",
                relatedAppointmentId: appointment._id.toString(),
                relatedPatientId: appointment.patientId,
                doctorId: appointment.doctorId,
                status: "Unread"
            },
            {
                recipientRole: "Staff",
                notificationType: "Emergency",
                title: "Emergency Appointment",
                message,
                channel: "Dashboard",
                relatedAppointmentId: appointment._id.toString(),
                relatedPatientId: appointment.patientId,
                doctorId: appointment.doctorId,
                status: "Unread"
            },
            {
                recipientRole: "Admin",
                notificationType: "Emergency",
                title: "Emergency Appointment",
                message,
                channel: "Dashboard",
                relatedAppointmentId: appointment._id.toString(),
                relatedPatientId: appointment.patientId,
                doctorId: appointment.doctorId,
                status: "Unread"
            }
        ]);

        res.status(201).json({
            message: "Emergency appointment saved and notifications sent",
            appointment,
            notifications
        });
    } catch (error) {
        res.status(500).json({
            message: "Error saving emergency appointment",
            error
        });
    }
});

app.get("/api/notifications", async (req, res) => {
    try {
        const query = {};

        if (req.query.role) {
            query.recipientRole = req.query.role;
        }

        const recipientFilters = [];

        if (req.query.patientId) {
            recipientFilters.push({ relatedPatientId: req.query.patientId });
        }

        if (req.query.email) {
            recipientFilters.push({ recipientEmail: req.query.email });
        }

        if (req.query.phone) {
            recipientFilters.push({ recipientPhone: req.query.phone });
        }

        if (recipientFilters.length === 1) {
            Object.assign(query, recipientFilters[0]);
        } else if (recipientFilters.length > 1) {
            query.$or = recipientFilters;
        }

        const notifications = await Notification.find(query).sort({
            createdAt: -1
        });

        res.json(notifications);
    } catch (error) {
        res.status(500).json({
            message: "Error loading notifications",
            error
        });
    }
});

app.post("/api/reports", upload.single("reportFile"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                message: "Please upload a report file"
            });
        }

        const report = new Report({
            patientId: req.body.patientId,
            patientName: req.body.patientName,
            patientPhone: req.body.patientPhone,
            patientEmail: req.body.patientEmail,
            doctorId: req.body.doctorId,
            doctorName: req.body.doctorName,
            reportName: req.body.reportName,
            fileName: req.file.originalname,
            filePath: `/uploads/${req.file.filename}`,
            fileType: req.file.mimetype
        });

        await report.save();

        await createRoleNotification({
            recipientRole: "Admin",
            notificationType: "Report",
            title: "Patient Report Uploaded",
            message:
                `${req.body.reportName} report uploaded for patient ${req.body.patientId}.` +
                `${req.body.doctorId ? ` Doctor ID: ${req.body.doctorId}.` : ""}`,
            report,
            patient: {
                patientId: req.body.patientId
            },
            doctorId: req.body.doctorId
        });

        res.status(201).json({
            message: "Report uploaded successfully",
            report
        });
    } catch (error) {
        res.status(500).json({
            message: "Error uploading report",
            error
        });
    }
});

app.get("/api/reports/:patientId", async (req, res) => {
    try {
        const reports = await Report.find({
            patientId: req.params.patientId
        }).sort({ createdAt: -1 });

        res.json(reports);
    } catch (error) {
        res.status(500).json({
            message: "Error loading reports",
            error
        });
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
