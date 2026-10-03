const storageKeys = {
  cart: 'roastedCoffeeCart',
  favorites: 'roastedCoffeeFavorites',
  user: 'roastedCoffeeUser',
  reviews: 'roastedCoffeeReviews',
};

const readStorage = (key, fallback = []) => {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
};

const writeStorage = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const getCart = () => readStorage(storageKeys.cart);
const getFavorites = () => readStorage(storageKeys.favorites);
const getReviews = () => readStorage(storageKeys.reviews);

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}[character]));

const updateCartCount = () => {
  const count = getCart().reduce((total, item) => total + (Number(item.quantity) || 0), 0);
  document.querySelectorAll('.cart-count').forEach((badge) => {
    badge.textContent = count;
  });
};

const updateFavoriteButtons = () => {
  const favorites = getFavorites();
  document.querySelectorAll('[data-favorite]').forEach((button) => {
    const isFavorite = favorites.includes(button.dataset.favorite);
    button.classList.toggle('is-favorite', isFavorite);
    button.setAttribute('aria-pressed', isFavorite);
    button.textContent = isFavorite ? '♥ Saved' : '♡ Save';
  });
};

const favoriteCatalog = {
  'ethiopian-bloom': { name: 'Ethiopian Bloom', meta: 'Blueberry · Jasmine · $22.00' },
  'golden-hour': { name: 'Golden Hour', meta: 'Caramel · Almond · $18.00' },
  'sumatra-night': { name: 'Sumatra Night', meta: 'Cocoa · Molasses · $24.00' },
  'morning-set': { name: 'Morning Set', meta: 'Coffee + cup + filters · $42.00' },
  'origin-trio': { name: 'Origin Trio', meta: 'Three origins · $48.00' },
  'weekend-ritual': { name: 'Weekend Ritual', meta: 'Pour-over kit · $64.00' },
};

const renderFavorites = () => {
  const list = document.querySelector('[data-favorites-list]');
  if (!list) return;

  const favorites = getFavorites();
  list.innerHTML = '';

  if (!favorites.length) {
    list.innerHTML = '<p class="muted text-copy leading-relaxed text-muted">You have not saved any coffee yet. <a class="transition hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" href="catalog.html">Explore the catalog -&gt;</a></p>';
    return;
  }

  favorites.forEach((id) => {
    const item = favoriteCatalog[id];
    if (!item) return;
    const card = document.createElement('div');
    card.className = 'saved-item flex items-center gap-4 border border-border bg-white p-4';
    card.innerHTML = `<div class="product-art mb-0 flex h-16 w-16 shrink-0 items-center justify-center bg-coffee-art text-base text-accent">Coffee</div><div class="min-w-0"><strong>${escapeHtml(item.name)}</strong><p class="muted text-copy leading-relaxed text-muted">${escapeHtml(item.meta)}</p><button class="text-button min-h-11 px-2 text-xs text-accent transition hover:text-brown focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" type="button" data-favorite="${escapeHtml(id)}">Remove from saved</button></div>`;
    list.appendChild(card);
    card.querySelector('[data-favorite]').addEventListener('click', () => {
      toggleFavorite(id);
      renderFavorites();
    });
  });
};

const addToCart = (item) => {
  const cart = getCart();
  const existing = cart.find((cartItem) => cartItem.id === item.id);

  if (existing) {
    existing.quantity += item.quantity || 1;
  } else {
    cart.push({ ...item, quantity: item.quantity || 1 });
  }

  writeStorage(storageKeys.cart, cart);
  updateCartCount();
};

const toggleFavorite = (id) => {
  const favorites = getFavorites();
  const nextFavorites = favorites.includes(id)
    ? favorites.filter((favoriteId) => favoriteId !== id)
    : [...favorites, id];

  writeStorage(storageKeys.favorites, nextFavorites);
  updateFavoriteButtons();
};

const updateUserState = () => {
  const user = readStorage(storageKeys.user, null);
  document.querySelectorAll('[data-user-email]').forEach((element) => {
    element.textContent = user?.email || 'Guest';
  });
};

const setupLogin = () => {
  const form = document.querySelector('[data-login-form]');
  if (!form) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const email = form.querySelector('[name="email"]');
    const password = form.querySelector('[name="password"]');
    const message = form.querySelector('[data-login-message]');

    if (!email.checkValidity() || password.value.length < 6) {
      password.setCustomValidity('Password must contain at least 6 characters.');
      form.reportValidity();
      password.setCustomValidity('');
      return;
    }

    writeStorage(storageKeys.user, { email: email.value.trim() });
    if (message) message.hidden = false;
    window.setTimeout(() => { window.location.href = 'account.html'; }, 500);
  });
};

const setupReviews = () => {
  const form = document.querySelector('[data-review-form]');
  const list = document.querySelector('[data-review-list]');
  if (!form || !list) return;

  const renderReviews = () => {
    const reviews = getReviews();
    list.innerHTML = reviews.length ? reviews.map((review) => {
      const rating = Math.max(1, Math.min(5, Math.trunc(Number(review.rating) || 1)));
      return `<article class="review-item border border-border bg-white p-4"><div class="stars mb-1.5 tracking-widest text-accent" aria-label="${rating} out of 5 stars">${'*'.repeat(rating)}</div><strong>${escapeHtml(review.name)}</strong><p class="mt-2 leading-relaxed text-muted">${escapeHtml(review.comment)}</p></article>`;
    }).join('') : '<p class="muted text-copy leading-relaxed text-muted">Be the first to review this blend.</p>';
  };

  renderReviews();
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const reviews = getReviews();
    reviews.unshift({ name: String(data.get('name') || ''), rating: Number(data.get('rating')), comment: String(data.get('comment') || '') });
    writeStorage(storageKeys.reviews, reviews);
    form.reset();
    renderReviews();
  });
};

const renderCart = () => {
  const list = document.querySelector('[data-cart-list]');
  if (!list) return;

  const cart = getCart();
  const emptyState = document.querySelector('[data-cart-empty]');
  const checkoutButton = document.querySelector('[data-checkout-button]');

  list.innerHTML = '';

  if (!cart.length) {
    if (emptyState) emptyState.hidden = false;
    checkoutButton?.setAttribute('aria-disabled', 'true');
    checkoutButton?.classList.add('is-disabled');
    updateCheckoutTotals(0);
    return;
  }

  emptyState.hidden = true;
  checkoutButton?.removeAttribute('aria-disabled');
  checkoutButton?.classList.remove('is-disabled');

  cart.forEach((item) => {
    const row = document.createElement('div');
    row.className = 'cart-item grid grid-cols-[58px_minmax(0,1fr)] items-center gap-4 border-b border-border py-4 sm:grid-cols-[72px_minmax(0,1fr)_85px_auto]';
    row.innerHTML = `
      <div class="cart-item-art flex h-16 items-center justify-center bg-coffee-art text-accent">${escapeHtml(item.art || 'Coffee')}</div>
      <div class="cart-item-info flex min-w-0 flex-col gap-1.5">
        <strong>${escapeHtml(item.name)}</strong>
        <span class="text-xs text-muted">${escapeHtml(item.meta || 'Freshly roasted')}</span>
        <button class="text-button min-h-11 px-2 text-xs text-accent transition hover:text-brown focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" type="button" data-remove-item="${escapeHtml(item.id)}">Remove</button>
      </div>
      <label class="quantity-control col-start-2 text-xs text-muted sm:col-auto">Qty
        <input class="min-h-11 w-16 border border-border-dark px-2 py-1 text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" type="number" min="1" value="${Math.max(1, Number(item.quantity) || 1)}" data-quantity-item="${escapeHtml(item.id)}">
      </label>
      <strong class="col-start-2 break-all sm:col-auto">$${((Number(item.price) || 0) * Math.max(1, Number(item.quantity) || 1)).toFixed(2)}</strong>`;
    list.appendChild(row);
  });

  updateCheckoutTotals(cart.reduce((total, item) => total + item.price * item.quantity, 0));
};

const updateCheckoutTotals = (subtotal) => {
  const delivery = Number(document.querySelector('[name="delivery"]:checked')?.value || 4);
  const deliveryLabel = document.querySelector('[data-delivery-label]');
  const subtotalElement = document.querySelector('[data-subtotal]');
  const deliveryElement = document.querySelector('[data-delivery-price]');
  const totalElement = document.querySelector('[data-total]');

  if (subtotalElement) subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
  if (deliveryElement) deliveryElement.textContent = delivery === 0 ? 'Free' : `$${delivery.toFixed(2)}`;
  if (totalElement) totalElement.textContent = `$${(subtotal + delivery).toFixed(2)}`;
  if (deliveryLabel) {
    deliveryLabel.textContent = delivery === 0 ? 'Pickup - free' : delivery === 9 ? 'Express delivery' : 'Standard delivery';
  }
};

const setupBuilder = () => {
  const builder = document.querySelector('[data-builder]');
  if (!builder) return;

  const steps = [...builder.querySelectorAll('[data-builder-step]')];
  const progress = [...builder.querySelectorAll('[data-progress-step]')];
  let currentStep = 0;
  const selection = { bean: 'Arabica', origin: 'Ethiopia', roast: 'Medium', grind: 'Whole bean', weight: '250g' };

  const renderStep = () => {
    steps.forEach((step, index) => { step.hidden = index !== currentStep; });
    progress.forEach((step, index) => step.classList.toggle('active', index <= currentStep));
  };

  builder.querySelectorAll('[data-builder-option]').forEach((button) => {
    button.addEventListener('click', () => {
      const group = button.closest('[data-builder-group]');
      group?.querySelectorAll('[data-builder-option]').forEach((item) => item.classList.remove('selected'));
      button.classList.add('selected');
      selection[button.dataset.builderOption] = button.dataset.value;
      builder.querySelectorAll(`[data-selection="${button.dataset.builderOption}"]`).forEach((output) => {
        output.textContent = button.dataset.value;
      });
    });
  });

  builder.querySelectorAll('[data-builder-next]').forEach((button) => {
    button.addEventListener('click', () => {
      if (currentStep < steps.length - 1) currentStep += 1;
      renderStep();
    });
  });

  builder.querySelectorAll('[data-builder-back]').forEach((button) => {
    button.addEventListener('click', () => {
      if (currentStep > 0) currentStep -= 1;
      renderStep();
    });
  });

  builder.querySelector('[data-builder-add]')?.addEventListener('click', () => {
    addToCart({
      id: `custom-${Date.now()}`,
      name: 'Morning Ritual Custom Blend',
      price: 18,
      meta: `${selection.origin} · ${selection.roast} · ${selection.grind} · ${selection.weight}`,
      art: 'Blend',
    });
    const message = builder.querySelector('[data-builder-message]');
    if (message) message.hidden = false;
  });

  renderStep();
};

const setupCheckout = () => {
  const form = document.querySelector('[data-checkout-form]');
  if (!form) return;

  const steps = [...form.querySelectorAll('[data-checkout-step]')];
  const progress = [...document.querySelectorAll('[data-checkout-progress]')];
  const message = form.querySelector('[data-checkout-message]');
  let currentStep = 0;
  form.noValidate = true;

  const renderStep = () => {
    steps.forEach((step, index) => { step.hidden = index !== currentStep; });
    progress.forEach((item, index) => {
      item.classList.toggle('active', index === currentStep);
      item.toggleAttribute('data-complete', index < currentStep);
      if (index === currentStep) item.setAttribute('aria-current', 'step');
      else item.removeAttribute('aria-current');
    });
    const heading = steps[currentStep].querySelector('[data-checkout-heading]');
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    heading?.focus({ preventScroll: true });
  };

  const validateCurrentStep = () => {
    const controls = [...steps[currentStep].querySelectorAll('input, select, textarea')];
    const invalidControl = controls.find((control) => !control.checkValidity());
    if (invalidControl) {
      invalidControl.reportValidity();
      return false;
    }
    return true;
  };

  const advance = () => {
    if (!validateCurrentStep()) return false;
    if (currentStep < steps.length - 1) {
      currentStep += 1;
      renderStep();
    }
    return true;
  };

  form.querySelectorAll('[data-checkout-next]').forEach((button) => {
    button.addEventListener('click', advance);
  });
  form.querySelectorAll('[data-checkout-back]').forEach((button) => {
    button.addEventListener('click', () => {
      if (currentStep > 0) {
        currentStep -= 1;
        renderStep();
      }
    });
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (currentStep < steps.length - 1) {
      advance();
      return;
    }
    if (!validateCurrentStep()) return;
    if (!getCart().length) {
      if (message) {
        message.hidden = false;
        message.focus();
      }
      return;
    }
    window.location.assign(form.action);
  });

  renderStep();
};

const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.main-nav');
if (menuButton && navigation) {
  menuButton.setAttribute('aria-expanded', String(navigation.classList.contains('open')));
  menuButton.addEventListener('click', () => {
    const isOpen = navigation.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(isOpen));
    menuButton.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
  });
}

document.addEventListener('click', (event) => {
  const checkoutControl = event.target.closest('[data-checkout-button]');
  if (!checkoutControl || getCart().length) return;
  event.preventDefault();
  const message = document.querySelector('[data-checkout-message]');
  if (message) {
    message.hidden = false;
    message.focus();
  }
});

document.querySelectorAll('.choice, .option').forEach((button) => {
  button.setAttribute('aria-pressed', String(button.classList.contains('active') || button.classList.contains('selected')));
  button.addEventListener('click', () => {
    button.closest('.choice-row, .option-grid')?.querySelectorAll('.choice, .option').forEach((item) => item.classList.remove('active', 'selected'));
    button.classList.add(button.classList.contains('option') ? 'selected' : 'active');
    button.closest('.choice-row, .option-grid')?.querySelectorAll('.choice, .option').forEach((item) => {
      item.setAttribute('aria-pressed', String(item === button));
    });
  });
});

document.querySelectorAll('[data-favorite]').forEach((button) => {
  button.addEventListener('click', () => toggleFavorite(button.dataset.favorite));
});

document.querySelectorAll('[data-add-cart]').forEach((button) => {
  button.addEventListener('click', () => {
    const weight = document.querySelector('[name="weight"]');
    const grind = document.querySelector('[name="grind"]');
    const weightLabel = weight?.selectedOptions[0]?.textContent.split(' - ')[0];
    const price = weight?.selectedOptions[0]?.textContent.match(/\$(\d+(?:\.\d{2})?)/)?.[1];
    const baseMeta = button.dataset.meta.split(' · ').slice(0, 2).join(' · ');
    addToCart({
      id: button.dataset.addCart,
      name: button.dataset.name,
      price: Number(price || button.dataset.price),
      meta: weightLabel && grind ? `${baseMeta} · ${grind.value} · ${weightLabel}` : button.dataset.meta,
      art: button.dataset.art,
    });
    button.textContent = 'Added ✓';
  });
});

document.addEventListener('click', (event) => {
  const removeButton = event.target.closest('[data-remove-item]');
  if (!removeButton) return;
  writeStorage(storageKeys.cart, getCart().filter((item) => item.id !== removeButton.dataset.removeItem));
  renderCart();
  updateCartCount();
});

document.addEventListener('change', (event) => {
  const quantityInput = event.target.closest('[data-quantity-item]');
  if (!quantityInput) return;
  const cart = getCart();
  const item = cart.find((cartItem) => cartItem.id === quantityInput.dataset.quantityItem);
  if (item) item.quantity = Math.max(1, Number(quantityInput.value));
  writeStorage(storageKeys.cart, cart);
  renderCart();
  updateCartCount();
});

document.querySelectorAll('[name="delivery"]').forEach((radio) => {
  radio.addEventListener('change', () => updateCheckoutTotals(getCart().reduce((total, item) => total + item.price * item.quantity, 0)));
});

document.querySelector('[name="delivery"]')?.closest('form')?.addEventListener('change', (event) => {
  if (event.target.name !== 'delivery') return;
  const location = document.querySelector('[name="delivery-location"]');
  const address = document.querySelector('[name="address"]');
  if (!location) return;
  const pickup = event.target.value === '0';
  const locationField = location.closest('.field');
  if (locationField) locationField.hidden = !pickup;
  location.required = pickup;
  if (address) {
    address.placeholder = pickup ? 'Optional when picking up' : 'Street and number';
    address.required = !pickup;
  }
});

document.querySelectorAll('form').forEach((form) => {
  form.addEventListener('submit', (event) => {
    if (form.getAttribute('action')) return;
    event.preventDefault();
    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) { submitButton.textContent = 'Sent'; submitButton.disabled = true; }
  });
});

document.querySelector('[data-logout]')?.addEventListener('click', () => {
  localStorage.removeItem(storageKeys.user);
  window.location.href = 'login.html';
});

const quiz = document.querySelector('[data-quiz]');
if (quiz) {
  const questions = [...quiz.querySelectorAll('[data-question]')];
  const nextButton = quiz.querySelector('[data-next]');
  const result = quiz.querySelector('[data-result]');
  let currentQuestion = 0;
  const answers = Array(questions.length).fill('');
  const renderQuestion = () => {
    questions.forEach((question, index) => { question.hidden = index !== currentQuestion; });
    nextButton.disabled = !answers[currentQuestion];
  };
  questions.forEach((question, index) => {
    question.querySelectorAll('.option').forEach((button) => {
      button.setAttribute('aria-pressed', 'false');
      button.addEventListener('click', () => {
        answers[index] = button.textContent.trim();
        question.querySelectorAll('.option').forEach((option) => option.setAttribute('aria-pressed', String(option === button)));
        nextButton.disabled = false;
      });
    });
  });
  renderQuestion();
  nextButton?.addEventListener('click', () => {
    if (currentQuestion < questions.length - 1) { currentQuestion += 1; renderQuestion(); return; }
    questions.forEach((question) => { question.hidden = true; });
    const recommendation = answers[0].toLowerCase().includes('fruity')
      ? 'Ethiopian Bloom'
      : answers[0].toLowerCase().includes('spiced') ? 'Sumatra Night' : 'Golden Hour';
    const recommendationHeading = result.querySelector('h2');
    if (recommendationHeading) recommendationHeading.innerHTML = `Your match: <span class="text-accent">${escapeHtml(recommendation)}</span>`;
    result.hidden = false;
    nextButton.hidden = true;
  });
}

updateCartCount();
updateFavoriteButtons();
renderFavorites();
renderCart();
setupBuilder();
setupCheckout();
setupLogin();
setupReviews();
updateUserState();

document.querySelectorAll('[data-filter]').forEach((filterButton) => {
  filterButton.addEventListener('click', () => {
    document.querySelectorAll('[data-filter]').forEach((button) => button.classList.remove('active'));
    filterButton.classList.add('active');
    const filter = filterButton.dataset.filter;

    applyCatalogFilters(filter);
  });
});

const applyCatalogFilters = (roastFilter = document.querySelector('[data-filter].active')?.dataset.filter || 'all') => {
  const query = new URLSearchParams(window.location.search).get('q')?.trim().toLowerCase() || '';
  document.querySelectorAll('.product-card').forEach((product) => {
    const matchesRoast = roastFilter === 'all' || product.dataset.roast === roastFilter;
    const matchesQuery = !query || product.textContent.toLowerCase().includes(query);
    product.hidden = !matchesRoast || !matchesQuery;
  });
};

if (document.querySelector('[data-filter]')) applyCatalogFilters();
