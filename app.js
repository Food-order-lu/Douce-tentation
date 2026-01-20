document.addEventListener('DOMContentLoaded', () => {

    // --- AUTH CHECK ---
    if (!localStorage.getItem('isAuthenticated')) {
        window.location.href = 'login.html';
        return;
    }

    // --- LOGOUT ---
    const logoutLink = document.querySelector('a[href="index.html"]');
    if (logoutLink) {
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('isAuthenticated');
            window.location.href = 'index.html';
        });
    }

    // --- Configuration ---
    let currentDate = new Date(); // Start from today

    // --- State ---
    let orders = JSON.parse(localStorage.getItem('douceTentationOrders')) || [
        { id: 101, type: 'Fraisier', size: '6 parts', client: 'M. Dupont', time: '10:00', date: new Date().toISOString().split('T')[0], source: 'manual' },
    ];

    // --- DOM Elements ---
    const calendarGrid = document.getElementById('calendarGrid');
    const modal = document.getElementById('orderModal');
    const newOrderBtn = document.getElementById('newOrderBtn');
    const closeModalBtn = document.getElementById('closeModal');
    const simulateGloriaBtn = document.getElementById('simulateGloriaBtn');
    const calendarHeaderTitle = document.querySelector('.calendar-header h1');

    // Wizard
    const orderForm = document.getElementById('orderForm');
    const steps = [document.getElementById('step1'), document.getElementById('step2'), document.getElementById('step3')];
    const nextBtn = document.getElementById('nextBtn');
    const prevBtn = document.getElementById('prevBtn');
    let currentStep = 0;

    // --- Initialization ---
    renderCalendar();

    // --- Wizard Navigation ---
    function updateWizard() {
        steps.forEach((step, idx) => {
            step.style.display = idx === currentStep ? 'block' : 'none';
        });

        // Update Steps indicators
        const indicators = document.querySelectorAll('.step');
        indicators.forEach((ind, idx) => {
            ind.classList.toggle('active', idx === currentStep);
        });

        // Update Buttons
        prevBtn.style.visibility = currentStep === 0 ? 'hidden' : 'visible';

        if (currentStep === steps.length - 1) {
            nextBtn.style.display = 'none';
        } else {
            nextBtn.style.display = 'inline-block';
            nextBtn.innerText = 'Suivant';
        }
    }

    nextBtn.onclick = () => {
        // Simple validation for required fields in current step
        const inputs = steps[currentStep].querySelectorAll('input[required], select[required]');
        let valid = true;
        inputs.forEach(input => {
            if (!input.value) {
                input.style.borderColor = 'red';
                valid = false;
            } else {
                input.style.borderColor = '';
            }
        });

        if (valid && currentStep < steps.length - 1) {
            currentStep++;
            updateWizard();
        }
    };

    prevBtn.onclick = () => {
        if (currentStep > 0) {
            currentStep--;
            updateWizard();
        }
    };

    newOrderBtn.onclick = () => {
        orderForm.reset();
        delete orderForm.dataset.editId;
        currentStep = 0;
        updateWizard();
        populateDaySelect();
        modal.style.display = 'flex';
    };

    closeModalBtn.onclick = () => {
        modal.style.display = 'none';
    };

    window.onclick = (event) => {
        if (event.target == modal) modal.style.display = 'none';
        if (event.target == detailModal) detailModal.style.display = 'none';
    };

    // --- Navigation Buttons (To be added securely) ---
    const headerDiv = document.querySelector('.calendar-header > div');
    const navDiv = document.createElement('div');
    navDiv.className = 'calendar-nav';
    navDiv.innerHTML = `
        <button id="prevWeek" class="btn btn-secondary" style="padding: 5px 15px; font-size:0.8rem;"><i class="fas fa-chevron-left"></i> Préc.</button>
        <button id="nextWeek" class="btn btn-secondary" style="padding: 5px 15px; font-size:0.8rem;">Suiv. <i class="fas fa-chevron-right"></i></button>
    `;
    headerDiv.appendChild(navDiv);

    document.getElementById('prevWeek').onclick = () => {
        currentDate.setDate(currentDate.getDate() - 7);
        renderCalendar();
    };
    document.getElementById('nextWeek').onclick = () => {
        currentDate.setDate(currentDate.getDate() + 7);
        renderCalendar();
    };

    // --- Functions ---

    function getStartOfWeek(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
        return new Date(d.setDate(diff));
    }

    function renderCalendar() {
        calendarGrid.innerHTML = '';
        const startOfWeek = getStartOfWeek(currentDate);

        // Update Title
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        const options = { month: 'long', day: 'numeric' };
        calendarHeaderTitle.innerText = `Semaine du ${startOfWeek.toLocaleDateString('fr-FR', options)}`;

        for (let i = 0; i < 7; i++) {
            const dayDate = new Date(startOfWeek);
            dayDate.setDate(startOfWeek.getDate() + i);
            const dateStr = dayDate.toISOString().split('T')[0];
            const isToday = new Date().toISOString().split('T')[0] === dateStr;

            const col = document.createElement('div');
            col.className = 'day-column';
            if (isToday) col.style.border = '2px solid var(--color-primary)';

            col.innerHTML = `
                <div class="day-header">
                    ${dayDate.toLocaleDateString('fr-FR', { weekday: 'long' })} <br>
                    <span style="font-size:0.8rem; opacity:0.7">${dayDate.getDate()}/${dayDate.getMonth() + 1}</span>
                </div>
            `;

            // Filter orders
            const dayOrders = orders.filter(o => o.date === dateStr);
            dayOrders.sort((a, b) => a.time.localeCompare(b.time));

            dayOrders.forEach(order => {
                const card = document.createElement('div');
                let sourceClass = '';
                let sourceLabel = '';

                if (order.source === 'gloria_snack') {
                    sourceClass = 'gloria-snack';
                    sourceLabel = '<span style="color:#E85D04;"><i class="fas fa-utensils"></i> Snacking</span>';
                } else if (order.source === 'gloria_cake') {
                    sourceClass = 'gloria-cake';
                    sourceLabel = '<span style="color:#D4AF37;"><i class="fas fa-birthday-cake"></i> Gâteau Web</span>';
                }

                // Supplements summary
                let supplementsHTML = '';
                if (order.supplements && order.supplements.length > 0) {
                    supplementsHTML = `<div style="font-size:0.75rem; color:#888; border-top:1px solid #eee; margin-top:4px; padding-top:2px;">+ ${order.supplements.join(', ')}</div>`;
                }

                card.className = `order-card ${sourceClass}`;
                card.innerHTML = `
                    <div class="order-time">${order.time}</div>
                    <div class="order-title">${order.type} (${order.size})</div>
                    <div class="order-client">${order.client}</div>
                    ${supplementsHTML}
                    ${sourceLabel ? `<div style="font-size:0.7rem; font-weight:bold; margin-top:4px;">${sourceLabel}</div>` : ''}
                `;
                card.onclick = () => showOrderDetails(order);
                col.appendChild(card);
            });

            calendarGrid.appendChild(col);
        }
    }

    // --- Detail Modal Elements ---
    const detailModal = document.getElementById('detailModal');
    const closeDetailModalBtn = document.getElementById('closeDetailModal');
    const detailContent = document.getElementById('detailContent');
    const editOrderBtn = document.getElementById('editOrderBtn');
    const deleteOrderBtn = document.getElementById('deleteOrderBtn');
    let currentSelectedOrderId = null;

    // --- Detail Logic ---
    function showOrderDetails(order) {
        currentSelectedOrderId = order.id;

        let supplementsHTML = '';
        if (order.supplements && order.supplements.length > 0) {
            supplementsHTML = `<p><strong>Options:</strong> <br> ${order.supplements.join('<br>')}</p>`;
        }

        detailContent.innerHTML = `
            <div style="text-align:center; margin-bottom:20px;">
                <h2 style="color:var(--color-primary); margin-bottom:5px;">${order.type}</h2>
                <span style="background:rgba(212,175,55,0.1); padding:4px 10px; border-radius:10px; font-size:0.8rem; color:var(--color-primary);">${order.size}</span>
            </div>
            <div style="background:rgba(255,255,255,0.05); padding:15px; border-radius:8px; margin-bottom:15px;">
                <p><i class="fas fa-user" style="width:20px; color:#888;"></i> <strong>${order.client}</strong></p>
                <p><i class="fas fa-phone" style="width:20px; color:#888;"></i> ${order.phone || 'Non renseigné'}</p>
                <p><i class="fas fa-clock" style="width:20px; color:#888;"></i> ${order.time}</p>
            </div>
            ${supplementsHTML ? `<div style="margin-bottom:15px; font-size:0.9rem;">${supplementsHTML}</div>` : ''}
            ${order.notes ? `<div style="margin-bottom:15px; font-size:0.9rem;"><p><strong>Note:</strong> ${order.notes}</p></div>` : ''}
        `;

        detailModal.style.display = 'flex';
    }

    closeDetailModalBtn.onclick = () => { detailModal.style.display = 'none'; };

    // --- Helper Functions ---
    function populateDaySelect() {
        const select = document.getElementById('pickupDay');
        select.innerHTML = '';
        const startOfWeek = getStartOfWeek(currentDate);

        for (let i = 0; i < 7; i++) {
            const d = new Date(startOfWeek);
            d.setDate(startOfWeek.getDate() + i);
            const val = d.toISOString().split('T')[0];

            const option = document.createElement('option');
            option.value = val;
            option.text = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric' });
            select.appendChild(option);
        }
    }

    // --- Edit Logic ---
    editOrderBtn.onclick = () => {
        const order = orders.find(o => o.id === currentSelectedOrderId);
        if (!order) return;

        detailModal.style.display = 'none'; // Close detail

        // Open Form in Edit Mode
        modal.style.display = 'flex';
        currentStep = 0;
        updateWizard();
        populateDaySelect();

        // Pre-fill form
        document.getElementById('cakeType').value = order.type;

        // Handle Size Matching (e.g. "6 parts" -> "6")
        let sizeVal = order.size.split(' ')[0]; // Try taking first part "6"
        if (sizeVal === 'Std') sizeVal = '4'; // Fallback for snacking
        // If exact match not found in select, it might default or stay empty, 
        // but this heuristic covers "6 parts", "8 pers", "20+".
        const sizeSelect = document.getElementById('cakeSize');
        if ([...sizeSelect.options].some(o => o.value === sizeVal)) {
            sizeSelect.value = sizeVal;
        } else {
            // Try parseInt fallback
            sizeSelect.value = parseInt(order.size) || '4';
        }

        document.getElementById('clientName').value = order.client;
        document.getElementById('clientPhone').value = order.phone || '';
        document.getElementById('pickupDay').value = order.date;
        document.getElementById('pickupTime').value = order.time;
        document.getElementById('cakeNotes').value = order.notes || '';

        // Reset and check supplements
        ['optCandles', 'optPhoto', 'optGluten', 'optLactose'].forEach(id => document.getElementById(id).checked = false);
        document.getElementById('cakeMessage').value = '';

        if (order.supplements) {
            if (order.supplements.includes('Bougies')) document.getElementById('optCandles').checked = true;
            if (order.supplements.includes('Impression Photo')) document.getElementById('optPhoto').checked = true;
            if (order.supplements.includes('Sans Gluten')) document.getElementById('optGluten').checked = true;
            if (order.supplements.includes('Sans Lactose')) document.getElementById('optLactose').checked = true;

            // Extract message
            const plaque = order.supplements.find(s => s.startsWith('Plaque "'));
            if (plaque) {
                document.getElementById('cakeMessage').value = plaque.replace('Plaque "', '').replace('"', '');
            }
        }

        // Tag form as editing
        orderForm.dataset.editId = order.id;
    };

    // --- Delete Logic ---
    deleteOrderBtn.onclick = () => {
        if (confirm('Voulez-vous vraiment supprimer cette commande ?')) {
            orders = orders.filter(o => o.id !== currentSelectedOrderId);
            localStorage.setItem('douceTentationOrders', JSON.stringify(orders));
            renderCalendar();
            detailModal.style.display = 'none';
        }
    };

    // --- Form Submission (Updated for Edit) ---
    orderForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // Collect Supplements
        const supplements = [];
        if (document.getElementById('optCandles').checked) supplements.push('Bougies');
        if (document.getElementById('optPhoto').checked) supplements.push('Impression Photo');
        if (document.getElementById('optGluten').checked) supplements.push('Sans Gluten');
        if (document.getElementById('optLactose').checked) supplements.push('Sans Lactose');

        const msg = document.getElementById('cakeMessage').value;
        if (msg) supplements.push(`Plaque "${msg}"`);

        const orderData = {
            type: document.getElementById('cakeType').value,
            size: document.getElementById('cakeSize').value,
            supplements: supplements,
            client: document.getElementById('clientName').value,
            phone: document.getElementById('clientPhone').value,
            date: document.getElementById('pickupDay').value,
            time: document.getElementById('pickupTime').value,
            source: 'manual',
            notes: document.getElementById('cakeNotes').value
        };

        if (orderForm.dataset.editId) {
            // Update Existing
            const idx = orders.findIndex(o => o.id == orderForm.dataset.editId);
            if (idx !== -1) {
                orders[idx] = { ...orders[idx], ...orderData };
                alert('Commande modifiée !');
            }
            delete orderForm.dataset.editId; // Clear edit mode
        } else {
            // Create New
            orders.push({ id: Date.now(), ...orderData });
            alert('Commande ajoutée !');
        }

        localStorage.setItem('douceTentationOrders', JSON.stringify(orders));
        renderCalendar();
        modal.style.display = 'none';
    });

    // --- GloriaFood Simulation ---
    simulateGloriaBtn.addEventListener('click', () => {
        const startOfWeek = getStartOfWeek(currentDate);
        const randomDayOffset = Math.floor(Math.random() * 7);
        const targetDate = new Date(startOfWeek);
        targetDate.setDate(targetDate.getDate() + randomDayOffset);
        const dateStr = targetDate.toISOString().split('T')[0];

        const isCake = Math.random() > 0.5;
        let type, source, notes, supps = [];

        if (isCake) {
            const cakeTypes = ['Gâteau Personnalisé', 'Pièce Montée', 'Tarte aux Fruits'];
            type = cakeTypes[Math.floor(Math.random() * cakeTypes.length)];
            source = 'gloria_cake';
            notes = 'Via Web';
            if (Math.random() > 0.7) supps.push('Bougies');
        } else {
            const snackTypes = ['Sandwich Jambon', 'Croissant x4', 'Pain Surprise'];
            type = snackTypes[Math.floor(Math.random() * snackTypes.length)];
            source = 'gloria_snack';
            notes = 'Via Web';
        }

        const gloriaOrder = {
            id: Date.now(),
            type: type,
            size: isCake ? '8 pers' : 'Std',
            client: 'Commande Web #' + Math.floor(Math.random() * 1000),
            date: dateStr,
            time: '12:00',
            source: source,
            notes: notes,
            supplements: supps
        };

        orders.push(gloriaOrder);
        localStorage.setItem('douceTentationOrders', JSON.stringify(orders));
        renderCalendar();

        const btnText = simulateGloriaBtn.innerHTML;
        simulateGloriaBtn.innerHTML = '<i class="fas fa-check"></i> Reçu !';
        setTimeout(() => simulateGloriaBtn.innerHTML = btnText, 2000);
    });

});
