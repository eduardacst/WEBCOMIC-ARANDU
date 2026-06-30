/* ============================================================
   RAIZ-LUME — comportamento
   ============================================================ */

(() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- entrar na caverna ---------- */
  const enterBtn = document.getElementById('enter-btn');
  const storyEl = document.getElementById('story');
  if (enterBtn && storyEl) {
    enterBtn.addEventListener('click', () => {
      storyEl.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
  }

  /* ---------- barra de progresso lateral ---------- */
  const progressFill = document.getElementById('progress-fill');
  function updateProgress() {
    if (!progressFill || !storyEl) return;
    const rect = storyEl.getBoundingClientRect();
    const total = storyEl.offsetHeight - window.innerHeight;
    const scrolled = Math.min(Math.max(-rect.top, 0), total);
    const pct = total > 0 ? (scrolled / total) * 100 : 0;
    progressFill.style.height = pct + '%';
  }
  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();

  /* ---------- reveal genérico ao entrar na viewport ---------- */
  const scenes = document.querySelectorAll('.scene');
  const sceneObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
      }
    });
  }, { threshold: 0.28 });
  scenes.forEach((s) => sceneObserver.observe(s));

  /* ---------- camadas internas com data-reveal (cena 4 e 14) ---------- */
  const revealLayers = document.querySelectorAll('[data-reveal]');
  const layerObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const delay = parseInt(el.dataset.delay || '0', 10);
        window.setTimeout(() => {
          el.classList.add('is-revealed');
        }, delay);
        layerObserver.unobserve(el);
      }
    });
  }, { threshold: 0.4 });
  revealLayers.forEach((el) => layerObserver.observe(el));

  /* ---------- interação especial: cena5 -> cena5_2 (1s depois) ---------- */
  const cena5 = document.getElementById('img-cena5');
  const cena5_2 = document.getElementById('img-cena5_2');
  if (cena5 && cena5_2) {
    let triggered = false;
    const cena5Observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !triggered) {
          triggered = true;
          window.setTimeout(() => {
            cena5_2.classList.add('is-revealed');
          }, 1000);
          cena5Observer.unobserve(cena5);
        }
      });
    }, { threshold: 0.5 });
    cena5Observer.observe(cena5);
  }

  /* ============================================================
     TRANSFORMAÇÃO — cena 8 (botão) -> cena 9 (partículas mágicas)
     ============================================================ */
  const transformBtn = document.getElementById('transform-btn');
  const scene9 = document.getElementById('scene9');
  const canvas = document.getElementById('particle-canvas');

  if (transformBtn && scene9 && canvas) {
    transformBtn.addEventListener('click', () => {
      transformBtn.setAttribute('disabled', 'true');
      scene9.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
      // pequeno atraso para a rolagem assentar antes de disparar os efeitos
      window.setTimeout(runTransformation, prefersReducedMotion ? 80 : 650);
    });
  }

  let transformationDone = false;

  function runTransformation() {
    if (transformationDone) return;
    transformationDone = true;

    const stage = scene9.querySelector('.transform-stage');
    const flash = scene9.querySelector('.transform-flash');
    stage.classList.add('is-transforming');

    if (prefersReducedMotion) {
      flash.classList.add('flash-active');
      window.setTimeout(() => flash.classList.remove('flash-active'), 500);
      return;
    }

    startParticles(canvas, () => {
      // pico de luz no meio da animação
      flash.classList.add('flash-active');
      window.setTimeout(() => flash.classList.remove('flash-active'), 700);
    });
  }

  function startParticles(canvasEl, onPeak) {
    const ctx = canvasEl.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const imgEl = scene9.querySelector('.transform-base');

    function resize() {
      const rect = canvasEl.getBoundingClientRect();
      canvasEl.width = rect.width * dpr;
      canvasEl.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    const stageRect = canvasEl.getBoundingClientRect();
    const imgRect = imgEl ? imgEl.getBoundingClientRect() : stageRect;
    // origem das partículas: centro horizontal da imagem, ligeiramente acima
    // do meio vertical (onde a criatura tende a estar na arte vertical)
    const cx = (imgRect.left + imgRect.width / 2) - stageRect.left;
    const cy = (imgRect.top + imgRect.height * 0.46) - stageRect.top;
    const rect = stageRect;

    const colors = ['#f3c77a', '#ffe9c9', '#c96b6b', '#8fae6f'];
    const particles = [];
    const total = 140;

    for (let i = 0; i < total; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 40 + Math.random() * 60;
      particles.push({
        x: cx + Math.cos(angle) * radius * 0.3,
        y: cy + Math.sin(angle) * radius * 0.3,
        angle,
        speed: 0.6 + Math.random() * 2.2,
        radius: 1 + Math.random() * 2.6,
        life: 0,
        maxLife: 70 + Math.random() * 90,
        color: colors[Math.floor(Math.random() * colors.length)],
        drift: (Math.random() - 0.5) * 0.6,
        risingBias: 0.4 + Math.random() * 0.8,
      });
    }

    let frame = 0;
    let peakFired = false;
    const totalFrames = 200;

    function tick() {
      frame++;
      ctx.clearRect(0, 0, rect.width, rect.height);

      if (!peakFired && frame > totalFrames * 0.45) {
        peakFired = true;
        if (typeof onPeak === 'function') onPeak();
      }

      particles.forEach((p) => {
        p.life++;
        const t = p.life / p.maxLife;
        const ease = 1 - Math.pow(1 - Math.min(t, 1), 2);

        p.x += Math.cos(p.angle) * p.speed * 0.4 + p.drift;
        p.y += Math.sin(p.angle) * p.speed * 0.4 - p.risingBias * 1.4;

        const alpha = t < 0.15 ? t / 0.15 : 1 - Math.max(0, (t - 0.6) / 0.4);
        const size = p.radius * (1 - ease * 0.3);

        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(size, 0.3), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      if (frame < totalFrames) {
        requestAnimationFrame(tick);
      } else {
        ctx.clearRect(0, 0, rect.width, rect.height);
      }
    }

    requestAnimationFrame(tick);
  }
})();
