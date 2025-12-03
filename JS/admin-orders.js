
let allOrders = [];  // Lahat ng orders mula sa localStorage
let currentOrderToCancel = null;  // Order na icacancel

// ====================================================
// INITIALIZATION - PAGSISIMULA NG SYSTEM
// ====================================================

// Kapag nabasa na ng browser ang buong webpage
document.addEventListener('DOMContentLoaded', function() {
    console.log('⚡ Pearlify Orders System Initialized');
    
    // Step 1: Kunin lahat ng orders mula sa localStorage
    loadOrders();
    
    // Step 2: I-setup ang mga event listeners (mga button na pwedeng i-click)
    setupEventListeners();
    
    // Step 3: I-display ang mga orders sa screen
    updateDisplay();
    
    // Auto-refresh: Every 30 seconds, i-refresh ang display
    // Para automatic makita ang bagong orders kahit hindi i-refresh ang page
    setInterval(() => {
        loadOrders();
        updateDisplay();
    }, 30000); // 30000 milliseconds = 30 seconds
});

// ====================================================
// LOAD ORDERS FUNCTION - PAGKUHA NG ORDERS
// ====================================================

/**
 * Kumukuha ng mga order mula sa localStorage
 */
function loadOrders() {
    try {
        // Subukan kunin ang orders mula sa iba't ibang storage key
        // (Para compatible sa iba't ibang version ng system)
        const ordersFromStorage = getOrdersFromAllSources();
        
        // I-filter ang mga orders: tanggalin ang mga invalid o sira
        allOrders = ordersFromStorage.filter(order => 
            order &&                     // Dapat may laman
            order.id &&                  // Dapat may Order ID
            typeof order.status === 'string'  // Dapat may status
        );
        
        console.log(`✅ Loaded ${allOrders.length} valid orders`);
        
        // I-sort ang mga orders: pinakabago muna
        allOrders.sort((a, b) => {
            // Kunin ang date kung kailan in-order
            const dateA = new Date(a.timestamps?.placed || a.createdAt || Date.now());
            const dateB = new Date(b.timestamps?.placed || b.createdAt || Date.now());
            
            // Pag-compare: mas bago = mas mataas na value
            return dateB - dateA; // Descending (bago -> luma)
        });
        
    } catch (error) {
        console.error('❌ Error loading orders:', error);
        allOrders = []; // Kapag may error, gumamit ng empty array
    }
}

/**
 * Kumukuha ng orders mula sa lahat ng possible na storage location
 * (Para siguradong makakuha ng data kahit saang key naka-save)
 */
function getOrdersFromAllSources() {
    // Listahan ng mga possible na pangalan ng storage
    const sources = ['pearlifyOrders', 'orders', 'customerOrders'];
    let allOrders = [];
    
    // Loop sa bawat storage name
    for (const source of sources) {
        try {
            // Kunin ang data mula sa localStorage
            const stored = localStorage.getItem(source);
            
            if (stored) {
                // I-convert ang JSON string pabalik sa array
                const parsed = JSON.parse(stored);
                
                // Kung array talaga, idagdag sa collection
                if (Array.isArray(parsed)) {
                    allOrders = allOrders.concat(parsed);
                }
            }
        } catch (error) {
            console.warn(`⚠️ Error parsing ${source}:`, error);
        }
    }
    
    // Tanggalin ang mga duplicate na orders (parehong Order ID)
    const uniqueOrders = [];
    const seenIds = new Set(); // Para ma-track kung anong IDs ang nakita na
    
    allOrders.forEach(order => {
        if (order && order.id && !seenIds.has(order.id)) {
            seenIds.add(order.id);      // Mark as seen
            uniqueOrders.push(order);   // Add to unique list
        }
    });
    
    return uniqueOrders;
}

// ====================================================
// SAVE ORDERS FUNCTION - PAG-SAVE NG ORDERS
// ====================================================

/**
 * Sinasave ang mga orders pabalik sa localStorage
 * Parang paglalagay ng file sa filing cabinet
 */
function saveOrders() {
    try {
        // Save sa 3 different keys para siguradong mababasa
        localStorage.setItem('pearlifyOrders', JSON.stringify(allOrders));
        localStorage.setItem('orders', JSON.stringify(allOrders));
        localStorage.setItem('customerOrders', JSON.stringify(allOrders));
        
        console.log(`💾 Saved ${allOrders.length} orders to localStorage`);
    } catch (error) {
        console.error('❌ Error saving orders:', error);
    }
}

// ====================================================
// EVENT LISTENERS - MGA "PAKIKINGGAN" NG BUTTONS
// ====================================================

/**
 * I-setup ang lahat ng event listeners
 * Parang paglagay ng "tainga" sa mga button para malaman kapag pinindot
 */
function setupEventListeners() {
    // ========== FILTERS ==========
    // Kapag nagbago ang status filter (pending, preparing, etc.)
    document.getElementById('status-filter').addEventListener('change', updateDisplay);
    
    // Kapag nagbago ang time filter (today, week, month)
    document.getElementById('time-filter').addEventListener('change', updateDisplay);
    
    // ========== REFRESH BUTTON ==========
    document.getElementById('refresh-btn').addEventListener('click', function() {
        loadOrders();      // Mag-load ulit ng orders
        updateDisplay();   // I-update ang display
        showMessage('🔄 Orders refreshed'); // Magpakita ng notification
    });
    
    // ========== MODAL CLOSE BUTTONS ==========
    // Ang modals ay yung popup windows (cancel confirmation, timeline, etc.)
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function() {
            closeAllModals(); // Isara lahat ng popup
        });
    });
    
    // ========== CANCEL CONFIRMATION ==========
    document.getElementById('confirm-cancel-btn').addEventListener('click', confirmCancel);
    
    // ========== CLOSE MODAL ON OUTSIDE CLICK ==========
    // Kapag nag-click sa labas ng popup window, isara ito
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            closeAllModals();
        }
    });
}

/**
 * Isara lahat ng modal/popup windows
 */
function closeAllModals() {
    // Hanapin lahat ng elements na may class na 'modal'
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none'; // Itago ang modal
    });
    
    currentOrderToCancel = null; // Reset ang order to cancel
    
    // Linisin ang cancel form
    const cancelReason = document.getElementById('cancel-reason');
    const cancelNotes = document.getElementById('cancel-notes');
    
    if (cancelReason) cancelReason.value = '';
    if (cancelNotes) cancelNotes.value = '';
}

// ====================================================
// DISPLAY FUNCTIONS - PAGPAPAKITA SA SCREEN
// ====================================================

/**
 * Main function para i-update ang display ng orders
 * Tinatawag ito kapag:
 * 1. Nagbago ang filter
 * 2. Nag-refresh
 * 3. Nag-update ng status
 */
function updateDisplay() {
    // Kunin ang current filter values
    const statusFilter = document.getElementById('status-filter').value;
    const timeFilter = document.getElementById('time-filter').value;
    
    // I-filter ang orders base sa selections
    let filteredOrders = filterOrders(statusFilter, timeFilter);
    
    // I-update ang statistics counter
    updateStats(filteredOrders);
    
    // I-display ang filtered orders
    displayOrders(filteredOrders);
}

/**
 * Mag-filter ng orders base sa status at time period
 * @param {string} status - Status filter (all, order_received, etc.)
 * @param {string} time - Time filter (all, today, week, month)
 * @returns {Array} Filtered orders
 */
function filterOrders(status, time) {
    // Gumawa ng copy ng allOrders para hindi ma-modify ang original
    let filtered = [...allOrders];
    
    // ========== FILTER BY STATUS ==========
    if (status !== 'all') {
        filtered = filtered.filter(order => order.status === status);
    }
    
    // ========== FILTER BY TIME ==========
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (time === 'today') {
        // I-filter: orders ngayong araw lang
        filtered = filtered.filter(order => {
            const orderDate = new Date(order.timestamps?.placed || order.createdAt || Date.now());
            return orderDate >= today;
        });
    } else if (time === 'week') {
        // I-filter: orders sa loob ng 7 days
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        filtered = filtered.filter(order => {
            const orderDate = new Date(order.timestamps?.placed || order.createdAt || Date.now());
            return orderDate >= weekAgo;
        });
    } else if (time === 'month') {
        // I-filter: orders sa loob ng 30 days
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        
        filtered = filtered.filter(order => {
            const orderDate = new Date(order.timestamps?.placed || order.createdAt || Date.now());
            return orderDate >= monthAgo;
        });
    }
    
    return filtered;
}

/**
 * Mag-update ng statistics counter sa taas ng page
 * @param {Array} orders - Mga orders na ididisplay
 */
function updateStats(orders) {
    // Gumawa ng counter object para sa bawat status
    const counts = {
        order_received: 0,    // Bagong order
        preparing: 0,         // Inihahanda
        out_for_delivery: 0,  // Nakabike na
        delivered: 0,         // Nai-deliver na
        cancelled: 0          // Na-cancel
    };
    
    // Bilangin ang bawat status
    orders.forEach(order => {
        if (counts[order.status] !== undefined) {
            counts[order.status]++; // Dagdagan ang count
        }
    });
    
    // ========== UPDATE COUNTER DISPLAY ==========
    // I-update ang mga number sa stats cards
    document.getElementById('pending-count').textContent = counts.order_received;
    document.getElementById('preparing-count').textContent = counts.preparing;
    document.getElementById('delivery-count').textContent = counts.out_for_delivery;
    document.getElementById('completed-count').textContent = counts.delivered + counts.cancelled;
    
    // ========== UPDATE SECTION COUNTS ==========
    // Active orders = hindi pa delivered o cancelled
    const activeOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');
    
    // Completed orders = delivered o cancelled na
    const completedOrders = orders.filter(o => o.status === 'delivered' || o.status === 'cancelled');
    
    document.getElementById('current-orders-count').textContent = activeOrders.length;
    document.getElementById('delivered-count').textContent = completedOrders.length;
}

/**
 * I-display ang mga orders sa webpage
 * @param {Array} orders - Mga orders na ididisplay
 */
function displayOrders(orders) {
    const statusFilter = document.getElementById('status-filter').value;
    
    // Kunin ang dalawang container:
    // 1. Current orders (hindi pa tapos)
    // 2. Delivered orders (tapos na)
    const activeContainer = document.getElementById('current-orders');
    const deliveredContainer = document.getElementById('delivered-orders');
    
    // Linisin muna ang containers
    activeContainer.innerHTML = '';
    deliveredContainer.innerHTML = '';
    
    // ========== KUNG "ALL" ANG FILTER ==========
    if (statusFilter === 'all') {
        // Paghiwalayin ang orders sa dalawa:
        const currentOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');
        const completedOrders = orders.filter(o => o.status === 'delivered' || o.status === 'cancelled');
        
        // ===== DISPLAY CURRENT ORDERS =====
        if (currentOrders.length === 0) {
            // Kung walang current orders, magpakita ng message
            activeContainer.innerHTML = `
                <div class="no-orders">
                    <i class="fas fa-clipboard-list"></i>
                    <p>📭 No current orders</p>
                </div>
            `;
        } else {
            // Kung may orders, gumawa ng card para sa bawat isa
            currentOrders.forEach(order => {
                activeContainer.innerHTML += createOrderCard(order);
            });
        }
        
        // ===== DISPLAY COMPLETED ORDERS =====
        if (completedOrders.length === 0) {
            deliveredContainer.innerHTML = `
                <div class="no-orders">
                    <i class="fas fa-check"></i>
                    <p>✅ No completed orders</p>
                </div>
            `;
        } else {
            completedOrders.forEach(order => {
                deliveredContainer.innerHTML += createOrderCard(order);
            });
        }
        
    } else {
        // ========== KUNG SPECIFIC STATUS ANG FILTER ==========
        // (Halimbawa: "preparing" lang ang gusto makita)
        
        if (orders.length === 0) {
            // Kung walang orders sa filtered status
            activeContainer.innerHTML = `
                <div class="no-orders">
                    <i class="fas fa-clipboard-list"></i>
                    <p>No ${getStatusText(statusFilter).toLowerCase()} orders</p>
                </div>
            `;
        } else {
            // I-display lahat ng filtered orders
            orders.forEach(order => {
                activeContainer.innerHTML += createOrderCard(order);
            });
        }
        
        // Clear ang delivered section kapag may specific filter
        deliveredContainer.innerHTML = '';
    }
    
    // Magdagdag ng event listeners sa mga bagong order cards
    addOrderEventListeners();
}

// ====================================================
// ORDER CARD CREATION - PAGGAWA NG ORDER CARD
// ====================================================

/**
 * Gumawa ng HTML card para sa isang order
 * Ito yung parang ticket na may order details
 * @param {Object} order - Order object
 * @returns {string} HTML string ng order card
 */
function createOrderCard(order) {
    // ========== GET BASIC INFO ==========
    const timeAgo = getTimeAgo(order.timestamps?.placed || order.createdAt);
    const statusText = getStatusText(order.status);
    const statusClass = `status-${order.status}`;
    
    // ========== CUSTOMER INFO ==========
    const customer = order.customer || {};
    const items = order.items || [];
    const total = order.total || 0;
    
    // ========== CREATE ITEMS HTML ==========
    // Para sa bawat item sa order, gumawa ng row
    const itemsHTML = items.map(item => `
        <div class="order-item">
            <span>${item.quantity || 1}x ${item.name || 'Item'}</span>
            <span>₱${((item.price || 0) * (item.quantity || 1)).toFixed(2)}</span>
        </div>
    `).join('');
    
    // ========== RETURN HTML CARD ==========
    return `
        <div class="order-card" data-order-id="${order.id}">
            <!-- HEADER: Order ID at Time -->
            <div class="order-header">
                <div class="order-id">📦 ${order.id}</div>
                <div class="order-time">⏰ ${timeAgo}</div>
            </div>
            
            <!-- CONTENT: Customer info at Order Summary -->
            <div class="order-content">
                <div class="customer-info">
                    <h3>👤 ${customer.name || 'Customer Name'}</h3>
                    <p><i class="fas fa-phone"></i> ${customer.phone || customer.contact || 'N/A'}</p>
                    <p><i class="fas fa-map-marker-alt"></i> ${customer.address || 'N/A'}</p>
                    ${customer.email ? `<p><i class="fas fa-envelope"></i> ${customer.email}</p>` : ''}
                </div>
                
                <div class="order-summary">
                    <p><strong>Status:</strong> <span class="status-badge ${statusClass}">${statusText}</span></p>
                    <p><strong>Total:</strong> ₱${total.toFixed(2)}</p>
                    <p><strong>Payment:</strong> ${order.paymentMethod || 'Cash on Delivery'}</p>
                    ${order.notes ? `<p><strong>Notes:</strong> ${order.notes}</p>` : ''}
                </div>
            </div>
            
            <!-- ITEMS LIST: Listahan ng mga inorder -->
            ${items.length > 0 ? `
            <div class="order-items">
                <h4>🛒 Items (${items.length})</h4>
                ${itemsHTML}
            </div>
            ` : ''}
            
            <!-- FOOTER: Total at Action Buttons -->
            <div class="order-footer">
                <div class="order-total">💰 ₱${total.toFixed(2)}</div>
                <div class="order-actions">
                    <!-- UPDATE BUTTON: Para sa orders na hindi pa tapos -->
                    ${order.status !== 'delivered' && order.status !== 'cancelled' ? `
                    <button class="btn-action btn-edit" data-action="update" data-order-id="${order.id}">
                        <i class="fas fa-edit"></i> Update Status
                    </button>
                    ` : ''}
                    
                    <!-- TIMELINE BUTTON: Para makita ang history -->
                    <button class="btn-action btn-view" data-action="timeline" data-order-id="${order.id}">
                        <i class="fas fa-history"></i> Timeline
                    </button>
                    
                    <!-- CANCEL BUTTON: Para sa orders na hindi pa tapos -->
                    ${order.status !== 'delivered' && order.status !== 'cancelled' ? `
                    <button class="btn-action btn-cancel" data-action="cancel" data-order-id="${order.id}">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

// ====================================================
// ORDER ACTIONS - MGA ACTION SA ORDER
// ====================================================

/**
 * Magdagdag ng event listeners sa mga button sa order cards
 * (Update, Timeline, Cancel buttons)
 */
function addOrderEventListeners() {
    // UPDATE STATUS BUTTONS
    document.querySelectorAll('[data-action="update"]').forEach(btn => {
        btn.addEventListener('click', function() {
            const orderId = this.dataset.orderId;
            updateOrderStatus(orderId);
        });
    });
    
    // TIMELINE BUTTONS
    document.querySelectorAll('[data-action="timeline"]').forEach(btn => {
        btn.addEventListener('click', function() {
            const orderId = this.dataset.orderId;
            showTimeline(orderId);
        });
    });
    
    // CANCEL BUTTONS
    document.querySelectorAll('[data-action="cancel"]').forEach(btn => {
        btn.addEventListener('click', function() {
            const orderId = this.dataset.orderId;
            showCancelModal(orderId);
        });
    });
}

/**
 * I-update ang status ng order (next stage)
 * Order Flow: order_received → preparing → out_for_delivery → delivered
 * @param {string} orderId - ID ng order na iu-update
 */
function updateOrderStatus(orderId) {
    // Hanapin ang order sa allOrders array
    const order = allOrders.find(o => o.id === orderId);
    if (!order) {
        showMessage('❌ Order not found');
        return;
    }
    
    const currentStatus = order.status;
    let nextStatus = '';
    
    // Determine kung ano ang next status
    switch (currentStatus) {
        case 'order_received':
            nextStatus = 'preparing'; // Order received → preparing
            break;
        case 'preparing':
            nextStatus = 'out_for_delivery'; // Preparing → out for delivery
            break;
        case 'out_for_delivery':
            nextStatus = 'delivered'; // Out for delivery → delivered
            break;
        default:
            // Kung delivered or cancelled na, hindi na pwedeng i-update
            showMessage(`⚠️ Order cannot be updated. Current status: ${getStatusText(currentStatus)}`);
            return;
    }
    
    // Magpakita ng confirmation dialog
    if (confirm(`Update order from ${getStatusText(currentStatus)} to ${getStatusText(nextStatus)}?`)) {
        // I-update ang status
        order.status = nextStatus;
        
        // Magdagdag ng timestamp kung kailan na-update
        if (!order.timestamps) order.timestamps = {};
        order.timestamps[nextStatus] = new Date().toISOString();
        
        // I-save ang changes
        saveOrders();
        
        // I-update ang display
        updateDisplay();
        
        // Magpakita ng success message
        showMessage(`✅ Order updated to ${getStatusText(nextStatus)}`);
    }
}

/**
 * Magpakita ng timeline ng order (kailan nangyari ang bawat event)
 * @param {string} orderId - ID ng order
 */
function showTimeline(orderId) {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;
    
    // I-update ang modal header
    document.getElementById('timeline-order-id').textContent = order.id;
    document.getElementById('timeline-customer').textContent = `Customer: ${order.customer?.name || 'Unknown'}`;
    
    const timelineContainer = document.getElementById('timeline-content');
    const timestamps = order.timestamps || {};
    
    let timelineHTML = '';
    
    // ========== ORDER PLACED TIMESTAMP ==========
    if (timestamps.placed) {
        const date = new Date(timestamps.placed);
        timelineHTML += `
            <div class="timeline-item">
                <div class="timeline-icon"><i class="fas fa-shopping-cart"></i></div>
                <div class="timeline-content">
                    <h4>🛍️ Order Placed</h4>
                    <p>${date.toLocaleString()}</p>
                </div>
            </div>
        `;
    }
    
    // ========== STATUS CHANGE TIMESTAMPS ==========
    const statuses = [
        { key: 'order_received', label: '📥 Order Received', icon: 'fas fa-clipboard-check' },
        { key: 'preparing', label: '👨‍🍳 Preparing', icon: 'fas fa-utensils' },
        { key: 'out_for_delivery', label: '🏍️ Out for Delivery', icon: 'fas fa-motorcycle' },
        { key: 'delivered', label: '✅ Delivered', icon: 'fas fa-check-circle' },
        { key: 'cancelled', label: '❌ Cancelled', icon: 'fas fa-times-circle' }
    ];
    
    // Gumawa ng timeline item para sa bawat status na may timestamp
    statuses.forEach(status => {
        if (timestamps[status.key]) {
            const date = new Date(timestamps[status.key]);
            timelineHTML += `
                <div class="timeline-item">
                    <div class="timeline-icon"><i class="${status.icon}"></i></div>
                    <div class="timeline-content">
                        <h4>${status.label}</h4>
                        <p>${date.toLocaleString()}</p>
                    </div>
                </div>
            `;
        }
    });
    
    // I-display ang timeline o "No data" message
    timelineContainer.innerHTML = timelineHTML || '<p>📭 No timeline data available</p>';
    
    // Ipakita ang modal
    document.getElementById('timeline-modal').style.display = 'flex';
}

/**
 * Magpakita ng cancel confirmation modal
 * @param {string} orderId - ID ng order na icacancel
 */
function showCancelModal(orderId) {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;
    
    // I-store ang order ID na icacancel
    currentOrderToCancel = orderId;
    
    // I-update ang modal content
    document.getElementById('cancel-order-id').textContent = order.id;
    document.getElementById('cancel-customer-name').textContent = order.customer?.name || 'Customer';
    
    // Ipakita ang modal
    document.getElementById('cancel-modal').style.display = 'flex';
}

/**
 * I-confirm ang cancellation ng order
 * Tinatawag kapag pinindot ang "Confirm Cancel" button
 */
function confirmCancel() {
    if (!currentOrderToCancel) return;
    
    // Hanapin ang order
    const order = allOrders.find(o => o.id === currentOrderToCancel);
    if (!order) return;
    
    // Kunin ang reason at notes mula sa form
    const reason = document.getElementById('cancel-reason').value;
    const notes = document.getElementById('cancel-notes').value;
    
    // Validation: Dapat may reason
    if (!reason) {
        showMessage('⚠️ Please select a cancellation reason');
        return;
    }
    
    // ========== UPDATE ORDER STATUS ==========
    order.status = 'cancelled';
    order.cancellationReason = reason;
    order.cancellationNotes = notes;
    
    // Magdagdag ng timestamp
    if (!order.timestamps) order.timestamps = {};
    order.timestamps.cancelled = new Date().toISOString();
    
    // ========== SAVE CHANGES ==========
    saveOrders();
    updateDisplay();
    
    // ========== CLEANUP ==========
    closeAllModals();
    showMessage('❌ Order has been cancelled');
}

// ====================================================
// HELPER FUNCTIONS - MGA TUMUTULONG NA FUNCTION
// ====================================================

/**
 * I-convert ang date sa "time ago" format
 * Halimbawa: "2 hours ago", "3 days ago"
 * @param {string} dateString - Date string
 * @returns {string} Time ago string
 */
function getTimeAgo(dateString) {
    if (!dateString) return 'Just now';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date; // Difference in milliseconds
    
    // Convert to minutes, hours, days
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    // Return appropriate string
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    // Kung more than 1 week, show date
    return date.toLocaleDateString();
}

/**
 * I-convert ang status code sa readable text
 * @param {string} status - Status code
 * @returns {string} Status text
 */
function getStatusText(status) {
    const statusMap = {
        'order_received': '📥 Order Received',
        'preparing': '👨‍🍳 Preparing',
        'out_for_delivery': '🏍️ Out for Delivery',
        'delivered': '✅ Delivered',
        'cancelled': '❌ Cancelled'
    };
    
    return statusMap[status] || status;
}

/**
 * Magpakita ng temporary message/notification
 * @param {string} text - Message text
 */
function showMessage(text) {
    // Gumawa ng message element
    const message = document.createElement('div');
    message.className = 'message';
    message.textContent = text;
    
    // Style ng message
    message.style.cssText = `
        position: fixed;
        top: 30px;
        right: 30px;
        background: #FF783E;
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 2000;
        animation: messageSlideIn 0.3s;
        font-weight: 600;
    `;
    
    // Idagdag sa page
    document.body.appendChild(message);
    
    // Automatically remove after 3 seconds
    setTimeout(() => {
        message.style.animation = 'messageSlideOut 0.3s';
        setTimeout(() => message.remove(), 300);
    }, 3000);
}

// ====================================================
// ADD ANIMATION STYLES FOR MESSAGES
// ====================================================

// Kung wala pa, magdagdag ng CSS animations para sa messages
if (!document.querySelector('#message-styles')) {
    const messageStyle = document.createElement('style');
    messageStyle.id = 'message-styles';
    messageStyle.textContent = `
        @keyframes messageSlideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes messageSlideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(messageStyle);
}

// ====================================================
// FINAL MESSAGE
// ====================================================

console.log('🎯 Pearlify Orders System Ready - Reading from localStorage');
