
const API_URL = "http://127.0.0.1:5000/api";

let toastTimer = null;
let currentReports = [];


// ==========================================
// NOTIFICATION MESSAGE IN CENTRE
// ==========================================

function showToast(message) {

    const toast = document.getElementById("toast");

    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}


// ==========================================
// AUTHENTICATION SCREEN
// ==========================================

function showAuthForm(type) {

    const loginPanel = document.getElementById("loginPanel");
    const registerPanel = document.getElementById("registerPanel");

    const loginTab = document.getElementById("loginTab");
    const registerTab = document.getElementById("registerTab");

    loginPanel.hidden = type !== "login";
    registerPanel.hidden = type !== "register";

    loginTab.classList.toggle("active", type === "login");
    registerTab.classList.toggle("active", type === "register");
}


// ==========================================
// GET CURRENT USER
// ==========================================

function getCurrentUser() {

    try {
        return JSON.parse(
            localStorage.getItem("communityUser") || "null"
        );
    } catch (error) {
        return null;
    }
}


// ==========================================
// SHOW MAIN APPLICATION
// ==========================================

function openApplication() {

    const user = getCurrentUser();

    if (!user) {
        showLoginScreen();
        return;
    }

    document.getElementById("authScreen").hidden = true;
    document.getElementById("appScreen").hidden = false;

    document.getElementById("navUserName").textContent = user.name;

    document.body.classList.add("user-logged-in");

    showSection("home");

    updateStatistics();
}


// ==========================================
// SHOW LOGIN SCREEN
// ==========================================

function showLoginScreen() {

    document.getElementById("authScreen").hidden = false;
    document.getElementById("appScreen").hidden = true;

    document.body.classList.remove("user-logged-in");

    showAuthForm("login");
}


// ==========================================
// NAVIGATION
// ==========================================

function showSection(sectionId) {

    const user = getCurrentUser();

    if (!user) {
        showLoginScreen();
        return;
    }

    document.querySelectorAll(".page-section").forEach(section => {
        section.classList.remove("active");
    });

    const selected = document.getElementById(sectionId);

    if (selected) {
        selected.classList.add("active");
    }

    document.getElementById("navLinks").classList.remove("open");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

    if (sectionId === "complaints") {
        displayComplaints();
    }

    if (sectionId === "account") {
        loadAccountDetails();
    }

    if (sectionId === "home") {
        updateStatistics();
    }
}


function toggleMenu() {

    document.getElementById("navLinks").classList.toggle("open");

}


// ==========================================
// LOGOUT
// ==========================================

function logoutUser() {

    localStorage.removeItem("communityUser");

    showLoginScreen();

    showToast("You have been logged out successfully!");

}


// ==========================================
// API REQUEST HELPER
// ==========================================

async function apiRequest(url, options = {}) {

    const response = await fetch(url, options);

    let result;

    try {
        result = await response.json();
    } catch (error) {
        result = {};
    }

    if (!response.ok) {
        throw new Error(
            result.message || "Something went wrong. Please try again."
        );
    }

    return result;
}


// ==========================================
// GET USER'S COMPLAINTS
// ==========================================

async function getReports() {

    const user = getCurrentUser();

    if (!user) return [];

    try {

        const result = await apiRequest(
            `${API_URL}/complaints/?user_id=${encodeURIComponent(user.id)}`
        );

        return Array.isArray(result) ? result : [];

    } catch (error) {

        console.error(error);

        showToast("Unable to load your complaints.");

        return [];
    }
}


// ==========================================
// IMAGE PREVIEW AND VALIDATION
// ==========================================

const imageInput = document.getElementById("image");

imageInput.addEventListener("change", function () {

    const preview = document.getElementById("imagePreview");

    preview.innerHTML = "";

    const file = this.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {

        showToast("Please select a valid image.");

        this.value = "";

        return;
    }

    if (file.size > 1024 * 1024) {

        showToast("Image must be smaller than 1 MB.");

        this.value = "";

        return;
    }

    const image = document.createElement("img");

    image.src = URL.createObjectURL(file);

    image.alt = "Selected complaint image";

    preview.appendChild(image);

});


// ==========================================
// GET CURRENT LOCATION
// ==========================================

function getLocation() {

    if (!navigator.geolocation) {

        showToast("Location is not supported by your browser.");

        return;
    }

    showToast("Getting your current location...");

    navigator.geolocation.getCurrentPosition(

        position => {

            document.getElementById("location").value =
                `Latitude: ${position.coords.latitude}, Longitude: ${position.coords.longitude}`;

            showToast("Location captured successfully!");

        },

        () => {

            showToast("Unable to get location. Enter it manually.");

        },

        {
            enableHighAccuracy: true,
            timeout: 10000
        }

    );

}


// ==========================================
// CONVERT IMAGE TO BASE64
// ==========================================

function readImage(file) {

    return new Promise((resolve, reject) => {

        if (!file) {
            return resolve(null);
        }

        const reader = new FileReader();

        reader.onload = () => resolve(reader.result);

        reader.onerror = () => {
            reject(new Error("Unable to read the selected image."));
        };

        reader.readAsDataURL(file);

    });

}


// ==========================================
// REGISTER USER
// ==========================================

document.getElementById("registerForm").addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();

        const body = {

            name: document.getElementById("regName").value.trim(),

            email: document.getElementById("regEmail").value.trim(),

            phone: document.getElementById("regPhone").value.trim(),

            password: document.getElementById("regPassword").value

        };

        if (body.password.length < 8) {

            showToast("Password must contain at least 8 characters.");

            return;
        }

        try {

            const result = await apiRequest(
                `${API_URL}/auth/register`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify(body)
                }
            );

            this.reset();

            showAuthForm("login");

            document.getElementById("loginEmail").value = body.email;

            showToast("Registration successful! Please login.");

        } catch (error) {

            showToast(error.message);

        }

    }
);


// ==========================================
// LOGIN USER
// ==========================================

document.getElementById("loginForm").addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();

        const email = document.getElementById("loginEmail").value.trim();

        const password = document.getElementById("loginPassword").value;

        try {

            const result = await apiRequest(
                `${API_URL}/auth/login`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        email,
                        password
                    })
                }
            );

            // Save user details for this browser session
            localStorage.setItem(
                "communityUser",
                JSON.stringify(result.user)
            );

            this.reset();

            openApplication();

            showToast("Welcome, " + result.user.name + "!");

        } catch (error) {

            // Incorrect password appears in the centre
            showToast(error.message || "Invalid email or password.");

        }

    }
);


// ==========================================
// SUBMIT COMPLAINT
// ==========================================

document.getElementById("reportForm").addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();

        const user = getCurrentUser();

        if (!user) {

            showLoginScreen();

            showToast("Please login before submitting a complaint.");

            return;
        }

        const title = document.getElementById("title").value.trim();

        const category = document.getElementById("category").value;

        const description = document.getElementById("description").value.trim();

        const location = document.getElementById("location").value.trim();

        const imageFile = document.getElementById("image").files[0];

        if (!title || !category || !description || !location) {

            showToast("Please fill all required fields.");

            return;
        }

        if (imageFile && imageFile.size > 1024 * 1024) {

            showToast("Image must be smaller than 1 MB.");

            return;
        }

        try {

            const image = await readImage(imageFile);

            const result = await apiRequest(
                `${API_URL}/complaints/`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({

                        title,
                        category,
                        description,
                        location,
                        image,
                        user_id: user.id

                    })
                }
            );

            this.reset();

            document.getElementById("imagePreview").innerHTML = "";

            showToast(
                "Complaint submitted successfully! ID: " +
                result.complaint.complaint_id
            );

            await updateStatistics();

            setTimeout(() => {
                showSection("complaints");
            }, 1200);

        } catch (error) {

            console.error(error);

            showToast(error.message);

        }

    }
);


// ==========================================
// CREATE COMPLAINT CARD
// ==========================================

function createComplaintCard(report) {

    const card = document.createElement("div");

    card.className = "complaint-card";

    const id = document.createElement("span");

    id.className = "complaint-id";

    id.textContent = "Complaint ID: " + report.complaint_id;

    const heading = document.createElement("h3");

    heading.textContent = report.title;

    const details = document.createElement("p");

    details.textContent =
        `Category: ${report.category} | Date: ${new Date(report.created_at).toLocaleDateString()}`;

    const location = document.createElement("p");

    location.textContent = "Location: " + report.location;

    const description = document.createElement("p");

    description.textContent = report.description;

    const status = document.createElement("span");

    status.className =
        "status " +
        (report.status === "Resolved"
            ? "resolved"
            : report.status === "In Progress"
                ? "progress"
                : "pending");

    status.textContent = report.status;

    card.append(
        id,
        heading,
        details,
        location,
        description,
        status
    );

    if (report.image) {

        const image = document.createElement("img");

        image.src = report.image;

        image.alt = "Complaint photograph";

        card.appendChild(image);
    }

    return card;
}


// ==========================================
// DISPLAY MY COMPLAINTS
// ==========================================

async function displayComplaints() {

    const container = document.getElementById("complaintList");

    if (!container) return;

    container.innerHTML = "<p>Loading your complaints...</p>";

    const reports = await getReports();

    currentReports = reports;

    const searchValue =
        document.getElementById("searchComplaint").value.toLowerCase();

    const selectedStatus =
        document.getElementById("statusFilter").value;

    const filteredReports = reports.filter(report => {

        const matchesSearch =
            report.title.toLowerCase().includes(searchValue) ||
            report.complaint_id.toLowerCase().includes(searchValue);

        const matchesStatus =
            selectedStatus === "All" ||
            report.status === selectedStatus;

        return matchesSearch && matchesStatus;

    });

    container.innerHTML = "";

    if (filteredReports.length === 0) {

        container.innerHTML = `
            <div class="complaint-card">
                <h3>No complaints found</h3>
                <p>You have not submitted any complaints matching this search.</p>
            </div>
        `;

        return;
    }

    filteredReports.forEach(report => {

        container.appendChild(
            createComplaintCard(report)
        );

    });

}


// ==========================================
// SEARCH AND FILTER
// ==========================================

document.getElementById("searchComplaint").addEventListener(
    "input",
    displayComplaints
);

document.getElementById("statusFilter").addEventListener(
    "change",
    displayComplaints
);


// ==========================================
// DASHBOARD STATISTICS
// ==========================================

async function updateStatistics() {

    const reports = await getReports();

    document.getElementById("totalReports").textContent =
        reports.length;

    document.getElementById("resolvedReports").textContent =
        reports.filter(report => report.status === "Resolved").length;

}


// ==========================================
// MY ACCOUNT DETAILS AND HISTORY
// ==========================================

async function loadAccountDetails() {

    const user = getCurrentUser();

    if (!user) return;

    document.getElementById("profileName").textContent =
        user.name || "User";

    document.getElementById("profileEmail").textContent =
        user.email || "Not available";

    document.getElementById("profilePhone").textContent =
        "Phone: " + (user.phone || "Not available");


    const historyContainer =
        document.getElementById("accountComplaintHistory");

    historyContainer.innerHTML = "<p>Loading complaint history...</p>";

    const reports = await getReports();

    const pending = reports.filter(
        report => report.status === "Pending"
    ).length;

    const inProgress = reports.filter(
        report => report.status === "In Progress"
    ).length;

    const resolved = reports.filter(
        report => report.status === "Resolved"
    ).length;


    document.getElementById("myTotalReports").textContent =
        reports.length;

    document.getElementById("myPendingReports").textContent =
        pending;

    document.getElementById("myProgressReports").textContent =
        inProgress;

    document.getElementById("myResolvedReports").textContent =
        resolved;


    historyContainer.innerHTML = "";

    if (reports.length === 0) {

        historyContainer.innerHTML = `
            <div class="complaint-card">
                <h3>No previous complaints</h3>
                <p>Your submitted complaints will appear here.</p>
            </div>
        `;

        return;
    }

    reports.forEach(report => {

        historyContainer.appendChild(
            createComplaintCard(report)
        );

    });

}


// ==========================================
// INITIALIZE WEBSITE
// ==========================================

document.addEventListener("DOMContentLoaded", function () {

    const user = getCurrentUser();

    if (user) {

        openApplication();

    } else {

        showLoginScreen();

    }

    console.log("CommunityConnect frontend initialized.");

});
