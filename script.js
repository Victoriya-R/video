const menuToggle = document.querySelector('.menu-toggle');
const mobileMenu = document.getElementById('mobile-menu');

if (menuToggle && mobileMenu) {
  menuToggle.addEventListener('click', () => {
    const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!isExpanded));
    mobileMenu.hidden = isExpanded;
    mobileMenu.style.display = isExpanded ? 'none' : 'flex';
  });

  mobileMenu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      menuToggle.setAttribute('aria-expanded', 'false');
      mobileMenu.hidden = true;
      mobileMenu.style.display = 'none';
    });
  });
}

const filterButtons = document.querySelectorAll('.filter-btn');
const portfolioCards = document.querySelectorAll('.portfolio-card');

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const filter = button.dataset.filter;

    filterButtons.forEach((btn) => btn.classList.remove('active'));
    button.classList.add('active');

    portfolioCards.forEach((card) => {
      const shouldShow = filter === 'all' || card.dataset.category === filter;
      card.style.display = shouldShow ? 'block' : 'none';
    });
  });
});

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);

document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

document.getElementById('year').textContent = new Date().getFullYear();

const contactForm = document.querySelector('.contact-form');
const formStatus = document.querySelector('.form-status');
const formTimeInput = document.getElementById('form-time');

if (formTimeInput) {
  formTimeInput.value = String(Date.now());
}

const setFormStatus = (message, type) => {
  if (!formStatus) return;
  formStatus.textContent = message;
  formStatus.className = `form-status show ${type === 'success' ? 'is-success' : 'is-error'}`;
};

const getErrorText = (code) => {
  const map = {
    missing_required: 'Заполните обязательные поля: имя, способ связи и тип съемки.',
    spam_detected: 'Отправка отклонена. Пожалуйста, попробуйте снова чуть позже.',
    invalid_request: 'Некорректная отправка формы. Обновите страницу и попробуйте еще раз.',
    server_error: 'Не удалось отправить заявку. Напишите в Telegram или WhatsApp, пока мы исправляем форму.',
  };

  return map[code] || map.server_error;
};

const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('ok') === 'true' || urlParams.get('ok') === '1') {
  setFormStatus('Спасибо! Заявка отправлена. Я свяжусь с вами в ближайшее время.', 'success');
  window.history.replaceState({}, '', `${window.location.pathname}${window.location.hash || '#contacts'}`);
} else if (urlParams.get('error')) {
  setFormStatus(getErrorText(urlParams.get('error')), 'error');
  window.history.replaceState({}, '', `${window.location.pathname}${window.location.hash || '#contacts'}`);
}

contactForm?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const requiredFields = ['name', 'contact', 'type'];
  const hasEmptyRequired = requiredFields.some((fieldName) => {
    const field = contactForm.elements.namedItem(fieldName);
    return !field || !String(field.value || '').trim();
  });

  if (hasEmptyRequired) {
    setFormStatus('Пожалуйста, заполните обязательные поля перед отправкой.', 'error');
    return;
  }

  const submitButton = contactForm.querySelector('button[type="submit"]');
  const initialButtonText = submitButton?.textContent;
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = 'Отправка...';
  }

  try {
    const response = await fetch(contactForm.action, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
      },
      body: new FormData(contactForm),
    });

    const payload = await response.json().catch(() => ({}));
    if (response.ok && payload.ok) {
      setFormStatus('Спасибо! Заявка отправлена. Я свяжусь с вами в ближайшее время.', 'success');
      contactForm.reset();
      if (formTimeInput) {
        formTimeInput.value = String(Date.now());
      }
      return;
    }

    setFormStatus(getErrorText(payload.error), 'error');
  } catch (error) {
    setFormStatus(getErrorText('server_error'), 'error');
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = initialButtonText || 'Отправить заявку';
    }
  }
});
