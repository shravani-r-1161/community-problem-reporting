
// ==========================================
// COMMUNITYCONNECT - JAVASCRIPT
// ==========================================


// 1. NAVIGATION BETWEEN PAGES

function showSection(sectionId) {

    document.querySelectorAll(".page-section").forEach(section => {
        section.classList.remove("active");
    });

    const selected = document.getElementById(sectionId);

    if (selected) {
        selected.classList.add("active");
    }

    document.querySelector(".nav-links").classList.remove("open");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

    if (sectionId === "complaints") {
        displayComplaints();
    }
}


// Mobile menu

function toggleMenu() {

    document.querySelector(".nav-links").classList.toggle("open");

}


// 2. NOTIFICATION MESSAGE

function showToast(message) {

    const toast = document.getElementById("toast");

    toast.textContent = message;

    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);

}


// 3. GET SAVED COMPLAINTS

function getReports() {

    try {

        return JSON.parse(
            localStorage.getItem("communityReports")
        ) || [];

    } catch (error) {

        return [];

    }

}


// SAVE COMPLAINTS

function saveReports(reports) {

    localStorage.setItem(
        "communityReports",
        JSON.stringify(reports)
    );

}


// 4. GENERATE COMPLAINT ID

function generateComplaintId() {

    return "CPR" + Date.now().toString().slice(-7);

}


// 5. IMAGE PREVIEW

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

    preview.appendChild(image);

});


// 6. GET CURRENT LOCATION

function getLocation() {

    if (!navigator.geolocation) {

        showToast("Location is not supported by your browser.");

        return;
    }

    showToast("Getting your current location...");

    navigator.geolocation.getCurrentPosition(

        function (position) {

            const latitude = position.coords.latitude;

            const longitude = position.coords.longitude;

            document.getElementById("location").value =
                `Latitude: ${latitude}, Longitude: ${longitude}`;

            showToast("Location captured successfully!");

        },

        function () {

            showToast("Unable to get location. Enter it manually.");

        },

        {
            enableHighAccuracy: true,
            timeout: 10000
        }

    );

}


// 7. SUBMIT COMPLAINT

document.getElementById("reportForm").addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();

        const title = document.getElementById("title").value.trim();

        const category = document.getElementById("category").value;

        const description =
            document.getElementById("description").value.trim();

        const location =
            document.getElementById("location").value.trim();

        const imageFile =
            document.getElementById("image").files[0];

        if (!title || !category || !description || !location) {

            showToast("Please fill all required fields.");

            return;
        }

        let imageData = "";

        if (imageFile) {

            if (imageFile.size > 1024 * 1024) {

                showToast("Image must be smaller than 1 MB.");

                return;
            }

            imageData = await new Promise((resolve, reject) => {

                const reader = new FileReader();

                reader.onload = () => resolve(reader.result);

                reader.onerror = reject;

                reader.readAsDataURL(imageFile);

            }).catch(() => "");

            if (!imageData) {

                showToast("Unable to read the selected image.");

                return;
            }

        }

        const complaint = {

            id: generateComplaintId(),

            title: title,

            category: category,

            description: description,

            location: location,

            image: imageData,

            status: "Pending",

            date: new Date().toLocaleDateString(),

            createdAt: new Date().toISOString()

        };

        try {

            const reports = getReports();

            reports.unshift(complaint);

            saveReports(reports);

            this.reset();

            document.getElementById("imagePreview").innerHTML = "";

            updateStatistics();

            showToast(
                "Complaint submitted successfully! ID: " + complaint.id
            );

            setTimeout(() => {

                showSection("complaints");

            }, 1000);

        } catch (error) {

            showToast("Unable to save report. Browser storage may be full.");

        }

    }
);


// 8. DISPLAY COMPLAINTS

function displayComplaints() {

    const container =
        document.getElementById("complaintList");

    const reports = getReports();

    const searchValue =
        document.getElementById("searchComplaint").value.toLowerCase();

    const selectedStatus =
        document.getElementById("statusFilter").value;

    container.innerHTML = "";

    const filteredReports = reports.filter(report => {

        const matchesSearch =
            report.title.toLowerCase().includes(searchValue) ||
            report.id.toLowerCase().includes(searchValue);

        const matchesStatus =
            selectedStatus === "All" ||
            report.status === selectedStatus;

        return matchesSearch && matchesStatus;

    });

    if (filteredReports.length === 0) {

        container.innerHTML = `
            <div class="complaint-card">
                <h3>No complaints found</h3>
                <p>Submit a new complaint or change your search.</p>
            </div>
        `;

        return;
    }

    filteredReports.forEach(report => {

        const card = document.createElement("div");

        card.className = "complaint-card";

        const heading = document.createElement("h3");

        heading.textContent = report.title;

        const id = document.createElement("span");

        id.className = "complaint-id";

        id.textContent = "Complaint ID: " + report.id;

        const details = document.createElement("p");

        details.textContent =
            "Category: " + report.category +
            " | Date: " + report.date;

        const location = document.createElement("p");

        location.textContent = "Location: " + report.location;

        const description = document.createElement("p");

        description.textContent = report.description;

        const status = document.createElement("span");

        status.className =
            "status " +
            (report.status === "Resolved" ? "resolved" :
            report.status === "In Progress" ? "progress" : "pending");

        status.textContent = report.status;

        card.appendChild(id);

        card.appendChild(heading);

        card.appendChild(details);

        card.appendChild(location);

        card.appendChild(description);

        card.appendChild(status);

        if (report.image) {

            const image = document.createElement("img");

            image.src = report.image;

            image.alt = "Complaint photograph";

            card.appendChild(image);

        }

        container.appendChild(card);

    });

}


// 9. SEARCH AND FILTER

document.getElementById("searchComplaint").addEventListener(
    "input",
    displayComplaints
);

document.getElementById("statusFilter").addEventListener(
    "change",
    displayComplaints
);


// 10. UPDATE STATISTICS

function updateStatistics() {

    const reports = getReports();

    const total = reports.length;

    const resolved = reports.filter(
        report => report.status === "Resolved"
    ).length;

    document.getElementById("totalReports").textContent = total;

    document.getElementById("resolvedReports").textContent = resolved;

}


// 11. LOGIN DEMONSTRATION

document.getElementById("loginForm").addEventListener(
    "submit",
    function (event) {

        event.preventDefault();

        showToast(
            "Login will be connected to the Flask backend."
        );

    }
);


// 12. REGISTRATION DEMONSTRATION

document.getElementById("registerForm").addEventListener(
    "submit",
    function (event) {

        event.preventDefault();

        showToast(
            "Registration will be connected to the Flask backend."
        );

    }
);


// 13. INITIALIZE WEBSITE

document.addEventListener("DOMContentLoaded", function () {

    updateStatistics();

    displayComplaints();

    console.log(
        "CommunityConnect frontend loaded successfully!"
    );

});
