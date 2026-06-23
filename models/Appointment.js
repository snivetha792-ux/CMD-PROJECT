const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
    {
        department: String,
        doctor: String,
        doctorId: String,
        patientId: String,
        patientName: String,
        patientEmail: String,
        patientPhone: String,
        date: String,
        time: String,
        reason: String,
        status: {
            type: String,
            default: "Pending"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Appointment", appointmentSchema);
