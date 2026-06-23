const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        recipientRole: {
            type: String,
            required: true
        },
        recipientEmail: String,
        recipientPhone: String,
        notificationType: {
            type: String,
            default: "General"
        },
        title: {
            type: String,
            required: true
        },
        message: {
            type: String,
            required: true
        },
        channel: {
            type: String,
            default: "Dashboard"
        },
        relatedAppointmentId: String,
        relatedPatientId: String,
        relatedReportId: String,
        doctorId: String,
        status: {
            type: String,
            default: "Unread"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Notification", notificationSchema);
