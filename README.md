# Community Pavement Accessibility Map (Template)

A lightweight, open-source web application designed for local community groups, active travel advocates, and local accessibility supporters to crowdsource and map pavement barriers (missing dropped curbs, overgrown vegetation, high curbs, broken paving, or temporary obstructions; can be modified to the specific needs).

Volunteers sign in with credentials issued by project administrators, drop geotagged pins on an interactive Leaflet map, attach compressed photo evidence, and log issue notes. Administrators can view, filter, and export the aggregated data as CSV datasets or structured Word (`.docx`) reports with embedded images for local councils and highway authorities.

This mapping tool was developed and is used by The Formby Commons (https://theformbycommons.github.io).

---

## Key Features

* **Interactive Mapping:** Powered by Leaflet.js and OpenStreetMap tiles.
* **Geolocated Auditing:** Drop pins manually or capture current GPS locations.
* **Photo Proof Storage:** Client-side JPEG compression stores images directly in Firestore as Base64 data without requiring external cloud storage buckets or CORS configuration.
* **Secure Volunteer Logins:** Authenticated reporting powered by Firebase Auth.
* **Admin Dashboard:** Review submissions, filter by date ranges, and monitor issue locations.
* **Automated Word & CSV Export:** Export complete audit reports formatted into tables with embedded inline images using `docx.js`.
* **Zero-Cost Architecture:** Designed to run 100% free using GitHub Pages and the Firebase Spark plan (UK, status: 10-2026).

---

## Project Structure

```text
/ (Repository Root)
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions automated deployment
├── css/
│   └── styles.css              # Custom layout, sidebar, and map styling
├── js/
│   ├── firebase-config.js      # Firebase connection setup (Replace with your keys)
│   ├── app.js                  # Main map interface & issue reporting logic
│   └── admin.js                # Admin dashboard, date filtering, CSV & Word exports
├── index.html                  # Public map & volunteer reporting page
├── admin.html                  # Admin dashboard & export interface
├── firestore.rules             # Database security rules
├── README.md                   # Repository overview
└── setup_guide.md              # Detailed step-by-step setup guide