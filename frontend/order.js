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

        // Group tables by floor
        const tablesByFloor = tables.reduce((acc, table) => {
            if (!acc[table.floor]) {
                acc[table.floor] = [];
            }
            acc[table.floor].push(table);
            return acc;
        }, {});

        // Add tables to dropdown, grouped by floor
        Object.keys(tablesByFloor).sort().forEach(floor => {
            const optgroup = document.createElement('optgroup');
            optgroup.label = `Floor ${floor}`;
            
            tablesByFloor[floor].forEach(table => {
                const option = document.createElement('option');
                option.value = table.id;
                const status = table.current_status || table.status;
                option.textContent = `Table ${table.table_number} (${table.capacity} people) - ${status}`;
                option.disabled = status !== 'available';
                optgroup.appendChild(option);
            });
            
            tableSelect.appendChild(optgroup);
        });

        // Add event listener for table selection
        tableSelect.addEventListener('change', function() {
            const selectedTable = this.value;
            if (selectedTable) {
                // Enable the place order button if a table is selected
                document.querySelector('.btn-place-order').disabled = false;
            } else {
                // Disable the place order button if no table is selected
                document.querySelector('.btn-place-order').disabled = true;
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
                <div class="card menu-item" data-item-id="${item.id}">
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
    
    // Update cart Map
    if (currentQuantity > 0) {
        cart.set(itemId, currentQuantity);
    } else {
        cart.delete(itemId);
    }
    
    updateCart();
}

function updateCart() {
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    let total = 0;
    cartItems.innerHTML = '';

    cart.forEach((quantity, itemId) => {
        const menuItem = document.querySelector(`.menu-item[data-item-id="${itemId}"]`);
        if (menuItem) {
            const name = menuItem.querySelector('.card-title').textContent;
            const price = parseFloat(menuItem.querySelector('.price').textContent.replace('₹', ''));
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
        alert('Please select a table first');
        return;
    }

    if (cart.size === 0) {
        alert('Your cart is empty');
        return;
    }

    const orderItems = Array.from(cart.entries()).map(([itemId, quantity]) => ({
        id: parseInt(itemId),
        quantity: quantity
    }));

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
        
        // Clear the cart
        cart.clear();
        document.getElementById('cartItems').innerHTML = '';
        document.getElementById('cartTotal').textContent = '0.00';
        
        // Reset table selection
        document.getElementById('tableSelect').value = '';
        document.querySelector('.btn-place-order').disabled = true;
        
        // Reload tables to update their status
        loadTables();
    } catch (error) {
        console.error('Error placing order:', error);
        alert('Failed to place order. Please try again.');
    }
} 