const API_URL = "https://cmd-project.onrender.com";
function quickUploadReport() {

    let file =
        document.getElementById("quickReportFile").files[0];

    if (file) {
        document.getElementById("uploadMsg")
            .innerHTML =
            "✅ Report Uploaded Successfully";
    }
    else {
        alert("Please Select a File");
    }
}

function updateStock() {

    document.getElementById("stockMsg")
        .innerHTML =
        "✅ Medicine Stock Updated Successfully";
}

function saveSchedule() {

    document.getElementById("scheduleMsg")
        .innerHTML =
        "✅ Schedule Saved Successfully";
}

async function uploadReport() {

    let patientId =
        document.getElementById("patientId").value;

    let reportName =
        document.getElementById("reportName").value;

    let file =
        document.getElementById("patientReportFile")
            .files[0];

    if (!patientId || !reportName) {
        alert("Enter Patient ID and Report Name");
        return;
    }

    if (!file) {
        alert("Select File");
        return;
    }

    const formData = new FormData();
    formData.append("patientId", patientId);
    formData.append("reportName", reportName);
    formData.append("reportFile", file);

    try {
        const response = await fetch(`${API_URL}/api/reports`, {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Report upload failed");
            return;
        }

        alert(data.message);
        document.getElementById("patientId").value = "";
        document.getElementById("reportName").value = "";
        document.getElementById("patientReportFile").value = "";
    } catch (error) {
        alert("Backend server is not connected");
    }
}

async function loadStaffNotifications() {
    try {
        const response = await fetch(
            `${API_URL}/api/notifications?role=Staff`
        );
        const notifications = await response.json();

        let html = "";

        notifications.forEach((item) => {
            html += `
            <div class="report-card">
                <h3>${item.title}</h3>
                <p>${item.message}</p>
                <p>Date: ${new Date(item.createdAt).toLocaleString()}</p>
            </div>
            `;
        });

        document.getElementById("staffNotifications").innerHTML =
            html || "No emergency notifications found";
    } catch (error) {
        document.getElementById("staffNotifications").innerHTML =
            "Backend server is not connected";
    }
}

loadStaffNotifications();
