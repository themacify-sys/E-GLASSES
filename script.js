// Global State
let customers = JSON.parse(localStorage.getItem('e_glasses_today_queue')) || [];
let currentPhotoBase64 = "";

// Initialize Date and Data on Load
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('currentDate').innerText = new Date().toLocaleDateString('hi-IN', {
        weekday: 'long', year: 'numeric', month: 'short', day: 'numeric'
    });
    
    checkDailyAutoArchive();
    renderQueueTable();
    updateCounters();
});

// Photo Base64 Handler
document.getElementById('custPhoto').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(evt) {
            currentPhotoBase64 = evt.target.result;
            document.getElementById('photoPreview').src = currentPhotoBase64;
            document.getElementById('photoPreviewContainer').classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }
});

// Toggle Sub-category for Shopping
function toggleSubCategory() {
    const reason = document.getElementById('visitReason').value;
    const subGroup = document.getElementById('subCategoryGroup');
    if (reason === 'Shopping') {
        subGroup.classList.remove('hidden');
    } else {
        subGroup.classList.add('hidden');
    }
}

// Add Customer & Trigger WhatsApp Intent
document.getElementById('customerForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const name = document.getElementById('custName').value.trim();
    const mobile = document.getElementById('custMobile').value.trim();
    const gender = document.querySelector('input[name="gender"]:checked').value;
    const reason = document.getElementById('visitReason').value;
    const subCat = (reason === 'Shopping') ? document.getElementById('subCategory').value : '';

    const tokenNumber = customers.length + 1;
    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newCustomer = {
        id: Date.now(),
        token: tokenNumber,
        name: name,
        mobile: mobile,
        gender: gender,
        photo: currentPhotoBase64 || 'https://via.placeholder.com/40',
        reason: reason,
        subCategory: subCat,
        time: timeString,
        status: 'Waiting'
    };

    // FIFO: Serial-Wise Addition
    customers.push(newCustomer);
    saveQueueToLocal();
    renderQueueTable();
    updateCounters();

    // Reset Form
    document.getElementById('customerForm').reset();
    document.getElementById('photoPreviewContainer').classList.add('hidden');
    currentPhotoBase64 = "";

    // Open Custom WhatsApp Intent directly
    sendWhatsAppNotification(newCustomer);
});

// WhatsApp Intent Trigger (Safe & Direct Link)
function sendWhatsAppNotification(cust) {
    let reasonText = cust.reason;
    if (cust.subCategory) {
        reasonText += ` (${cust.subCategory})`;
    }

    // Editable WhatsApp Custom Text
    const message = `नमस्ते ${cust.name} जी! 👋\nE-GLASSES ऑप्टिकल्स में आपका स्वागत है।\n\nआपका टोकन नंबर: #${cust.token}\nविज़िट का कारण: ${reasonText}\n\nआपकी बारी आते ही आपको सूचित कर दिया जाएगा। धन्यवाद!`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/91${cust.mobile}?text=${encodedMessage}`;
    
    // Opens WhatsApp with Pre-filled Message
    window.open(whatsappUrl, '_blank');
}

// Render Queue List dynamically
function renderQueueTable() {
    const tbody = document.getElementById('queueListBody');
    tbody.innerHTML = "";

    if (customers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color: var(--text-muted);">आज कोई कस्टमर वेटिंग में नहीं है।</td></tr>`;
        return;
    }

    // First Come First Served Sorting Order
    customers.forEach((cust, index) => {
        let badgeClass = 'badge-shopping';
        if (cust.reason === 'Eye Test') badgeClass = 'badge-eyetest';
        if (cust.reason === 'Repair') badgeClass = 'badge-repair';
        if (cust.reason === 'Pickup') badgeClass = 'badge-pickup';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>#${cust.token}</strong></td>
            <td><img src="${cust.photo}" class="cust-avatar"></td>
            <td>${cust.name} <br><small style="color:var(--text-muted);">${cust.gender}</small></td>
            <td>+91 ${cust.mobile}</td>
            <td><span class="badge ${badgeClass}">${cust.reason} ${cust.subCategory ? '- ' + cust.subCategory : ''}</span></td>
            <td>${cust.time}</td>
            <td class="action-btns">
                <button class="btn-action btn-wa" title="WhatsApp भेजें" onclick='sendWhatsAppNotification(${JSON.stringify(cust)})'><i class="fa-brands fa-whatsapp"></i></button>
                <button class="btn-action btn-done" title="Complete" onclick="markDone(${cust.id})"><i class="fa-solid fa-check"></i></button>
                <button class="btn-action btn-delete" title="Delete" onclick="deleteCustomer(${cust.id})"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Update Counters Logic
function updateCounters() {
    document.getElementById('totalCount').innerText = customers.length;
    document.getElementById('shoppingCount').innerText = customers.filter(c => c.reason === 'Shopping').length;
    document.getElementById('eyetestCount').innerText = customers.filter(c => c.reason === 'Eye Test').length;
    document.getElementById('repairCount').innerText = customers.filter(c => c.reason === 'Repair').length;
    document.getElementById('pickupCount').innerText = customers.filter(c => c.reason === 'Pickup').length;
}

// Actions
function markDone(id) {
    customers = customers.filter(c => c.id !== id);
    saveQueueToLocal();
    renderQueueTable();
    updateCounters();
}

function deleteCustomer(id) {
    if (confirm("क्या आप इस कस्टमर को कतार से हटाना चाहते हैं?")) {
        customers = customers.filter(c => c.id !== id);
        saveQueueToLocal();
        renderQueueTable();
        updateCounters();
    }
}

function saveQueueToLocal() {
    localStorage.setItem('e_glasses_today_queue', JSON.stringify(customers));
}

// Midnight Auto-Archive Logic
function checkDailyAutoArchive() {
    const lastSavedDate = localStorage.getItem('e_glasses_last_date');
    const today = new Date().toDateString();

    if (lastSavedDate && lastSavedDate !== today) {
        // Move today's queue to History Archive
        const history = JSON.parse(localStorage.getItem('e_glasses_history')) || [];
        history.push({ date: lastSavedDate, records: customers });
        localStorage.setItem('e_glasses_history', JSON.stringify(history));

        // Reset Today's Queue
        customers = [];
        saveQueueToLocal();
    }
    localStorage.setItem('e_glasses_last_date', today);
}

// Export CSV Report
function exportDailyReport() {
    if (customers.length === 0) {
        alert("डाउनलोड करने के लिए आज का कोई डेटा उपलब्ध नहीं है।");
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,Token,Name,Mobile,Gender,Reason,SubCategory,Time\n";
    customers.forEach(c => {
        csvContent += `${c.token},${c.name},${c.mobile},${c.gender},${c.reason},${c.subCategory || 'N/A'},${c.time}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `E-Glasses_Report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Privacy Modal Controls
function openPrivacyModal() { document.getElementById('privacyModal').style.display = 'flex'; }
function closePrivacyModal() { document.getElementById('privacyModal').style.display = 'none'; }