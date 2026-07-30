/* ══════════════════════════════════════════════
   공드린스튜디오 — 공용 스크립트
   ══════════════════════════════════════════════ */

/* ── 스크롤 등장 모션 ─────────────────────────── */
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('is-in');
      io.unobserve(e.target);          // 한 번 나타나면 다시 감추지 않음
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

document.querySelectorAll('.reveal').forEach(el => io.observe(el));

/* ── 스크롤 시 헤더 배경 (사진 위에서 로고가 묻히지 않도록) ── */
const hdr = document.getElementById('hdr');
if (hdr) {
  addEventListener('scroll', () => {
    hdr.classList.toggle('is-scrolled', scrollY > 40);
  }, { passive: true });
}

/* ── 전체 화면 메뉴 ───────────────────────────── */
const navEl  = document.getElementById('nav');
const navBtn = document.querySelector('.hdr__menu');

if (navEl && navBtn) {
  let navOpen = false;

  function setNav(open) {
    navOpen = open;
    navEl.classList.toggle('is-open', open);
    navEl.setAttribute('aria-hidden', String(!open));
    navBtn.setAttribute('aria-expanded', String(open));
    navBtn.textContent = open ? '닫기' : '메뉴';
    document.body.classList.toggle('nav-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
    // 열렸을 때 첫 항목으로 포커스
    if (open) navEl.querySelector('.nav__link')?.focus();
    else navBtn.focus();
  }

  navBtn.addEventListener('click', () => setNav(!navOpen));

  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navOpen) setNav(false);
  });

  // 현재 페이지 항목은 흐리게 (같은 곳으로 또 가지 않게)
  const here = location.pathname.split('/').pop() || 'index.html';
  navEl.querySelectorAll('.nav__link').forEach(a => {
    if (a.getAttribute('href') === here) {
      a.style.opacity = '.35';
      a.setAttribute('aria-current', 'page');
    }
  });
}

/* ── 맨 위로 버튼 — 조금 내려가면 나타남 ──────── */
const toTop = document.getElementById('totop');
if (toTop) {
  addEventListener('scroll', () => {
    toTop.classList.toggle('is-on', scrollY > 600);
  }, { passive: true });
  toTop.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ── 포트폴리오 카테고리 필터 ─────────────────── */
const filterBar = document.getElementById('filters');
const masonry   = document.getElementById('masonry');

if (filterBar && masonry) {
  const tiles = [...masonry.querySelectorAll('.tile')];
  const empty = document.getElementById('empty');

  function applyFilter(cat) {
    filterBar.querySelectorAll('.chip').forEach(c =>
      c.setAttribute('aria-pressed', String(c.dataset.cat === cat))
    );
    let shown = 0;
    tiles.forEach(t => {
      const match = cat === 'all' || t.dataset.cat === cat;
      t.classList.toggle('is-hidden', !match);
      if (match) shown++;
    });
    if (empty) empty.hidden = shown > 0;
  }

  filterBar.addEventListener('click', (e) => {
    const btn = e.target.closest('.chip');
    if (!btn) return;
    applyFilter(btn.dataset.cat);
  });

  // 상세 페이지에서 ?cat=인테리어 로 들어오면 해당 분야로 열림
  const wanted = new URLSearchParams(location.search).get('cat');
  if (wanted && tiles.some(t => t.dataset.cat === wanted)) applyFilter(wanted);
}

/* ══ 예약 현황 달력 ════════════════════════════ */

const calGrid = document.getElementById('calGrid');
if (calGrid) {

  /* ── 예약 상태 데이터 ──────────────────────────
     'full' = 마감, 'off' = 휴무. 없으면 예약 가능.
     지금은 여기 직접 적습니다. 나중에 Sanity를 붙이면
     관리 화면에서 날짜만 찍으면 자동으로 반영됩니다.   */
  const STATUS = {
    '2026-08-03': 'off',   '2026-08-10': 'off',
    '2026-08-12': 'full',  '2026-08-13': 'full',
    '2026-08-17': 'off',   '2026-08-20': 'full',
    '2026-08-24': 'off',   '2026-08-28': 'full',
    '2026-08-31': 'off',
    '2026-09-07': 'off',   '2026-09-09': 'full',
    '2026-09-14': 'off',   '2026-09-18': 'full',
  };
  const CLOSED_WEEKDAY = [0];          // 0=일요일 정기 휴무. 없으면 [] 로

  const monthEl = document.getElementById('calMonth');
  const prevBtn = document.getElementById('calPrev');
  const nextBtn = document.getElementById('calNext');
  const pDate   = document.getElementById('panelDate');
  const pSub    = document.getElementById('panelSub');
  const pSlots  = document.getElementById('panelSlots');
  const pGo     = document.getElementById('panelGo');
  const pLink   = document.getElementById('panelLink');

  const today = new Date(); today.setHours(0,0,0,0);
  let view = new Date(today.getFullYear(), today.getMonth(), 1);
  let picked = null, slot = null;

  const key = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

  function statusOf(d) {
    if (d < today) return 'past';
    if (CLOSED_WEEKDAY.includes(d.getDay())) return 'off';
    return STATUS[key(d)] || 'open';
  }

  function render() {
    monthEl.textContent = `${view.getFullYear()}년 ${view.getMonth()+1}월`;
    // 지난 달로는 못 감
    prevBtn.disabled = view.getFullYear() === today.getFullYear() && view.getMonth() === today.getMonth();

    calGrid.innerHTML = '';
    const first = new Date(view.getFullYear(), view.getMonth(), 1);
    const days  = new Date(view.getFullYear(), view.getMonth()+1, 0).getDate();

    for (let i = 0; i < first.getDay(); i++) {
      const b = document.createElement('div');
      b.className = 'day day--blank';
      calGrid.appendChild(b);
    }

    for (let n = 1; n <= days; n++) {
      const d  = new Date(view.getFullYear(), view.getMonth(), n);
      const st = statusOf(d);
      const b  = document.createElement('button');
      b.type = 'button';
      b.className = `day day--${st}`;
      b.dataset.date = key(d);
      b.disabled = st !== 'open';
      b.innerHTML = `<span class="day__num">${n}</span><span class="day__mark">${
        st === 'open' ? '' : st === 'full' ? '마감' : st === 'off' ? '휴무' : ''
      }</span>`;
      if (picked === key(d)) b.classList.add('is-sel');
      calGrid.appendChild(b);
    }
  }

  function updatePanel() {
    if (!picked) return;
    const [y,m,dd] = picked.split('-');
    const wd = ['일','월','화','수','목','금','토'][new Date(+y, +m-1, +dd).getDay()];
    pDate.textContent = `${+m}월 ${+dd}일 (${wd})`;
    pSub.textContent  = slot ? '아래 버튼을 누르면 문의서로 넘어갑니다.' : '시간대를 골라주세요.';
    pSlots.hidden = false;
    pGo.hidden = !slot;
    if (slot) pLink.href = `inquiry.html?date=${picked}&slot=${encodeURIComponent(slot)}`;
  }

  calGrid.addEventListener('click', (e) => {
    const b = e.target.closest('.day');
    if (!b || b.disabled) return;
    picked = b.dataset.date; slot = null;
    pSlots.querySelectorAll('.slot').forEach(s => s.setAttribute('aria-pressed','false'));
    render(); updatePanel();
  });

  pSlots.addEventListener('click', (e) => {
    const s = e.target.closest('.slot');
    if (!s) return;
    slot = s.dataset.slot;
    pSlots.querySelectorAll('.slot').forEach(x => x.setAttribute('aria-pressed', String(x === s)));
    updatePanel();
  });

  prevBtn.addEventListener('click', () => { view.setMonth(view.getMonth()-1); render(); });
  nextBtn.addEventListener('click', () => { view.setMonth(view.getMonth()+1); render(); });

  render();
}

/* ══ 문의 폼 ═══════════════════════════════════ */

/* ── 달력에서 넘어온 날짜·시간대 채우기 ───────── */
const dateField = document.getElementById('date');
if (dateField) {
  const qs = new URLSearchParams(location.search);
  const d = qs.get('date'), s = qs.get('slot');
  if (d) dateField.value = d;
  if (s) {
    const msg = document.getElementById('message');
    if (msg && !msg.value) msg.value = `희망 시간대: ${s}\n`;
  }
}

/* ── 연락처 자동 하이픈 (필드 3분할 대신 단일 필드) ── */
const phone = document.getElementById('phone');
if (phone) {
  phone.addEventListener('input', () => {
    const d = phone.value.replace(/\D/g, '').slice(0, 11);
    phone.value =
      d.length < 4  ? d :
      d.length < 8  ? `${d.slice(0,3)}-${d.slice(3)}` :
                      `${d.slice(0,3)}-${d.slice(3,7)}-${d.slice(7)}`;
  });
}

/* ── 첨부파일 이름 표시 ───────────────────────── */
const fileInput = document.getElementById('files');
if (fileInput) {
  const nameEl = document.getElementById('fileName');
  fileInput.addEventListener('change', () => {
    const n = fileInput.files.length;
    nameEl.textContent = n === 0 ? '선택된 파일 없음'
      : n === 1 ? fileInput.files[0].name
      : `${n}개 선택됨`;
  });
}

/* ── 동의해야 제출 버튼 활성화 ────────────────── */
const agree = document.getElementById('agree');
const submitBtn = document.getElementById('submit');
if (agree && submitBtn) {
  const sync = () => { submitBtn.disabled = !agree.checked; };
  agree.addEventListener('change', sync);
  sync();
}

/* ── 모달 열기/닫기 ───────────────────────────── */
function openModal(id){
  const m = document.getElementById(id);
  if (!m) return;
  m.classList.add('is-open');
  document.body.style.overflow = 'hidden';
}
function closeModal(m){
  m.classList.remove('is-open');
  document.body.style.overflow = '';
}
document.querySelectorAll('[data-open-modal]').forEach(btn => {
  btn.addEventListener('click', () => openModal(btn.dataset.openModal));
});
document.querySelectorAll('.modal').forEach(m => {
  // 배경 클릭 또는 닫기 버튼
  m.addEventListener('click', (e) => {
    if (e.target === m || e.target.closest('[data-close]')) closeModal(m);
  });
});
addEventListener('keydown', (e) => {
  if (e.key === 'Escape') document.querySelectorAll('.modal.is-open').forEach(closeModal);
});

/* ── 폼 제출 ──────────────────────────────────
   지금은 화면 동작만 확인하는 상태입니다.
   실제 접수는 아래 fetch 부분을 연결해야 합니다.
   (Formspree, Cloudflare Pages Functions 등)      */
const form = document.getElementById('inquiryForm');
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // TODO: 실제 전송 연결
    // const res = await fetch('/api/inquiry', { method:'POST', body:new FormData(form) });
    // if (!res.ok) { alert('전송에 실패했습니다. 카카오톡으로 문의해 주세요.'); return; }

    openModal('doneModal');
    form.reset();
    if (submitBtn) submitBtn.disabled = true;
  });
}
