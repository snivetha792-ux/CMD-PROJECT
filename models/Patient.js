const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema(
    {
        patientId: {
            type: String,
            unique: true,
            sparse: true
        },
        name: String,
        email: String,
        phone: String,
        age: Number,
        gender: String,
        address: String,
        password: String
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Patient", patientSchema);
