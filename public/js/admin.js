import { db } from './firebase-config.js';
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let loadedIssues = [];

// DOM Elements
const statsSummary = document.getElementById('stats-summary');
const issuesBody = document.getElementById('issues-body');
const exportCsvBtn = document.getElementById('export-csv-btn');

// Fetch and display issues on load
async function loadAuditData() {
  try {
    const q = query(collection(db, "accessibility_issues"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);

    loadedIssues = [];
    issuesBody.innerHTML = '';

    if (querySnapshot.empty) {
      statsSummary.innerHTML = '<p>No issues logged yet.</p>';
      issuesBody.innerHTML = '<tr><td colspan="5">No records found.</td></tr>';
      return;
    }

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      loadedIssues.push(data);
    });

    renderStats(loadedIssues);
    renderTable(loadedIssues);

  } catch (error) {
    console.error("Error fetching audit data:", error);
    statsSummary.innerHTML = `<p style="color: red;">Error loading data: ${error.message}</p>`;
  }
}

// Render Summary Statistics
function renderStats(issues) {
  const total = issues.length;
  const categories = {};

  issues.forEach((issue) => {
    const cat = issue.issueType ? issue.issueType.replace(/_/g, ' ') : 'uncategorized';
    categories[cat] = (categories[cat] || 0) + 1;
  });

  let statsHTML = `<p><strong>Total Logged Issues:</strong> ${total}</p><ul>`;
  for (const [cat, count] of Object.entries(categories)) {
    statsHTML += `<li><strong>${cat.toUpperCase()}:</strong> ${count}</li>`;
  }
  statsHTML += '</ul>';

  statsSummary.innerHTML = statsHTML;
}

// Render Table Rows
function renderTable(issues) {
  issuesBody.innerHTML = '';

  issues.forEach((issue) => {
    const tr = document.createElement('tr');

    // Date formatting
    let dateStr = 'N/A';
    if (issue.createdAt && issue.createdAt.toDate) {
      dateStr = issue.createdAt.toDate().toLocaleDateString();
    }

    const category = issue.issueType ? issue.issueType.replace(/_/g, ' ').toUpperCase() : 'N/A';
    const coords = (issue.latitude && issue.longitude) 
      ? `${issue.latitude.toFixed(5)}, ${issue.longitude.toFixed(5)}` 
      : 'N/A';
    const loggedBy = issue.createdBy || 'Anonymous';

    tr.innerHTML = `
      <td>${dateStr}</td>
      <td>${category}</td>
      <td>${issue.description || ''}</td>
      <td>${coords}</td>
      <td>${loggedBy}</td>
    `;

    issuesBody.appendChild(tr);
  });
}

// Convert JSON array to CSV and trigger browser download
function exportToCSV(issues) {
  if (!issues || !issues.length) {
    alert("No data available to export.");
    return;
  }

  const headers = ["Date", "Category", "Description", "Latitude", "Longitude", "Logged By"];
  const rows = issues.map((issue) => {
    let dateStr = '';
    if (issue.createdAt && issue.createdAt.toDate) {
      dateStr = issue.createdAt.toDate().toISOString();
    }

    const category = issue.issueType ? issue.issueType.replace(/_/g, ' ') : '';
    const description = issue.description ? `"${issue.description.replace(/"/g, '""')}"` : '""';
    const lat = issue.latitude || '';
    const lng = issue.longitude || '';
    const user = issue.createdBy ? `"${issue.createdBy.replace(/"/g, '""')}"` : '""';

    return [dateStr, `"${category}"`, description, lat, lng, user].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `accessibility_audit_export_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Event Listeners
if (exportCsvBtn) {
  exportCsvBtn.addEventListener('click', () => exportToCSV(loadedIssues));
}

// Initialize
loadAuditData();