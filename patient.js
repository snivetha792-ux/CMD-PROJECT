// Appointment Form

const API_URL = "https://cmd-project.onrender.com";
function getLoggedInPatient() {
    return JSON.parse(localStorage.getItem("loggedInPatient") || "null");
}

function fillPatientDetails() {
    const patient = getLoggedInPatient();

    if (!patient) {
        return;
    }

    document.getElementById("profileName").innerHTML = patient.name || "Patient";
    document.getElementById("profilePatientId").innerHTML = patient.patientId || "-";
    document.getElementById("patientName").value = patient.name || "";
    document.getElementById("patientId").value = patient.patientId || "";
    document.getElementById("patientEmail").value = patient.email || "";
    document.getElementById("patientPhone").value = patient.phone || "";
    document.getElementById("notificationEmail").value = patient.email || "";
    document.getElementById("notificationPhone").value = patient.phone || "";
    document.getElementById("notificationPatientId").value = patient.patientId || "";
    document.getElementById("uploadPatientId").value = patient.patientId || "";
    document.getElementById("searchPatient").value = patient.patientId || "";
}

async function loadPatientDashboardData() {
    const patient = getLoggedInPatient();

    if (!patient?.patientId) {
        loadAppointments([]);
        return;
    }

    await Promise.all([
        loadAppointments(patient.patientId),
        loadPatientNotifications()
    ]);
}

document.getElementById("appointmentForm")
    .addEventListener("submit", async function (e) {

        e.preventDefault();
        const patient = getLoggedInPatient();

        let appointment = {

            department:
                document.getElementById("department").value,

            doctor:
                document.getElementById("doctor").value,

            patientId:
                document.getElementById("patientId").value || patient?.patientId || "",

            patientName:
                document.getElementById("patientName").value,

            patientEmail:
                document.getElementById("patientEmail").value,

            patientPhone:
                document.getElementById("patientPhone").value,

            date:
                document.getElementById("date").value,

            time:
                document.getElementById("time").value,

            reason:
                document.getElementById("reason").value,

            status: "Pending"
        };

        document.getElementById("notificationEmail").value =
            appointment.patientEmail;

        document.getElementById("notificationPhone").value =
            appointment.patientPhone;

        document.getElementById("notificationPatientId").value =
            appointment.patientId;

        try {
            const response = await fetch(`${API_URL}/api/appointments`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(appointment)
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.message || "Appointment booking failed");
                return;
            }

            alert(data.message);
        } catch (error) {
            alert("Backend server or MongoDB is not connected");
            return;
        }

        document.getElementById("notification")
            .innerHTML =
            "Appointment Submitted Successfully";

        document.getElementById("appointmentForm")
            .reset();

        fillPatientDetails();
        loadPatientDashboardData();
    });


// Load Appointments

async function loadAppointments(patientId) {
    let appointments = [];

    if (patientId) {
        try {
            const response = await fetch(
                `${API_URL}/api/appointments?patientId=${encodeURIComponent(patientId)}`
            );
            appointments = await response.json();
        } catch (error) {
            document.getElementById("appointmentHistory").innerHTML =
                "Unable to load appointments";
            return;
        }
    }

    document.getElementById("appointmentCount")
        .innerHTML =
        appointments.length;

    let output = "";

    appointments.forEach(app => {

        output += `
        <div class="history-card">

            <h3>${app.department}</h3>

            <p>Doctor:
            ${app.doctor}</p>

            <p>Date:
            ${app.date}</p>

            <p>Time:
            ${app.time}</p>

            <p>Status:
            ${app.status}</p>

        </div>
        `;
    });

    document.getElementById(
        "appointmentHistory"
    ).innerHTML = output || "No appointments found";

    if (appointments.length > 0) {

        let latest =
            appointments[
            0
            ];

        document.getElementById(
            "upcomingAppointment"
        ).innerHTML =
            latest.date + " " + latest.time;
    } else {
        document.getElementById(
            "upcomingAppointment"
        ).innerHTML = "No Appointment";
    }
}


// Emergency Booking

function emergencyBooking() {
    const patientName =
        document.getElementById("patientName")?.value || "Patient";

    const patientEmail =
        document.getElementById("patientEmail")?.value || "";

    const patientPhone =
        document.getElementById("patientPhone")?.value || "";

    const emergencyAppointment = {
        department: document.getElementById("department")?.value || "Emergency",
        doctor: document.getElementById("doctor")?.value || "Emergency Doctor",
        patientId: document.getElementById("patientId")?.value || "",
        patientName,
        patientEmail,
        patientPhone,
        date: document.getElementById("date")?.value || "",
        time: document.getElementById("time")?.value || "",
        reason: document.getElementById("reason")?.value || "Emergency booking request"
    };

    document.getElementById("notificationEmail").value = patientEmail;
    document.getElementById("notificationPhone").value = patientPhone;

    fetch(`${API_URL}/api/emergency`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(emergencyAppointment)
    })
        .then((response) => response.json())
        .then((data) => {
            alert(data.message || "Emergency Request Sent!");
            document.getElementById("notification").innerHTML =
                "Emergency Request Submitted";

            if (data.appointment) {
                document.getElementById("notificationPatientId").value =
                    data.appointment.patientId || "";
            }

            loadPatientDashboardData();
        })
        .catch(() => {
            alert("Backend server is not connected");
        });
}

async function loadPatientNotifications() {
    const email = document.getElementById("notificationEmail").value;
    const phone = document.getElementById("notificationPhone").value;
    const patientId = document.getElementById("notificationPatientId").value;

    if (!patientId && !email && !phone) {
        alert("Enter Patient ID, Email or Phone Number");
        return;
    }

    let url = `${API_URL}/api/notifications?role=Patient`;

    if (patientId) {
        url += `&patientId=${encodeURIComponent(patientId)}`;
    }

    if (email) {
        url += `&email=${encodeURIComponent(email)}`;
    }

    if (phone) {
        url += `&phone=${encodeURIComponent(phone)}`;
    }

    try {
        const response = await fetch(url);
        const notifications = await response.json();

        let output = "";

        notifications.forEach((item) => {
            output += `
            <div class="report-card">
                <h3>${item.title}</h3>
                <p>${item.message}</p>
                <p>Channel: ${item.channel}</p>
                <p>Date: ${new Date(item.createdAt).toLocaleString()}</p>
            </div>
            `;
        });

        document.getElementById("patientNotifications").innerHTML =
            output || "No notifications found";
    } catch (error) {
        document.getElementById("patientNotifications").innerHTML =
            "Backend server is not connected";
    }
}

fillPatientDetails();
loadPatientDashboardData();

async function uploadPatientReport() {
    let patientId =
        document.getElementById("uploadPatientId").value;

    let reportName =
        document.getElementById("uploadReportName").value;

    let file =
        document.getElementById("uploadReportFile").files[0];

    if (!patientId || !reportName) {
        alert("Enter Patient ID and Report Name");
        return;
    }

    if (!file) {
        alert("Select Report File");
        return;
    }

    const formData = new FormData();
    formData.append("patientId", patientId);
    formData.append("reportName", reportName);
    formData.append("patientName", document.getElementById("patientName")?.value || "");
    formData.append("patientPhone", document.getElementById("patientPhone")?.value || "");
    formData.append("patientEmail", document.getElementById("patientEmail")?.value || "");
    formData.append("reportFile", file);

    try {
        const response = await fetch(`${API_URL}/api/reports`, {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            document.getElementById("patientUploadMsg").innerHTML =
                data.message || "Report upload failed";
            return;
        }

        document.getElementById("patientUploadMsg").innerHTML =
            data.message;
        document.getElementById("uploadPatientId").value = "";
        document.getElementById("uploadReportName").value = "";
        document.getElementById("uploadReportFile").value = "";
    } catch (error) {
        document.getElementById("patientUploadMsg").innerHTML =
            "Backend server is not connected";
    }
}

async function loadPatientReports(){

    let patientId =
    document.getElementById(
    "searchPatient"
    ).value;

    if (!patientId) {
        alert("Enter Patient ID");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/reports/${patientId}`);
        const reports = await response.json();

        let output="";

        reports.forEach(report=>{

            output += `

            <div class="report-card">

                <h3>
                ${report.reportName}
                </h3>

                <p>
                Patient ID:
                ${report.patientId}
                </p>

                <p>
                Date:
                ${new Date(report.createdAt).toLocaleDateString()}
                </p>

                <a href="${report.filePath}"
                target="_blank">

                View Report

                </a>

            </div>

            `;
        });

        document.getElementById(
        "patientReports"
        ).innerHTML =
        output || "No reports found";
    } catch (error) {
        document.getElementById(
        "patientReports"
        ).innerHTML =
        "Backend server is not connected";
    }
}
