/* ==========================================================
   HGJS — app.js
   ========================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- reveal on scroll ----------
     예전엔 IntersectionObserver로 "화면에 10% 들어오면 한 번에 켠다" 방식이었는데,
     사파리에서 그 순간 트랜지션이 아예 재생이 안 되는 경우가 있고, 켜지기 전까진
     완전히 안 보이다가 갑자기 나타나서 부자연스러웠습니다.
     그래서 스크롤 위치에 따라 opacity/transform을 매 프레임 직접 계산해서
     "스크롤한 만큼 자연스럽게" 나타나도록 바꿨습니다. CSS 트랜지션에 의존하지
     않기 때문에 사파리에서도 동일하게 동작합니다. */
  const revealEls = Array.from(document.querySelectorAll('.reveal'));
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (revealEls.length && !reduceMotion) {
    let active = new Set(revealEls);
    let ticking = false;

    function updateReveal() {
      const vh = window.innerHeight;
      const start = vh * 0.92;   // 이 지점에 요소 윗변이 오면 진행률 0%
      const end = vh * 0.55;     // 이 지점에 오면 진행률 100%

      active.forEach(el => {
        const top = el.getBoundingClientRect().top;
        let progress = (start - top) / (start - end);
        progress = Math.max(0, Math.min(1, progress));
        el.style.opacity = progress;
        el.style.transform = `translateY(${(1 - progress) * 48}px) scale(${0.97 + progress * 0.03})`;
        if (progress >= 1) active.delete(el);
      });

      ticking = false;
      if (active.size === 0) window.removeEventListener('scroll', onScroll);
    }

    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(updateReveal);
        ticking = true;
      }
    }

    updateReveal();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
  } else {
    revealEls.forEach(el => { el.style.opacity = 1; el.style.transform = 'none'; });
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
