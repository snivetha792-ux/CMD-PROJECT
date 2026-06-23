function updateStock(){

    let medicine =
    document.getElementById("medicine").value;

    let qty =
    document.getElementById("stockQty").value;

    if(qty === ""){
        alert("Enter Stock Quantity");
        return;
    }

    if(medicine === "Paracetamol"){
        document.getElementById("para").innerHTML = qty;
    }

    else if(medicine === "Dolo"){
        document.getElementById("dolo").innerHTML = qty;
    }

    else if(medicine === "Syringe"){
        document.getElementById("syringe").innerHTML = qty;
    }

    else{
        document.getElementById("glucose").innerHTML = qty;
    }

    document.getElementById("message").innerHTML =
    "✅ Stock Updated Successfully!";
}

const API_URL = "http://localhost:5000";

async function login() {
    let role = document.getElementById("role").value;
    let email = document.getElementById("loginEmail").value;
    let password = document.getElementById("loginPassword").value;

    if (role === "Patient") {
        if (!email || !password) {
            alert("Enter Patient ID or Email and Password");
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/patients/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    loginId: email,
                    password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.message || "Patient login failed");
                return;
            }

            localStorage.setItem("loggedInPatient", JSON.stringify(data.patient));
            window.location.href = "patient.html";
        } catch (error) {
            alert("Backend server is not connected");
        }
    }
    else if (role === "Doctor") {
        if (!email || !password) {
            alert("Enter Doctor Email and Password");
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/doctors/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email,
                    password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.message || "Doctor login failed");
                return;
            }

            localStorage.setItem("loggedInDoctor", JSON.stringify(data.doctor));
            window.location.href = "doctor.html";
        } catch (error) {
            alert("Backend server is not connected");
        }
    }
    else if (role === "Staff") {
        window.location.href = "staff.html";
    }
    else if (role === "Admin") {
        window.location.href = "admain.html";
    }
}
