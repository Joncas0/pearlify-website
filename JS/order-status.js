// order-status.js
// Backend-friendly order status tracking system

document.addEventListener("DOMContentLoaded", () => {
    // DOM Elements
    const refreshBtn = document.getElementById('refresh-btn');
    
    // Initialize order status
    loadOrderStatus();
    
    // Event Listeners
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadOrderStatus);
    }
});

// ========================
// BACKEND-FRIENDLY DATA STRUCTURE
// ========================

/**
 * Order Status Data Structure (Example for backend developers)
 * 
 * Expected order object structure:
 * {
 *   id: "ORD-123456789",
 *   customer: {
 *     name: "John Doe",
 *     contact: "09123456789",
 *     address: "123 Main Street, City"
 *   },
 *   items: [
 *     {
 *       name: "Wintermelon Milk Tea",
 *       price: 85,
 *       quantity: 2,
 *       size: "Regular",
 *       sugar: "50%",
 *       addons: ["Pearls", "Cheese Foam"]
 *     }
 *   ],
 *   status: "preparing", // received, preparing, delivery, delivered
 *   timestamps: {
 *     placed: "2024-01-15T10:30:00Z",
 *     received: "2024-01-15T10:35:00Z",
 *     preparing: "2024-01-15T10:40:00Z",
 *     delivery: "2024-01-15T11:00:00Z",
 *     delivered: "2024-01-15T11:30:00Z"
 *   },
 *   total: 170
 * }
 */

// ========================
// ORDER STATUS MANAGEMENT
// ========================

/**
 * Load and display order status
 * Backend integration point: Replace localStorage with API call
 */
function loadOrderStatus() {
    // Get order ID from URL parameters or use demo data
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId') || getStoredOrderId();
    
    if (!orderId) {
        showNoOrderFound();
        return;
    }
    
    // BACKEND INTEGRATION POINT:
    // Replace this with: fetch(`/api/orders/${orderId}`)
    const order = getOrderById(orderId);
    
    if (order) {
        displayOrderStatus(order);
        updateRefreshTime();
    } else {
        showNoOrderFound();
    }
}

/**
 * Get order by ID - SIMULATES BACKEND CALL
 * Backend developers: Replace with actual database query
 */
function getOrderById(orderId) {
    // SIMULATION: Get from localStorage (replace with API call)
    try {
        const orders = JSON.parse(localStorage.getItem('orders')) || [];
        return orders.find(order => order.id === orderId);
    } catch (error) {
        console.error('Error fetching order:', error);
        return null;
    }
}

/**
 * Get stored order ID from session
 * Backend: Can use session storage or cookies
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
    document.getElementById('order-id').textContent = order.id;
    document.getElementById('order-date').textContent = formatDateTime(order.timestamps.placed);
}

/**
 * Update status timeline with current progress
 */
function updateStatusTimeline(order) {
    const statusSteps = {
        'received': 1,
        'preparing': 2, 
        'delivery': 3,
        'delivered': 4
    };
    
    const currentStep = statusSteps[order.status] || 1;
    
    // Reset all steps
    document.querySelectorAll('.status-step').forEach(step => {
        step.classList.remove('active', 'completed');
    });
    
    // Activate current and previous steps
    document.querySelectorAll('.status-step').forEach((step, index) => {
        const stepNumber = index + 1;
        
        if (stepNumber < currentStep) {
            step.classList.add('completed');
        } else if (stepNumber === currentStep) {
            step.classList.add('active');
        }
        
        // Update timestamps
        const status = step.dataset.status;
        const timeElement = step.querySelector('.step-time');
        if (order.timestamps[status]) {
            timeElement.textContent = formatDateTime(order.timestamps[status]);
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
    
    itemsContainer.innerHTML = '';
    
    order.items.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'order-item';
        
        itemElement.innerHTML = `
            <div class="item-info">
                <strong>${item.name}</strong>
                <div class="item-meta">
                    ${item.size || 'Regular'} • ${item.sugar || '100%'} 
                    ${item.addons && item.addons.length > 0 ? `• ${item.addons.join(', ')}` : ''}
                </div>
            </div>
            <div class="item-qty">×${item.quantity}</div>
            <div class="item-price">₱${(item.price * item.quantity).toLocaleString()}</div>
        `;
        
        itemsContainer.appendChild(itemElement);
    });
    
    totalElement.textContent = `₱${order.total.toLocaleString()}`;
}

/**
 * Update customer information
 */
function updateCustomerInfo(order) {
    document.getElementById('customer-name').textContent = order.customer.name;
    document.getElementById('customer-contact').textContent = order.customer.contact;
    document.getElementById('customer-address').textContent = order.customer.address;
}

// ========================
// UTILITY FUNCTIONS
// ========================

/**
 * Format date time for display
 * Backend: Ensure timestamps are in ISO format
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
        console.error('Error formatting date:', error);
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
        refreshNote.textContent = `Last updated: ${now.toLocaleTimeString()}`;
    }
}

/**
 * Show no order found message
 */
function showNoOrderFound() {
    const statusContainer = document.querySelector('.status-container');
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

// ========================
// BACKEND INTEGRATION HELPERS
// ========================

/**
 * Backend developers: Use these functions for API integration
 */

/**
 * Fetch order from backend API
 * @param {string} orderId 
 * @returns {Promise}
 */
async function fetchOrderFromBackend(orderId) {
    try {
        const response = await fetch(`/api/orders/${orderId}`);
        if (!response.ok) throw new Error('Order not found');
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        return null;
    }
}

/**
 * Real-time updates with WebSocket (Optional)
 * Backend: Implement WebSocket server for real-time updates
 */
function setupRealTimeUpdates(orderId) {
    // Backend: Implement WebSocket connection
    const socket = new WebSocket(`ws://yourserver.com/orders/${orderId}`);
    
    socket.onmessage = function(event) {
        const order = JSON.parse(event.data);
        displayOrderStatus(order);
    };
    
    socket.onclose = function() {
        console.log('WebSocket connection closed');
    };
}

// ========================
// DEMO DATA FOR TESTING
// ========================

/**
 * Create demo order for testing
 * Backend: Remove this function in production
 */
function createDemoOrder() {
    const demoOrder = {
        id: "ORD-" + Date.now(),
        customer: {
            name: "Juan Dela Cruz",
            contact: "09123456789",
            address: "123 Pearl Street, Manila"
        },
        items: [
            {
                name: "Wintermelon Milk Tea",
                price: 85,
                quantity: 2,
                size: "Large",
                sugar: "50%",
                addons: ["Pearls", "Crystal"]
            },
            {
                name: "Taro Milk Tea",
                price: 95,
                quantity: 1,
                size: "Regular",
                sugar: "30%",
                addons: ["Cheese Foam"]
            }
        ],
        status: "preparing",
        timestamps: {
            placed: new Date().toISOString(),
            received: new Date(Date.now() + 5 * 60000).toISOString(),
            preparing: new Date(Date.now() + 10 * 60000).toISOString()
        },
        total: 265
    };
    
    // Save to localStorage for demo
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    orders.push(demoOrder);
    localStorage.setItem('orders', JSON.stringify(orders));
    sessionStorage.setItem('lastOrderId', demoOrder.id);
    
    return demoOrder.id;
}

// Uncomment for testing:
// createDemoOrder();