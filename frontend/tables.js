document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    loadTables();
    setupStatusFilters();
    addBookingModal();
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

function addBookingModal() {
    const modalHTML = `
        <div class="modal fade" id="bookingModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Book Table</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="bookingForm">
                            <div class="mb-3">
                                <label for="customerName" class="form-label">Customer Name</label>
                                <input type="text" class="form-control" id="customerName" required>
                            </div>
                            <div class="mb-3">
                                <label for="phoneNumber" class="form-label">Phone Number</label>
                                <input type="tel" class="form-control" id="phoneNumber" required>
                            </div>
                            <div class="mb-3">
                                <label for="reservationTime" class="form-label">Reservation Time</label>
                                <input type="datetime-local" class="form-control" id="reservationTime" required>
                            </div>
                            <input type="hidden" id="tableId">
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" onclick="submitBooking()">Book Table</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
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
                            <button class="btn btn-primary btn-sm" 
                                onclick="openBookingModal(${table.id})"
                                ${table.status !== 'available' ? 'disabled' : ''}>
                                Book Table
                            </button>
                            ${table.status === 'available' ? `
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

async function reserveTable(tableId) {
    try {
        const response = await fetch(`http://localhost:3000/api/tables/${tableId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ status: 'reserved' })
        });

        if (!response.ok) {
            throw new Error('Failed to reserve table');
        }

        // Show success message
        alert('Table reserved successfully!');
        
        // Reload tables to show updated status
        loadTables();
        
        // Update dashboard reservations count
        updateDashboardReservations();
    } catch (error) {
        console.error('Error reserving table:', error);
        alert('Failed to reserve table. Please try again.');
    }
}

async function clearTable(tableId) {
    try {
        const response = await fetch(`http://localhost:3000/api/tables/${tableId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ status: 'available' })
        });

        if (!response.ok) {
            throw new Error('Failed to clear table');
        }

        // Show success message
        alert('Table cleared successfully!');
        
        // Reload tables to show updated status
        loadTables();
        
        // Update dashboard reservations count
        updateDashboardReservations();
    } catch (error) {
        console.error('Error clearing table:', error);
        alert('Failed to clear table. Please try again.');
    }
}

async function occupyTable(tableId) {
    try {
        const response = await fetch(`http://localhost:3000/api/tables/${tableId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ status: 'occupied' })
        });

        if (!response.ok) {
            throw new Error('Failed to occupy table');
        }

        // Show success message
        alert('Table occupied successfully!');
        
        // Reload tables to show updated status
        loadTables();
    } catch (error) {
        console.error('Error occupying table:', error);
        alert('Failed to occupy table. Please try again.');
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

function openBookingModal(tableId) {
    document.getElementById('tableId').value = tableId;
    const modal = new bootstrap.Modal(document.getElementById('bookingModal'));
    modal.show();
}

async function submitBooking() {
    const tableId = document.getElementById('tableId').value;
    const customerName = document.getElementById('customerName').value;
    const phoneNumber = document.getElementById('phoneNumber').value;
    const reservationTime = document.getElementById('reservationTime').value;

    if (!customerName || !phoneNumber || !reservationTime) {
        alert('Please fill in all fields');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/reservations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                table_id: tableId,
                customer_name: customerName,
                phone_number: phoneNumber,
                reservation_time: reservationTime
            })
        });

        if (!response.ok) {
            throw new Error('Failed to book table');
        }

        // Show success message
        alert('Table booked successfully!');
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('bookingModal'));
        modal.hide();
        
        // Reset form
        document.getElementById('bookingForm').reset();
        
        // Reload tables to show updated status
        loadTables();
        
        // Update dashboard reservations count
        updateDashboardReservations();
    } catch (error) {
        console.error('Error booking table:', error);
        alert('Failed to book table. Please try again.');
    }
} 