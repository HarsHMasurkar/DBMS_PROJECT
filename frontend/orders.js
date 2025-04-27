// Store cart items
let cart = new Map();

document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Load tables and menu items
    loadTables();
    loadMenuItems();
});

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    window.location.href = 'login.html';
}

async function loadTables() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/tables', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load tables');
        }

        const tables = await response.json();
        const tableSelect = document.getElementById('tableSelect');
        
        // Clear existing options except the first one
        while (tableSelect.options.length > 1) {
            tableSelect.remove(1);
        }

        // Add available tables
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
        alert('Failed to load tables. Please try again later.');
    }
}

async function loadMenuItems() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/menu', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load menu items');
        }

        const menuItems = await response.json();
        displayMenuItems(menuItems);
    } catch (error) {
        console.error('Error loading menu items:', error);
        alert('Failed to load menu items. Please try again later.');
    }
}

function displayMenuItems(items) {
    const menuContainer = document.getElementById('menuItems');
    menuContainer.innerHTML = '';

    items.forEach(item => {
        if (item.availability) {
            const price = parseFloat(item.price);
            const formattedPrice = isNaN(price) ? '0.00' : price.toFixed(2);

            const menuItem = document.createElement('div');
            menuItem.className = 'col-md-6 mb-4';
            menuItem.innerHTML = `
                <div class="card menu-item h-100">
                    <div class="card-body">
                        <span class="badge bg-info category-badge">${item.category}</span>
                        <h5 class="card-title mt-4">${item.name}</h5>
                        <p class="card-text">${item.description || ''}</p>
                        <div class="d-flex justify-content-between align-items-center mt-3">
                            <span class="price">₹${formattedPrice}</span>
                            <div class="quantity-control">
                                <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                                <span class="quantity-display" id="quantity-${item.id}">0</span>
                                <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            menuContainer.appendChild(menuItem);
        }
    });
}

function updateQuantity(itemId, change) {
    const currentQuantity = cart.get(itemId) || 0;
    const newQuantity = Math.max(0, currentQuantity + change);
    
    if (newQuantity === 0) {
        cart.delete(itemId);
    } else {
        cart.set(itemId, newQuantity);
    }
    
    document.getElementById(`quantity-${itemId}`).textContent = newQuantity;
    updateCartDisplay();
}

function updateCartDisplay() {
    const cartItemsContainer = document.getElementById('cartItems');
    cartItemsContainer.innerHTML = '';
    
    let total = 0;
    
    cart.forEach((quantity, itemId) => {
        const menuItem = document.querySelector(`#quantity-${itemId}`).closest('.card');
        const name = menuItem.querySelector('.card-title').textContent;
        const price = parseFloat(menuItem.querySelector('.price').textContent.replace('₹', ''));
        const itemTotal = price * quantity;
        total += itemTotal;
        
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <h6 class="mb-0">${name}</h6>
                    <small class="text-muted">₹${price.toFixed(2)} × ${quantity}</small>
                </div>
                <div class="text-end">
                    <strong>₹${itemTotal.toFixed(2)}</strong>
                </div>
            </div>
        `;
        cartItemsContainer.appendChild(cartItem);
    });
    
    document.getElementById('cartTotal').textContent = total.toFixed(2);
}

async function placeOrder() {
    const tableId = document.getElementById('tableSelect').value;
    if (!tableId) {
        alert('Please select a table');
        return;
    }
    
    if (cart.size === 0) {
        alert('Please add items to your order');
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        const orderItems = Array.from(cart.entries()).map(([itemId, quantity]) => ({
            id: itemId,
            quantity: quantity
        }));
        
        const response = await fetch('http://localhost:3000/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                table_id: tableId,
                items: orderItems
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to place order');
        }
        
        const result = await response.json();
        alert('Order placed successfully!');
        
        // Clear cart and reset quantities
        cart.clear();
        document.querySelectorAll('.quantity-display').forEach(el => el.textContent = '0');
        updateCartDisplay();
        
        // Reload tables to update availability
        loadTables();
    } catch (error) {
        console.error('Error placing order:', error);
        alert('Failed to place order. Please try again later.');
    }
} 