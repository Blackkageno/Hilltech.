import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getDatabase, ref, get, remove, push, set, update } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = { 
  apiKey: "AIzaSyCjFL4edy1fX9rprfCZ9-MYavdsk9hGJwc", 
  authDomain: "hilltech.firebaseapp.com", 
  databaseURL: "https://hilltech-default-rtdb.firebaseio.com", 
  projectId: "hilltech", 
  storageBucket: "hilltech.firebasestorage.app", 
  messagingSenderId: "406255325932", 
  appId: "1:406255325932:web:20191ba3bb7aec64100bc9", 
  measurementId: "G-9W4HF2FGL6" 
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

const $ = s => document.querySelector(s);
function esc(s) { return String(s || "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])); }

onAuthStateChanged(auth, user => {
  if (!user) {
    window.location.href = "login.html";
  } else {
    $("#adminEmail").textContent = user.email;
    loadDashboardData();
  }
});

async function loadDashboardData() {
  try {
    const [bookingsSnap, enquiriesSnap, portfolioSnap] = await Promise.all([
      get(ref(db, "bookings")),
      get(ref(db, "enquiries")),
      get(ref(db, "portfolio"))
    ]);

    const bookings = Object.entries(bookingsSnap.val() || {}).map(([id, val]) => ({ id, ...val }));
    const enquiries = Object.entries(enquiriesSnap.val() || {}).map(([id, val]) => ({ id, ...val }));
    const portfolio = Object.entries(portfolioSnap.val() || {}).map(([id, val]) => ({ id, ...val }));

    $("#sBookings").textContent = bookings.length;
    $("#sPending").textContent = bookings.filter(x => x.status === "Pending" || !x.status).length;
    $("#sEnquiries").textContent = enquiries.length;
    $("#sProjects").textContent = portfolio.length;

    $("#bookingsTable").innerHTML = bookings.map(x => {
      const currentStatus = x.status || "Pending";
      const optionsHtml = ["Pending", "Confirmed", "Completed", "Cancelled"].map(s => {
        const selectedAttr = s === currentStatus ? "selected" : "";
        return `<option ${selectedAttr}>${s}</option>`;
      }).join("");

      return `
        <tr>
          <td>${esc(x.event_date)}<br>${esc(x.event_time)}</td>
          <td><b>${esc(x.name)}</b><br><small>${esc(x.email)}</small></td>
          <td>${esc(x.service)}</td>
          <td>${esc(x.location)}</td>
          <td>
            <select data-id="${x.id}" class="status-select">
              ${optionsHtml}
            </select>
          </td>
          <td><button class="small copy-btn" data-copy="${esc(x.phone || "")}">Copy phone</button></td>
        </tr>
      `;
    }).join("") || `<tr><td colspan="6">No bookings yet.</td></tr>`;

    $("#enquiriesTable").innerHTML = enquiries.map(x => `
      <tr>
        <td><b>${esc(x.name)}</b><br><small>${esc(x.email)} ${esc(x.phone || "")}</small></td>
        <td>${esc(x.service)}</td>
        <td class="message-cell">${esc(x.message)}</td>
        <td>${esc(x.created_at || "N/A")}</td>
      </tr>
    `).join("") || `<tr><td colspan="4">No enquiries yet.</td></tr>`;

    $("#portfolioAdmin").innerHTML = portfolio.map(x => `
      <div>
        <span><b>${esc(x.title)}</b><small>${esc(x.category)} · ${esc(x.description)}</small></span>
        <button class="danger delete-project" data-delete="${x.id}">Delete</button>
      </div>
    `).join("") || `<p class="muted">No portfolio projects found.</p>`;

  } catch (err) {
    console.error("Error loading dashboard data:", err);
  }
}

// Portfolio Form Submission (Base64 Conversion & Direct Realtime Database Save)
$("#portfolioForm")?.addEventListener("submit", async e => {
  e.preventDefault();
  const form = e.currentTarget;
  const title = form.querySelector('input[name="title"]').value;
  const category = form.querySelector('input[name="category"]').value;
  const description = form.querySelector('input[name="description"]').value;
  const featured = form.querySelector('input[name="featured"]').checked;
  const fileInput = document.getElementById("projectImageInput");
  const file = fileInput.files[0];

  if (!file) {
    alert("Please select an image file!");
    return;
  }

  try {
    const base64String = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          let width = img.width;
          let height = img.height;

          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    await set(push(ref(db, "portfolio")), {
      title,
      category,
      description,
      imageUrl: base64String,
      featured,
      createdAt: Date.now()
    });

    form.reset();
    loadDashboardData();
    alert("Project added successfully with image!");
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
});

document.addEventListener("change", async e => {
  if (e.target.classList.contains("status-select")) {
    try {
      await update(ref(db, `bookings/${e.target.dataset.id}`), { status: e.target.value });
      loadDashboardData();
    } catch (err) {
      alert(err.message);
    }
  }
});

document.addEventListener("click", async e => {
  if (e.target.classList.contains("delete-project")) {
    if (confirm("Delete this portfolio item?")) {
      try {
        await remove(ref(db, `portfolio/${e.target.dataset.delete}`));
        loadDashboardData();
      } catch (err) {
        alert(err.message);
      }
    }
  }
  if (e.target.classList.contains("copy-btn")) {
    const phone = e.target.dataset.copy;
    if (phone) {
      navigator.clipboard?.writeText(phone);
      e.target.textContent = "Copied";
      setTimeout(() => { e.target.textContent = "Copy phone"; }, 2000);
    }
  }
});

$("#logout")?.addEventListener("click", async () => {
  try {
    await signOut(auth);
    window.location.href = "login.html";
  } catch (err) {
    alert(err.message);
  }
});