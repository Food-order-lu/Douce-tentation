document.addEventListener('DOMContentLoaded', async () => {

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
    const API_BASE = '/api';
    let currentDate = new Date(); // Start from today

    // --- State ---
    let orders = [];

    // --- API Helper Functions ---
    async function fetchOrders() {
        console.log('📡 Tentative de chargement des commandes depuis l\'API...');
        try {
            const res = await fetch(`${API_BASE}/orders`, {
                headers: { 'Bypass-Tunnel-Reminder': 'true' }
            });
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            orders = await res.json();
            console.log('✅ Commandes chargées:', orders.length, 'trouvées');
            return orders;
        } catch (error) {
            console.error('❌ Erreur API, passage sur LocalStorage:', error);
            const saved = localStorage.getItem('douceTentationOrders');
            orders = saved ? JSON.parse(saved) : [];
            return orders;
        }
    }

    async function createOrder(orderData) {
        try {
            const res = await fetch(`${API_BASE}/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Bypass-Tunnel-Reminder': 'true'
                },
                body: JSON.stringify(orderData)
            });
            const newOrder = await res.json();
            orders.push(newOrder);
            return newOrder;
        } catch (error) {
            console.error('Erreur création commande:', error);
            orderData.id = Date.now();
            orders.push(orderData);
            return orderData;
        }
    }

    async function updateOrder(id, orderData) {
        try {
            const res = await fetch(`${API_BASE}/orders/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Bypass-Tunnel-Reminder': 'true'
                },
                body: JSON.stringify(orderData)
            });
            const updatedOrder = await res.json();
            const idx = orders.findIndex(o => o.id == id);
            if (idx !== -1) orders[idx] = updatedOrder;
            return updatedOrder;
        } catch (error) {
            console.error('Erreur modification commande:', error);
            return null;
        }
    }

    async function deleteOrder(id) {
        try {
            await fetch(`${API_BASE}/orders/${id}`, {
                method: 'DELETE',
                headers: { 'Bypass-Tunnel-Reminder': 'true' }
            });
            orders = orders.filter(o => o.id != id);
            return true;
        } catch (error) {
            console.error('Erreur suppression commande:', error);
            return false;
        }
    }

    // Load orders from API
    await fetchOrders();

    // --- DOM Elements ---
    const calendarGrid = document.getElementById('calendarGrid');
    const modal = document.getElementById('orderModal');
    const newOrderBtn = document.getElementById('newOrderBtn');
    const closeModalBtn = document.getElementById('closeModal');
    const simulateGloriaBtn = document.getElementById('simulateGloriaBtn');
    const calendarHeaderTitle = document.querySelector('.calendar-header h1');

    // Wizard
    const orderForm = document.getElementById('orderForm');
    const steps = [
        document.getElementById('step1'),
        document.getElementById('step2'),
        document.getElementById('step3'),
        document.getElementById('step4')
    ];
    const orderSummary = document.getElementById('orderSummary');
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

        const indicators = document.querySelectorAll('.step');
        indicators.forEach((ind, idx) => {
            ind.classList.toggle('active', idx === currentStep);
            ind.classList.toggle('completed', idx < currentStep);
        });

        prevBtn.style.visibility = currentStep === 0 ? 'hidden' : 'visible';

        if (currentStep === steps.length - 1) {
            nextBtn.style.display = 'none';
            generateSummary();
        } else {
            nextBtn.style.display = 'inline-block';
            nextBtn.innerText = 'Suivant';
        }
    }

    function generateSummary() {
        const type = document.getElementById('cakeType').value;
        const size = document.getElementById('cakeSize').value;
        const client = document.getElementById('clientName').value;
        const phone = document.getElementById('clientPhone').value;
        const date = document.getElementById('pickupDay').value;
        const time = document.getElementById('pickupTime').value;
        const notes = document.getElementById('cakeNotes').value;

        const supplements = [];
        if (document.getElementById('optCandles').checked) supplements.push('Bougies');
        if (document.getElementById('optPhoto').checked) supplements.push('Impression Photo');
        if (document.getElementById('optGluten').checked) supplements.push('Sans Gluten');
        if (document.getElementById('optLactose').checked) supplements.push('Sans Lactose');
        const msg = document.getElementById('cakeMessage').value;

        orderSummary.innerHTML = `
            <div class="summary-item"><span class="summary-label">Produit:</span> <span class="summary-value">${type} (${size} pers.)</span></div>
            <div class="summary-item"><span class="summary-label">Client:</span> <span class="summary-value">${client}</span></div>
            <div class="summary-item"><span class="summary-label">Contact:</span> <span class="summary-value">${phone}</span></div>
            <div class="summary-item"><span class="summary-label">Retrait:</span> <span class="summary-value">${date} à ${time}</span></div>
            ${supplements.length > 0 ? `<div class="summary-item"><span class="summary-label">Options:</span> <span class="summary-value">${supplements.join(', ')}</span></div>` : ''}
            ${msg ? `<div class="summary-item"><span class="summary-label">Message:</span> <span class="summary-value">"${msg}"</span></div>` : ''}
            ${notes ? `<div class="summary-item"><span class="summary-label">Notes:</span> <span class="summary-value">${notes}</span></div>` : ''}
        `;
    }

    nextBtn.onclick = () => {
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

    // --- Modal Logic ---
    newOrderBtn.onclick = () => {
        orderForm.reset();
        currentStep = 0;
        updateWizard();
        modal.style.display = 'block';
        delete orderForm.dataset.editId;
        populatePickupDays();
    };

    closeModalBtn.onclick = () => {
        modal.style.display = 'none';
    };

    window.onclick = (event) => {
        if (event.target == modal) modal.style.display = 'none';
        if (event.target == detailModal) detailModal.style.display = 'none';
    };

    // --- Navigation Buttons ---
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
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    }

    function renderCalendar() {
        console.log('📅 Rendu du calendrier à partir de:', currentDate.toDateString());
        calendarGrid.innerHTML = '';
        const startOfWeek = getStartOfWeek(currentDate);
        console.log('📅 Début de semaine (Lundi):', startOfWeek.toDateString());

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        const options = { month: 'long', day: 'numeric' };
        calendarHeaderTitle.innerText = `Semaine du ${startOfWeek.toLocaleDateString('fr-FR', options)}`;

        for (let i = 0; i < 7; i++) {
            const dayDate = new Date(startOfWeek);
            dayDate.setDate(startOfWeek.getDate() + i);
            const dateStr = dayDate.toISOString().split('T')[0];
            const isToday = new Date().toLocaleDateString('en-CA') === dateStr;

            const col = document.createElement('div');
            col.className = 'day-column';
            if (isToday) col.classList.add('is-today');

            col.innerHTML = `
                <div class="day-header">
                    ${dayDate.toLocaleDateString('fr-FR', { weekday: 'long' })} <br>
                    <span style="font-size:0.8rem; opacity:0.7">${dayDate.getDate()}/${dayDate.getMonth() + 1}</span>
                </div>
            `;

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

    function populatePickupDays() {
        const pickupDaySelect = document.getElementById('pickupDay');
        pickupDaySelect.innerHTML = '';
        const startOfWeek = getStartOfWeek(currentDate);

        for (let i = 0; i < 7; i++) {
            const dayDate = new Date(startOfWeek);
            dayDate.setDate(startOfWeek.getDate() + i);
            const dateStr = dayDate.toISOString().split('T')[0];
            const option = document.createElement('option');
            option.value = dateStr;
            option.innerText = dayDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
            pickupDaySelect.appendChild(option);
        }
    }

    const detailModal = document.getElementById('detailModal');
    const closeDetailModalBtn = document.getElementById('closeDetailModal');
    const detailContent = document.getElementById('detailContent');
    const editOrderBtn = document.getElementById('editOrderBtn');
    const deleteOrderBtn = document.getElementById('deleteOrderBtn');
    let currentSelectedOrderId = null;

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
                <p><i class="fas fa-calendar" style="width:20px; color:#888;"></i> ${order.date}</p>
                <p><i class="fas fa-sticky-note" style="width:20px; color:#888;"></i> ${order.notes || 'Pas de notes'}</p>
            </div>
            ${supplementsHTML}
        `;

        detailModal.style.display = 'block';
    }

    closeDetailModalBtn.onclick = () => {
        detailModal.style.display = 'none';
    };

    editOrderBtn.onclick = () => {
        const order = orders.find(o => o.id == currentSelectedOrderId);
        if (!order) return;

        detailModal.style.display = 'none';
        modal.style.display = 'block';
        currentStep = 0;
        updateWizard();

        document.getElementById('cakeType').value = order.type;
        document.getElementById('cakeSize').value = order.size;
        document.getElementById('clientName').value = order.client;
        document.getElementById('clientPhone').value = order.phone;
        document.getElementById('pickupDay').value = order.date;
        document.getElementById('pickupTime').value = order.time;
        document.getElementById('cakeNotes').value = order.notes;

        document.getElementById('optCandles').checked = order.supplements.includes('Bougies');
        document.getElementById('optPhoto').checked = order.supplements.includes('Impression Photo');
        document.getElementById('optGluten').checked = order.supplements.includes('Sans Gluten');
        document.getElementById('optLactose').checked = order.supplements.includes('Sans Lactose');

        populatePickupDays();
        document.getElementById('pickupDay').value = order.date;

        orderForm.dataset.editId = order.id;
    };

    deleteOrderBtn.onclick = async () => {
        if (confirm('Voulez-vous vraiment supprimer cette commande ?')) {
            await deleteOrder(currentSelectedOrderId);
            renderCalendar();
            detailModal.style.display = 'none';
        }
    };

    orderForm.addEventListener('submit', async (e) => {
        e.preventDefault();

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
            await updateOrder(orderForm.dataset.editId, orderData);
            alert('Commande modifiée !');
            delete orderForm.dataset.editId;
        } else {
            await createOrder(orderData);
            alert('Commande ajoutée !');
        }

        renderCalendar();
        modal.style.display = 'none';
    });

    simulateGloriaBtn.addEventListener('click', async () => {
        const btnText = simulateGloriaBtn.innerHTML;
        simulateGloriaBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Syncing...';

        try {
            await fetchOrders();
            renderCalendar();
            simulateGloriaBtn.innerHTML = '<i class="fas fa-check"></i> Synced !';
        } catch (error) {
            simulateGloriaBtn.innerHTML = '<i class="fas fa-times"></i> Erreur';
        }

        setTimeout(() => simulateGloriaBtn.innerHTML = btnText, 2000);
    });

});
