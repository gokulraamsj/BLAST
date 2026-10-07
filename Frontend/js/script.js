// ============================================
// BLAST — Symposium Landing Page Scripts
// ============================================

// Point this at your backend. Use the local FastAPI server while testing,
// then swap to your Render URL once deployed (see blast-backend/README.md).
const API_BASE = "https://ominous-succotash-qvvjwgq75xj6hpr6-8000.app.github.dev";

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- LOADER ---------- */
  const loader = document.getElementById('loader');
  window.addEventListener('load', () => {
    setTimeout(() => loader.classList.add('is-hidden'), 600);
  });
  // fallback in case load already fired
  setTimeout(() => loader && loader.classList.add('is-hidden'), 2500);

  /* ---------- STARFIELD CANVAS ---------- */
  const canvas = document.getElementById('starfield');
  const ctx = canvas.getContext('2d');
  let stars = [];

  function resizeCanvas(){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const count = Math.min(160, Math.floor((canvas.width * canvas.height) / 9000));
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.4 + 0.3,
      speed: Math.random() * 0.15 + 0.02,
      alpha: Math.random() * 0.6 + 0.2
    }));
  }

  function drawStars(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(180,210,255,${s.alpha})`;
      ctx.fill();
      s.y += s.speed;
      if (s.y > canvas.height) { s.y = 0; s.x = Math.random() * canvas.width; }
    });
    requestAnimationFrame(drawStars);
  }

  resizeCanvas();
  drawStars();
  window.addEventListener('resize', resizeCanvas);

  /* ---------- NAV: scroll state + mobile menu ---------- */
  const nav = document.getElementById('siteNav');
  const burger = document.getElementById('navBurger');
  const mobileMenu = document.getElementById('navMobile');

  window.addEventListener('scroll', () => {
    nav.classList.toggle('is-scrolled', window.scrollY > 40);
    backToTop.classList.toggle('is-visible', window.scrollY > 600);
  });

  burger.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', isOpen);
  });

  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
    });
  });

  /* ---------- COUNTDOWN ---------- */
  // Target date: adjust to actual event date
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 45);
  targetDate.setHours(9, 0, 0, 0);

  const cdDays = document.getElementById('cdDays');
  const cdHours = document.getElementById('cdHours');
  const cdMins = document.getElementById('cdMins');
  const cdSecs = document.getElementById('cdSecs');

  function pad(n){ return n.toString().padStart(2, '0'); }

  function updateCountdown(){
    const now = new Date();
    let diff = Math.max(0, targetDate - now);

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const mins = Math.floor((diff / (1000 * 60)) % 60);
    const secs = Math.floor((diff / 1000) % 60);

    cdDays.textContent = pad(days);
    cdHours.textContent = pad(hours);
    cdMins.textContent = pad(mins);
    cdSecs.textContent = pad(secs);
  }
  updateCountdown();
  setInterval(updateCountdown, 1000);

  /* ---------- SCHEDULE TABS ---------- */
  const tabBtns = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.timeline[data-day-panel]');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const day = btn.dataset.day;
      tabBtns.forEach(b => b.classList.toggle('is-active', b === btn));
      panels.forEach(p => p.classList.toggle('is-hidden', p.dataset.dayPanel !== day));
    });
  });

  /* ---------- ACCORDION (FAQ) ---------- */
  document.querySelectorAll('.acc-trigger').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const item = trigger.closest('.acc-item');
      const wasOpen = item.classList.contains('is-open');
      document.querySelectorAll('.acc-item').forEach(i => i.classList.remove('is-open'));
      if (!wasOpen) item.classList.add('is-open');
    });
  });

  /* ---------- SCROLL REVEAL ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting){
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  revealEls.forEach(el => observer.observe(el));

  /* ---------- BACK TO TOP ---------- */
  const backToTop = document.getElementById('backToTop');
  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ---------- SMOOTH ANCHOR SCROLL (offset for fixed nav) ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href');
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const offset = 80;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  /* ---------- REGISTRATION FORM ---------- */
  const regForm = document.getElementById('regForm');
  const formMsg = document.getElementById('formMsg');
  const submitBtn = document.getElementById('submitBtn');

  if (regForm) {
    regForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const checkedEvents = Array.from(
        regForm.querySelectorAll('input[name="events"]:checked')
      ).map(el => el.value);

      const payload = {
        full_name: regForm.fullName.value.trim(),
        email: regForm.email.value.trim(),
        phone: regForm.phone.value.trim(),
        college: regForm.college.value.trim(),
        year_of_study: regForm.year.value || null,
        events: checkedEvents,
        team_name: regForm.teamName.value.trim() || null,
        team_size: regForm.teamSize.value ? parseInt(regForm.teamSize.value, 10) : null,
      };

      if (!payload.full_name || !payload.email || !payload.phone || !payload.college) {
        showMsg('Please fill in all required fields.', 'error');
        return;
      }
      if (checkedEvents.length === 0) {
        showMsg('Select at least one event.', 'error');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting…';
      showMsg('', '');

      try {
        const res = await fetch(`${API_BASE}/api/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await res.json().catch(() => ({}));

        if (res.ok) {
          showMsg('🚀 Registration successful! Check your email for confirmation details.', 'success');
          regForm.reset();
        } else {
          showMsg(data.detail || 'Something went wrong. Please try again.', 'error');
        }
      } catch (err) {
        showMsg('Could not reach the server. Please try again shortly.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Registration';
      }
    });
  }

  function showMsg(text, type) {
    formMsg.textContent = text;
    formMsg.className = 'form-msg' + (type ? ` form-msg--${type}` : '');
  }

});
