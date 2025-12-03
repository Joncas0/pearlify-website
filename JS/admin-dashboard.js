// admin-dashboard.js - UPDATED VERSION
// Business Intelligence Dashboard - Calculates real metrics from order data

document.addEventListener("DOMContentLoaded", () => {
    // Initialize dashboard
    loadDashboardData();
    
    // Event listeners
    const timePeriodSelect = document.getElementById('time-period');
    if (timePeriodSelect) {
        timePeriodSelect.addEventListener('change', loadDashboardData);
    }
});

// ========================
// MAIN DASHBOARD LOADER
// ========================

function loadDashboardData() {
    console.log("=== DASHBOARD LOADING ===");
    
    const timePeriod = document.getElementById('time-period').value;
    
    // Get only NON-CANCELLED orders
    const allOrders = getAllOrders();
    const validOrders = allOrders.filter(order => order.status !== 'cancelled');
    
    console.log(`Total orders: ${allOrders.length}, Valid (non-cancelled): ${validOrders.length}`);
    
    if (validOrders.length === 0) {
        showNoDataMessage();
        return;
    }

    // Filter orders by selected time period
    const filteredOrders = filterOrdersByTimePeriod(validOrders, timePeriod);
    
    // Update all dashboard components
    updateKeyMetrics(filteredOrders);
    updateTopFlavorsChart(filteredOrders);
    updateRevenueTrendChart(filteredOrders, timePeriod);
    updateCategoryBreakdown(filteredOrders);
    updateHourlySales(filteredOrders);
    updateBusinessAlerts(filteredOrders);
}

// ========================
// DATA FETCHING & FILTERING - FIXED
// ========================

/**
 * Get all orders from localStorage (EXCLUDES CANCELLED)
 */
function getAllOrders() {
    try {
        const orders = JSON.parse(localStorage.getItem('orders')) || [];
        // Filter out cancelled orders
        return orders.filter(order => order.status !== 'cancelled');
    } catch (error) {
        console.error('Error loading orders:', error);
        return [];
    }
}

/**
 * Filter orders by time period
 */
function filterOrdersByTimePeriod(orders, period) {
    if (period === 'all') return orders;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return orders.filter(order => {
        let orderDate;
        
        if (order.timestamps && order.timestamps.placed) {
            orderDate = new Date(order.timestamps.placed);
        } else if (order.orderDate) {
            orderDate = new Date(order.orderDate);
        } else {
            console.warn('Order missing timestamp:', order.id);
            return false;
        }
        
        switch (period) {
            case 'today':
                return orderDate >= today;
            case 'week':
                const weekAgo = new Date(today);
                weekAgo.setDate(weekAgo.getDate() - 7);
                return orderDate >= weekAgo;
            case 'month':
                const monthAgo = new Date(today);
                monthAgo.setMonth(monthAgo.getMonth() - 1);
                return orderDate >= monthAgo;
            default:
                return true;
        }
    });
}

// ========================
// KEY METRICS CALCULATIONS - REMOVED FAKE TRENDS
// ========================

function updateKeyMetrics(orders) {
    if (orders.length === 0) {
        resetMetricsToZero();
        return;
    }
    
    // Total Revenue
    const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    
    // Total Orders
    const totalOrders = orders.length;
    
    // Average Order Value
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    // Peak Hour
    const peakHour = calculatePeakHour(orders);
    
    // Update DOM - REMOVED TREND ELEMENTS
    document.querySelector('.metric-card:nth-child(1) .metric-value').textContent = `₱${Math.round(totalRevenue).toLocaleString()}`;
    document.querySelector('.metric-card:nth-child(2) .metric-value').textContent = totalOrders.toLocaleString();
    document.querySelector('.metric-card:nth-child(3) .metric-value').textContent = `₱${Math.round(averageOrderValue).toLocaleString()}`;
    document.querySelector('.metric-card:nth-child(4) .metric-value').textContent = peakHour;
    
    // Remove trend display elements
    document.querySelectorAll('.metric-trend').forEach(el => {
        el.style.display = 'none';
    });
}

function calculatePeakHour(orders) {
    if (orders.length === 0) return '--:--';
    
    const hourCounts = {};
    orders.forEach(order => {
        let orderDate;
        
        if (order.timestamps && order.timestamps.placed) {
            orderDate = new Date(order.timestamps.placed);
        } else if (order.orderDate) {
            orderDate = new Date(order.orderDate);
        } else {
            return;
        }
        
        const hour = orderDate.getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    
    if (Object.keys(hourCounts).length === 0) return '--:--';
    
    const peakHour = Object.keys(hourCounts).reduce((a, b) => 
        hourCounts[a] > hourCounts[b] ? a : b
    );
    
    const hourInt = parseInt(peakHour);
    const period = hourInt >= 12 ? 'PM' : 'AM';
    const displayHour = hourInt > 12 ? hourInt - 12 : hourInt;
    
    return `${displayHour}:00${period}`;
}

function resetMetricsToZero() {
    document.querySelector('.metric-card:nth-child(1) .metric-value').textContent = '₱0';
    document.querySelector('.metric-card:nth-child(2) .metric-value').textContent = '0';
    document.querySelector('.metric-card:nth-child(3) .metric-value').textContent = '₱0';
    document.querySelector('.metric-card:nth-child(4) .metric-value').textContent = '--:--';
}

// ========================
// TOP FLAVORS CHART - UPDATED
// ========================

function updateTopFlavorsChart(orders) {
    const flavorSales = calculateFlavorSales(orders);
    const topFlavors = getTopFlavors(flavorSales, 5);
    
    const flavorsContainer = document.querySelector('.flavors-chart');
    if (!flavorsContainer) return;
    
    flavorsContainer.innerHTML = '';
    
    if (topFlavors.length === 0) {
        flavorsContainer.innerHTML = '<p class="no-data">No sales data available</p>';
        return;
    }
    
    const maxSales = Math.max(...topFlavors.map(f => f.quantity));
    
    topFlavors.forEach(flavor => {
        const percentage = (flavor.quantity / maxSales) * 100;
        const flavorElement = createFlavorElement(flavor, percentage);
        flavorsContainer.appendChild(flavorElement);
    });
}

function calculateFlavorSales(orders) {
    const flavorSales = {};
    
    orders.forEach(order => {
        if (!order.items || !Array.isArray(order.items)) return;
        
        order.items.forEach(item => {
            const flavorName = item.name || 'Unknown Item';
            if (!flavorSales[flavorName]) {
                flavorSales[flavorName] = {
                    name: flavorName,
                    quantity: 0,
                    revenue: 0,
                    image: item.image || getDefaultImage(flavorName)
                };
            }
            flavorSales[flavorName].quantity += item.quantity || 1;
            flavorSales[flavorName].revenue += (item.price || 0) * (item.quantity || 1);
        });
    });
    
    return flavorSales;
}

function getTopFlavors(flavorSales, limit) {
    return Object.values(flavorSales)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, limit);
}

function createFlavorElement(flavor, percentage) {
    const div = document.createElement('div');
    div.className = 'flavor-item';
    
    div.innerHTML = `
        <div class="flavor-image">
            <img src="${flavor.image}" alt="${flavor.name}" onerror="this.src='../media/default-drink.png'">
        </div>
        <div class="flavor-info">
            <span class="flavor-name">${flavor.name}</span>
            <div class="flavor-bar">
                <div class="bar" style="width: ${percentage}%"></div>
            </div>
        </div>
        <div class="flavor-stats">
            <span class="sold-count">${flavor.quantity} sold</span>
        </div>
    `;
    
    return div;
}

function getDefaultImage(flavorName) {
    const imageMap = {
        'Wintermelon Milk Tea': '../media/winter top sellers (2).png',
        'Brown Sugar Milk Tea': '../media/brown sugar.png',
        'Pearly Milk Tea': '../media/pearly top sellers (4).png',
        'Taro Milk Tea': '../media/taro.png',
        'Honey Lemon Juice': '../media/honey lemon.png',
        'Cheese Milk Tea': '../media/default-drink.png',
        'Oreo Milk Tea': '../media/default-drink.png',
        'Hokkaido Milk Tea': '../media/default-drink.png',
        'Matcha Milk Tea': '../media/default-drink.png'
    };
    
    return imageMap[flavorName] || '../media/default-drink.png';
}

// ========================
// REVENUE TREND CHART - REPLACED WITH LINE CHART
// ========================

function updateRevenueTrendChart(orders, period) {
    const revenueData = calculateRevenueData(orders, period);
    const chartContainer = document.querySelector('.revenue-chart-container');
    
    if (!chartContainer) return;
    
    // Clear container
    chartContainer.innerHTML = '';
    
    if (revenueData.length === 0) {
        chartContainer.innerHTML = '<p class="no-data">No revenue data available</p>';
        return;
    }
    
    // Calculate max revenue for scaling
    const maxRevenue = Math.max(...revenueData.map(d => d.revenue));
    const yLabels = generateDynamicYLabels(maxRevenue);
    
    // Create line chart HTML
    const chartHTML = createLineChartHTML(revenueData, yLabels, period);
    chartContainer.innerHTML = chartHTML;
    
    // Add hover effects
    addChartHoverEffects();
}

function calculateRevenueData(orders, period) {
    const now = new Date();
    let dataPoints = [];
    
    if (period === 'today') {
        // Group by hour for today
        for (let hour = 0; hour < 24; hour++) {
            const hourStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, 0, 0);
            const hourEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour + 1, 0, 0);
            
            const hourRevenue = orders.reduce((sum, order) => {
                const orderTime = new Date(order.timestamps?.placed || order.orderDate);
                if (orderTime >= hourStart && orderTime < hourEnd) {
                    return sum + (order.total || 0);
                }
                return sum;
            }, 0);
            
            dataPoints.push({
                label: `${hour}:00`,
                revenue: hourRevenue,
                hour: hour
            });
        }
        // Only show hours with data
        dataPoints = dataPoints.filter(d => d.revenue > 0 || d.hour <= now.getHours());
    } else {
        // Group by day for week/month
        const days = period === 'week' ? 7 : 30;
        const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        
        for (let i = days - 1; i >= 0; i--) {
            const day = new Date(now);
            day.setDate(day.getDate() - i);
            const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
            const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1);
            
            const dayRevenue = orders.reduce((sum, order) => {
                const orderTime = new Date(order.timestamps?.placed || order.orderDate);
                if (orderTime >= dayStart && orderTime < dayEnd) {
                    return sum + (order.total || 0);
                }
                return sum;
            }, 0);
            
            const dayLabel = period === 'week' ? 
                labels[day.getDay()] : 
                `${day.getDate()}/${day.getMonth() + 1}`;
            
            dataPoints.push({
                label: dayLabel,
                revenue: dayRevenue,
                date: day
            });
        }
    }
    
    return dataPoints;
}

function generateDynamicYLabels(maxValue) {
    if (maxValue === 0) return [0, 0, 0, 0, 0];
    
    const roundedMax = Math.ceil(maxValue / 1000) * 1000;
    const step = roundedMax / 4;
    
    return [
        Math.round(roundedMax),
        Math.round(roundedMax * 0.75),
        Math.round(roundedMax * 0.5),
        Math.round(roundedMax * 0.25),
        0
    ];
}

function createLineChartHTML(data, yLabels, period) {
    const maxRevenue = Math.max(...data.map(d => d.revenue), 1); // Ensure at least 1
    const containerHeight = 180; // Reduced from 200
    const containerWidth = Math.max(data.length * 40, 300); // Minimum width
    
    // Calculate points for line - ensure they start from bottom
    let points = '';
    data.forEach((point, index) => {
        const x = (index * 40) + 20;
        // Calculate y position from bottom (0 at bottom, max at top)
        const y = containerHeight - ((point.revenue / maxRevenue) * containerHeight);
        // Ensure y is within bounds
        const safeY = Math.max(0, Math.min(y, containerHeight));
        points += `${x},${safeY} `;
    });
    
    // Create bars for each data point
    const barsHTML = data.map((point, index) => {
        const barHeight = maxRevenue > 0 ? (point.revenue / maxRevenue) * containerHeight : 0;
        const x = (index * 40) + 10;
        
        return `
            <div class="chart-bar" style="left: ${x}px; height: ${barHeight}px; bottom: 0;">
                <div class="bar-tooltip">
                    <strong>${point.label}</strong><br>
                    ₱${point.revenue.toLocaleString()}
                </div>
            </div>
        `;
    }).join('');
    
    // Create line points
    const pointsHTML = data.map((point, index) => {
        const x = (index * 40) + 20;
        const y = containerHeight - ((point.revenue / maxRevenue) * containerHeight);
        const safeY = Math.max(0, Math.min(y, containerHeight));
        
        return `<circle cx="${x}" cy="${safeY}" r="4" class="data-point" data-value="${point.revenue}" data-label="${point.label}"/>`;
    }).join('');
    
    return `
        <div class="line-chart-wrapper">
            <div class="y-axis">
                ${yLabels.map(label => `<span>₱${label.toLocaleString()}</span>`).join('')}
            </div>
            
            <div class="chart-area" style="width: ${containerWidth}px;">
                <!-- Grid lines -->
                <div class="grid-lines">
                    ${yLabels.map((_, i) => `
                        <div class="grid-line" style="top: ${(i * (100 / (yLabels.length - 1)))}%;"></div>
                    `).join('')}
                </div>
                
                <!-- Bars -->
                <div class="chart-bars">
                    ${barsHTML}
                </div>
                
                <!-- SVG Line -->
                <svg class="line-chart" width="${containerWidth}" height="${containerHeight}">
                    <polyline points="${points.trim()}" class="chart-line"/>
                    ${pointsHTML}
                </svg>
            </div>
            
            <!-- X-axis labels - SEPARATE from chart area -->
            <div class="x-axis">
                ${data.map(point => `<span>${point.label}</span>`).join('')}
            </div>
        </div>
    `;
}

// ========================
// HOURLY SALES - FIXED BAR CHART
// ========================

function updateHourlySales(orders) {
    const hourlyData = calculateHourlySales(orders);
    const container = document.querySelector('.hourly-sales-container');
    
    if (!container) return;
    
    container.innerHTML = '';
    
    if (Object.values(hourlyData).every(v => v === 0)) {
        container.innerHTML = '<p class="no-data">No hourly sales data</p>';
        return;
    }
    
    const maxOrders = Math.max(...Object.values(hourlyData));
    const yLabels = generateDynamicYLabels(maxOrders, true);
    
    const chartHTML = createHourlyChartHTML(hourlyData, yLabels);
    container.innerHTML = chartHTML;
}

function calculateHourlySales(orders) {
    const hours = {
        '9AM': 0,
        '12PM': 0, 
        '3PM': 0,
        '6PM': 0,
        '9PM': 0
    };
    
    const hourMapping = {
        9: '9AM',
        10: '9AM',
        11: '9AM',
        12: '12PM',
        13: '12PM',
        14: '12PM',
        15: '3PM',
        16: '3PM',
        17: '3PM',
        18: '6PM',
        19: '6PM',
        20: '6PM',
        21: '9PM',
        22: '9PM',
        23: '9PM'
    };
    
    orders.forEach(order => {
        let orderDate;
        
        if (order.timestamps && order.timestamps.placed) {
            orderDate = new Date(order.timestamps.placed);
        } else if (order.orderDate) {
            orderDate = new Date(order.orderDate);
        } else {
            return;
        }
        
        const hour = orderDate.getHours();
        const timeSlot = hourMapping[hour];
        
        if (timeSlot && hours[timeSlot] !== undefined) {
            hours[timeSlot]++;
        }
    });
    
    return hours;
}

function createHourlyChartHTML(hourlyData, yLabels) {
    const hours = ['9AM', '12PM', '3PM', '6PM', '9PM'];
    const maxOrders = Math.max(...Object.values(hourlyData), 1);
    const containerHeight = 180; // Reduced from 200
    
    return `
        <div class="hourly-chart-wrapper">
            <div class="y-axis">
                ${yLabels.map(label => `<span>${label}</span>`).join('')}
            </div>
            
            <div class="chart-area" style="width: 300px;">
                <div class="grid-lines">
                    ${yLabels.map((_, i) => `
                        <div class="grid-line" style="top: ${(i * (100 / (yLabels.length - 1)))}%;"></div>
                    `).join('')}
                </div>
                
                <div class="hourly-bars">
                    ${hours.map(hour => {
                        const count = hourlyData[hour] || 0;
                        const barHeight = maxOrders > 0 ? (count / maxOrders) * containerHeight : 0;
                        
                        return `
                            <div class="hour-bar">
                                <div class="bar" style="height: ${barHeight}px;">
                                    <div class="bar-tooltip">
                                        <strong>${hour}</strong><br>
                                        ${count} orders
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
            
            <!-- X-axis labels -->
            <div class="x-axis">
                ${hours.map(hour => `<span>${hour}</span>`).join('')}
            </div>
        </div>
    `;
}

// ========================
// CATEGORY BREAKDOWN - FIXED PIE CHART
// ========================

function updateCategoryBreakdown(orders) {
    const categoryData = calculateCategoryBreakdown(orders);
    const pieLegend = document.querySelector('.pie-legend');
    const pieVisual = document.querySelector('.pie-chart-visual');
    
    if (!pieLegend || !pieVisual) return;
    
    // Clear existing
    pieLegend.innerHTML = '';
    
    // Calculate percentages
    const totalOrders = orders.length;
    let categoriesHTML = '';
    let conicGradient = '';
    let accumulatedPercent = 0;
    
    const colors = {
        'Classic': '#FF783E',
        'Premium': '#6f42c1',
        'Oreo': '#fd7e14',
        'Fruity': '#20c997',
        'Other': '#6c757d'
    };
    
    Object.entries(categoryData).forEach(([category, count]) => {
        const percentage = totalOrders > 0 ? (count / totalOrders) * 100 : 0;
        
        // Add to conic gradient
        if (percentage > 0) {
            conicGradient += `${colors[category]} ${accumulatedPercent}% ${accumulatedPercent + percentage}%, `;
            accumulatedPercent += percentage;
        }
        
        // Add to legend
        categoriesHTML += `
            <div class="category">
                <span class="dot ${category.toLowerCase()}"></span>
                <span>${category}: ${Math.round(percentage)}% (${count})</span>
            </div>
        `;
    });
    
    // Update pie chart visual
    if (conicGradient) {
        pieVisual.style.background = `conic-gradient(${conicGradient.slice(0, -2)})`;
    } else {
        pieVisual.style.background = '#e9ecef';
    }
    
    // Update legend
    pieLegend.innerHTML = categoriesHTML || '<div class="no-data">No category data</div>';
}

function calculateCategoryBreakdown(orders) {
    const categories = {
        'Classic': 0,
        'Premium': 0,
        'Oreo': 0,
        'Fruity': 0,
        'Other': 0
    };
    
    const classicFlavors = ['Wintermelon', 'Brown Sugar', 'Taro', 'Hokkaido', 'Classic'];
    const premiumFlavors = ['Cheese', 'Premium', 'Matcha', 'Special'];
    const oreoFlavors = ['Oreo', 'Cookies'];
    const fruityFlavors = ['Honey Lemon', 'Fruit', 'Berry', 'Mango', 'Strawberry'];
    
    orders.forEach(order => {
        if (!order.items || !Array.isArray(order.items)) {
            categories['Other']++;
            return;
        }
        
        let orderCategory = 'Other';
        
        order.items.some(item => {
            const itemName = item.name || '';
            
            if (classicFlavors.some(flavor => itemName.includes(flavor))) {
                orderCategory = 'Classic';
                return true;
            }
            if (premiumFlavors.some(flavor => itemName.includes(flavor))) {
                orderCategory = 'Premium';
                return true;
            }
            if (oreoFlavors.some(flavor => itemName.includes(flavor))) {
                orderCategory = 'Oreo';
                return true;
            }
            if (fruityFlavors.some(flavor => itemName.includes(flavor))) {
                orderCategory = 'Fruity';
                return true;
            }
            return false;
        });
        
        categories[orderCategory]++;
    });
    
    return categories;
}

// ========================
// BUSINESS ALERTS
// ========================

function updateBusinessAlerts(orders) {
    const alerts = generateBusinessAlerts(orders);
    const alertContainer = document.querySelector('.alert-list');
    
    if (!alertContainer) return;
    
    alertContainer.innerHTML = '';
    
    if (alerts.length === 0) {
        alertContainer.innerHTML = '<div class="alert info">✅ All systems normal</div>';
        return;
    }
    
    alerts.forEach(alert => {
        const alertElement = document.createElement('div');
        alertElement.className = `alert ${alert.type}`;
        alertElement.innerHTML = alert.message;
        alertContainer.appendChild(alertElement);
    });
}

function generateBusinessAlerts(orders) {
    const alerts = [];
    
    if (orders.length === 0) {
        alerts.push({
            type: 'info',
            message: '📊 No sales data available for the selected period'
        });
        return alerts;
    }
    
    // Stock alert based on top flavors
    const flavorSales = calculateFlavorSales(orders);
    const topFlavors = getTopFlavors(flavorSales, 3);
    
    if (topFlavors.length > 0) {
        const topFlavor = topFlavors[0];
        if (topFlavor.quantity > 10) {
            alerts.push({
                type: 'warning',
                message: `⚠️ ${topFlavor.name} is selling fast (${topFlavor.quantity} sold) - check stock`
            });
        }
    }
    
    // Peak hour alert
    const hourlyData = calculateHourlySales(orders);
    const peakHour = Object.keys(hourlyData).reduce((a, b) => 
        hourlyData[a] > hourlyData[b] ? a : b
    );
    
    if (hourlyData[peakHour] > 5) {
        alerts.push({
            type: 'info',
            message: `💡 Peak sales hour: ${peakHour} (${hourlyData[peakHour]} orders)`
        });
    }
    
    // Low sales alert
    const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    if (totalRevenue < 1000 && orders.length > 5) {
        alerts.push({
            type: 'warning',
            message: '📉 Low average order value - consider promotions'
        });
    }
    
    return alerts;
}

// ========================
// UTILITY FUNCTIONS
// ========================

function showNoDataMessage() {
    const containers = [
        '.flavors-chart',
        '.revenue-chart-container',
        '.hourly-sales-container',
        '.pie-legend',
        '.alert-list'
    ];
    
    containers.forEach(selector => {
        const container = document.querySelector(selector);
        if (container) {
            container.innerHTML = '<p class="no-data">No data available</p>';
        }
    });
    
    resetMetricsToZero();
}

// ========================
// CHART HOVER EFFECTS
// ========================

function addChartHoverEffects() {
    // Add hover effects for line chart points
    document.querySelectorAll('.data-point').forEach(point => {
        point.addEventListener('mouseenter', function() {
            const value = this.getAttribute('data-value');
            const label = this.getAttribute('data-label');
            
            const tooltip = document.createElement('div');
            tooltip.className = 'chart-tooltip';
            tooltip.innerHTML = `<strong>${label}</strong><br>₱${parseInt(value).toLocaleString()}`;
            tooltip.style.position = 'absolute';
            tooltip.style.left = `${this.cx.baseVal.value}px`;
            tooltip.style.top = `${this.cy.baseVal.value - 40}px`;
            
            this.parentElement.appendChild(tooltip);
        });
        
        point.addEventListener('mouseleave', function() {
            const tooltip = this.parentElement.querySelector('.chart-tooltip');
            if (tooltip) tooltip.remove();
        });
    });
    
    // Add hover effects for bars
    document.querySelectorAll('.chart-bar, .hour-bar .bar').forEach(bar => {
        bar.addEventListener('mouseenter', function() {
            const tooltip = this.querySelector('.bar-tooltip');
            if (tooltip) {
                tooltip.style.opacity = '1';
                tooltip.style.visibility = 'visible';
            }
        });
        
        bar.addEventListener('mouseleave', function() {
            const tooltip = this.querySelector('.bar-tooltip');
            if (tooltip) {
                tooltip.style.opacity = '0';
                tooltip.style.visibility = 'hidden';
            }
        });
    });
}