import { auth, db, MAP_SETTINGS } from './firebase-config.js';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, addDoc, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let selectedMarker = null;

// Initialize Leaflet Map
const map = L.map('map').setView(MAP_SETTINGS.defaultCenter, MAP_SETTINGS.defaultZoom);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Dedicated layer group for live-updating map markers
const issueLayerGroup = L.layerGroup().addTo(map);

// DOM Elements
const loginModal = document.getElementById('login-modal');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const closeBtn = document.querySelector('.close-btn');
const loginForm = document.getElementById('login-form');
const issueForm = document.getElementById('issue-form');
const submitBtn = document.getElementById('submit-btn');

// --- Helper Function: Client-Side Canvas Image Compression ---
function compressImage(file, maxWidth = 1000, quality = 0.7) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve(null);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convert canvas output to JPEG Base64 string (~100-250KB)
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
}

// --- Authentication Listeners ---
if (loginBtn) loginBtn.onclick = () => loginModal.style.display = 'flex';
if (closeBtn) closeBtn.onclick = () => loginModal.style.display = 'none';

if (loginForm) {
  loginForm.onsubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    try {
      await signInWithEmailAndPassword(auth, email, password);
      loginModal.style.display = 'none';
      document.getElementById('login-error').innerText = '';
    } catch (err) {
      document.getElementById('login-error').innerText = err.message;
    }
  };
}

if (logoutBtn) logoutBtn.onclick = () => signOut(auth);

onAuthStateChanged(auth, (user) => {
  const userDisplay = document.getElementById('user-display');
  if (user) {
    if (userDisplay) userDisplay.innerText = `Logged in: ${user.email}`;
    if (loginBtn) loginBtn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'inline-block';
  } else {
    if (userDisplay) userDisplay.innerText = 'Not logged in';
    if (loginBtn) loginBtn.style.display = 'inline-block';
    if (logoutBtn) logoutBtn.style.display = 'none';
  }
});

// --- Map Click Listener (Place Pin) ---
map.on('click', (e) => {
  if (!auth.currentUser) {
    alert("Please log in to submit a pavement accessibility issue.");
    return;
  }
  const { lat, lng } = e.latlng;
  document.getElementById('lat').value = lat;
  document.getElementById('lng').value = lng;
  
  if (selectedMarker) map.removeLayer(selectedMarker);
  selectedMarker = L.marker([lat, lng]).addTo(map);
  if (submitBtn) submitBtn.disabled = false;
});

// --- Submit Issue Form ---
if (issueForm) {
  issueForm.onsubmit = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    const photoInput = document.getElementById('photo');
    const photoFile = photoInput && photoInput.files.length > 0 ? photoInput.files[0] : null;

    try {
      // Compress photo if attached
      let photoData = null;
      if (photoFile) {
        photoData = await compressImage(photoFile, 1000, 0.7);
      }

      const newIssue = {
        issueType: document.getElementById('issueType').value,
        description: document.getElementById('description').value,
        latitude: parseFloat(document.getElementById('lat').value),
        longitude: parseFloat(document.getElementById('lng').value),
        photoUrl: photoData, // Base64 compressed image string
        createdBy: auth.currentUser.email,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, "accessibility_issues"), newIssue);
      alert("Accessibility issue logged successfully!");
      
      issueForm.reset();
      if (submitBtn) submitBtn.disabled = true;
      
      if (selectedMarker) {
        map.removeLayer(selectedMarker);
        selectedMarker = null;
      }
    } catch (err) {
      alert("Error saving issue: " + err.message);
    }
  };
}

// --- Real-time Display of Existing Issues ---
onSnapshot(collection(db, "accessibility_issues"), (snapshot) => {
  issueLayerGroup.clearLayers();
  
  snapshot.forEach((doc) => {
    const issue = doc.data();
    if (typeof issue.latitude === 'number' && typeof issue.longitude === 'number') {
      const typeLabel = issue.issueType ? issue.issueType.replace(/_/g, ' ').toUpperCase() : 'ISSUE';
      
      let popupContent = `<b>${typeLabel}</b><br>${issue.description || ''}`;
      if (issue.photoUrl) {
        popupContent += `<br><img src="${issue.photoUrl}" alt="Issue photo" style="max-width:200px; height:auto; margin-top:8px; border-radius:4px; display:block;" />`;
      }

      L.circleMarker([issue.latitude, issue.longitude], {
        color: '#dc2626',
        fillColor: '#ef4444',
        fillOpacity: 0.7,
        radius: 8
      })
      .bindPopup(popupContent)
      .addTo(issueLayerGroup);
    }
  });
});