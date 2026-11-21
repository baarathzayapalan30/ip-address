
// =====================================
// 1. GET HTML ELEMENTS
// =====================================

const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const message = document.getElementById("message");

const ipAddressText = document.getElementById("ipAddress");
const locationText = document.getElementById("location");
const timezoneText = document.getElementById("timezone");
const ispText = document.getElementById("isp");


// =====================================
// 2. CREATE MAP
// =====================================

const map = L.map("map").setView([20, 0], 2);

L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        attribution: "&copy; OpenStreetMap contributors"
    }
).addTo(map);


// =====================================
// 3. CREATE LOCATION MARKER
// =====================================

const locationIcon = L.icon({
    iconUrl: "images/icon-location.svg",
    iconSize: [38, 48],
    iconAnchor: [19, 48]
});

let marker = null;


// =====================================
// 4. DISPLAY IP INFORMATION
// =====================================

function displayIpDetails(data) {

    ipAddressText.textContent = data.ip || "Not available";

    const city = data.city || "";
    const region = data.region || "";
    const postal = data.postal || "";
    const country = data.country || "";

    locationText.textContent =
        [city, region, postal, country]
            .filter(Boolean)
            .join(", ") || "Not available";

    timezoneText.textContent =
        data.timezone && data.timezone.utc
            ? "UTC " + data.timezone.utc
            : "Not available";

    ispText.textContent =
        data.connection && data.connection.isp
            ? data.connection.isp
            : "Not available";
}


// =====================================
// 5. SEARCH IP ADDRESS OR DOMAIN
// =====================================

async function searchIp(query = "") {

    message.textContent = "Searching...";

    try {

        const url = query
            ? `https://ipwho.is/${encodeURIComponent(query)}`
            : "https://ipwho.is/";

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Unable to connect to the server.");
        }

        const data = await response.json();

        // Check API error
        if (data.success === false) {
            throw new Error(
                data.message || "Invalid IP address or domain."
            );
        }

        // Check coordinates
        if (
            !Number.isFinite(data.latitude) ||
            !Number.isFinite(data.longitude)
        ) {
            throw new Error("Location coordinates not found.");
        }

        // Display information
        displayIpDetails(data);

        // Get coordinates
        const coordinates = [
            data.latitude,
            data.longitude
        ];

        // Move map to searched location
        map.setView(coordinates, 13);

        // Add or update marker
        if (marker) {

            marker.setLatLng(coordinates);

        } else {

            marker = L.marker(
                coordinates,
                { icon: locationIcon }
            ).addTo(map);

        }

        // Update marker popup
        marker.bindPopup(
            `<strong>${escapeHtml(data.ip || "IP location")}</strong><br>
            ${escapeHtml(data.city || "Location found")}`
        );

        // Refresh map
        requestAnimationFrame(() => {
            map.invalidateSize();
        });

        message.textContent = "";

    } catch (error) {

        message.textContent =
            error.message || "Something went wrong. Please try again.";

    }

}


// =====================================
// 6. PREVENT HTML INJECTION
// =====================================

function escapeHtml(value) {

    return String(value).replace(/[&<>"']/g, function(character) {

        const replacements = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return replacements[character];

    });

}


// =====================================
// 7. SEARCH BUTTON EVENT
// =====================================

searchForm.addEventListener("submit", function(event) {

    event.preventDefault();

    const searchValue = searchInput.value.trim();

    if (!searchValue) {

        message.textContent =
            "Please enter an IP address or domain.";

        searchInput.focus();

        return;
    }

    searchIp(searchValue);

});


// =====================================
// 8. LOAD VISITOR IP WHEN PAGE OPENS
// =====================================

searchIp();
