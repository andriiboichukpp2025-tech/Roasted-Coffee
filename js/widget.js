(() => {
  const coffeeCatalog = Object.freeze({
    'ethiopian-bloom': { name: 'Ethiopian Bloom', price250: 2200 },
    'golden-hour': { name: 'Golden Hour', price250: 1800 },
    'sumatra-night': { name: 'Sumatra Night', price250: 2400 },
  });
  const weightRates = Object.freeze({
    '250g': 1800,
    '500g': 3200,
    '1kg': 5500,
  });
  const deliveryRates = Object.freeze({
    standard: { name: 'Standard', price: 400 },
    express: { name: 'Express', price: 900 },
    pickup: { name: 'Pickup', price: 0 },
  });
  const fieldNames = ['coffee', 'weight', 'quantity', 'delivery', 'first-order'];
  const outputNames = ['coffee', 'discount', 'delivery', 'total'];

  const calculateOrder = (values) => {
    if (!Object.hasOwn(coffeeCatalog, values.coffee)) {
      return { ok: false, field: 'coffee', message: 'Choose one of the available coffees.' };
    }
    if (!Object.hasOwn(weightRates, values.weight)) {
      return { ok: false, field: 'weight', message: 'Choose an available bag size.' };
    }

    const quantityText = values.quantity.trim();
    if (quantityText === '') {
      return { ok: false, field: 'quantity', message: 'Enter a quantity from 1 to 20.' };
    }
    if (!/^-?\d+$/.test(quantityText)) {
      return { ok: false, field: 'quantity', message: 'Enter a whole number of bags.' };
    }

    const quantity = Number(quantityText);
    if (!Number.isFinite(quantity) || !Number.isInteger(quantity)) {
      return { ok: false, field: 'quantity', message: 'Enter a whole number of bags.' };
    }
    if (quantity < 1 || quantity > 20) {
      return { ok: false, field: 'quantity', message: 'Enter a quantity from 1 to 20.' };
    }
    if (!Object.hasOwn(deliveryRates, values.delivery)) {
      return { ok: false, field: 'delivery', message: 'Choose an available delivery method.' };
    }
    if (values['first-order'] !== 'true' && values['first-order'] !== 'false') {
      return { ok: false, field: 'first-order', message: 'Choose whether this is your first order.' };
    }

    const coffee = coffeeCatalog[values.coffee];
    const pricePerBag = Math.round((coffee.price250 * weightRates[values.weight]) / 1800);
    const coffeeTotal = pricePerBag * quantity;
    const shipping = deliveryRates[values.delivery].price;
    const beforeDiscount = coffeeTotal + shipping;
    const discount = values['first-order'] === 'true' ? Math.round(beforeDiscount * 0.1) : 0;
    const total = beforeDiscount - discount;

    if (![pricePerBag, coffeeTotal, shipping, discount, total].every(Number.isSafeInteger)) {
      return { ok: false, field: 'quantity', message: 'This order total is outside the supported range.' };
    }

    return {
      ok: true,
      coffeeName: coffee.name,
      quantity,
      coffeeTotal,
      deliveryName: deliveryRates[values.delivery].name,
      shipping,
      discount,
      total,
    };
  };

  const formatMoney = (cents) => `$${(cents / 100).toFixed(2)}`;

  const initializeWidget = (root, instanceIndex) => {
    const section = root.closest('section') || root;
    const idMap = new Map();
    section.querySelectorAll('[id^="est-"]').forEach((element) => {
      const nextId = `est-${instanceIndex}-${element.id.slice(4)}`;
      idMap.set(element.id, nextId);
      element.id = nextId;
    });
    section.querySelectorAll('[for], [aria-describedby], [aria-labelledby]').forEach((element) => {
      ['for', 'aria-describedby', 'aria-labelledby'].forEach((attribute) => {
        const value = element.getAttribute(attribute);
        if (!value) return;
        element.setAttribute(attribute, value.split(/\s+/).map((id) => idMap.get(id) || id).join(' '));
      });
    });
    section.id = `est-calculator-${instanceIndex}`;

    const fields = {};
    const errors = {};
    const outputs = {};
    const missing = [];

    fieldNames.forEach((name) => {
      fields[name] = root.querySelector(`[data-est-field="${name}"]`);
      if (!fields[name]) {
        missing.push(`field "${name}"`);
        return;
      }
      const describedBy = fields[name].getAttribute('aria-describedby');
      errors[name] = describedBy
        ? [...section.querySelectorAll('[id]')].find((element) => element.id === describedBy) || null
        : null;
      if (!errors[name]) missing.push(`error message for "${name}"`);
    });
    outputNames.forEach((name) => {
      outputs[name] = root.querySelector(`[data-est-output="${name}"]`);
      if (!outputs[name]) missing.push(`result "${name}"`);
    });

    if (missing.length) {
      console.warn(`Order calculator was not initialized: missing ${missing.join(', ')}.`);
      return;
    }

    const touched = new Set();
    const inputValues = () => ({
      coffee: String(fields.coffee.value),
      weight: String(fields.weight.value),
      quantity: String(fields.quantity.value),
      delivery: String(fields.delivery.value),
      'first-order': String(fields['first-order'].checked),
    });

    const updateFieldStates = (result) => {
      fieldNames.forEach((name) => {
        const field = fields[name];
        const error = errors[name];
        const message = result.ok || result.field !== name ? '' : result.message;
        if (touched.has(name) && message) {
          field.setAttribute('aria-invalid', 'true');
          field.classList.remove('border-border-dark', 'border-green-500');
          field.classList.add('border-red-500');
          error.textContent = message;
          error.classList.remove('hidden');
          return;
        }
        field.setAttribute('aria-invalid', 'false');
        field.classList.remove('border-red-500', 'border-green-500');
        field.classList.add('border-border-dark');
        error.textContent = '';
        error.classList.add('hidden');
        if (touched.has(name)) {
          field.classList.remove('border-border-dark');
          field.classList.add('border-green-500');
        }
      });
    };

    const clearOutputs = () => {
      outputNames.forEach((name) => { outputs[name].textContent = '—'; });
    };

    const update = () => {
      const result = calculateOrder(inputValues());
      updateFieldStates(result);
      if (!result.ok) {
        clearOutputs();
        return;
      }
      outputs.coffee.textContent = `${result.coffeeName} × ${result.quantity} · ${formatMoney(result.coffeeTotal)}`;
      outputs.discount.textContent = result.discount ? `-${formatMoney(result.discount)}` : formatMoney(0);
      outputs.delivery.textContent = result.shipping
        ? `${result.deliveryName} · ${formatMoney(result.shipping)}`
        : `${result.deliveryName} · Free`;
      outputs.total.textContent = formatMoney(result.total);
    };

    fields.quantity.addEventListener('input', () => {
      touched.add('quantity');
      update();
    });
    ['coffee', 'weight', 'delivery', 'first-order'].forEach((name) => {
      fields[name].addEventListener('change', () => {
        touched.add(name);
        update();
      });
    });

    update();
  };

  document.querySelectorAll('[data-est-widget]').forEach(initializeWidget);
})();
