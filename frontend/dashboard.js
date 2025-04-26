// Check if user is logged in
document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    console.log('Dashboard loaded, token:', token);

    if (!token) {
        console.log('No token found, redirecting to login');
        window.location.href = 'login.html';
        return;
    }

    // Display user name
    const userName = localStorage.getItem('userName') || 'Staff';
    document.getElementById('userName').textContent = userName;

    // Set up logout button
    document.getElementById('logoutBtn').addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        localStorage.removeItem('userName');
        localStorage.removeItem('userRole');
        window.location.href = 'login.html';
    });

    // Update date and time
    updateDateTime();
    setInterval(updateDateTime, 1000);

    // Load dashboard data
    loadDashboardData();
    loadRecentOrders();
    loadReservations();

    // Refresh data every 30 seconds
    setInterval(() => {
        loadDashboardData();
        loadRecentOrders();
        loadReservations();
    }, 30000);
});

// Update date and time
function updateDateTime() {
    const now = new Date();
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit' };
    
    document.getElementById('currentDate').textContent = now.toLocaleDateString('en-US', dateOptions);
    document.getElementById('currentTime').textContent = now.toLocaleTimeString('en-US', timeOptions);
}

// Load dashboard data
async function loadDashboardData() {
    try {
        const token = localStorage.getItem('token');
        console.log('Loading dashboard data with token:', token);
        
        const response = await fetch('http://localhost:3000/api/dashboard', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            console.error('Dashboard data fetch failed:', response.status, response.statusText);
            const errorData = await response.json();
            console.error('Error details:', errorData);
            throw new Error('Failed to load dashboard data');
        }
        
        const data = await response.json();
        console.log('Dashboard data loaded:', data);
        
        // Update dashboard cards
        document.getElementById('todaySales').textContent = `₹${data.todaySales.toFixed(2)}`;
        document.getElementById('pendingOrders').textContent = data.pendingOrders;
        
        // Fetch available tables count
        const tablesResponse = await fetch('http://localhost:3000/api/tables', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!tablesResponse.ok) {
            throw new Error('Failed to fetch tables data');
        }
        
        const tables = await tablesResponse.json();
        const availableTables = tables.filter(table => table.status === 'available').length;
        document.getElementById('availableTables').textContent = availableTables;
        
        // Fetch today's reservations
        const reservationsResponse = await fetch('http://localhost:3000/api/reservations', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!reservationsResponse.ok) {
            throw new Error('Failed to fetch reservations data');
        }
        
        const reservations = await reservationsResponse.json();
        const today = new Date().toISOString().split('T')[0];
        const todayReservations = reservations.filter(reservation => 
            reservation.reservation_time.startsWith(today) && 
            reservation.status === 'upcoming'
        ).length;
        
        document.getElementById('todayReservations').textContent = todayReservations;
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        alert('Failed to load dashboard data. Please try again.');
    }
}

// Load recent orders
async function loadRecentOrders() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/orders', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch orders data');
        }
        
        const orders = await response.json();
        const recentOrdersBody = document.getElementById('recentOrdersBody');
        recentOrdersBody.innerHTML = '';
        
        // Display only the 5 most recent orders
        const recentOrders = orders.slice(0, 5);
        
        recentOrders.forEach(order => {
            const row = document.createElement('tr');
            
            // Format date and time
            const orderDate = new Date(order.created_at);
            const formattedDate = orderDate.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            // Set status class for styling
            const statusClass = order.status === 'pending' ? 'status-pending' : 'status-completed';
            
            row.innerHTML = `
                <td>#${order.id}</td>
                <td>${order.table_number} (${order.floor})</td>
                <td>₹${order.total_price.toFixed(2)}</td>
                <td><span class="status ${statusClass}">${order.status}</span></td>
                <td>${formattedDate}</td>
            `;
            
            recentOrdersBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading recent orders:', error);
    }
}

// Load reservations
async function loadReservations() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/reservations', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch reservations data');
        }
        
        const reservations = await response.json();
        const reservationsBody = document.getElementById('reservationsBody');
        reservationsBody.innerHTML = '';
        
        // Filter upcoming reservations
        const upcomingReservations = reservations.filter(reservation => 
            reservation.status === 'upcoming'
        );
        
        // Sort by reservation time (ascending)
        upcomingReservations.sort((a, b) => 
            new Date(a.reservation_time) - new Date(b.reservation_time)
        );
        
        // Display only the 5 most immediate reservations
        const immediateReservations = upcomingReservations.slice(0, 5);
        
        immediateReservations.forEach(reservation => {
            const row = document.createElement('tr');
            
            // Format date and time
            const reservationDate = new Date(reservation.reservation_time);
            const formattedDate = reservationDate.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            row.innerHTML = `
                <td>${reservation.table_number} (${reservation.floor})</td>
                <td>${reservation.customer_name}</td>
                <td>${reservation.phone_number}</td>
                <td>${formattedDate}</td>
                <td><span class="status status-upcoming">${reservation.status}</span></td>
            `;
            
            reservationsBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading reservations:', error);
    }
} 