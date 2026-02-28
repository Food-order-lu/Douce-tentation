/**
 * Douce Tentation - Main Application
 * ====================================
 * Entry point for the dashboard application.
 * Orchestrates the calendar, modals, and API modules.
 * 
 * Prerequisites:
 * - utils.js
 * - api.js
 * - calendar.js
 * - modals.js
 * 
 * @module app
 * @version 2.0.0
 */

document.addEventListener('DOMContentLoaded', async () => {
    'use strict';

    // ========================================
    // Authentication Check
    // ========================================

    if (!DouxUtils.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }

    // ========================================
    // State
    // ========================================

    let orders = [];

    // ========================================
    // Initialize Modules
    // ========================================

    // Calendar
    const calendar = createCalendar({
        containerSelector: '#calendarGrid',
        headerTitleSelector: '.calendar-header h1',
        orders: orders,
        onOrderClick: (order) => modals.showOrderDetails(order)
    });

    // Modals
    const modals = createModalsManager({
        onOrderCreated: (newOrder) => {
            orders.push(newOrder);
            calendar.render(orders);
        },
        onOrderUpdated: (id, updatedOrder) => {
            const idx = orders.findIndex(o => o.id == id);
            if (idx !== -1) orders[idx] = updatedOrder;
            calendar.render(orders);
        },
        onOrderDeleted: (id) => {
            orders = orders.filter(o => o.id != id);
            calendar.render(orders);
        },
        getCurrentOrders: () => orders
    });
    window.modals = modals; // Expose to global for HTML onclick handlers


    // ========================================
    // Load Initial Data
    // ========================================

    orders = await DouxAPI.fetchOrders();
    calendar.render(orders);

    // ========================================
    // Navigation (Simplified)
    // ========================================
    const navCalendrier = document.getElementById('navCalendrier');
    if (navCalendrier) {
        navCalendrier.addEventListener('click', (e) => {
            e.preventDefault();
            // Already on Calendrier, but could force a refresh if desired
            calendar.render(orders);
        });
    }



    // ========================================
    // Navigation (Week)
    // ========================================

    // Add week navigation buttons
    const headerDiv = document.querySelector('.calendar-header > div');
    const navDiv = document.createElement('div');
    navDiv.className = 'calendar-nav';
    navDiv.innerHTML = `
        <button id="prevWeek" class="btn btn-secondary" style="padding: 5px 15px; font-size:0.8rem;">
            <i class="fas fa-chevron-left"></i> Préc.
        </button>
        <button id="nextWeek" class="btn btn-secondary" style="padding: 5px 15px; font-size:0.8rem;">
            Suiv. <i class="fas fa-chevron-right"></i>
        </button>
    `;
    headerDiv.appendChild(navDiv);

    document.getElementById('prevWeek').onclick = () => {
        calendar.previousWeek();
        calendar.render(orders);
    };

    document.getElementById('nextWeek').onclick = () => {
        calendar.nextWeek();
        calendar.render(orders);
    };

    // ========================================
    // Sync Button
    // ========================================

    const syncBtn = document.getElementById('simulateGloriaBtn');
    if (syncBtn) {
        syncBtn.addEventListener('click', async () => {
            const originalText = syncBtn.innerHTML;
            syncBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Syncing...';

            try {
                // Trigger remote sync first
                const syncResult = await DouxAPI.syncOrders();
                console.log('Sync result:', syncResult);

                // Then refresh local list
                orders = await DouxAPI.fetchOrders();
                calendar.render(orders);


                if (syncResult && syncResult.newOrdersCount > 0) {
                    syncBtn.innerHTML = `<i class="fas fa-check"></i> +${syncResult.newOrdersCount} New!`;
                } else {
                    syncBtn.innerHTML = '<i class="fas fa-check"></i> Up to date';
                }
            } catch (error) {
                console.error('Sync error:', error);
                syncBtn.innerHTML = '<i class="fas fa-times"></i> Erreur';
            }

            setTimeout(() => syncBtn.innerHTML = originalText, 3000);
        });
    }

    // ========================================
    // Backup Button
    // ========================================
    const backupBtn = document.getElementById('downloadBackupBtn');
    if (backupBtn) {
        backupBtn.addEventListener('click', () => {
            const originalText = backupBtn.innerHTML;
            backupBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Préparation...';

            // Just redirect to the download URL
            window.location.href = '/api/orders/backup/download';

            setTimeout(() => {
                backupBtn.innerHTML = originalText;
            }, 2000);
        });
    }

    // ========================================
    // Logout Handler
    // ========================================

    const logoutLink = document.querySelector('a.logout');
    if (logoutLink) {
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            DouxUtils.logout();
        });
    }

    console.log('✅ Dashboard initialized successfully');
});
