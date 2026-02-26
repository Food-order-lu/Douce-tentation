/**
 * Douce Tentation - Modals Module
 * ================================
 * Handles all modal dialogs for order creation, editing, and details.
 * 
 * @module modals
 */

/**
 * Create the Modals manager
 * @param {Object} callbacks - Event callbacks
 * @returns {Object} Modals API
 */
function createModalsManager(callbacks) {
    const { onOrderCreated, onOrderUpdated, onOrderDeleted } = callbacks;

    // Prices and Menu
    const MENU = window.MENU_DATA;

    // DOM Elements
    const orderModal = document.getElementById('orderModal');
    const detailModal = document.getElementById('detailModal');
    const orderForm = document.getElementById('orderForm');

    // Menu state
    let activeItemCategory = 'gateaux';

    // Wizard state
    const steps = [
        document.getElementById('step1'),
        document.getElementById('step2'),
        document.getElementById('step3'),
        document.getElementById('step4')
    ];
    let currentStep = 0;
    let currentSelectedOrderId = null;

    // ========================================
    // Order Modal (Create/Edit)
    // ========================================

    /**
     * Open the order modal for creating a new order
     */
    function openNewOrderModal() {
        orderForm.reset();
        currentStep = 0;
        delete orderForm.dataset.editId;
        renderWizardItems([]); // Start with empty list

        // Populate and select first date
        populateDateDropdown();

        updateWizardUI();
        orderModal.style.display = 'flex';
    }

    /**
     * Populate the pickupDay dropdown with human-readable dates (Jour, Date)
     */
    function populateDateDropdown() {
        const select = document.getElementById('pickupDay');
        if (!select) return;
        select.innerHTML = '';

        const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
        const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

        const now = new Date();
        for (let i = 0; i < 15; i++) {
            const date = new Date(now);
            date.setDate(now.getDate() + i);

            const dayName = days[date.getDay()];
            const dayNum = date.getDate();
            const monthName = months[date.getMonth()];

            const iso = date.toISOString().split('T')[0];
            const label = `${dayName}, ${dayNum} ${monthName}`;

            const opt = document.createElement('option');
            opt.value = iso;
            opt.textContent = label;
            select.appendChild(opt);
        }
    }

    /**
     * Open the order modal for editing an existing order
     * @param {Object} order - Order to edit
     */
    function openEditOrderModal(order) {
        orderForm.reset();
        currentStep = 0;
        updateWizardUI();

        // Populate form fields
        document.getElementById('cakeType').value = order.type || '';
        document.getElementById('cakeSize').value = order.size || '';
        document.getElementById('clientName').value = order.client || '';
        document.getElementById('clientPhone').value = order.phone || '';

        // Ensure date dropdown is populated before setting value
        populateDateDropdown();
        document.getElementById('pickupDay').value = order.date;
        document.getElementById('pickupTime').value = order.time;
        document.getElementById('cakeNotes').value = order.notes || '';

        // Global supplements are no longer used for selection in Step 2

        // Handle items - Force separation of items for detailed editing
        const items = order.items || (order.gloriaRaw && order.gloriaRaw.items) || [];
        renderWizardItems(items, true);

        orderForm.dataset.editId = order.id;
        orderModal.style.display = 'flex';
    }

    /**
     * Render the items list inside the wizard
     * @param {Array} items - Items to render
     * @param {Boolean} forceSeparate - If true, treats quantity as 1 and clones entries (separate modifications)
     */
    function renderWizardItems(items, forceSeparate = false) {
        const list = document.getElementById('wizardItemsList');
        if (!list) return;
        list.innerHTML = '';

        let processedItems = [...items];

        if (forceSeparate) {
            const flat = [];
            items.forEach(it => {
                const qty = parseInt(it.quantity) || 1;
                for (let i = 0; i < qty; i++) {
                    flat.push({ ...it, quantity: 1 });
                }
            });
            processedItems = flat;
        }

        processedItems.forEach((item, index) => {
            const card = document.createElement('div');
            card.className = 'wizard-item-card';

            // Options summary badges
            const instructions = item.instructions || '';
            const optsSummaryHTML = instructions ? `
                <div style="margin-top: 8px; display: flex; flex-wrap: wrap; gap: 4px;">
                    ${instructions.split(' | ').filter(opt => !opt.startsWith('Catégorie:')).map(opt => `
                        <span class="option-badge">
                            ${opt}
                        </span>
                    `).join('')}
                </div>
            ` : '';

            card.innerHTML = `
                <div class="item-card-header">
                    <span class="item-card-number">Article ${index + 1}</span>
                    <button type="button" class="btn-remove-item" onclick="window.modals.removeWizardItem(${index})">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
                <div class="item-card-body">
                    <input type="hidden" class="item-instructions" value="${item.instructions || ''}">
                    <div class="item-field">
                        <label>Nom du Produit</label>
                        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                            <div style="flex:1;">
                                <input type="text" class="item-name" value="${item.name || ''}" placeholder="Nom de l'article" 
                                       onchange="window.modals.updateWizardItemField(${index}, 'name', this.value)">
                                ${optsSummaryHTML}
                            </div>
                            <button type="button" onclick="window.modals.openWizardItemEdit(${index})" class="btn-icon" 
                                    style="margin-left:8px; background:rgba(212,175,55,0.1); border:none; width:28px; height:28px; border-radius:50%; color:var(--color-primary); cursor:pointer; flex-shrink:0; display:flex; align-items:center; justify-content:center;">
                                <i class="fas fa-magic" style="font-size:0.7rem;"></i>
                            </button>
                        </div>
                    </div>
                    <div class="item-field">
                        <label>Quantité</label>
                        <input type="number" class="item-quantity" value="${item.quantity || 1}" min="1" 
                               onchange="window.modals.updateWizardItemField(${index}, 'quantity', this.value)">
                    </div>
                </div>
            `;
            list.appendChild(card);
        });
    }

    /**
     * Add an empty item to the wizard list
     */
    function addWizardItem() {
        try {
            console.log('Adding new item to wizard...');
            const list = document.getElementById('wizardItemsList');
            if (!list) {
                console.error('Wizard list container not found!');
                return;
            }
            const items = collectWizardItems();
            items.push({ name: '', quantity: 1, instructions: '' });
            renderWizardItems(items);
            console.log('Item added successfully. Count:', items.length);
        } catch (err) {
            console.error('Error adding wizard item:', err);
        }
    }

    /**
     * Remove an item from the wizard list
     */
    function removeWizardItem(index) {
        const items = collectWizardItems();
        items.splice(index, 1);
        renderWizardItems(items);
    }

    /**
     * Update an item field in the wizard
     */
    function updateWizardItemField(index, field, value) {
        const items = collectWizardItems();
        if (items[index]) {
            items[index][field] = value;
            // Always re-render to ensure UI reflects the state correctly (e.g. badges, name)
            renderWizardItems(items);
        }
    }

    /**
     * Open individual item edit modal FROM WIZARD
     */
    function openWizardItemEdit(index) {
        const items = collectWizardItems();
        const item = items[index];
        if (!item) return;

        // Use a flag to know we are editing a wizard item
        document.getElementById('editItemIndex').value = index;
        document.getElementById('editItemIndex').dataset.source = 'wizard';

        // Default to gateaux if no category info in instructions
        let cat = 'gateaux';
        if (item.instructions && item.instructions.includes('Catégorie: Salgados')) cat = 'salgados';

        switchItemCategory(cat);
        populateMenuDropdowns();
        populateItemEditModal(item);
    }

    /**
     * Switch category in the item edit modal
     */
    function switchItemCategory(category) {
        activeItemCategory = category;
        const gateauxSection = document.getElementById('sectionGateaux');
        const salgadosSection = document.getElementById('sectionSalgados');
        const catBtnGateaux = document.getElementById('catBtnGateaux');
        const catBtnSalgados = document.getElementById('catBtnSalgados');

        if (category === 'gateaux') {
            gateauxSection.style.display = 'block';
            salgadosSection.style.display = 'none';
            catBtnGateaux.classList.add('active');
            catBtnSalgados.classList.remove('active');
        } else {
            gateauxSection.style.display = 'none';
            salgadosSection.style.display = 'block';
            catBtnGateaux.classList.remove('active');
            catBtnSalgados.classList.add('active');
        }
    }

    /**
     * Populate the dropdowns in item edit modal from MENU_DATA
     */
    function populateMenuDropdowns() {
        const menu = window.MENU_DATA;
        if (!menu) return;

        // Gateaux
        const baseSel = document.getElementById('editGateauBase');
        const garnSel = document.getElementById('editGateauGarniture');
        const mousSel = document.getElementById('editGateauMousse');
        const finCont = document.getElementById('finitionContainer');

        if (baseSel) {
            baseSel.innerHTML = '<option value="">Choisir un goût...</option>' +
                menu.gateaux.bases.map(b => `<option value="${b}">${b}</option>`).join('');
        }
        if (garnSel) {
            garnSel.innerHTML = '<option value="">Choisir une garniture...</option>' +
                menu.gateaux.garnitures.map(g => `<option value="${g}">${g}</option>`).join('');
        }
        if (mousSel) {
            mousSel.innerHTML = '<option value="">Choisir une mousse...</option>' +
                menu.gateaux.mousses.map(m => `<option value="${m}">${m}</option>`).join('');
        }
        if (finCont) {
            finCont.innerHTML = menu.gateaux.finitions.map(f => `
                <button type="button" class="category-chip" data-finition="${f.name}" onclick="this.parentNode.querySelectorAll('button').forEach(b=>b.classList.remove('active')); this.classList.add('active');">
                    ${f.name} (${f.pricePerPers.toFixed(2)}€)
                </button>
            `).join('');
        }

        // Salgados
        const saléSel = document.getElementById('editSaléType');
        if (saléSel) {
            let html = '<option value="">Choisir un type...</option>';
            html += '<optgroup label="Rissois (8€)">';
            html += menu.salgados.rissois_8.map(r => `<option value="${r}">${r} (8€/12)</option>`).join('');
            html += '</optgroup>';
            html += '<optgroup label="Rissois (9€)">';
            html += menu.salgados.rissois_9.map(r => `<option value="${r}">${r} (9€/12)</option>`).join('');
            html += '</optgroup>';
            html += '<optgroup label="Autres">';
            html += menu.salgados.autres.map(a => `<option value="${a.name}">${a.name} (${a.pricePerDozen || a.pricePerPiece}€)</option>`).join('');
            html += '</optgroup>';
            saléSel.innerHTML = html;
        }
    }

    /**
     * Populate the item edit modal fields
     */
    function populateItemEditModal(item) {
        document.getElementById('editItemName').value = item.name || '';
        document.getElementById('editItemQuantity').value = item.quantity || 1;

        // Reset sub-form fields
        if (document.getElementById('editItemSupplements')) document.getElementById('editItemSupplements').value = '';
        if (document.getElementById('editItemOptChef')) document.getElementById('editItemOptChef').checked = false;
        if (document.getElementById('editSaléFrit')) document.getElementById('editSaléFrit').checked = false;
        if (document.getElementById('editSaléChef')) document.getElementById('editSaléChef').checked = false;
        document.getElementById('editItemInstructions').value = '';

        // Populate from item metadata/instructions if existing
        342:         // Populate from item metadata/instructions if existing
        343: if (item.instructions) {
            344: const lines = item.instructions.split(' | ');
            345: lines.forEach(line => {
                346: const lowerLine = line.toLowerCase();
                347:
                348:                 // Helper to check if line contains a key
                349: const getValue = (prefix) => {
                    350: if (line.includes(': ')) return line.split(': ')[1];
                    351: return line.replace(prefix, '');
                    352:
                };
                353:
                354: if (lowerLine.includes('base') || lowerLine.includes('goût')) {
                    355: document.getElementById('editGateauBase').value = getValue('Base: ');
                    356:
                } else if (lowerLine.includes('garniture')) {
                    357: document.getElementById('editGateauGarniture').value = getValue('Garniture: ');
                    358:
                } else if (lowerLine.includes('mousse')) {
                    359: document.getElementById('editGateauMousse').value = getValue('Mousse: ');
                    360:
                } else if (lowerLine.includes('finition')) {
                    361: const finish = getValue('Finition: ');
                    362: document.querySelectorAll('#finitionContainer button').forEach(b => {
                        363: if (b.dataset.finition === finish) b.classList.add('active');
                        364:                         else b.classList.remove('active');
                        365:
                    });
                    366:
                } else if (lowerLine.includes('type: ')) {
                    367: document.getElementById('editSaléType').value = getValue('Type: ');
                    368:
                } else if (lowerLine === 'frit') {
                    369: document.getElementById('editSaléFrit').checked = true;
                    370:
                } else if (lowerLine.includes('plaque') || lowerLine.includes('inscription')) {
                    371: document.getElementById('editItemMessage').value = getValue('Plaque: ');
                    372:
                } else if (lowerLine.includes('supplément')) {
                    373: if (document.getElementById('editItemSupplements')) {
                        374: document.getElementById('editItemSupplements').value = getValue('Suppléments: ');
                        375:
                    }
                    376:
                } else if (lowerLine.includes('bougie')) {
                    377: if (document.getElementById('editItemOptCandles')) document.getElementById('editItemOptCandles').checked = true;
                    378:
                } else if (lowerLine.includes('photo')) {
                    379: if (document.getElementById('editItemOptPhoto')) document.getElementById('editItemOptPhoto').checked = true;
                    380:
                } else if (lowerLine.includes('gluten')) {
                    381: if (document.getElementById('editItemOptGluten')) document.getElementById('editItemOptGluten').checked = true;
                    382:
                } else if (lowerLine.includes('choix du restaurant') || lowerLine.includes('chef')) {
                    383: if (document.getElementById('editItemOptChef')) document.getElementById('editItemOptChef').checked = true;
                    384: if (document.getElementById('editSaléChef')) document.getElementById('editSaléChef').checked = true;
                    385:
                }
                386:
            });
            387:
            388:             // The raw instructions are lines that don't match standard patterns
            389: const rawInstructions = lines.filter(l => {
                390: const low = l.toLowerCase();
                391: return !low.includes('base') && !low.includes('goût') && !low.includes('garniture') &&
                    392: !low.includes('mousse') && !low.includes('finition') && !low.includes('type: ') &&
                        393: !low.includes('plaque') && !low.includes('inscription') && !low.includes('catégorie:') &&
                            394: !['frit', 'bougies', 'photo', 'gluten'].some(k => low.includes(k));
                395:
            }).join(' | ');
            396: document.getElementById('editItemInstructions').value = rawInstructions;
            397:
        }

        document.getElementById('itemEditModal').style.display = 'flex';
    }

    /**
     * Collect all items from the wizard UI
     */
    function collectWizardItems() {
        const list = document.getElementById('wizardItemsList');
        if (!list) return [];
        const cards = list.querySelectorAll('.wizard-item-card');
        return Array.from(cards).map(card => {
            const nameInput = card.querySelector('.item-name');
            const qtyInput = card.querySelector('.item-quantity');
            const instrInput = card.querySelector('.item-instructions');

            return {
                name: nameInput ? nameInput.value : '',
                quantity: qtyInput ? (parseInt(qtyInput.value) || 1) : 1,
                instructions: instrInput ? instrInput.value : ''
            };
        });
    }

    /**
     * Close the order modal
     */
    function closeOrderModal() {
        orderModal.style.display = 'none';
    }

    /**
     * Update wizard step indicators
     */
    function updateWizardUI() {
        steps.forEach((step, idx) => {
            step.style.display = idx === currentStep ? 'block' : 'none';
        });

        const indicators = document.querySelectorAll('.step');
        indicators.forEach((ind, idx) => {
            ind.classList.toggle('active', idx === currentStep);
        });

        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');

        prevBtn.style.visibility = currentStep === 0 ? 'hidden' : 'visible';
        nextBtn.style.display = currentStep === steps.length - 1 ? 'none' : 'inline-block';
    }

    /**
     * Go to next wizard step
     */
    function nextStep() {
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
            if (currentStep === steps.length - 1) {
                renderSummary();
            }
            updateWizardUI();
        }
    }

    function calculateItemPrice(item, orderSizeStr) {
        const menu = window.MENU_DATA;
        if (!menu) return 0;

        const instructions = item.instructions || '';
        const qty = parseInt(item.quantity) || 1;

        if (instructions.includes('Catégorie: Salgados')) {
            let price = 0;
            const typeLine = instructions.split(' | ').find(l => l.startsWith('Type: '));
            const type = typeLine ? typeLine.replace('Type: ', '') : '';

            // Determine base price
            if (menu.salgados.rissois_8.includes(type)) {
                price = 8.00;
            } else if (menu.salgados.rissois_9.includes(type)) {
                price = 9.00;
            } else {
                const autre = menu.salgados.autres.find(a => a.name === type);
                if (autre) {
                    if (autre.pricePerPiece && !autre.pricePerDozen) {
                        return autre.pricePerPiece * qty;
                    }
                    price = autre.pricePerDozen || (autre.pricePerPiece * 12);
                }
            }

            // Frit extra
            if (instructions.includes('Frit')) {
                price += (menu.salgados.extra?.frit_per_dozen || 0);
            }

            return price * qty;
        } else {
            // Gateaux
            // Extract number of persons (e.g., "15 pers" -> 15)
            const match = (orderSizeStr || "").match(/\d+/);
            const numPers = match ? parseInt(match[0]) : 0;

            const finishLine = instructions.split(' | ').find(l => l.startsWith('Finition: '));
            const finishName = finishLine ? finishLine.replace('Finition: ', '') : '';
            const finish = menu.gateaux.finitions.find(f => f.name === finishName);

            let pricePerPers = finish ? finish.pricePerPers : 0;
            let totalPrice = pricePerPers * numPers;

            // Updated reference to gateaux_extra
            if (instructions.includes('Plaque: ')) {
                totalPrice += (menu.gateaux_extra?.plaque || 0);
            }

            const result = totalPrice * qty;
            return isNaN(result) ? 0 : result;
        }
    }

    /**
     * Render Step 4 Summary
     */
    function renderSummary() {
        const summary = document.getElementById('orderSummary');
        const type = document.getElementById('cakeType').value;
        const size = document.getElementById('cakeSize').value;
        const client = document.getElementById('clientName').value;
        const phone = document.getElementById('clientPhone').value;
        const notes = document.getElementById('cakeNotes').value;
        const dateString = document.getElementById('pickupDay').options[document.getElementById('pickupDay').selectedIndex]?.text || '';
        const time = document.getElementById('pickupTime').value;
        const items = collectWizardItems();

        summary.innerHTML = `
            <div class="summary-item"><span class="summary-label">Produit Principal:</span> <span class="summary-value">${type}</span></div>
            <div class="summary-item"><span class="summary-label">Taille:</span> <span class="summary-value">${size}</span></div>
            <div class="summary-item"><span class="summary-label">Client:</span> <span class="summary-value">${client} ${phone ? `(${phone})` : ''}</span></div>
            <div class="summary-item"><span class="summary-label">Jour:</span> <span class="summary-value">${dateString}</span></div>
            <div class="summary-item"><span class="summary-label">Heure:</span> <span class="summary-value">${time}</span></div>
            
            <div class="summary-item" style="flex-direction:column; align-items:flex-start; margin-top: 10px;">
                <span class="summary-label">Global Notes / Allergies:</span>
                <span class="summary-value" style="font-weight:400; font-size:0.85rem;">${notes || 'Aucune'}</span>
            </div>

            <div class="summary-item" style="border-top: 1px solid #444; margin-top: 15px; padding-top: 15px;">
                <span class="summary-label">Articles Détaillés (${items.length}):</span>
            </div>
            ${items.map(it => {
            const price = calculateItemPrice(it, size);
            return `
                <div class="summary-item" style="padding: 8px 10px; font-size: 0.8rem; flex-direction:column; align-items:flex-start; background:rgba(255,255,255,0.03); border-radius:6px; margin-bottom:5px;">
                    <div style="display:flex; justify-content:space-between; width:100%; font-weight:600; color:var(--color-secondary);">
                        <span>${it.quantity}x ${it.name}</span>
                        <span style="color:var(--color-primary);">${price > 0 ? price.toFixed(2) + '€' : '--'}</span>
                    </div>
                    <div style="color:#aaa; font-size:0.75rem; margin-top:4px; display:flex; flex-wrap:wrap; gap:5px;">
                        ${it.instructions ? it.instructions.split(' | ').filter(o => !o.startsWith('Catégorie:')).map(opt => `
                            <span style="background:rgba(212,175,55,0.08); padding:1px 6px; border-radius:4px; border:1px solid rgba(212,175,55,0.15); color:var(--color-primary);">
                                ${opt}
                            </span>
                        `).join('') : '<span style="color:#666;">Standard</span>'}
                    </div>
                </div>
            `}).join('')}

            <div class="summary-item" style="border-top: 2px solid var(--color-primary); margin-top: 15px; padding-top: 15px; font-size: 1.1rem;">
                <span class="summary-label" style="color:var(--color-primary);">Total Estimé:</span>
                <span class="summary-value" style="color:var(--color-primary); font-size: 1.3rem;">
                    ${items.reduce((acc, it) => acc + calculateItemPrice(it, size), 0).toFixed(2)}€
                </span>
            </div>
        `;
    }

    /**
     * Go to previous wizard step
     */
    function prevStep() {
        if (currentStep > 0) {
            currentStep--;
            updateWizardUI();
        }
    }

    /**
     * Handle form submission
     */
    async function handleFormSubmit(event) {
        event.preventDefault();

        const globalNotes = document.getElementById('cakeNotes').value;
        const wizardItems = collectWizardItems().filter(it => it.name.trim() !== '');

        const formData = {
            type: document.getElementById('cakeType').value,
            size: document.getElementById('cakeSize').value,
            items: wizardItems,
            supplements: [], // Per-item now
            client: document.getElementById('clientName').value,
            phone: document.getElementById('clientPhone').value,
            date: document.getElementById('pickupDay').value,
            time: document.getElementById('pickupTime').value,
            notes: globalNotes
        };

        if (orderForm.dataset.editId) {
            const currentOrders = callbacks.getCurrentOrders();
            const existingOrder = currentOrders.find(o => o.id == orderForm.dataset.editId);

            if (existingOrder) {
                const orderToUpdate = { ...existingOrder, ...formData };
                const updated = await DouxAPI.updateOrder(orderForm.dataset.editId, orderToUpdate);
                if (updated) {
                    alert('Commande modifiée !');
                    onOrderUpdated(orderForm.dataset.editId, updated);
                }
            }
            delete orderForm.dataset.editId;
        } else {
            const newOrder = {
                ...formData,
                source: 'manual',
                status: 'Accepted'
            };
            const created = await DouxAPI.createOrder(newOrder);
            alert('Commande ajoutée !');
            onOrderCreated(created);
        }

        closeOrderModal();
    }



    // ========================================
    // Detail Modal
    // ========================================

    /**
     * Show order details modal
     * @param {Object} order - Order to display
     */
    function showOrderDetails(order) {
        currentSelectedOrderId = order.id;

        const items = order.items || (order.gloriaRaw && order.gloriaRaw.items) || [];

        const detailContent = document.getElementById('detailContent');
        detailContent.innerHTML = `
            <div style="text-align:center; margin-bottom:30px; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:20px;">
                <h2 style="color:var(--color-primary); font-size:1.8rem; margin-bottom:10px;">${order.type}</h2>
                <div style="display:flex; justify-content:center; gap:12px; align-items:center;">
                    <span style="background:rgba(212,175,55,0.1); padding:6px 14px; border-radius:20px; font-size:0.85rem; color:var(--color-primary); border:1px solid rgba(212,175,55,0.2);">${order.size}</span>
                    <span class="status-badge" style="background:${getStatusColor(order.status)}; padding:6px 14px; border-radius:20px; font-size:0.85rem; color:white; font-weight:600;">${getStatusLabel(order.status)}</span>
                </div>
            </div>

            <div class="summary-card" style="margin-bottom:25px;">
                <div class="summary-item"><span class="summary-label">Client</span><span class="summary-value">${order.client}</span></div>
                <div class="summary-item"><span class="summary-label">Téléphone</span><span class="summary-value">${order.phone || 'N/A'}</span></div>
                <div class="summary-item"><span class="summary-label">Heure Retrait</span><span class="summary-value">${order.time}</span></div>
                <div class="summary-item"><span class="summary-label">Date</span><span class="summary-value">${order.date}</span></div>
                <div class="summary-item" style="flex-direction:column; align-items:flex-start; gap:5px;">
                    <span class="summary-label">Notes de la commande</span>
                    <span class="summary-value" style="font-weight:400; font-size:0.85rem; line-height:1.4;">${order.notes || 'N/A'}</span>
                </div>
            </div>

            ${items.length > 0 ? `
                <div style="margin-top:30px; border-top:1px solid rgba(255,255,255,0.1); padding-top:20px;">
                    <h3 style="font-size:1rem; margin-bottom:15px; text-align:center; color:var(--color-text-muted);">Articles détaillés</h3>
                    <div class="items-list">
                        ${items.map((item, index) => `
                            <div class="item-row" style="background:rgba(255,255,255,0.03); padding:12px 15px; border-radius:12px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center; border:1px solid rgba(255,255,255,0.05);">
                                <div style="flex:1;">
                                    <div style="font-weight:600; font-size:0.95rem; color:var(--color-secondary);">${item.quantity || 1}x ${item.name}</div>
                                    <div style="font-size:0.85rem; color:var(--color-text-muted); margin-top:8px; display:flex; flex-direction:column; gap:4px;">
                                        ${(item.instructions || item.options?.map(o => o.name).join(', ') || '').split(' | ').filter(o => !o.startsWith('Catégorie:')).map(l => `
                                            <div style="padding:4px 0; border-bottom:1px solid rgba(255,255,255,0.03);">
                                                <i class="fas fa-chevron-right" style="font-size:0.6rem; color:var(--color-primary); margin-right:8px;"></i>${l}
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                                <button onclick="window.modals.openItemEdit(${index})" class="btn-icon" style="background:rgba(212,175,55,0.1); border:none; width:36px; height:36px; border-radius:50%; color:var(--color-primary); cursor:pointer; display:flex; align-items:center; justify-content:center; transition:0.3s; flex-shrink:0; margin-left:15px;">
                                    <i class="fas fa-pen" style="font-size:0.8rem;"></i>
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        `;

        updateStatusButtons(order.status);
        detailModal.style.display = 'flex';
    }

    function getStatusColor(status) {
        switch (status) {
            case 'In Progress': return '#E85D04';
            case 'Ready': return '#2D6A4F';
            default: return '#555';
        }
    }

    function getStatusLabel(status) {
        switch (status) {
            case 'Accepted': return 'À Faire';
            case 'In Progress': return 'En Cours';
            case 'Ready': return 'Prêt';
            default: return status || 'Reçu';
        }
    }

    function updateStatusButtons(currentStatus) {
        const btns = document.querySelectorAll('.status-btn');
        btns.forEach(btn => {
            const isActive = btn.dataset.status === currentStatus;
            btn.style.background = isActive ? getStatusColor(currentStatus) : 'transparent';
            btn.style.borderColor = isActive ? getStatusColor(currentStatus) : '#444';
        });
    }

    async function handleStatusChange(status) {
        const order = callbacks.getCurrentOrders().find(o => o.id == currentSelectedOrderId);
        if (order) {
            order.status = status;
            const updated = await DouxAPI.updateOrder(order.id, order);
            if (updated) {
                onOrderUpdated(order.id, updated);
                showOrderDetails(updated);
            }
        }
    }

    /**
     * Open individual item edit modal (for DETAIL VIEW)
     */
    function openItemEdit(itemIndex) {
        const order = callbacks.getCurrentOrders().find(o => o.id == currentSelectedOrderId);
        if (!order) return;

        const items = order.items || (order.gloriaRaw && order.gloriaRaw.items) || [];
        const item = items[itemIndex];
        if (!item) return;

        document.getElementById('editItemIndex').value = itemIndex;
        document.getElementById('editItemIndex').dataset.source = 'detail';

        populateItemEditModal(item);
    }

    /**
     * Handle item edit form submission (Universal for Wizard OR Detail)
     */
    async function handleItemEditSubmit(event) {
        event.preventDefault();
        const index = parseInt(document.getElementById('editItemIndex').value);
        const source = document.getElementById('editItemIndex').dataset.source;

        const name = document.getElementById('editItemName').value;
        const quantity = parseInt(document.getElementById('editItemQuantity').value);

        // Collect options
        const opts = [];

        if (activeItemCategory === 'gateaux') {
            opts.push('Catégorie: Gâteaux');
            const base = document.getElementById('editGateauBase').value;
            const garn = document.getElementById('editGateauGarniture').value;
            const mous = document.getElementById('editGateauMousse').value;
            const fini = document.querySelector('#finitionContainer button.active')?.dataset.finition;

            if (base) opts.push(`Saveur de base: ${base}`);
            if (garn) opts.push(`Garniture: ${garn}`);
            if (mous) opts.push(`Mousse: ${mous}`);
            if (fini) opts.push(`Finition: ${fini}`);

            const message = document.getElementById('editItemMessage') ? document.getElementById('editItemMessage').value : '';
            if (message) opts.push(`Plaque: ${message}`);

            const supplements = document.getElementById('editItemSupplements') ? document.getElementById('editItemSupplements').value : '';
            if (supplements) opts.push(`Suppléments: ${supplements}`);

            if (document.getElementById('editItemOptChef')?.checked) opts.push('Choix du restaurant');
        } else {
            opts.push('Catégorie: Salgados');
            const type = document.getElementById('editSaléType').value;
            if (type) opts.push(`Type: ${type}`);
            if (document.getElementById('editSaléFrit')?.checked) opts.push('Frit');
            if (document.getElementById('editSaléChef')?.checked) opts.push('Choix du restaurant');
        }

        const rawInstructions = document.getElementById('editItemInstructions').value;
        if (rawInstructions) opts.push(rawInstructions);

        const finalInstructions = opts.join(' | ');

        if (source === 'wizard') {
            // Update in Wizard UI
            const wizardItemsList = document.getElementById('wizardItemsList');
            const card = wizardItemsList.children[index];
            if (card) {
                card.querySelector('.item-name').value = name;
                card.querySelector('.item-quantity').value = quantity;
                // We must re-render to update the badges
                const items = collectWizardItems();
                items[index].instructions = finalInstructions;
                renderWizardItems(items);
            }
            document.getElementById('itemEditModal').style.display = 'none';
        } else {
            // Update in DB (from detail view)
            const orders = callbacks.getCurrentOrders();
            const order = orders.find(o => o.id == currentSelectedOrderId);
            if (!order) return;

            let items = order.items || (order.gloriaRaw && order.gloriaRaw.items) || [];
            if (items[index]) {
                items[index].name = name;
                items[index].quantity = quantity;
                items[index].instructions = finalInstructions;
            }

            try {
                const updated = await DouxAPI.updateOrder(order.id, order);
                if (updated) {
                    onOrderUpdated(order.id, updated);
                    showOrderDetails(updated);
                    document.getElementById('itemEditModal').style.display = 'none';
                }
            } catch (error) {
                console.error('Error updating item:', error);
                alert('Erreur lors de la mise à jour');
            }
        }
    }

    /**
     * Close detail modal
     */
    function closeDetailModal() {
        detailModal.style.display = 'none';
    }

    /**
     * Handle edit button click
     * @param {Array} orders - Current orders array
     */
    function handleEditClick(orders) {
        const order = orders.find(o => o.id == currentSelectedOrderId);
        if (order) {
            closeDetailModal();
            openEditOrderModal(order);
        }
    }

    /**
     * Handle delete button click
     */
    async function handleDeleteClick() {
        if (confirm('Voulez-vous vraiment supprimer cette commande ?')) {
            const success = await DouxAPI.deleteOrder(currentSelectedOrderId);
            if (success) {
                onOrderDeleted(currentSelectedOrderId);
            }
            closeDetailModal();
        }
    }

    // ========================================
    // Event Bindings
    // ========================================

    function bindEvents() {
        if (document.getElementById('newOrderBtn')) document.getElementById('newOrderBtn').onclick = openNewOrderModal;
        if (document.getElementById('closeModal')) document.getElementById('closeModal').onclick = closeOrderModal;
        if (document.getElementById('nextBtn')) document.getElementById('nextBtn').onclick = nextStep;
        if (document.getElementById('prevBtn')) document.getElementById('prevBtn').onclick = prevStep;
        if (orderForm) orderForm.addEventListener('submit', handleFormSubmit);

        // Automate Title to Client Name
        const clientInput = document.getElementById('clientName');
        const titleInput = document.getElementById('cakeType');
        if (clientInput && titleInput) {
            clientInput.addEventListener('input', () => {
                if (!titleInput.value || titleInput.value === clientInput.dataset.lastAuto || titleInput.value === 'Nouvelle Commande') {
                    titleInput.value = clientInput.value;
                    clientInput.dataset.lastAuto = clientInput.value;
                }
            });
        }

        if (document.getElementById('addItemBtn')) {
            document.getElementById('addItemBtn').removeEventListener('click', addWizardItem);
            document.getElementById('addItemBtn').addEventListener('click', addWizardItem);
        }
        if (document.getElementById('closeDetailModal')) document.getElementById('closeDetailModal').onclick = closeDetailModal;
        if (document.getElementById('deleteOrderBtn')) document.getElementById('deleteOrderBtn').onclick = handleDeleteClick;

        if (document.getElementById('editOrderBtn')) {
            document.getElementById('editOrderBtn').onclick = () => handleEditClick(callbacks.getCurrentOrders());
        }

        document.querySelectorAll('.status-btn').forEach(btn => {
            btn.onclick = () => handleStatusChange(btn.dataset.status);
        });

        const itemEditForm = document.getElementById('itemEditForm');
        if (itemEditForm) itemEditForm.addEventListener('submit', handleItemEditSubmit);

        window.onclick = (event) => {
            if (event.target === orderModal) closeOrderModal();
            if (event.target === detailModal) closeDetailModal();
            if (event.target === document.getElementById('itemEditModal')) {
                document.getElementById('itemEditModal').style.display = 'none';
            }
        };
    }

    // Initialize
    bindEvents();

    return {
        openNewOrderModal,
        openEditOrderModal,
        closeOrderModal,
        showOrderDetails,
        closeDetailModal,
        handleEditClick,
        updateWizardUI,
        addWizardItem,
        removeWizardItem,
        openWizardItemEdit,
        openItemEdit,
        collectWizardItems,
        updateWizardItemField,
        switchItemCategory
    };
}

// Export
window.createModalsManager = createModalsManager;
