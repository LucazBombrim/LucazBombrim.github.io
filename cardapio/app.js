(() => {
  'use strict';
  const data = window.LOLLO_MENU;
  const order = window.LOLLO_ORDER;
  if (!data || !Array.isArray(data.products) || !order) return;
  const byId = new Map(data.products.map(product => [product.id, product]));
  const categoryById = new Map(data.categories.map(category => [category.id, category]));
  const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const normalize = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const icons = {
    star:'<path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z"/>',
    cake:'<path d="M4 14h16v7H4zM6 9h12v5H6zm6 0V5m0-2v1M4 17q2 3 4 0t4 0t4 0t4 0"/>',
    coffee:'<path d="M5 8h12v8a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4Zm12 2h2a3 3 0 0 1 0 6h-2M3 22h16M8 5V2m4 3V2"/>',
    pastry:'<path d="M5 9c3-5 11-5 14 0l-2 9H7Zm-2 1 4 8H4l-2-5Zm18 0-4 8h3l2-5ZM9 7l1 11m5-11-1 11"/>',
    burger:'<path d="M3 10a9 7 0 0 1 18 0Zm0 4h18M4 18h16v3H4zM8 6h.01M12 4h.01M16 6h.01"/>',
    plate:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/>',
    leaf:'<path d="M20 4c-7-1-15 1-15 8 0 5 5 8 9 5 5-3 6-7 6-13ZM4 21l12-12"/>',
    glass:'<path d="M7 3h10l-1 18H8ZM6 8h12M13 3l3-2"/>',
    grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    expand:'<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
  };
  const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name] || icons.plate}</svg>`;
  const elements = {
    categories: document.getElementById('category-navigation'),
    subgroups: document.getElementById('subgroup-navigation'),
    grid: document.getElementById('product-grid'),
    title: document.getElementById('category-title'),
    description: document.getElementById('category-description'),
    count: document.getElementById('results-count'),
    search: document.getElementById('menu-search'),
    clear: document.getElementById('clear-search'),
    empty: document.getElementById('empty-state'),
    more: document.getElementById('load-more'),
    dialog: document.getElementById('product-dialog'),
  };
  const params = new URLSearchParams(location.search);
  const initialCategory = params.get('categoria');
  const initialQuery = (params.get('q') || '').slice(0, 200);
  const state = { category: categoryById.has(initialCategory) || initialCategory === 'todos' ? initialCategory : 'destaques', subgroup: 'all', query: initialQuery, limit: 12 };
  elements.search.value = initialQuery;
  let opener = null;
  let toastTimer;
  let dialogProduct = null;
  let cartAfterDialog = false;
  let cart = [];
  let orderNotes = '';
  const storageKey = 'lollo-cake-demo-order-v1';
  const cartElements = {
    toggle: document.getElementById('cart-toggle'),
    panel: document.getElementById('cart-panel'),
    items: document.getElementById('cart-items'),
    empty: document.getElementById('cart-empty'),
    count: document.getElementById('cart-count'),
    total: document.getElementById('cart-total'),
    totalLabel: document.getElementById('cart-total-label'),
    checkout: document.getElementById('cart-checkout'),
    notes: document.getElementById('order-notes'),
    notesWrap: document.getElementById('order-notes-wrap'),
    clear: document.getElementById('cart-clear'),
    weightNote: document.getElementById('cart-weight-note'),
  };
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
    cart = order.sanitizeCart(saved?.lines, data.products);
    orderNotes = typeof saved?.notes === 'string' ? saved.notes.slice(0, 1000) : '';
  } catch (_) { /* Ordering still works when device storage is unavailable. */ }
  cartElements.notes.value = orderNotes;
  const searchIndex = new Map(data.products.map(product => [product.id, normalize([product.name, product.originalName, product.description, product.subgroup, categoryById.get(product.category)?.name].join(' '))]));

  function categoriesMarkup() {
    const all = [{ id: 'destaques', short: 'Destaques', icon: 'star' }, ...data.categories, { id: 'todos', short: 'Todos', icon: 'grid' }];
    elements.categories.innerHTML = all.map(category => `<button type="button" class="category-button" data-category="${category.id}" aria-pressed="${state.category === category.id}">${icon(category.icon)}<span>${escape(category.short)}</span></button>`).join('');
  }

  function currentProducts() {
    let products;
    if (state.query) {
      const terms = normalize(state.query).split(/\s+/).filter(Boolean);
      products = data.products.filter(product => terms.every(term => searchIndex.get(product.id).includes(term)));
      if (state.category !== 'destaques' && state.category !== 'todos') products = products.filter(product => product.category === state.category);
    } else if (state.category === 'destaques') {
      products = data.featured.map(id => byId.get(id)).filter(Boolean);
    } else if (state.category === 'todos') {
      products = [...data.products];
    } else {
      products = data.products.filter(product => product.category === state.category);
    }
    if (state.subgroup !== 'all') products = products.filter(product => product.subgroup === state.subgroup);
    if (state.category !== 'destaques' || state.query) {
      products.sort((a, b) => Number(Boolean(b.image)) - Number(Boolean(a.image)) || a.name.localeCompare(b.name, 'pt-BR'));
    }
    return products;
  }

  function subgroupMarkup() {
    if (state.category === 'destaques' || state.category === 'todos') {
      elements.subgroups.hidden = true;
      elements.subgroups.innerHTML = '';
      return;
    }
    const values = [...new Set(data.products.filter(product => product.category === state.category).map(product => product.subgroup))];
    elements.subgroups.hidden = values.length < 2;
    elements.subgroups.innerHTML = ['all', ...values].map(group => `<button type="button" class="subgroup-button" data-subgroup="${escape(group)}" aria-pressed="${state.subgroup === group}">${escape(group === 'all' ? 'Todos' : group)}</button>`).join('');
  }

  function fallback(product) {
    return `<div class="image-fallback">${icon(categoryById.get(product.category).icon)}<span>Sem foto nesta demonstração</span></div>`;
  }

  function productMarkup(product) {
    const category = categoryById.get(product.category);
    return `<article class="product-card" data-product="${product.id}">
      <button type="button" class="product-image-button" data-open="${product.id}" aria-label="Ver detalhes de ${escape(product.name)}">
        ${product.image ? `<img src="${escape(product.image)}" alt="${escape(product.name)}" loading="lazy" decoding="async" width="800" height="600">` : fallback(product)}
        <span class="image-expand">${icon('expand')}</span>
      </button>
      <div class="product-copy"><p class="product-category">${escape(category.short)}</p>
        <h4 class="product-title"><button type="button" data-open="${product.id}">${escape(product.name)}</button></h4>
        ${product.description ? `<p class="product-description">${escape(product.description)}</p>` : ''}
        <div class="product-bottom"><div><div class="product-price">${money.format(product.priceCents / 100)}${product.unit === 'kg' ? '<small>/kg</small>' : ''}</div>${product.unit === 'unidade' ? '<div class="product-unit">Por unidade</div>' : ''}</div><button type="button" class="product-details" data-open="${product.id}">Ver detalhes ↗</button></div>
        <button type="button" class="add-order-button" data-add="${product.id}" aria-label="Adicionar ${escape(product.name)} no pedido">${icon('plus')}<span>Adicionar no pedido</span></button>
      </div></article>`;
  }

  function updateUrl() {
    const next = new URL(location.href);
    if (state.query) next.searchParams.set('q', state.query); else next.searchParams.delete('q');
    if (state.category !== 'destaques') next.searchParams.set('categoria', state.category); else next.searchParams.delete('categoria');
    try { history.replaceState(null, '', next); } catch (_) { /* The menu remains usable in restricted previews. */ }
  }

  function render() {
    const products = currentProducts();
    categoriesMarkup();
    subgroupMarkup();
    if (state.query) {
      elements.title.textContent = 'Resultados da busca';
      elements.description.textContent = `Você buscou por “${state.query}”.`;
    } else if (state.category === 'destaques') {
      elements.title.textContent = 'Destaques da casa';
      elements.description.textContent = 'Uma seleção para começar a explorar.';
    } else if (state.category === 'todos') {
      elements.title.textContent = 'Todo o cardápio';
      elements.description.textContent = 'Explore todos os produtos ou escolha uma categoria.';
    } else {
      elements.title.textContent = categoryById.get(state.category).name;
      elements.description.textContent = categoryById.get(state.category).description;
    }
    elements.count.textContent = `${products.length} ${products.length === 1 ? 'produto' : 'produtos'}`;
    elements.grid.innerHTML = products.slice(0, state.limit).map(productMarkup).join('');
    elements.empty.hidden = products.length > 0;
    elements.more.hidden = products.length <= state.limit;
    if (!elements.more.hidden) elements.more.innerHTML = `Mostrar mais produtos <span>↓</span>`;
    elements.clear.hidden = !state.query;
    updateUrl();
  }

  function selectCategory(category) {
    state.category = category;
    state.subgroup = 'all';
    state.limit = 12;
    state.query = '';
    elements.search.value = '';
    render();
    const selectedButton = elements.categories.querySelector(`[data-category="${category}"]`);
    if (selectedButton) {
      selectedButton.focus({ preventScroll: true });
      if (window.matchMedia('(max-width:560px)').matches) selectedButton.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
  }

  function showProduct(id, trigger) {
    const product = byId.get(id);
    if (!product) return;
    opener = trigger;
    dialogProduct = product;
    closeCart(false);
    const category = categoryById.get(product.category);
    document.getElementById('dialog-title').textContent = product.name;
    document.getElementById('dialog-category').textContent = `${category.name} · ${product.subgroup}`;
    document.getElementById('dialog-price').textContent = money.format(product.priceCents / 100) + (product.unit === 'kg' ? ' /kg' : '');
    document.getElementById('dialog-unit').textContent = product.unit === 'unidade' ? 'Por unidade' : product.unit === 'kg' ? 'Vendido por peso' : '';
    const description = document.getElementById('dialog-description');
    description.textContent = product.description;
    description.hidden = !product.description;
    const photo = document.getElementById('dialog-photo');
    photo.classList.remove('entire-photo');
    photo.innerHTML = product.image ? `<img src="${escape(product.image)}" alt="${escape(product.name)}"><button type="button" data-full-photo aria-pressed="false">${icon('expand')}<span>Ver foto inteira</span></button>` : fallback(product);
    const options = document.getElementById('dialog-options');
    options.hidden = !product.options.length;
    document.getElementById('dialog-options-list').innerHTML = product.options.map((option, index) => `<li><label class="product-option"><input type="checkbox" data-order-option="${index}"><span>${escape(option.name)}</span><span>${option.priceCents ? '+ ' + money.format(option.priceCents / 100) : 'Sem custo'}</span></label></li>`).join('');
    const quantity = document.getElementById('dialog-quantity');
    quantity.min = product.unit === 'kg' ? '0.001' : '1';
    quantity.step = product.unit === 'kg' ? '0.001' : '1';
    quantity.inputMode = product.unit === 'kg' ? 'decimal' : 'numeric';
    quantity.value = product.unit === 'kg' ? '0.1' : '1';
    document.getElementById('dialog-quantity-label').textContent = product.unit === 'kg' ? 'Quantidade (kg)' : 'Quantidade';
    document.getElementById('dialog-weight-note').hidden = product.unit !== 'kg';
    updateDialogEstimate();
    document.body.classList.add('dialog-open');
    elements.dialog.showModal();
    document.getElementById('dialog-close').focus({ preventScroll: true });
  }

  function selectedOptions() {
    return [...elements.dialog.querySelectorAll('[data-order-option]:checked')].map(input => Number(input.dataset.orderOption));
  }

  function updateDialogEstimate() {
    if (!dialogProduct) return;
    const amount = order.parseAmount(dialogProduct, document.getElementById('dialog-quantity').value);
    const indexes = selectedOptions();
    const valid = amount !== null;
    document.getElementById('dialog-add-order').disabled = !valid;
    document.getElementById('dialog-decrease').disabled = !valid || amount <= 1;
    document.getElementById('dialog-order-total').textContent = valid ? money.format(order.lineTotalCents({ amount, optionIndexes: indexes }, dialogProduct) / 100) : '—';
  }

  function persistOrder() {
    try { localStorage.setItem(storageKey, JSON.stringify({ lines: cart, notes: orderNotes })); }
    catch (_) { /* The current order remains available in memory. */ }
  }

  function refreshCheckout() {
    cartElements.checkout.href = '#pedido-demonstrativo';
    cartElements.checkout.setAttribute('aria-disabled', String(!cart.length));
    cartElements.checkout.removeAttribute('target');
    cartElements.checkout.onclick = event => {
      event.preventDefault();
      if (!cart.length) return;
      const message = order.buildMessage(cart, data.products, orderNotes);
      document.getElementById('demo-order-message').textContent = message;
      document.getElementById('demo-order-dialog').showModal();
    };
  }

  function renderCart() {
    cart = order.sanitizeCart(cart, data.products);
    const count = order.itemCount(cart, data.products);
    const weighed = cart.some(line => byId.get(line.productId).unit === 'kg');
    cartElements.count.textContent = String(count);
    cartElements.toggle.setAttribute('aria-label', `Abrir meu pedido, ${count} ${count === 1 ? 'item' : 'itens'}`);
    cartElements.empty.hidden = cart.length > 0;
    cartElements.notesWrap.hidden = !cart.length;
    cartElements.clear.disabled = !cart.length;
    cartElements.weightNote.hidden = !weighed;
    cartElements.totalLabel.textContent = weighed ? 'Total estimado dos produtos' : 'Total dos produtos';
    cartElements.total.textContent = money.format(order.totalCents(cart, data.products) / 100);
    cartElements.items.innerHTML = cart.map(line => {
      const product = byId.get(line.productId);
      const isWeight = product.unit === 'kg';
      const options = line.optionIndexes.map(index => product.options[index].name);
      return `<li class="cart-item" data-cart-line="${escape(line.key)}">
        <div class="cart-item-image">${product.image ? `<img src="${escape(product.image)}" alt="" loading="lazy">` : icon(categoryById.get(product.category).icon)}</div>
        <div class="cart-item-copy"><h3>${escape(product.name)}</h3>
          <p class="cart-item-unit-price">${money.format(order.unitPriceCents(line, product) / 100)}${isWeight ? ' /kg' : ' por unidade'}</p>
          ${options.length ? `<p class="cart-item-options">Adicionais: ${escape(options.join(', '))}</p>` : ''}
          <div class="cart-item-actions"><div class="quantity-control cart-quantity-control"><button type="button" data-cart-action="decrease" aria-label="Diminuir quantidade de ${escape(product.name)}">−</button><input type="number" data-cart-quantity="${escape(line.key)}" min="${isWeight ? '0.001' : '1'}" step="${isWeight ? '0.001' : '1'}" value="${isWeight ? line.amount / 1000 : line.amount}" inputmode="${isWeight ? 'decimal' : 'numeric'}" aria-label="Quantidade de ${escape(product.name)}${isWeight ? ' em kg' : ''}"><button type="button" data-cart-action="increase" aria-label="Aumentar quantidade de ${escape(product.name)}">+</button></div>${isWeight ? '<span class="cart-kg-label">kg</span>' : ''}<button type="button" class="cart-remove" data-cart-action="remove" aria-label="Remover ${escape(product.name)} do pedido">Remover</button></div>
          <strong class="cart-line-total">${money.format(order.lineTotalCents(line, product) / 100)}</strong>
        </div></li>`;
    }).join('');
    refreshCheckout();
  }

  function openCart(focus = true) {
    cartElements.panel.hidden = false;
    cartElements.toggle.setAttribute('aria-expanded', 'true');
    if (focus) document.getElementById('cart-close').focus({ preventScroll: true });
  }

  function closeCart(focus = true) {
    cartElements.panel.hidden = true;
    cartElements.toggle.setAttribute('aria-expanded', 'false');
    if (focus) cartElements.toggle.focus({ preventScroll: true });
  }

  function addProduct(product, amount = 1, options = []) {
    cart = order.addLine(cart, data.products, product.id, amount, options);
    persistOrder();
    renderCart();
    toast(`${product.name} adicionado ao pedido.`);
  }

  elements.categories.addEventListener('click', event => {
    const button = event.target.closest('[data-category]');
    if (button) selectCategory(button.dataset.category);
  });
  elements.subgroups.addEventListener('click', event => {
    const button = event.target.closest('[data-subgroup]');
    if (!button) return;
    state.subgroup = button.dataset.subgroup;
    state.limit = 12;
    render();
    const selected = [...elements.subgroups.querySelectorAll('[data-subgroup]')].find(el => el.dataset.subgroup === state.subgroup);
    selected?.focus({ preventScroll: true });
  });
  elements.search.addEventListener('input', () => {
    state.query = elements.search.value.slice(0, 200);
    state.subgroup = 'all';
    state.limit = 12;
    render();
  });
  elements.clear.addEventListener('click', () => {
    state.query = '';
    elements.search.value = '';
    state.limit = 12;
    render();
    elements.search.focus();
  });
  document.getElementById('reset-search').addEventListener('click', () => selectCategory('destaques'));
  elements.more.addEventListener('click', () => {
    const previousCount = elements.grid.children.length;
    state.limit += 12;
    render();
    const nextCard = elements.grid.children[previousCount];
    nextCard?.querySelector('[data-open]')?.focus({ preventScroll: true });
  });
  elements.grid.addEventListener('click', event => {
    const addButton = event.target.closest('[data-add]');
    if (addButton) {
      const product = byId.get(addButton.dataset.add);
      if (!product) return;
      if (product.unit === 'kg') {
        showProduct(product.id, addButton);
        document.getElementById('dialog-quantity').focus({ preventScroll: true });
      } else {
        addProduct(product);
        openCart(false);
      }
      return;
    }
    const button = event.target.closest('[data-open]');
    if (button) showProduct(button.dataset.open, button);
  });
  document.getElementById('dialog-close').addEventListener('click', () => elements.dialog.close());
  elements.dialog.addEventListener('click', event => {
    const photoButton = event.target.closest('[data-full-photo]');
    if (photoButton) {
      const photo = document.getElementById('dialog-photo');
      const entire = photo.classList.toggle('entire-photo');
      photoButton.setAttribute('aria-pressed', String(entire));
      photoButton.querySelector('span').textContent = entire ? 'Preencher a foto' : 'Ver foto inteira';
    }
    if (event.target === elements.dialog) {
      const rect = elements.dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) elements.dialog.close();
    }
  });
  elements.dialog.addEventListener('close', () => {
    document.body.classList.remove('dialog-open');
    if (cartAfterDialog) { cartAfterDialog = false; openCart(); }
    else if (opener?.isConnected) opener.focus({ preventScroll: true });
  });

  document.getElementById('dialog-quantity').addEventListener('input', updateDialogEstimate);
  document.getElementById('dialog-options-list').addEventListener('change', updateDialogEstimate);
  for (const [id, direction] of [['dialog-decrease', -1], ['dialog-increase', 1]]) {
    document.getElementById(id).addEventListener('click', () => {
      if (!dialogProduct) return;
      const input = document.getElementById('dialog-quantity');
      const amount = order.parseAmount(dialogProduct, input.value);
      if (amount === null) return;
      const next = Math.max(1, amount + direction * (dialogProduct.unit === 'kg' ? 100 : 1));
      input.value = String(dialogProduct.unit === 'kg' ? next / 1000 : next);
      updateDialogEstimate();
    });
  }
  document.getElementById('dialog-add-order').addEventListener('click', () => {
    if (!dialogProduct) return;
    const amount = order.parseAmount(dialogProduct, document.getElementById('dialog-quantity').value);
    if (amount === null) return;
    addProduct(dialogProduct, amount, selectedOptions());
    cartAfterDialog = true;
    elements.dialog.close();
  });
  cartElements.toggle.addEventListener('click', () => cartElements.panel.hidden ? openCart() : closeCart());
  document.getElementById('cart-close').addEventListener('click', () => closeCart());
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !elements.dialog.open && !cartElements.panel.hidden) {
      event.preventDefault();
      closeCart();
    }
  });
  cartElements.items.addEventListener('click', event => {
    const button = event.target.closest('[data-cart-action]');
    const row = button?.closest('[data-cart-line]');
    if (!row) return;
    const key = row.dataset.cartLine;
    const line = cart.find(item => item.key === key);
    if (!line) return;
    const action = button.dataset.cartAction;
    const step = byId.get(line.productId).unit === 'kg' ? 100 : 1;
    cart = action === 'remove' ? order.removeLine(cart, key) : order.changeAmount(cart, data.products, key, Math.max(0, line.amount + (action === 'increase' ? step : -step)));
    persistOrder();
    renderCart();
    const updatedRow = [...cartElements.items.querySelectorAll('[data-cart-line]')].find(element => element.dataset.cartLine === key);
    if (updatedRow) updatedRow.querySelector(`[data-cart-action="${action}"]`)?.focus({ preventScroll: true });
    else document.getElementById('cart-close').focus({ preventScroll: true });
  });
  cartElements.items.addEventListener('change', event => {
    const input = event.target.closest('[data-cart-quantity]');
    if (!input) return;
    const line = cart.find(item => item.key === input.dataset.cartQuantity);
    if (!line) return;
    const product = byId.get(line.productId);
    const amount = order.parseAmount(product, input.value);
    if (amount === null) toast(product.unit === 'kg' ? 'Informe um peso válido em kg, com até três casas decimais.' : 'Informe uma quantidade inteira maior que zero.');
    else cart = order.changeAmount(cart, data.products, line.key, amount);
    persistOrder();
    renderCart();
  });
  cartElements.notes.addEventListener('input', () => {
    orderNotes = cartElements.notes.value.slice(0, 1000);
    persistOrder();
    refreshCheckout();
  });
  cartElements.clear.addEventListener('click', () => {
    cart = [];
    orderNotes = '';
    cartElements.notes.value = '';
    persistOrder();
    renderCart();
    toast('Pedido limpo.');
    document.getElementById('cart-close').focus({ preventScroll: true });
  });
  cartElements.checkout.addEventListener('click', event => {
    if (!cart.length || cartElements.checkout.getAttribute('aria-disabled') === 'true') event.preventDefault();
  });

  function toast(message) {
    const box = document.getElementById('toast');
    box.textContent = message;
    box.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { box.hidden = true; }, 4000);
  }
  document.getElementById('share-menu').addEventListener('click', async () => {
    const url = location.href;
    if (navigator.share) {
      try { await navigator.share({ title: 'Lollo Cake · Cardápio', text: 'Escolha seu próximo favorito na Lollo Cake.', url }); return; }
      catch (error) { if (error.name === 'AbortError') return; }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast('Link do cardápio copiado!');
    } catch (_) {
      toast('Copie o endereço do navegador para compartilhar.');
    }
  });
  render();
  renderCart();
})();
