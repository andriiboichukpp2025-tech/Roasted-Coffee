(async () => {
  const results = [];
  const root = document.querySelector('[data-est-widget]');
  const fieldNames = ['coffee', 'weight', 'quantity', 'delivery', 'first-order'];
  const outputNames = ['coffee', 'discount', 'delivery', 'total'];
  const fail = (message) => { throw new Error(message); };
  const assert = (condition, message) => { if (!condition) fail(message); };

  if (!root) {
    console.table([{ test: 'Widget present', status: 'FAIL', details: 'No [data-est-widget] was found.' }]);
    return;
  }

  const section = root.closest('section');
  const fields = Object.fromEntries(fieldNames.map((name) => [name, root.querySelector(`[data-est-field="${name}"]`)]));
  const outputs = Object.fromEntries(outputNames.map((name) => [name, root.querySelector(`[data-est-output="${name}"]`)]));
  if (fieldNames.some((name) => !fields[name]) || outputNames.some((name) => !outputs[name])) {
    console.table([{ test: 'Widget structure', status: 'FAIL', details: 'A required field or output is missing.' }]);
    return;
  }

  const savedValues = Object.fromEntries(fieldNames.map((name) => [
    name,
    fields[name].type === 'checkbox' ? fields[name].checked : fields[name].value,
  ]));
  const savedTypes = Object.fromEntries(fieldNames.map((name) => [name, fields[name].type]));
  const savedFieldStates = Object.fromEntries(fieldNames.map((name) => [name, {
    className: fields[name].className,
    ariaInvalid: fields[name].getAttribute('aria-invalid'),
    error: section.querySelector(`[id="${fields[name].getAttribute('aria-describedby')}"]`),
  }]));
  const savedErrors = Object.fromEntries(fieldNames.map((name) => {
    const error = savedFieldStates[name].error;
    return [name, error ? { className: error.className, text: error.textContent } : null];
  }));
  const savedOutputs = Object.fromEntries(outputNames.map((name) => [name, outputs[name].textContent]));

  const dispatch = (name) => {
    const type = name === 'quantity' ? 'input' : 'change';
    fields[name].dispatchEvent(new Event(type, { bubbles: true }));
  };
  const setField = (name, value) => {
    if (fields[name].type === 'checkbox') fields[name].checked = value;
    else fields[name].value = value;
    dispatch(name);
  };
  const resetFields = () => {
    fieldNames.forEach((name) => { fields[name].type = savedTypes[name]; });
    fieldNames.forEach((name) => setField(name, savedValues[name]));
  };
  const currentOutputs = () => Object.fromEntries(outputNames.map((name) => [name, outputs[name].textContent]));
  const record = async (test, callback) => {
    try {
      resetFields();
      const details = await callback();
      results.push({ test, status: 'PASS', details: details || '' });
    } catch (error) {
      results.push({ test, status: 'FAIL', details: error instanceof Error ? error.message : String(error) });
    }
  };
  const expectInvalidQuantity = () => {
    assert(fields.quantity.getAttribute('aria-invalid') === 'true', 'Quantity should be marked invalid.');
    assert(outputNames.every((name) => outputs[name].textContent === '—'), 'Invalid input must clear all totals.');
    assert(!savedFieldStates.quantity.error.classList.contains('hidden'), 'The quantity error should be visible.');
  };
  const loadWidgetScript = () => new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = new URL('js/widget.js', document.baseURI).href;
    const finish = (callback, value) => {
      window.clearTimeout(timeout);
      if (value instanceof Error) script.remove();
      callback(value);
    };
    const timeout = window.setTimeout(() => finish(reject, new Error('Timed out loading js/widget.js.')), 7000);
    script.onload = () => finish(resolve, script);
    script.onerror = () => finish(reject, new Error('Unable to load js/widget.js.'));
    document.body.appendChild(script);
  });

  try {
    await record('Valid quantity: 2', () => {
      setField('coffee', 'ethiopian-bloom');
      setField('weight', '250g');
      setField('delivery', 'standard');
      setField('first-order', false);
      setField('quantity', '2');
      assert(outputs.coffee.textContent.endsWith('$44.00') && outputs.total.textContent === '$48.00', 'Expected a $44.00 coffee subtotal and $48.00 total.');
      return JSON.stringify(currentOutputs());
    });

    for (const value of ['', '0', '-5', '2.5', '9999999999999999', '1e309', '<script>alert(1)</script>']) {
      await record(`Reject quantity: ${value || '(empty)'}`, () => {
        const originalType = fields.quantity.type;
        const scriptCount = document.scripts.length;
        try {
          if (value === '1e309' || value.includes('<script>')) fields.quantity.type = 'text';
          setField('quantity', value);
          expectInvalidQuantity();
          if (value.includes('<script>')) {
            assert(document.scripts.length === scriptCount, 'Untrusted text must not create script elements.');
          }
        } finally {
          fields.quantity.type = originalType;
        }
        return fields.quantity.getAttribute('aria-invalid');
      });
    }

    await record('Reject a tampered coffee value', () => {
      fields.coffee.value = 'tampered-value';
      fields.coffee.dispatchEvent(new Event('change', { bubbles: true }));
      assert(fields.coffee.getAttribute('aria-invalid') === 'true', 'A non-allowlisted coffee should be invalid.');
      assert(outputNames.every((name) => outputs[name].textContent === '—'), 'Tampered select input must clear all totals.');
      return 'Rejected by the coffee allowlist.';
    });

    await record('First-order checkbox discount', () => {
      setField('coffee', 'ethiopian-bloom');
      setField('weight', '250g');
      setField('quantity', '1');
      setField('delivery', 'standard');
      setField('first-order', true);
      assert(outputs.discount.textContent === '-$2.60' && outputs.total.textContent === '$23.40', 'Expected a $2.60 discount and $23.40 total.');
      return JSON.stringify(currentOutputs());
    });

    await record('Rapid multi-field changes', () => {
      setField('coffee', 'golden-hour');
      setField('weight', '500g');
      setField('quantity', '2');
      setField('delivery', 'pickup');
      setField('first-order', true);
      assert(outputs.total.textContent === '$57.60', 'Expected the final rapid-change total to be $57.60.');
      return outputs.total.textContent;
    });

    await record('Missing DOM element does not throw', async () => {
      const parent = section.parentNode;
      const next = section.nextSibling;
      const incomplete = document.createElement('div');
      incomplete.setAttribute('data-est-widget', '');
      const runtimeErrors = [];
      const warnings = [];
      const onError = (event) => runtimeErrors.push(event.message);
      const originalWarn = console.warn;
      section.remove();
      document.body.appendChild(incomplete);
      window.addEventListener('error', onError);
      console.warn = (...args) => {
        warnings.push(args.join(' '));
        originalWarn.apply(console, args);
      };
      let script;
      try {
        script = await loadWidgetScript();
      } finally {
        console.warn = originalWarn;
        window.removeEventListener('error', onError);
        incomplete.remove();
        if (section) parent.insertBefore(section, next && next.parentNode === parent ? next : null);
        if (script) script.remove();
      }
      assert(warnings.some((warning) => warning.includes('was not initialized')), 'Expected an initialization warning.');
      assert(runtimeErrors.length === 0, `Unexpected runtime errors: ${runtimeErrors.join('; ')}`);
      return 'Warned and skipped the incomplete widget without a runtime exception.';
    });

    await record('Two widget instances stay independent', async () => {
      const parent = section.parentNode;
      const next = section.nextSibling;
      const firstClone = section.cloneNode(true);
      const secondClone = section.cloneNode(true);
      section.remove();
      parent.insertBefore(firstClone, next && next.parentNode === parent ? next : null);
      parent.insertBefore(secondClone, next && next.parentNode === parent ? next : null);
      let script;
      try {
        script = await loadWidgetScript();
        const clones = [...document.querySelectorAll('[data-est-widget]')];
        assert(clones.length === 2, 'Expected exactly two test widget instances.');
        const setCloneField = (clone, name, value) => {
          const field = clone.querySelector(`[data-est-field="${name}"]`);
          if (field.type === 'checkbox') field.checked = value;
          else field.value = value;
          field.dispatchEvent(new Event(name === 'quantity' ? 'input' : 'change', { bubbles: true }));
        };
        setCloneField(clones[0], 'quantity', '2');
        const secondInitial = clones[1].querySelector('[data-est-output="total"]').textContent;
        setCloneField(clones[1], 'coffee', 'golden-hour');
        setCloneField(clones[1], 'weight', '500g');
        setCloneField(clones[1], 'quantity', '2');
        setCloneField(clones[1], 'delivery', 'pickup');
        setCloneField(clones[1], 'first-order', true);
        const firstTotal = clones[0].querySelector('[data-est-output="total"]').textContent;
        const secondTotal = clones[1].querySelector('[data-est-output="total"]').textContent;
        const allIds = [...document.querySelectorAll('[id]')].map((element) => element.id);
        assert(firstTotal === '$48.00' && secondInitial === '$26.00' && secondTotal === '$57.60', 'Widget outputs were not independent.');
        assert(new Set(allIds).size === allIds.length, 'Duplicate IDs were found with two widget instances.');
        return `${firstTotal} / ${secondTotal}; unique IDs.`;
      } finally {
        if (script) script.remove();
        firstClone.remove();
        secondClone.remove();
        if (section) parent.insertBefore(section, next && next.parentNode === parent ? next : null);
      }
    });
  } finally {
    fieldNames.forEach((name) => {
      fields[name].type = savedTypes[name];
      if (fields[name].type === 'checkbox') fields[name].checked = savedValues[name];
      else fields[name].value = savedValues[name];
      dispatch(name);
      fields[name].className = savedFieldStates[name].className;
      if (savedFieldStates[name].ariaInvalid === null) fields[name].removeAttribute('aria-invalid');
      else fields[name].setAttribute('aria-invalid', savedFieldStates[name].ariaInvalid);
      const error = savedFieldStates[name].error;
      if (error && savedErrors[name]) {
        error.className = savedErrors[name].className;
        error.textContent = savedErrors[name].text;
      }
    });
    outputNames.forEach((name) => { outputs[name].textContent = savedOutputs[name]; });
  }

  console.table(results);
})();
