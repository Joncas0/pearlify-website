// admin-orders.js - UPDATED TO READ REAL ORDERS

let allOrders = [];
let currentOrderToCancel = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    console.log('Pearlify Orders System Initialized');
    
    loadOrders();
    setupEventListeners();
    updateDisplay();
    
    // Auto-refresh every 30 seconds
    setInterval(() => {
        loadOrders();
        updateDisplay();
    }, 30000);
});

// ========================
// LOAD ORDERS FROM STORAGE
// ========================

function loadOrders() {
    try {
        // Try multiple localStorage keys for compatibility
        const ordersFromStorage = getOrdersFromAllSources();
        
        // Filter out null or invalid orders
        allOrders = ordersFromStorage.filter(order => 
            order && 
            order.id && 
            typeof order.status === 'string'
        );
        
        console.log(`Loaded ${allOrders.length} real orders`);
        
        // Sort by newest first
        allOrders.sort((a, b) => {
            const dateA = new Date(a.timestamps?.placed || a.createdAt || Date.now());
            const dateB = new Date(b.timestamps?.placed || b.createdAt || Date.now());
            return dateB - dateA;
        });
        
    } catch (error) {
        console.error('Error loading orders:', error);
        allOrders = [];
    }
}

/**
 * Get orders from all possible localStorage sources
 */
function getOrdersFromAllSources() {
    const sources = ['pearlifyOrders', 'orders', 'customerOrders'];
    let allOrders = [];
    
    for (const source of sources) {
        try {
            const stored = localStorage.getItem(source);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                    allOrders = allOrders.concat(parsed);
                }
            }
        } catch (error) {
            console.warn(`Error parsing ${source}:`, error);
        }
    }
    
    // Remove duplicates by order ID
    const uniqueOrders = [];
    const seenIds = new Set();
    
    allOrders.forEach(order => {
        if (order && order.id && !seenIds.has(order.id)) {
            seenIds.add(order.id);
            uniqueOrders.push(order);
        }
    });
    
    return uniqueOrders;
}

// ========================
// SAVE ORDERS TO STORAGE
// ========================

function saveOrders() {
    try {
        // Save to all storage locations for compatibility
        localStorage.setItem('pearlifyOrders', JSON.stringify(allOrders));
        localStorage.setItem('orders', JSON.stringify(allOrders));
        localStorage.setItem('customerOrders', JSON.stringify(allOrders));
        
        console.log(`Saved ${allOrders.length} orders to localStorage`);
    } catch (error) {
        console.error('Error saving orders:', error);
    }
}

// ========================
// EVENT LISTENERS
// ========================

function setupEventListeners() {
    // Filter changes
    document.getElementById('status-filter').addEventListener('change', updateDisplay);
    document.getElementById('time-filter').addEventListener('change', updateDisplay);
    
    // Refresh button
    document.getElementById('refresh-btn').addEventListener('click', function() {
        loadOrders();
        updateDisplay();
        showMessage('Orders refreshed');
    });
    
    // Modal close buttons
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function() {
            closeAllModals();
        });
    });
    
    // Confirm cancel
    document.getElementById('confirm-cancel-btn').addEventListener('click', confirmCancel);
    
    // Close modals on outside click
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            closeAllModals();
        }
    });
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
    currentOrderToCancel = null;
    
    // Clear cancel form
    const cancelReason = document.getElementById('cancel-reason');
    const cancelNotes = document.getElementById('cancel-notes');
    if (cancelReason) cancelReason.value = '';
    if (cancelNotes) cancelNotes.value = '';
}

// ========================
// DISPLAY FUNCTIONS
// ========================

function updateDisplay() {
    const statusFilter = document.getElementById('status-filter').value;
    const timeFilter = document.getElementById('time-filter').value;
    
    let filteredOrders = filterOrders(statusFilter, timeFilter);
    updateStats(filteredOrders);
    displayOrders(filteredOrders);
}

function filterOrders(status, time) {
    let filtered = [...allOrders];
    
    // Filter by status
    if (status !== 'all') {
        filtered = filtered.filter(order => order.status === status);
    }
    
    // Filter by time
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (time === 'today') {
        filtered = filtered.filter(order => {
            const orderDate = new Date(order.timestamps?.placed || order.createdAt || Date.now());
            return orderDate >= today;
        });
    } else if (time === 'week') {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        filtered = filtered.filter(order => {
            const orderDate = new Date(order.timestamps?.placed || order.createdAt || Date.now());
            return orderDate >= weekAgo;
        });
    } else if (time === 'month') {
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        filtered = filtered.filter(order => {
            const orderDate = new Date(order.timestamps?.placed || order.createdAt || Date.now());
            return orderDate >= monthAgo;
        });
    }
    
    return filtered;
}

function updateStats(orders) {
    const counts = {
        order_received: 0,
        preparing: 0,
        out_for_delivery: 0,
        delivered: 0,
        cancelled: 0
    };
    
    orders.forEach(order => {
        if (counts[order.status] !== undefined) {
            counts[order.status]++;
        }
    });
    
    // Update counts display
    document.getElementById('pending-count').textContent = counts.order_received;
    document.getElementById('preparing-count').textContent = counts.preparing;
    document.getElementById('delivery-count').textContent = counts.out_for_delivery;
    document.getElementById('completed-count').textContent = counts.delivered + counts.cancelled;
    
    // Update section counts
    const activeOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');
    const completedOrders = orders.filter(o => o.status === 'delivered' || o.status === 'cancelled');
    
    document.getElementById('current-orders-count').textContent = activeOrders.length;
    document.getElementById('delivered-count').textContent = completedOrders.length;
}

function displayOrders(orders) {
    const statusFilter = document.getElementById('status-filter').value;
    
    // Clear both containers
    const activeContainer = document.getElementById('current-orders');
    const deliveredContainer = document.getElementById('delivered-orders');
    
    activeContainer.innerHTML = '';
    deliveredContainer.innerHTML = '';
    
    if (statusFilter === 'all') {
        // For "all" filter: split into current (not delivered/cancelled) and completed (delivered/cancelled)
        const currentOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');
        const completedOrders = orders.filter(o => o.status === 'delivered' || o.status === 'cancelled');
        
        // Display current orders
        if (currentOrders.length === 0) {
            activeContainer.innerHTML = `
                <div class="no-orders">
                    <i class="fas fa-clipboard-list"></i>
                    <p>No current orders</p>
                </div>
            `;
        } else {
            currentOrders.forEach(order => {
                activeContainer.innerHTML += createOrderCard(order);
            });
        }
        
        // Display completed orders
        if (completedOrders.length === 0) {
            deliveredContainer.innerHTML = `
                <div class="no-orders">
                    <i class="fas fa-check"></i>
                    <p>No completed orders</p>
                </div>
            `;
        } else {
            completedOrders.forEach(order => {
                deliveredContainer.innerHTML += createOrderCard(order);
            });
        }
        
    } else {
        // For specific status filters: show all matching orders in current section
        if (orders.length === 0) {
            activeContainer.innerHTML = `
                <div class="no-orders">
                    <i class="fas fa-clipboard-list"></i>
                    <p>No ${getStatusText(statusFilter).toLowerCase()} orders</p>
                </div>
            `;
        } else {
            orders.forEach(order => {
                activeContainer.innerHTML += createOrderCard(order);
            });
        }
        
        // Clear delivered section when filtering by specific status
        deliveredContainer.innerHTML = '';
    }
    
    // Add event listeners to new order cards
    addOrderEventListeners();
}

// ========================
// ORDER CARD CREATION
// ========================

function createOrderCard(order) {
    const timeAgo = getTimeAgo(order.timestamps?.placed || order.createdAt);
    const statusText = getStatusText(order.status);
    const statusClass = `status-${order.status}`;
    
    const customer = order.customer || {};
    const items = order.items || [];
    const total = order.total || 0;
    
    const itemsHTML = items.map(item => `
        <div class="order-item">
            <span>${item.quantity || 1}x ${item.name || 'Item'}</span>
            <span>₱${((item.price || 0) * (item.quantity || 1)).toFixed(2)}</span>
        </div>
    `).join('');
    
    return `
        <div class="order-card" data-order-id="${order.id}">
            <div class="order-header">
                <div class="order-id">${order.id}</div>
                <div class="order-time">${timeAgo}</div>
            </div>
            
            <div class="order-content">
                <div class="customer-info">
                    <h3>${customer.name || 'Customer Name'}</h3>
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
            
            ${items.length > 0 ? `
            <div class="order-items">
                <h4>Items (${items.length})</h4>
                ${itemsHTML}
            </div>
            ` : ''}
            
            <div class="order-footer">
                <div class="order-total">₱${total.toFixed(2)}</div>
                <div class="order-actions">
                    ${order.status !== 'delivered' && order.status !== 'cancelled' ? `
                    <button class="btn-action btn-edit" data-action="update" data-order-id="${order.id}">
                        <i class="fas fa-edit"></i> Update Status
                    </button>
                    ` : ''}
                    
                    <button class="btn-action btn-view" data-action="timeline" data-order-id="${order.id}">
                        <i class="fas fa-history"></i> Timeline
                    </button>
                    
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

// ========================
// ORDER ACTIONS
// ========================

function addOrderEventListeners() {
    document.querySelectorAll('[data-action="update"]').forEach(btn => {
        btn.addEventListener('click', function() {
            const orderId = this.dataset.orderId;
            console.log('Update button clicked for order:', orderId);
            updateOrderStatus(orderId);
        });
    });
    
    document.querySelectorAll('[data-action="timeline"]').forEach(btn => {
        btn.addEventListener('click', function() {
            const orderId = this.dataset.orderId;
            showTimeline(orderId);
        });
    });
    
    document.querySelectorAll('[data-action="cancel"]').forEach(btn => {
        btn.addEventListener('click', function() {
            const orderId = this.dataset.orderId;
            showCancelModal(orderId);
        });
    });
}

function updateOrderStatus(orderId) {
    console.log('Updating order status for:', orderId);
    console.log('All orders:', allOrders);
    
    const order = allOrders.find(o => o.id === orderId);
    if (!order) {
        console.error('Order not found:', orderId);
        showMessage('Order not found');
        return;
    }
    
    console.log('Current order status:', order.status);
    
    const currentStatus = order.status;
    let nextStatus = '';
    
    switch (currentStatus) {
        case 'order_received':
            nextStatus = 'preparing';
            break;
        case 'preparing':
            nextStatus = 'out_for_delivery';
            break;
        case 'out_for_delivery':
            nextStatus = 'delivered';
            break;
        default:
            console.log('Order cannot be updated further. Current status:', currentStatus);
            showMessage('Order cannot be updated further. Current status: ' + getStatusText(currentStatus));
            return;
    }
    
    if (confirm(`Update order from ${getStatusText(currentStatus)} to ${getStatusText(nextStatus)}?`)) {
        // Update status
        order.status = nextStatus;
        console.log('Order status updated to:', nextStatus);
        
        // Add timestamp
        if (!order.timestamps) order.timestamps = {};
        order.timestamps[nextStatus] = new Date().toISOString();
        
        // Save changes
        saveOrders();
        updateDisplay();
        showMessage(`Order status updated to ${getStatusText(nextStatus)}`);
    }
}

function showTimeline(orderId) {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;
    
    document.getElementById('timeline-order-id').textContent = order.id;
    document.getElementById('timeline-customer').textContent = `Customer: ${order.customer?.name || 'Unknown'}`;
    
    const timelineContainer = document.getElementById('timeline-content');
    const timestamps = order.timestamps || {};
    
    let timelineHTML = '';
    
    // Add order placed timestamp
    if (timestamps.placed) {
        const date = new Date(timestamps.placed);
        timelineHTML += `
            <div class="timeline-item">
                <div class="timeline-icon"><i class="fas fa-shopping-cart"></i></div>
                <div class="timeline-content">
                    <h4>Order Placed</h4>
                    <p>${date.toLocaleString()}</p>
                </div>
            </div>
        `;
    }
    
    // Add status change timestamps
    const statuses = [
        { key: 'order_received', label: 'Order Received', icon: 'fas fa-clipboard-check' },
        { key: 'preparing', label: 'Preparing', icon: 'fas fa-utensils' },
        { key: 'out_for_delivery', label: 'Out for Delivery', icon: 'fas fa-motorcycle' },
        { key: 'delivered', label: 'Delivered', icon: 'fas fa-check-circle' },
        { key: 'cancelled', label: 'Cancelled', icon: 'fas fa-times-circle' }
    ];
    
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
    
    timelineContainer.innerHTML = timelineHTML || '<p>No timeline data available</p>';
    document.getElementById('timeline-modal').style.display = 'flex';
}

function showCancelModal(orderId) {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;
    
    currentOrderToCancel = orderId;
    document.getElementById('cancel-order-id').textContent = order.id;
    document.getElementById('cancel-customer-name').textContent = order.customer?.name || 'Customer';
    document.getElementById('cancel-modal').style.display = 'flex';
}

function confirmCancel() {
    if (!currentOrderToCancel) return;
    
    const order = allOrders.find(o => o.id === currentOrderToCancel);
    if (!order) return;
    
    const reason = document.getElementById('cancel-reason').value;
    const notes = document.getElementById('cancel-notes').value;
    
    if (!reason) {
        showMessage('Please select a cancellation reason');
        return;
    }
    
    order.status = 'cancelled';
    order.cancellationReason = reason;
    order.cancellationNotes = notes;
    
    if (!order.timestamps) order.timestamps = {};
    order.timestamps.cancelled = new Date().toISOString();
    
    saveOrders();
    updateDisplay();
    
    closeAllModals();
    showMessage('Order has been cancelled');
}

// ========================
// HELPER FUNCTIONS
// ========================

function getTimeAgo(dateString) {
    if (!dateString) return 'Just now';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
}

function getStatusText(status) {
    const statusMap = {
        'order_received': 'Order Received',
        'preparing': 'Preparing',
        'out_for_delivery': 'Out for Delivery',
        'delivered': 'Delivered',
        'cancelled': 'Cancelled'
    };
    
    return statusMap[status] || status;
}

function showMessage(text) {
    const message = document.createElement('div');
    message.className = 'message';
    message.textContent = text;
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
    
    document.body.appendChild(message);
    
    setTimeout(() => {
        message.style.animation = 'messageSlideOut 0.3s';
        setTimeout(() => message.remove(), 300);
    }, 3000);
}

// Add animation styles for messages
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

console.log('Pearlify Orders System Ready - Reading from localStorage');