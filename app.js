/* ==========================================================
   HGJS — app.js
   ========================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- 헤더: 아래로 스크롤하면 숨고, 위로 스크롤하면 다시 보이기 ----------
     홈/워크/어바웃/워크 상세 등 헤더(.hdr)가 있는 모든 페이지에 공통 적용됩니다. */
  const hdr = document.querySelector('.hdr');
  if (hdr) {
    let lastY = window.scrollY;
    let hdrTicking = false;

    function updateHdr() {
      const y = window.scrollY;
      if (y > lastY && y > hdr.offsetHeight) {
        hdr.classList.add('is-hidden');   // 아래로 스크롤 → 숨김
      } else {
        hdr.classList.remove('is-hidden'); // 위로 스크롤(또는 맨 위 근처) → 표시
      }
      lastY = y;
      hdrTicking = false;
    }

    window.addEventListener('scroll', () => {
      if (!hdrTicking) {
        requestAnimationFrame(updateHdr);
        hdrTicking = true;
      }
    }, { passive: true });
  }

  /* 매스너리로 재배치하기 전에, 라이트박스 이전/다음 순서가 원래 사진 순서(HTML에
     적힌 순서, 메인 사진 → home-01 → home-02 ...)를 그대로 유지하도록 미리 저장 */
  const lightboxOrder = Array.from(document.querySelectorAll('.lightbox-trigger'));

  /* ---------- home: 큐레이션 그리드 매스너리 배치 (사파리 안전) ----------
     CSS columns:(옛날 방식, 사파리에서 겹침/클릭 오류)나 CSS grid(줄이 딱 맞아
     다이나믹한 느낌이 사라짐) 대신, 사진들을 세로 컬럼 여러 개로 나눠 담아서
     각 컬럼이 사진 원래 비율 그대로 자연스럽게 쌓이도록 합니다. 화면 크기에 따라
     컬럼 수(3/2/1)를 다시 계산해서 사진들을 재배치합니다.
     * .lightbox-trigger 순서는 이 재배치와 무관하게 원래 사진 순서(HTML에 적힌 순서)를
       그대로 유지하도록, 순서는 재배치 전에 미리 저장해 둡니다. */
  const curatedGrid = document.querySelector('.curated__grid');
  if (curatedGrid) {
    const items = Array.from(curatedGrid.children);
    const columnsFor = (w) => (w <= 480 ? 1 : w <= 800 ? 2 : 3);

    function layoutMasonry() {
      const n = columnsFor(window.innerWidth);
      const cols = [];
      for (let c = 0; c < n; c++) {
        const col = document.createElement('div');
        col.className = 'curated__col';
        cols.push(col);
      }
      items.forEach((item, i) => cols[i % n].appendChild(item));
      curatedGrid.innerHTML = '';
      cols.forEach(col => curatedGrid.appendChild(col));
    }

    layoutMasonry();
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(layoutMasonry, 200);
    });
  }

  /* ---------- reveal on scroll ----------
     스크롤 위치에 따라 opacity/transform을 매 프레임 직접 계산해서 "스크롤한 만큼
     자연스럽게" 나타나도록 합니다 (CSS 트랜지션에 의존하지 않아 사파리에서도 동일하게
     동작). 예전엔 진행 구간이 짧고(화면의 37%) 스냅되는 느낌이 있어서, 구간을 더 길게
     늘리고 짧은 CSS 트랜지션(.reveal의 transition)을 더해 스크롤 입력이 뚝뚝 끊겨도
     (마우스 휠 등) 부드럽게 이어지도록 했습니다. */
  const revealEls = Array.from(document.querySelectorAll('.reveal'));
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (revealEls.length && !reduceMotion) {
    let active = new Set(revealEls);
    let ticking = false;

    function updateReveal() {
      const vh = window.innerHeight;
      const start = vh * 0.96;   // 이 지점에 요소 윗변이 오면 진행률 0%
      const end = vh * 0.35;     // 이 지점에 오면 진행률 100%

      active.forEach(el => {
        const top = el.getBoundingClientRect().top;
        let progress = (start - top) / (start - end);
        progress = Math.max(0, Math.min(1, progress));
        el.style.opacity = progress;
        el.style.transform = `translateY(${(1 - progress) * 40}px) scale(${0.98 + progress * 0.02})`;
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

  /* ---------- work detail: 좌우 화살표 키보드로도 프로젝트 이동 ---------- */
  const detailPrev = document.querySelector('.detail-nav--prev');
  const detailNext = document.querySelector('.detail-nav--next');
  if (detailPrev || detailNext) {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft' && detailPrev) location.href = detailPrev.href;
      if (e.key === 'ArrowRight' && detailNext) location.href = detailNext.href;
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
    const triggers = lightboxOrder;
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
