/**
 * Douce Tentation - Calendar Module
 * ==================================
 * Handles calendar rendering and order display.
 * 
 * @module calendar
 */

/**
 * Create the Calendar module
 * @param {Object} options - Configuration options
 * @returns {Object} Calendar API
 */
function createCalendar(options) {
    const {
        containerSelector,
        headerTitleSelector,
        orders,
        onOrderClick
    } = options;

    const container = document.querySelector(containerSelector);
    const headerTitle = document.querySelector(headerTitleSelector);
    let currentDate = new Date();

    /**
     * Render the calendar grid
     * @param {Array} ordersData - Orders to display
     */
    function render(ordersData) {
        console.log('📅 Rendering calendar from:', currentDate.toDateString());
        container.innerHTML = '';

        const startOfWeek = DouxUtils.getStartOfWeek(currentDate);

        // Update header title
        const options = { month: 'long', day: 'numeric' };
        headerTitle.innerText = `Semaine du ${DouxUtils.formatDateFR(startOfWeek, options)}`;

        // Render 7 days
        for (let i = 0; i < 7; i++) {
            const dayDate = new Date(startOfWeek);
            dayDate.setDate(startOfWeek.getDate() + i);
            const dateStr = DouxUtils.formatDateISO(dayDate);
            const isToday = DouxUtils.formatDateISO(new Date()) === dateStr;

            const column = createDayColumn(dayDate, dateStr, isToday, ordersData);
            container.appendChild(column);
        }
    }

    /**
     * Create a day column element
     */
    function createDayColumn(dayDate, dateStr, isToday, ordersData) {
        const col = document.createElement('div');
        col.className = 'day-column';
        if (isToday) col.style.border = '2px solid var(--color-primary)';

        // Header
        col.innerHTML = `
            <div class="day-header">
                ${DouxUtils.formatDateFR(dayDate, { weekday: 'long' })} <br>
                <span style="font-size:0.8rem; opacity:0.7">${dayDate.getDate()}/${dayDate.getMonth() + 1}</span>
            </div>
        `;

        // Orders for this day
        const dayOrders = ordersData
            .filter(o => o.date === dateStr)
            .sort((a, b) => a.time.localeCompare(b.time));

        dayOrders.forEach(order => {
            const card = createOrderCard(order);
            col.appendChild(card);
        });

        return col;
    }

    /**
     * Create an order card element
     */
    function createOrderCard(order) {
        const card = document.createElement('div');
        const sourceClass = DouxUtils.getSourceClass(order.source);
        const sourceLabel = DouxUtils.getSourceLabel(order.source);

        let supplementsHTML = '';
        if (order.supplements && order.supplements.length > 0) {
            supplementsHTML = `<div style="font-size:0.75rem; color:#888; border-top:1px solid #eee; margin-top:4px; padding-top:2px;">+ ${order.supplements.join(', ')}</div>`;
        }

        card.className = `order-card ${sourceClass} ${order.status === 'Pending' ? 'unconfirmed' : ''}`;

        let statusHTML = '';
        if (order.status === 'Ready') {
            statusHTML = `<div style="position:absolute; top:10px; right:10px; color:#2D6A4F; font-size:0.8rem;"><i class="fas fa-check-circle"></i></div>`;
        } else if (order.status === 'In Progress') {
            statusHTML = `<div style="position:absolute; top:10px; right:10px; color:#E85D04; font-size:0.8rem;"><i class="fas fa-spinner fa-spin"></i></div>`;
        } else if (order.status === 'Pending') {
            statusHTML = `<div style="position:absolute; top:10px; right:10px; color:#E85D04; font-size:0.65rem; font-weight:bold; background:rgba(232,93,4,0.1); padding:2px 6px; border-radius:4px; border:1px solid rgba(232,93,4,0.3);"><i class="fas fa-exclamation-triangle"></i> NON CONFIRMÉ</div>`;
        }

        const items = order.items || (order.gloriaRaw && order.gloriaRaw.items) || [];
        const itemsHTML = items.map(it => `
            <div style="font-size:0.75rem; border-top:1px solid rgba(255,255,255,0.05); padding-top:4px; margin-top:6px; line-height:1.3;">
                <strong style="color:var(--color-secondary);">${it.quantity}x ${it.name}</strong>
                ${it.instructions ? `<div style="font-size:0.7rem; color:#bbb; margin-top:2px; padding-left:5px; border-left:1px solid var(--color-primary);">${it.instructions.split(' | ').join('<br>')}</div>` : ''}
            </div>
        `).join('');

        card.innerHTML = `
            ${statusHTML}
            <div class="order-time">${order.time}</div>
            <div class="order-client" style="font-weight:bold; font-size:1.05rem; color:var(--color-primary); margin-bottom:2px;">${order.client}</div>
            ${itemsHTML}
            ${supplementsHTML}
            ${sourceLabel ? `<div style="font-size:0.65rem; font-weight:bold; margin-top:8px; opacity:0.8; text-transform:uppercase; letter-spacing:0.5px;">${sourceLabel} ${order.status === 'Ready' ? '✓' : ''}</div>` : ''}
        `;

        card.onclick = () => onOrderClick(order);
        return card;
    }

    /**
     * Navigate to previous week
     */
    function previousWeek() {
        currentDate.setDate(currentDate.getDate() - 7);
    }

    /**
     * Navigate to next week
     */
    function nextWeek() {
        currentDate.setDate(currentDate.getDate() + 7);
    }

    /**
     * Get current date
     */
    function getCurrentDate() {
        return new Date(currentDate);
    }

    return {
        render,
        previousWeek,
        nextWeek,
        getCurrentDate
    };
}

// Export
window.createCalendar = createCalendar;
