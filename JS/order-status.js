// Add this function to order-status.js (after DOMContentLoaded event)
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

// order-status.js - UPDATED FOR ADMIN INTEGRATION

document.addEventListener("DOMContentLoaded", () => {
    // DOM Elements
    const refreshBtn = document.getElementById('refresh-btn');
    
    // Initialize order status
    loadOrderStatus();
    
    // Event Listeners
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadOrderStatus);
    }
    
    // Auto-refresh every 30 seconds
    setInterval(loadOrderStatus, 30000);
});

// ========================
// ORDER STATUS MANAGEMENT
// ========================

/**
 * Load and display order status
 */
function loadOrderStatus() {
    // Get order ID from URL or storage
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId') || getStoredOrderId();
    
    if (!orderId) {
        showNoOrderFound();
        return;
    }
    
    const order = getOrderById(orderId);
    
    if (order) {
        displayOrderStatus(order);
        updateRefreshTime();
    } else {
        showNoOrderFound();
    }
}

/**
 * Get order by ID - READS FROM LOCALSTORAGE
 */
function getOrderById(orderId) {
    try {
        // Check multiple possible storage locations
        const orders = JSON.parse(localStorage.getItem('orders')) || 
                      JSON.parse(localStorage.getItem('pearlifyOrders')) || 
                      JSON.parse(localStorage.getItem('customerOrders')) || 
                      [];
        return orders.find(order => order.id === orderId);
    } catch (error) {
        console.error('Error fetching order:', error);
        return null;
    }
}

/**
 * Get stored order ID from session
 */
function getStoredOrderId() {
    return sessionStorage.getItem('lastOrderId');
}

// ========================
// STATUS DISPLAY FUNCTIONS
// ========================

/**
 * Display order status on the page
 */
function displayOrderStatus(order) {
    updateOrderHeader(order);
    updateStatusTimeline(order);
    updateOrderDetails(order);
    updateCustomerInfo(order);
}

/**
 * Update order header information
 */
function updateOrderHeader(order) {
    const orderIdEl = document.getElementById('order-id');
    const orderDateEl = document.getElementById('order-date');
    const orderStatusEl = document.getElementById('order-status-text');
    
    if (orderIdEl) orderIdEl.textContent = order.id;
    if (orderDateEl && order.timestamps && order.timestamps.placed) {
        orderDateEl.textContent = formatDateTime(order.timestamps.placed);
    }
    if (orderStatusEl) orderStatusEl.textContent = getStatusText(order.status);
}

/**
 * Update status timeline with current progress
 */
function updateStatusTimeline(order) {
    const statusSteps = {
        'order_received': 1,
        'preparing': 2, 
        'out_for_delivery': 3,
        'delivered': 4,
        'cancelled': 0
    };
    
    const currentStep = statusSteps[order.status] || 1;
    
    // Update step indicators
    document.querySelectorAll('.status-step').forEach((step, index) => {
        const stepNumber = index + 1;
        const stepStatus = step.dataset.status;
        
        step.classList.remove('active', 'completed');
        
        if (stepNumber < currentStep) {
            step.classList.add('completed');
        } else if (stepNumber === currentStep && order.status !== 'cancelled') {
            step.classList.add('active');
        }
        
        // Update timestamps - map step status to timestamp keys
        let timestampKey = stepStatus;
        if (stepStatus === 'order_received') {
            timestampKey = 'order_received';
        } else if (stepStatus === 'out_for_delivery') {
            timestampKey = 'out_for_delivery';
        }
        
        const timeElement = step.querySelector('.step-time');
        if (order.timestamps && order.timestamps[timestampKey]) {
            timeElement.textContent = formatDateTime(order.timestamps[timestampKey]);
            timeElement.style.display = 'block';
        } else {
            timeElement.style.display = 'none';
        }
    });
}

/**
 * Update order items and total
 */
function updateOrderDetails(order) {
    const itemsContainer = document.getElementById('order-items');
    const totalElement = document.getElementById('order-total');
    
    if (!itemsContainer) return;
    
    itemsContainer.innerHTML = '';
    
    if (order.items && order.items.length > 0) {
        order.items.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'order-item';
            
            itemElement.innerHTML = `
                <div class="item-info">
                    <strong>${item.name || 'Item'}</strong>
                    <div class="item-meta">
                        ${item.size ? item.size + ' • ' : ''} 
                        ${item.sugar || ''} 
                        ${item.addons && item.addons.length > 0 ? `• ${item.addons.join(', ')}` : ''}
                    </div>
                </div>
                <div class="item-qty">×${item.quantity || 1}</div>
                <div class="item-price">₱${((item.price || 0) * (item.quantity || 1)).toLocaleString()}</div>
            `;
            
            itemsContainer.appendChild(itemElement);
        });
    }
    
    if (totalElement) {
        totalElement.textContent = `₱${(order.total || 0).toLocaleString()}`;
    }
}

/**
 * Update customer information
 */
function updateCustomerInfo(order) {
    const customer = order.customer || {};
    
    const nameEl = document.getElementById('customer-name');
    const contactEl = document.getElementById('customer-contact');
    const addressEl = document.getElementById('customer-address');
    
    if (nameEl) nameEl.textContent = customer.name || 'N/A';
    if (contactEl) contactEl.textContent = customer.phone || customer.contact || 'N/A';
    if (addressEl) addressEl.textContent = customer.address || 'N/A';
}

// ========================
// UTILITY FUNCTIONS
// ========================

/**
 * Format date time for display
 */
function formatDateTime(isoString) {
    if (!isoString) return '--';
    
    try {
        const date = new Date(isoString);
        return date.toLocaleString('en-PH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return '--';
    }
}

/**
 * Update last refresh time
 */
function updateRefreshTime() {
    const now = new Date();
    const refreshNote = document.querySelector('.refresh-note');
    if (refreshNote) {
        refreshNote.textContent = `Last updated: ${now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
    }
}

/**
 * Show no order found message
 */
function showNoOrderFound() {
    const statusContainer = document.querySelector('.status-container');
    if (statusContainer) {
        statusContainer.innerHTML = `
            <div class="no-order">
                <h2>Order Not Found</h2>
                <p>We couldn't find your order. Please check your order ID or contact support.</p>
                <button onclick="window.location.href='../index.html'" class="refresh-btn">
                    Return to Home
                </button>
            </div>
        `;
    }
}

// ========================
// ORDER CREATION (When customer places order)
// ========================

/**
 * Create a new order when customer checks out
 * This should be called from checkout.js
 */
// In order-status.js, update the createNewOrder function:

function createNewOrder(orderData) {
    const orderId = generateOrderId();
    
    const order = {
        id: orderId,
        customer: {
            name: orderData.fullName || '',
            phone: orderData.contact || '',
            address: orderData.address || '',
            email: orderData.email || ''
        },
        items: orderData.items || [],
        total: orderData.total || 0,
        // FIX: Make sure this matches admin-orders.js
        status: 'order_received',
        timestamps: {
            placed: new Date().toISOString(),
            // FIX: Use the correct key
            order_received: new Date().toISOString()
        },
        paymentMethod: orderData.paymentMethod || 'cod',
        notes: orderData.notes || ''
    };
    
    // Save order to localStorage
    saveOrderToStorage(order);
    
    // Store order ID for customer to track
    sessionStorage.setItem('lastOrderId', orderId);
    
    console.log('New order created:', orderId);
    return orderId;
}

/**
 * Generate order ID
 */
function generateOrderId() {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORD-${timestamp}${random}`;
}

/**
 * Save order to localStorage in multiple formats for compatibility
 */
function saveOrderToStorage(order) {
    try {
        // Save in 'orders' array (for order-status.js)
        let orders = JSON.parse(localStorage.getItem('orders')) || [];
        orders.push(order);
        localStorage.setItem('orders', JSON.stringify(orders));
        
        // Save in 'pearlifyOrders' array (for admin-orders.js)
        let pearlifyOrders = JSON.parse(localStorage.getItem('pearlifyOrders')) || [];
        pearlifyOrders.push(order);
        localStorage.setItem('pearlifyOrders', JSON.stringify(pearlifyOrders));
        
        // Save in 'customerOrders' array (for backup)
        let customerOrders = JSON.parse(localStorage.getItem('customerOrders')) || [];
        customerOrders.push(order);
        localStorage.setItem('customerOrders', JSON.stringify(customerOrders));
        
        console.log('Order saved to localStorage');
    } catch (error) {
        console.error('Error saving order:', error);
    }
}

// ========================
// INTEGRATION WITH CHECKOUT
// ========================
