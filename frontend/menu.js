// Menu items will be fetched from the backend
let items = [];

// Cache DOM elements
const itemList = document.getElementById('itemList');
const searchBox = document.getElementById('searchBox');
const cartTotal = document.getElementById('cartTotal');
const cartCount = document.getElementById('cartCount');
const cartItems = document.querySelector('.cart-items');
const clearCartBtn = document.querySelector('.clear-cart');
const checkoutBtn = document.querySelector('.checkout');

// State management
let filters = {
  'veg': true,
  'non-veg': true,
  'drink': true
};

let cart = new Map();

// Fetch menu items from the backend
async function fetchMenuItems() {
  try {
    const response = await fetch('http://localhost:3000/api/menu');
    if (!response.ok) {
      throw new Error('Failed to fetch menu items');
    }
    items = await response.json();
    renderItems();
  } catch (error) {
    console.error('Error fetching menu items:', error);
    itemList.innerHTML = '<div class="error">Failed to load menu items. Please try again later.</div>';
  }
}

// Debounce function for search
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Render items with improved performance
function renderItems() {
  const query = searchBox.value.toLowerCase();
  const fragment = document.createDocumentFragment();

  items.forEach(item => {
    const isMatch = item.name.toLowerCase().includes(query);
    const isFilterActive = filters[item.tag];
    const cartQuantity = cart.get(item.id) || 0;

    if (isMatch && isFilterActive) {
      const itemEl = document.createElement('div');
      itemEl.classList.add('item');
      itemEl.innerHTML = `
        <div class="item-type ${item.tag}">${item.tag.charAt(0).toUpperCase()}</div>
        <div class="item-details">
          <label>${item.name}</label>
          <p class="item-description">${item.description}</p>
          <div class="item-price">₹${item.price}</div>
        </div>
        <div class="item-controls">
          <button class="quantity-btn minus" data-id="${item.id}">-</button>
          <span class="quantity">${cartQuantity}</span>
          <button class="quantity-btn plus" data-id="${item.id}">+</button>
        </div>
      `;
      fragment.appendChild(itemEl);
    }
  });

  itemList.innerHTML = '';
  itemList.appendChild(fragment);
  updateCartDisplay();
}

// Update cart display
function updateCartDisplay() {
  let total = 0;
  let count = 0;
  
  // Clear cart items display
  if (cartItems) {
    cartItems.innerHTML = '';
  }
  
  cart.forEach((quantity, itemId) => {
    const item = items.find(i => i.id === itemId);
    if (item) {
      total += item.price * quantity;
      count += quantity;
      
      // Add item to cart display
      if (cartItems) {
        const cartItemEl = document.createElement('div');
        cartItemEl.classList.add('cart-item');
        cartItemEl.innerHTML = `
          <div class="cart-item-details">
            <span class="cart-item-name">${item.name}</span>
            <span class="cart-item-price">₹${item.price} × ${quantity}</span>
          </div>
          <div class="cart-item-total">₹${item.price * quantity}</div>
        `;
        cartItems.appendChild(cartItemEl);
      }
    }
  });

  if (cartTotal) cartTotal.textContent = `₹${total}`;
  if (cartCount) cartCount.textContent = count;
}

// Toggle filter buttons
function toggleButton(btnId, key) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  
  filters[key] = !filters[key];
  btn.classList.toggle('active');
  
  // Update "All" button state
  const allBtn = document.getElementById('allBtn');
  if (allBtn) {
    const allActive = Object.values(filters).every(value => value === true);
    if (allActive) {
      allBtn.classList.add('active');
    } else {
      allBtn.classList.remove('active');
    }
  }
  
  renderItems();
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  // Filter buttons
  const vegBtn = document.getElementById('vegBtn');
  const nonVegBtn = document.getElementById('nonVegBtn');
  const drinksBtn = document.getElementById('drinksBtn');
  const allBtn = document.getElementById('allBtn');
  
  if (vegBtn) vegBtn.addEventListener('click', () => toggleButton('vegBtn', 'veg'));
  if (nonVegBtn) nonVegBtn.addEventListener('click', () => toggleButton('nonVegBtn', 'non-veg'));
  if (drinksBtn) drinksBtn.addEventListener('click', () => toggleButton('drinksBtn', 'drink'));
  
  if (allBtn) {
    allBtn.addEventListener('click', () => {
      // Check if all filters are already active
      const allActive = Object.values(filters).every(value => value === true);
      
      if (allActive) {
        // If all are active, deactivate all
        filters = { 'veg': false, 'non-veg': false, 'drink': false };
        ['vegBtn', 'nonVegBtn', 'drinksBtn', 'allBtn'].forEach(id => {
          const btn = document.getElementById(id);
          if (btn) btn.classList.remove('active');
        });
      } else {
        // Otherwise, activate all
        filters = { 'veg': true, 'non-veg': true, 'drink': true };
        ['vegBtn', 'nonVegBtn', 'drinksBtn', 'allBtn'].forEach(id => {
          const btn = document.getElementById(id);
          if (btn) btn.classList.add('active');
        });
      }
      
      renderItems();
    });
  }
  
  // Search functionality
  if (searchBox) {
    searchBox.addEventListener('input', debounce(renderItems, 300));
  }
  
  // Cart functionality
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('quantity-btn')) {
      const itemId = parseInt(e.target.dataset.id);
      const isPlus = e.target.classList.contains('plus');
      
      if (isPlus) {
        cart.set(itemId, (cart.get(itemId) || 0) + 1);
      } else {
        const currentQuantity = cart.get(itemId) || 0;
        if (currentQuantity > 0) {
          cart.set(itemId, currentQuantity - 1);
          if (currentQuantity === 1) cart.delete(itemId);
        }
      }
      
      renderItems();
    }
  });
  
  // Clear cart
  if (clearCartBtn) {
    clearCartBtn.addEventListener('click', () => {
      cart.clear();
      renderItems();
    });
  }
  
  // Checkout
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', async () => {
      if (cart.size === 0) {
        alert('Your cart is empty!');
        return;
      }
      
      try {
        // Get the current user's ID from localStorage or session
        const userId = localStorage.getItem('userId');
        if (!userId) {
          alert('Please login to place an order');
          return;
        }

        // Prepare order items
        const orderItems = Array.from(cart.entries()).map(([itemId, quantity]) => {
          const item = items.find(i => i.id === itemId);
          return {
            id: itemId,
            quantity: quantity,
            price: item.price
          };
        });

        // Calculate total amount
        const totalAmount = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        // Send order to backend
        const response = await fetch('http://localhost:3000/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: parseInt(userId),
            items: orderItems,
            totalAmount: totalAmount
          })
        });

        if (!response.ok) {
          throw new Error('Failed to place order');
        }

        const result = await response.json();
        alert('Order placed successfully! Order ID: ' + result.orderId);
        cart.clear();
        renderItems();
      } catch (error) {
        console.error('Error placing order:', error);
        alert('Failed to place order. Please try again later.');
      }
    });
  }
  
  // Fetch menu items when the page loads
  fetchMenuItems();
});
