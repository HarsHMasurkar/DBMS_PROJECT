// Menu items with prices and categories
const items = [
  { id: 1, name: 'veggie spring rolls(4pcs)', tag: 'veg', price: 120, description: 'Crispy vegetable spring rolls served with sweet chili sauce' },
  { id: 2, name: 'paneer tikka dry', tag: 'veg', price: 180, description: 'Marinated and grilled cottage cheese' },
  { id: 3, name: 'french fries', tag: 'veg', price: 100, description: 'Crispy golden fries with seasoning' },
  { id: 4, name: 'chicken 65 (dry/gravy)', tag: 'non-veg', price: 220, description: 'Spicy chicken preparation in your choice of style' },
  { id: 5, name: 'chicken spring rolls (4 pcs)', tag: 'non-veg', price: 140, description: 'Crispy chicken spring rolls with dipping sauce' },
  { id: 6, name: 'egg bonda (2 pcs)', tag: 'non-veg', price: 80, description: 'Spiced egg fritters' },
  { id: 7, name: 'veg club sandwich', tag: 'veg', price: 150, description: 'Triple-decker sandwich with fresh vegetables' },
  { id: 8, name: 'veggie burger', tag: 'veg', price: 160, description: 'Plant-based patty with fresh vegetables' },
  { id: 9, name: 'chicken club sandwich', tag: 'non-veg', price: 180, description: 'Triple-decker sandwich with grilled chicken' },
  { id: 10, name: 'chicken burger', tag: 'non-veg', price: 190, description: 'Grilled chicken patty with fresh vegetables' },
  { id: 11, name: 'coffee', tag: 'drink', price: 80, description: 'Freshly brewed coffee' },
  { id: 12, name: 'cold drink', tag: 'drink', price: 60, description: 'Choice of soft drinks' }
];

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
    checkoutBtn.addEventListener('click', () => {
      if (cart.size === 0) {
        alert('Your cart is empty!');
        return;
      }
      
      // Here you would typically redirect to a checkout page
      alert('Proceeding to checkout...');
      console.log('Cart items:', Array.from(cart.entries()));
    });
  }
  
  // Initialize
  renderItems();
});
