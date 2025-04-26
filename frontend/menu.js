const items = [
  { name: 'veggie spring rolls(4pcs)', tag: 'veg' },
  { name: 'paneer tikka dry', tag: 'veg' },
  { name: 'french fries', tag: 'veg' },
  { name: 'chicken 65 (dry/gravy)', tag: 'non-veg' },
  { name: 'chicken spring rolls (4 pcs)', tag: 'non-veg' },
  { name: 'egg bonda (2 pcs)', tag: 'non-veg' },
  { name: 'veg club sandwich', tag: 'veg' },
  { name: 'veggie burger', tag: 'veg' },
  { name: 'chicken club sandwich', tag: 'non-veg' },
  { name: 'chicken burger', tag: 'non-veg' },
  { name: 'coffee', tag: 'drink' },
  { name: 'cold drink', tag: 'drink' }
];

const itemList = document.getElementById('itemList');
const searchBox = document.getElementById('searchBox');

let filters = {
  'veg': false,
  'non-veg': false,
  'drink': false
};

function renderItems() {
  const query = searchBox.value.toLowerCase();
  itemList.innerHTML = '';

  items.forEach(item => {
    const isMatch = item.name.toLowerCase().includes(query);
    const isFilterActive = filters[item.tag];

    if (isMatch && isFilterActive) {
      const itemEl = document.createElement('div');
      itemEl.classList.add('item');
      itemEl.innerHTML = `
        <div class="item-type">${item.tag.charAt(0).toUpperCase()}</div>
        <label>${item.name}</label>
        <input type="checkbox" checked>
      `;
      itemList.appendChild(itemEl);
    }
  });
}

function toggleButton(btnId, key) {
  const btn = document.getElementById(btnId);
  filters[key] = !filters[key];
  btn.classList.toggle('active');
  renderItems();
}

document.getElementById('vegBtn').addEventListener('click', () => toggleButton('vegBtn', 'veg'));
document.getElementById('nonVegBtn').addEventListener('click', () => toggleButton('nonVegBtn', 'non-veg'));
document.getElementById('drinksBtn').addEventListener('click', () => toggleButton('drinksBtn', 'drink'));

document.getElementById('allBtn').addEventListener('click', () => {
  filters = { 'veg': true, 'non-veg': true, 'drink': true };
  ['vegBtn', 'nonVegBtn', 'drinksBtn'].forEach(id => document.getElementById(id).classList.add('active'));
  renderItems();
});

searchBox.addEventListener('input', renderItems);

document.getElementById('addItemBtn').addEventListener('click', () => {
  const newItemName = prompt("Enter new item name:");
  if (newItemName) {
    let tag = 'veg'; // default tag
    if (newItemName.toLowerCase().includes('chicken') || newItemName.toLowerCase().includes('egg')) {
      tag = 'non-veg';
    } else if (newItemName.toLowerCase().includes('coffee') || newItemName.toLowerCase().includes('drink')) {
      tag = 'drink';
    }

    items.push({ name: newItemName, tag: tag });
    renderItems();
  }
});

renderItems();
