// Store cart items
let cart = new Map();

document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    loadTables();
    loadMenuItems();
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
        const tableSelect = document.getElementById('tableSelect');
        tableSelect.innerHTML = '<option value="">Select a table...</option>';

        tables.forEach(table => {
            if (table.status === 'available') {
                const option = document.createElement('option');
                option.value = table.id;
                option.textContent = `Table ${table.table_number} (Floor ${table.floor})`;
                tableSelect.appendChild(option);
            }
        });
    } catch (error) {
        console.error('Error loading tables:', error);
        alert('Failed to load tables. Please try again.');
    }
}

async function loadMenuItems() {
    try {
        const response = await fetch('http://localhost:3000/api/menu', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load menu items');
        }

        const menuItems = await response.json();
        displayMenuItems(menuItems);
    } catch (error) {
        console.error('Error loading menu items:', error);
        alert('Failed to load menu items. Please try again.');
    }
}

function displayMenuItems(items) {
    const container = document.getElementById('menuItems');
    container.innerHTML = '';

    items.forEach(item => {
        if (item.availability) {
            const menuItem = document.createElement('div');
            menuItem.className = 'col-md-6 col-lg-4 mb-4';
            menuItem.innerHTML = `
                <div class="card menu-item">
                    <div class="card-body">
                        <h5 class="card-title">${item.name}</h5>
                        <p class="card-text">${item.description || ''}</p>
                        <div class="d-flex justify-content-between align-items-center">
                            <span class="price">₹${parseFloat(item.price).toFixed(2)}</span>
                            <div class="quantity-control">
                                <button class="btn btn-sm btn-outline-primary" onclick="updateQuantity(${item.id}, -1)">-</button>
                                <span class="quantity-display" id="quantity-${item.id}">0</span>
                                <button class="btn btn-sm btn-outline-primary" onclick="updateQuantity(${item.id}, 1)">+</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            container.appendChild(menuItem);
        }
    });
}

function updateQuantity(itemId, change) {
    const quantityDisplay = document.getElementById(`quantity-${itemId}`);
    let currentQuantity = parseInt(quantityDisplay.textContent);
    currentQuantity = Math.max(0, currentQuantity + change);
    quantityDisplay.textContent = currentQuantity;
    updateCart();
}

function updateCart() {
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    let total = 0;
    cartItems.innerHTML = '';

    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        const itemId = item.querySelector('.quantity-control').getAttribute('onclick').match(/\d+/)[0];
        const quantity = parseInt(document.getElementById(`quantity-${itemId}`).textContent);
        
        if (quantity > 0) {
            const name = item.querySelector('.card-title').textContent;
            const price = parseFloat(item.querySelector('.price').textContent.replace('₹', ''));
            const itemTotal = price * quantity;
            total += itemTotal;

            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <span>${name} x ${quantity}</span>
                    <span>₹${itemTotal.toFixed(2)}</span>
                </div>
            `;
            cartItems.appendChild(cartItem);
        }
    });

    cartTotal.textContent = total.toFixed(2);
}

async function placeOrder() {
    const tableId = document.getElementById('tableSelect').value;
    if (!tableId) {
        alert('Please select a table');
        return;
    }

    const orderItems = [];
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        const itemId = item.querySelector('.quantity-control').getAttribute('onclick').match(/\d+/)[0];
        const quantity = parseInt(document.getElementById(`quantity-${itemId}`).textContent);
        
        if (quantity > 0) {
            orderItems.push({
                menu_item_id: parseInt(itemId),
                quantity: quantity
            });
        }
    });

    if (orderItems.length === 0) {
        alert('Please add items to your order');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                table_id: parseInt(tableId),
                items: orderItems
            })
        });

        if (!response.ok) {
            throw new Error('Failed to place order');
        }

        const result = await response.json();
        alert('Order placed successfully!');
        
        // Update table status to occupied
        await fetch(`http://localhost:3000/api/tables/${tableId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ status: 'occupied' })
        });

        // Reset the form
        document.getElementById('tableSelect').value = '';
        menuItems.forEach(item => {
            const itemId = item.querySelector('.quantity-control').getAttribute('onclick').match(/\d+/)[0];
            document.getElementById(`quantity-${itemId}`).textContent = '0';
        });
        updateCart();
    } catch (error) {
        console.error('Error placing order:', error);
        alert('Failed to place order. Please try again.');
    }
} 