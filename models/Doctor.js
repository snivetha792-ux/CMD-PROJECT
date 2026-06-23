const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema(
    {
        doctorId: {
            type: String,
            required: true,
            unique: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        password: {
            type: String,
            required: true
        },
        lastLoginAt: Date,
        loginCount: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Doctor", doctorSchema);
