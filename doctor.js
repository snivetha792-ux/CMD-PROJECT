const API_URL = "http://localhost:5000";

function loadDoctorDetails() {
    const doctor = JSON.parse(localStorage.getItem("loggedInDoctor") || "null");

    if (!doctor) {
        document.getElementById("doctorDetails").innerHTML =
            "Doctor details not found. Please login again.";
        return;
    }

    document.getElementById("doctorDetails").innerHTML = `
        <strong>Doctor ID:</strong> ${doctor.doctorId}
        <strong>Email:</strong> ${doctor.email}
    `;
}

async function loadDoctorAppointments() {
    try {
        const response = await fetch(`${API_URL}/api/appointments`);
        const appointments = await response.json();

        let html = "";

        appointments.forEach((appointment) => {
            html += `
            <tr>
                <td>${appointment.department}</td>
                <td>${appointment.doctor}</td>
                <td>${appointment.date}</td>
                <td>${appointment.time}</td>
                <td>${appointment.reason}</td>
                <td id="status-${appointment._id}">${appointment.status}</td>
                <td>
                    <button onclick="updateAppointmentStatus('${appointment._id}', 'Approved')">
                        Approve
                    </button>
                </td>
                <td>
                    <button onclick="updateAppointmentStatus('${appointment._id}', 'Rejected')">
                        Reject
                    </button>
                </td>
            </tr>
            `;
        });

        document.getElementById("appointmentTableBody").innerHTML =
            html || "<tr><td colspan='8'>No appointments found</td></tr>";
    } catch (error) {
        document.getElementById("message").innerHTML =
            "Unable to load appointments";
    }
}

async function updateAppointmentStatus(id, status) {
    try {
        const response = await fetch(`${API_URL}/api/appointments/${id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ status })
        });

        const data = await response.json();

        if (!response.ok) {
            document.getElementById("message").innerHTML =
                data.message || "Status update failed";
            return;
        }

        document.getElementById(`status-${id}`).innerHTML = status;
        document.getElementById("message").innerHTML =
            `Appointment ${status} Successfully`;
    } catch (error) {
        document.getElementById("message").innerHTML =
            "Backend server is not connected";
    }
}

async function loadDoctorNotifications() {
    try {
        const response = await fetch(
            `${API_URL}/api/notifications?role=Doctor`
        );
        const notifications = await response.json();

        let html = "";

        notifications.forEach((item) => {
            html += `
            <div class="report-card emergency-report-card">
                <h3>${item.title}</h3>
                <p>${item.message}</p>
                ${item.relatedPatientId ? `<p>Patient ID: ${item.relatedPatientId}</p>` : ""}
                ${item.doctorId ? `<p>Doctor ID: ${item.doctorId}</p>` : ""}
                <p>Date: ${new Date(item.createdAt).toLocaleString()}</p>
            </div>
            `;
        });

        document.getElementById("doctorNotifications").innerHTML =
            html || "No emergency notifications found";
    } catch (error) {
        document.getElementById("doctorNotifications").innerHTML =
            "Backend server is not connected";
    }
}

function approveAppointment(id) {

    document.getElementById(id).innerHTML =
        "Approved";

    document.getElementById("message").innerHTML =
        "✅ Appointment Approved Successfully!";
}

function rejectAppointment(id) {

    document.getElementById(id).innerHTML =
        "Rejected";

    document.getElementById("message").innerHTML =
        "❌ Appointment Rejected!";
}
async function doctorViewReports(){

    let patientId =
    document.getElementById(
    "doctorPatientId"
    ).value;

    if (!patientId) {
        alert("Enter Patient ID");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/reports/${patientId}`);
        const reports = await response.json();

        let html="";

        reports.forEach(report=>{
            const isImage = report.fileType && report.fileType.startsWith("image/");

            html += `

            <div class="report-card">
                ${
                    isImage
                        ? `<img class="report-preview" src="${report.filePath}" alt="${report.reportName}">`
                        : `<div class="report-preview report-file-preview">${report.fileType || "Report File"}</div>`
                }

                <h3>
                ${report.reportName}
                </h3>

                <p>
                Patient ID:
                ${report.patientId}
                </p>

                <p>
                Doctor ID:
                ${report.doctorId || "Not added"}
                </p>

                <p>
                Date:
                ${new Date(report.createdAt).toLocaleDateString()}
                </p>

                <a href="${report.filePath}"
                target="_blank">

                Open Report

                </a>

            </div>

            `;
        });

        document.getElementById(
        "doctorReports"
        ).innerHTML = html || "No reports found";
    } catch (error) {
        document.getElementById(
        "doctorReports"
        ).innerHTML = "Backend server is not connected";
    }
}

loadDoctorAppointments();
loadDoctorNotifications();
loadDoctorDetails();
