const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
    {
        patientId: {
            type: String,
            required: true
        },
        patientName: String,
        patientPhone: String,
        patientEmail: String,
        doctorId: String,
        doctorName: String,
        reportName: {
            type: String,
            required: true
        },
        fileName: String,
        filePath: String,
        fileType: String
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Report", reportSchema);
