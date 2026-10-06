# Community Pavement Accessibility Map: Setup & Deployment Guide

## 1. Project Overview & Requirements

This repository provides an open-source web application for community groups to map pavement accessibility issues (such as missing dropped curbs, high curbs, broken paving slabs, and overgrown hedges; can be modified).

Volunteers sign in with an email and password provided by the project organiser, drop pins on an interactive map, describe the issue, and upload photo evidence. The aggregated data is stored securely in a database and can be exported as CSVs or structured Word reports for local authorities.

### Requirements & Prerequisites
To run this application, **no paid subscriptions or credit cards are required** (status 10-2026, UK). You do **not** need to install command-line tools on your computer. Everything can be managed through your web browser.

* **GitHub Account (Free):** Used to host your code repository and automatically publish the live web app via GitHub Actions.
* **Google Account / Gmail (Free):** Required to access the Firebase Console where your map data and user logins are hosted.
* **Bank Details:** **NOT REQUIRED.** Firebase's default "Spark Plan" is 100% free with generous daily usage quotas (50,000 reads/day and 20,000 writes/day), which is more than enough for local community projects.

---

## 2. Directory & File Structure

Your repository folder structure looks like this:

```text
/ (Repository Root)
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions deployment script
├── css/
│   └── styles.css              # Custom map and dashboard styling
├── js/
│   ├── firebase-config.js      # Firebase project keys and initialization
│   ├── app.js                  # Main map page logic
│   └── admin.js                # Admin dashboard & report generation
├── firestore.rules             # Security rules for Firestore Database
├── index.html                  # Main interactive map & reporting page
├── admin.html                  # Admin dashboard page
├── README.md                   # Project overview
└── setup_guide.md              # Setup instructions

## 3. Step-by-Step Setup Instructions

### Step 1: Create and Configure Your Firebase Backend

1. Go to https://console.firebase.google.com.
2. Sign in with your Google account.
3. Click **Add Project** or **Create a Project**.
4. Enter a project name, such as `my-community-accessibility-map`.
5. Disable Google Analytics if it is not required.
6. Click **Create Project**.

#### Set Up Authentication

1. In the left sidebar, click **Build > Authentication**.
2. Click **Get Started**.
3. Under **Native providers**, click **Email/Password**.
4. Enable the **Email/Password** toggle and leave **Email link (passwordless sign-in)** disabled.
5. Click **Save**.

#### Set Up Firestore Database

1. In the left sidebar, click **Build > Firestore Database**.
2. Click **Create Database**.
3. Choose a location close to your area, such as `europe-west2` for the UK.
4. Select **Start in production mode** and click **Create**.

#### Register Your Web App and Get API Keys

1. Click the **Gear** icon in the top-left sidebar to open **Project Settings**.
2. Scroll to **Your apps** and click the **Web** icon (`</>`).
3. Enter **Pavement Audit Web App** as the app nickname.
4. Click **Register app**.
5. Copy the values inside the `const firebaseConfig = { ... }` object.

### Step 2: Configure Database Security Rules

To ensure unauthorized users cannot tamper with your map data, set the security rules directly in the Firebase Console:

1. Open **Firebase Console > Firestore Database > Rules**.
2. Replace the existing text with the following:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Accessibility issues collection
    match /accessibility_issues/{issueId} {
      // Anyone on the internet can view logged map pins
      allow read: if true;

      // Only authenticated volunteers with a valid account can add pins
      allow create, update: if request.auth != null
        && request.resource.data.keys().hasAll(['latitude', 'longitude', 'issueType'])
        && request.resource.data.issueType is string;

      // Only administrators can delete records
      allow delete: if request.auth.token.admin == true;
    }
  }
}
```

3. Click **Publish**.

> **Cost Prevention Note:** Your Firebase project is created on the Spark (No-Cost) plan. If daily usage reaches the free-tier cap, such as 50,000 reads in one day, Firebase pauses service for the rest of the day instead of charging you. Services reset to zero at midnight (status 10-2026, UK, to the best of our knowledge).

### Step 3: Configure Code Files in GitHub

1. Open your GitHub repository at https://github.com.
2. Navigate to `js/firebase-config.js`.
3. Click the **Pencil** icon to edit the file.
4. Replace the existing configuration with the Firebase details copied in Step 1:

```javascript
// Located at: /js/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

5. Click **Commit changes**.

### (Step 4: Local Testing Before Deployment)

The application uses browser ES Modules, so open a local HTTP server inside your project directory to test it:

- **Using VS Code:** Install the Live Server extension, open `index.html`, and click **Go Live**.
- **Using Python:** Run `python3 -m http.server 8000` in the terminal and visit http://localhost:8000.

### Step 5: Automated Deployment via GitHub Actions and Pages

Publish the website automatically using GitHub Pages whenever you update the repository:

1. On GitHub, click **Add file > Create new file**.
2. Set the path to `.github/workflows/deploy.yml`.
3. Paste the following configuration into the file:

```yaml
name: Deploy Accessibility Map to GitHub Pages

on:
  push:
    branches:
      - main

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Setup GitHub Pages
        uses: actions/configure-pages@v4

      - name: Upload Pages Artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: '.'

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

4. Click **Commit changes**.
5. Go to **Repository Settings > Pages** in GitHub.
6. Under **Build and deployment > Source**, select **GitHub Actions**.

GitHub will trigger the deployment workflow automatically. Your live website URL will appear at the top of the Pages settings tab within 1–2 minutes.

## 4. Operational Guide: Registering Volunteers

Because logging is restricted to approved volunteers:

1. Open **Firebase Console > Authentication > Users**.
2. Click **Add user**.
3. Enter the volunteer's email address as the **Email** field.
4. Generate or enter a password.
5. Click **Add user**.
6. Send the login credentials to the volunteer.

The volunteer can now sign in to the map interface in `index.html` and record pavement issues.

## 5. Admin Dashboard & Report Generation

The application includes an administrative interface in `admin.html` for project organisers to review logged accessibility issues, filter records by date range, and export gathered data for local authorities or planning bodies.

### Accessing the Dashboard

1. Open `admin.html` in your browser, or navigate to the published dashboard at [https://your-username.github.io/your-repo-name/admin.html](https://your-username.github.io/your-repo-name/admin.html).
2. Log in using an authorised volunteer or administrator account.

The dashboard automatically queries Firestore for logged records and renders them in an audit table. Each record includes:

- **Submission date**
- **Issue category**, such as a missing dropped curb or broken paving
- **GPS coordinates**, including latitude and longitude
- **Issue description or notes**
- **Embedded thumbnail photo**
- **Submitting user email**

### Filtering Audits

Use the **Start Date** and **End Date** controls at the top of the dashboard to isolate issues collected during a specific community walkability audit or reporting period. The table updates instantly as you adjust the date parameters.

### Export Options

#### 1. Export CSV Data

Click **Export CSV** to download a flat spreadsheet file (`.csv`) containing all filtered issue records, including raw coordinates and text descriptions. Import the file directly into GIS software such as QGIS or ArcGIS, or into spreadsheet programs such as Microsoft Excel and Google Sheets.

#### 2. Export Word Report (`.docx`)

Click **Export Word** (`.docx`) to generate a structured, formatted document ready to submit to ward councillors or highway officers.

- **Inline Base64 images:** Photos uploaded by volunteers are converted into binary image runs inside the document, avoiding browser cross-origin issues.
- **Structured data tables:** Each issue is formatted into a clean metadata table displaying the date, category, coordinates, submitter details, and description notes.
- **Document formatting:** The report uses docx.js to create a clear title header, metadata summary, and visual section dividers between reported issues.