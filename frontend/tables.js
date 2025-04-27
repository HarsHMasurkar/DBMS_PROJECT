document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    loadTables();
    setupStatusFilters();
});

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    window.location.href = 'login.html';
}

async function loadTables() {
    try {
        const response = await fetch('http://localhost:3000/api/tables', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load tables');
        }

        const tables = await response.json();
        displayTables(tables);
    } catch (error) {
        console.error('Error loading tables:', error);
        alert('Failed to load tables. Please try again.');
    }
}

function displayTables(tables) {
    const tablesContainer = document.getElementById('tablesContainer');
    tablesContainer.innerHTML = '';

    // Group tables by floor
    const tablesByFloor = tables.reduce((acc, table) => {
        if (!acc[table.floor]) {
            acc[table.floor] = [];
        }
        acc[table.floor].push(table);
        return acc;
    }, {});

    // Create a section for each floor
    Object.keys(tablesByFloor).sort().forEach(floor => {
        const floorSection = document.createElement('div');
        floorSection.className = 'floor-section mb-4';
        
        const floorHeader = document.createElement('h3');
        floorHeader.className = 'floor-header mb-3';
        floorHeader.textContent = `Floor ${floor}`;
        floorSection.appendChild(floorHeader);

        const floorTables = document.createElement('div');
        floorTables.className = 'row g-3';

        tablesByFloor[floor].forEach(table => {
            const tableCard = document.createElement('div');
            tableCard.className = 'col-md-4';
            tableCard.innerHTML = `
                <div class="card h-100">
                    <div class="card-body">
                        <h5 class="card-title">Table ${table.table_number}</h5>
                        <p class="card-text">
                            <strong>Capacity:</strong> ${table.capacity} people<br>
                            <strong>Status:</strong> 
                            <span class="badge ${getStatusBadgeClass(table.status)}">
                                ${table.status}
                            </span>
                        </p>
                        <div class="d-flex flex-wrap gap-2">
                            <button class="btn btn-primary btn-sm" onclick="viewTableDetails(${table.id})">
                                View Details
                            </button>
                            ${table.status === 'available' ? `
                                <button class="btn btn-success btn-sm" onclick="reserveTable(${table.id})">
                                    Reserve
                                </button>
                                <button class="btn btn-warning btn-sm" onclick="occupyTable(${table.id})">
                                    Occupy
                                </button>
                            ` : ''}
                            ${table.status === 'reserved' ? `
                                <button class="btn btn-danger btn-sm" onclick="clearTable(${table.id})">
                                    Cancel Reservation
                                </button>
                            ` : ''}
                            ${table.status === 'occupied' ? `
                                <button class="btn btn-danger btn-sm" onclick="clearTable(${table.id})">
                                    Clear Table
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
            floorTables.appendChild(tableCard);
        });

        floorSection.appendChild(floorTables);
        tablesContainer.appendChild(floorSection);
    });
}

function setupStatusFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            button.classList.add('active');
            
            const status = button.dataset.status;
            filterTables(status);
        });
    });
}

function filterTables(status) {
    const tableCards = document.querySelectorAll('.table-card');
    tableCards.forEach(card => {
        const tableStatus = card.querySelector('.table-status').textContent.toLowerCase();
        if (status === 'all' || tableStatus === status) {
            card.parentElement.style.display = 'block';
        } else {
            card.parentElement.style.display = 'none';
        }
    });
}

async function showTableDetails(tableId) {
    try {
        const response = await fetch(`http://localhost:3000/api/tables/${tableId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load table details');
        }

        const table = await response.json();
        const modal = new bootstrap.Modal(document.getElementById('tableDetailsModal'));
        
        document.getElementById('tableDetails').innerHTML = `
            <div class="table-details">
                <p><strong>Table Number:</strong> ${table.table_number}</p>
                <p><strong>Floor:</strong> ${table.floor}</p>
                <p><strong>Status:</strong> <span class="badge bg-${getStatusColor(table.status)}">${table.status}</span></p>
                <p><strong>Capacity:</strong> ${table.capacity} persons</p>
                ${table.current_order ? `
                    <div class="mt-3">
                        <h6>Current Order</h6>
                        <p><strong>Order ID:</strong> ${table.current_order.id}</p>
                        <p><strong>Total Amount:</strong> ₹${table.current_order.total_amount}</p>
                        <p><strong>Status:</strong> ${table.current_order.status}</p>
                    </div>
                ` : ''}
            </div>
        `;
        
        modal.show();
    } catch (error) {
        console.error('Error loading table details:', error);
        alert('Failed to load table details. Please try again.');
    }
}

async function updateTableStatus(tableId, newStatus) {
    try {
        const response = await fetch(`http://localhost:3000/api/tables/${tableId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (!response.ok) {
            throw new Error('Failed to update table status');
        }

        // Reload tables to show updated status
        loadTables();
        
        // If status is being changed to reserved, update dashboard
        if (newStatus === 'reserved') {
            updateDashboardReservations();
        }
    } catch (error) {
        console.error('Error updating table status:', error);
        alert('Failed to update table status. Please try again.');
    }
}

async function updateDashboardReservations() {
    try {
        const response = await fetch('http://localhost:3000/api/dashboard', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to update dashboard');
        }

        const data = await response.json();
        // Update the reservations count on the dashboard
        const reservationsCount = document.getElementById('reservationsCount');
        if (reservationsCount) {
            reservationsCount.textContent = data.pendingReservations || 0;
        }
    } catch (error) {
        console.error('Error updating dashboard:', error);
    }
}

function reserveTable(tableId) {
    updateTableStatus(tableId, 'reserved');
}

function clearTable(tableId) {
    updateTableStatus(tableId, 'available');
}

function occupyTable(tableId) {
    updateTableStatus(tableId, 'occupied');
}

function getStatusColor(status) {
    switch (status.toLowerCase()) {
        case 'available':
            return 'success';
        case 'occupied':
            return 'danger';
        case 'reserved':
            return 'warning';
        default:
            return 'secondary';
    }
}

function getStatusBadgeClass(status) {
    switch (status) {
        case 'available':
            return 'bg-success';
        case 'occupied':
            return 'bg-danger';
        case 'reserved':
            return 'bg-warning';
        default:
            return 'bg-secondary';
    }
} 