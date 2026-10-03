// LocalStorage Backend Sync
let allCustomers = JSON.parse(localStorage.getItem('eglasses_customers')) || [];
let tokenCounter = parseInt(localStorage.getItem('eglasses_token_counter')) || 1;

// Clock Updater
function updateClock() {
    const now = new Date();
    document.getElementById('live-clock').innerText = now.toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric'
    }) + ' | ' + now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}
setInterval(updateClock, 1000);
updateClock();

// Toggle Side Menu
function toggleMenu() {
    document.getElementById('sideNav').classList.toggle('open');
    document.getElementById('navOverlay').classList.toggle('active');
}

// Switch Pages
function switchPage(pageId) {
    document.querySelectorAll('.page-section').forEach(p => p.classList.remove('active-page'));
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));

    document.getElementById(pageId).classList.add('active-page');
    toggleMenu();

    if (pageId === 'reports-page') {
        const todayStr = new Date().toISOString().split('T')[0];
        document.getElementById('filter-date').value = todayStr;
        filterRecordsByDate();
    }
}

// Select Service from Shop
function selectServiceAndGo(serviceName) {
    switchPage('dashboard-page');
    document.getElementById('visit-type').value = serviceName;
    document.getElementById('cust-name').focus();
}

// Add Customer Function
function addCustomer(event) {
    event.preventDefault();

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

    const newCustomer = {
        id: Date.now(),
        token: `T-${tokenCounter.toString().padStart(3, '0')}`,
        date: dateStr,
        time: timeStr,
        name: document.getElementById('cust-name').value.trim(),
        phone: document.getElementById('cust-phone').value.trim(),
        service: document.getElementById('visit-type').value
    };

    allCustomers.push(newCustomer);
    tokenCounter++;

    localStorage.setItem('eglasses_customers', JSON.stringify(allCustomers));
    localStorage.setItem('eglasses_token_counter', tokenCounter.toString());

    document.getElementById('customer-form').reset();
    renderTodayQueue();
}

// Render Only TODAY'S Queue
function renderTodayQueue() {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayCustomers = allCustomers.filter(c => c.date === todayStr);

    const tbody = document.getElementById('today-queue-list');
    const queueCount = document.getElementById('queue-count');

    tbody.innerHTML = '';
    queueCount.innerText = `${todayCustomers.length} Waiting`;

    todayCustomers.forEach((cust) => {
        const messageText = `Dear ${cust.name}, thank you for visiting EGLASSES.\nYour status for service: ${cust.service} has been updated. Token: ${cust.token}.`;
        const waLink = `https://wa.me/91${cust.phone}?text=${encodeURIComponent(messageText)}`;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${cust.token}</strong></td>
            <td><small>${cust.time}</small></td>
            <td><strong>${cust.name}</strong><br><small>+91 ${cust.phone}</small></td>
            <td>${cust.service}</td>
            <td>
                <a href="${waLink}" target="_blank" style="background:#25D366; color:white; padding:6px 12px; border-radius:6px; text-decoration:none; font-size:12px; font-weight:700;">WhatsApp</a>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Filter Records by Date in History Page
function filterRecordsByDate() {
    const selectedDate = document.getElementById('filter-date').value;
    const filtered = selectedDate ? allCustomers.filter(c => c.date === selectedDate) : allCustomers;

    const tbody = document.getElementById('history-table-list');
    tbody.innerHTML = '';

    filtered.forEach((cust) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${cust.date}</td>
            <td>${cust.time}</td>
            <td><strong>${cust.token}</strong></td>
            <td>${cust.name}</td>
            <td>+91 ${cust.phone}</td>
            <td>${cust.service}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Export Filtered / All Data to Excel (.CSV)
function exportToExcel() {
    const selectedDate = document.getElementById('filter-date').value;
    const recordsToExport = selectedDate ? allCustomers.filter(c => c.date === selectedDate) : allCustomers;

    if (recordsToExport.length === 0) {
        alert("Selected date ke liye koi data nahi hai!");
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,Date,Time,Token,Customer Name,Mobile,Service\n";

    recordsToExport.forEach(c => {
        csvContent += `${c.date},${c.time},${c.token},"${c.name}",${c.phone},"${c.service}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `EGLASSES_Report_${selectedDate || 'All'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Selfie Preview
function previewImage(event) {
    const reader = new FileReader();
    reader.onload = function() {
        document.getElementById('profile-preview').src = reader.result;
    }
    if (event.target.files[0]) {
        reader.readAsDataURL(event.target.files[0]);
    }
}

// Init
renderTodayQueue();