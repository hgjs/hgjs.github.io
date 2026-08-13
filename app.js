/* ==========================================================
   HGJS — app.js
   ========================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- reveal on scroll ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: .1, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('is-in'));
  }

  /* ---------- current nav highlight ---------- */
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.hdr__nav a').forEach(a => {
    if (a.getAttribute('href') === path) a.classList.add('is-active');
  });

  /* ---------- work filters ---------- */
  const filterBar = document.querySelector('.filters');
  if (filterBar) {
    const buttons = filterBar.querySelectorAll('button');
    const tiles = document.querySelectorAll('.masonry__tile');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        const cat = btn.dataset.filter;
        tiles.forEach(tile => {
          const show = cat === 'all' || tile.dataset.cat === cat;
          tile.style.display = show ? '' : 'none';
        });
      });
    });
  }

  /* ---------- totop ---------- */
  const totop = document.querySelector('.totop');
  if (totop) {
    window.addEventListener('scroll', () => {
      totop.classList.toggle('is-visible', window.scrollY > 600);
    }, { passive: true });
    totop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  /* ---------- lightbox (홈 사진·영상 팝업, 좌우 화살표로 홈 안에서만 순환) ---------- */
  const lightbox = document.getElementById('lightbox');
  if (lightbox) {
    const stage = lightbox.querySelector('.lightbox__stage');
    const countEl = lightbox.querySelector('.lightbox__count');
    const closeBtn = lightbox.querySelector('.lightbox__close');
    const prevBtn = lightbox.querySelector('.lightbox__prev');
    const nextBtn = lightbox.querySelector('.lightbox__next');
    const triggers = Array.from(document.querySelectorAll('.lightbox-trigger'));
    let current = 0;

    function render() {
      const el = triggers[current];
      const video = el.querySelector('iframe');
      const img = el.querySelector('img');
      stage.innerHTML = '';
      if (video) {
        const iframe = document.createElement('iframe');
        iframe.src = video.src;
        iframe.allow = 'autoplay; encrypted-media';
        stage.appendChild(iframe);
      } else if (img) {
        const image = document.createElement('img');
        image.src = img.currentSrc || img.src;
        image.alt = img.alt || '';
        stage.appendChild(image);
      }
      countEl.textContent = `${current + 1} / ${triggers.length}`;
    }

    function open(index) {
      current = index;
      render();
      lightbox.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    }

    function close() {
      lightbox.classList.remove('is-open');
      document.body.style.overflow = '';
      stage.innerHTML = '';
    }

    function go(delta) {
      current = (current + delta + triggers.length) % triggers.length;
      render();
    }

    triggers.forEach((el, i) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        open(i);
      });
    });

    closeBtn.addEventListener('click', close);
    prevBtn.addEventListener('click', () => go(-1));
    nextBtn.addEventListener('click', () => go(1));

    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) close();
    });

    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
    });
  }

});
