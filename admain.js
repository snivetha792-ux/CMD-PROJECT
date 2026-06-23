const API_URL = "https://cmd-project.onrender.com";
const appointmentChart = new Chart(
    document.getElementById("appointmentChart"),
    {
        type: "bar",
        data: {
            labels: [],
            datasets: [{
                label: "Appointments",
                data: [],
                backgroundColor: "#2563EB"
            }]
        }
    }
);

const departmentChart = new Chart(
    document.getElementById("departmentChart"),
    {
        type: "pie",
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    "#2563EB",
                    "#10B981",
                    "#F59E0B",
                    "#EF4444",
                    "#14B8A6",
                    "#8B5CF6"
                ]
            }]
        }
    }
);

function updateCharts(appointments) {
    const dateCounts = {};
    const departmentCounts = {};

    appointments.forEach((appointment) => {
        const date = appointment.date || "No Date";
        const department = appointment.department || "General";

        dateCounts[date] = (dateCounts[date] || 0) + 1;
        departmentCounts[department] = (departmentCounts[department] || 0) + 1;
    });

    appointmentChart.data.labels = Object.keys(dateCounts);
    appointmentChart.data.datasets[0].data = Object.values(dateCounts);
    appointmentChart.update();

    departmentChart.data.labels = Object.keys(departmentCounts);
    departmentChart.data.datasets[0].data = Object.values(departmentCounts);
    departmentChart.update();
}

function renderAppointmentTable(appointments) {
    let html = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>Department</th>
                    <th>Patient</th>
                    <th>Doctor</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Status</th>
                    <th>Reason</th>
                </tr>
            </thead>
            <tbody>
    `;

    appointments.forEach((appointment) => {
        html += `
            <tr>
                <td>${appointment.department || "-"}</td>
                <td>${appointment.patientName || "-"}</td>
                <td>${appointment.doctor || "-"}</td>
                <td>${appointment.date || "-"}</td>
                <td>${appointment.time || "-"}</td>
                <td>${appointment.status || "Pending"}</td>
                <td>${appointment.reason || "-"}</td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    document.getElementById("adminAppointments").innerHTML =
        appointments.length ? html : "No appointments found";
}

function renderReportList(reports) {
    let html = "";

    reports.forEach((report) => {
        html += `
            <div class="appointment-card">
                <h3>${report.reportName}</h3>
                <p>Patient ID: ${report.patientId || "-"}</p>
                <p>Patient: ${report.patientName || "-"}</p>
                <p>Doctor ID: ${report.doctorId || "-"}</p>
                <p>Doctor: ${report.doctorName || "-"}</p>
                <p>Date: ${new Date(report.createdAt).toLocaleString()}</p>
                <a href="${report.filePath}" target="_blank">Open Report</a>
            </div>
        `;
    });

    document.getElementById("adminReports").innerHTML =
        html || "No reports found";
}

async function loadAdminDashboard() {
    try {
        const response = await fetch(`${API_URL}/api/admin/stats`);
        const data = await response.json();

        if (!response.ok) {
            document.getElementById("adminAppointments").innerHTML =
                data.message || "Unable to load dashboard data";
            return;
        }

        document.getElementById("totalPatients").innerHTML =
            data.patientCount;
        document.getElementById("totalDoctors").innerHTML =
            data.doctorCount;
        document.getElementById("totalAppointments").innerHTML =
            data.appointmentCount;
        document.getElementById("emergencyRequests").innerHTML =
            data.emergencyCount;
        document.getElementById("dailyAppointments").innerHTML =
            data.dailyAppointmentCount;
        document.getElementById("weeklyAppointments").innerHTML =
            data.weeklyAppointmentCount;
        document.getElementById("totalReports").innerHTML =
            data.reportCount;
        document.getElementById("totalNotifications").innerHTML =
            data.notificationCount;

        updateCharts(data.appointments);
        renderAppointmentTable(data.appointments);
    } catch (error) {
        document.getElementById("adminAppointments").innerHTML =
            "Unable to load dashboard data";
    }
}

async function loadAdminNotifications() {
    try {
        const response = await fetch(`${API_URL}/api/notifications`);
        const notifications = await response.json();

        let html = "";

        notifications.forEach((item) => {
            html += `
            <div class="appointment-card">
                <h3>${item.title}</h3>
                <p>For: ${item.recipientRole}</p>
                <p>Type: ${item.notificationType || "General"}</p>
                <p>${item.message}</p>
                ${item.relatedPatientId ? `<p>Patient ID: ${item.relatedPatientId}</p>` : ""}
                ${item.doctorId ? `<p>Doctor ID: ${item.doctorId}</p>` : ""}
                <p>Date: ${new Date(item.createdAt).toLocaleString()}</p>
            </div>
            `;
        });

        document.getElementById("adminNotifications").innerHTML =
            html || "No notifications found";
    } catch (error) {
        document.getElementById("adminNotifications").innerHTML =
            "Unable to load notifications";
    }
}

async function loadAdminReports() {
    try {
        const response = await fetch(`${API_URL}/api/admin/reports`);
        const reports = await response.json();

        if (!response.ok) {
            document.getElementById("adminReports").innerHTML =
                reports.message || "Unable to load reports";
            return;
        }

        renderReportList(reports);
    } catch (error) {
        document.getElementById("adminReports").innerHTML =
            "Unable to load reports";
    }
}

loadAdminDashboard();
loadAdminNotifications();
loadAdminReports();
