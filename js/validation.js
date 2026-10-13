const REGEX_EMAIL = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const REGEX_PHONE = /^\+380\d{9}$/;

const feedbackForm = document.getElementById('feedbackForm');

if (feedbackForm) {
  const fields = [
    document.getElementById('username'),
    document.getElementById('email'),
    document.getElementById('phone'),
    document.getElementById('message'),
    document.getElementById('agreement')
  ];
  const phone = document.getElementById('phone');
  const phoneHint = document.getElementById('phoneHint');
  const submitButton = document.getElementById('feedbackSubmit');
  const overlay = document.getElementById('successOverlay');
  const closeButton = document.getElementById('closeSuccess');
  let dialogOpen = false;
  let previousBodyOverflow = '';

  function getErrorElement(field) {
    const errorId = field.id === 'username' ? 'nameError' : `${field.id}Error`;
    return document.getElementById(errorId);
  }

  function validateName(field) {
    const length = Array.from(field.value.trim()).length;
    return length >= 2 && length <= 50 ? '' : 'Please enter a name using 2 to 50 characters.';
  }

  function validateEmail(field) {
    return REGEX_EMAIL.test(field.value.trim()) ? '' : 'Please enter a valid email address.';
  }

  function validatePhone(field) {
    return REGEX_PHONE.test(field.value.trim()) ? '' : 'Enter a phone number in the format +380 followed by 9 digits.';
  }

  function validateMessage(field) {
    return field.value.trim().length >= 10 ? '' : 'Please enter a message of at least 10 characters.';
  }

  function validateAgreement(field) {
    return field.checked ? '' : 'Please agree before sending your message.';
  }

  function clearError(field) {
    const error = getErrorElement(field);
    error.textContent = '';
    error.classList.add('hidden');
    field.setAttribute('aria-invalid', 'false');
    field.classList.remove('border-red-500', 'border-green-500');
    field.classList.add('border-border-dark');
  }

  function showError(field, message) {
    const error = getErrorElement(field);
    error.textContent = message;
    error.classList.remove('hidden');
    field.setAttribute('aria-invalid', 'true');
    field.classList.remove('border-border-dark', 'border-green-500');
    field.classList.add('border-red-500');
  }

  function showSuccess(field) {
    clearError(field);
    field.classList.remove('border-border-dark', 'border-red-500');
    field.classList.add('border-green-500');
  }

  function validateField(field) {
    let error = '';
    switch (field.id) {
      case 'username':
        error = validateName(field);
        break;
      case 'email':
        error = validateEmail(field);
        break;
      case 'phone':
        error = validatePhone(field);
        break;
      case 'message':
        error = validateMessage(field);
        break;
      case 'agreement':
        error = validateAgreement(field);
        break;
      default:
        return false;
    }

    if (error) {
      showError(field, error);
      return false;
    }
    showSuccess(field);
    return true;
  }

  function normalizePhone() {
    const value = phone.value.trim();
    if (/^0\d{9}$/.test(value)) {
      phone.value = `+380${value.slice(1)}`;
    } else if (/^380\d{9}$/.test(value)) {
      phone.value = `+${value}`;
    } else {
      return;
    }
    phoneHint.textContent = 'We formatted your number to +380…';
    phoneHint.classList.remove('hidden');
    validateField(phone);
  }

  function resetFieldStates() {
    fields.forEach((field) => clearError(field));
    phoneHint.textContent = '';
    phoneHint.classList.add('hidden');
  }

  function openDialog() {
    dialogOpen = true;
    overlay.hidden = false;
    submitButton.disabled = true;
    previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButton.focus();
  }

  function closeDialog() {
    if (!dialogOpen) return;
    dialogOpen = false;
    overlay.hidden = true;
    submitButton.disabled = false;
    document.body.style.overflow = previousBodyOverflow;
    submitButton.focus();
  }

  fields.forEach((field) => {
    if (field.id === 'agreement') {
      field.addEventListener('change', () => validateField(field));
      return;
    }
    field.addEventListener('input', () => {
      if (field === phone) {
        field.value = field.value.replace(/\p{L}/gu, '');
        phoneHint.textContent = '';
        phoneHint.classList.add('hidden');
      }
      validateField(field);
    });
    field.addEventListener('blur', () => {
      if (field === phone) normalizePhone();
      validateField(field);
    });
  });

  feedbackForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (dialogOpen) return;

    let firstInvalidField = null;
    fields.forEach((field) => {
      if (!validateField(field) && !firstInvalidField) firstInvalidField = field;
    });

    if (firstInvalidField) {
      firstInvalidField.focus();
      return;
    }

    feedbackForm.reset();
    resetFieldStates();
    openDialog();
  });

  closeButton.addEventListener('click', closeDialog);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) closeDialog();
  });

  document.addEventListener('keydown', (event) => {
    if (!dialogOpen) return;
    if (event.key === 'Escape') {
      closeDialog();
      return;
    }
    if (event.key !== 'Tab') return;

    const focusableElements = overlay.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  });
}
