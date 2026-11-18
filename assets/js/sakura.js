/* ==========================================================
   樱花飘落 —— 纯 canvas 实现，无外部依赖
   想关掉：删掉页面底部引入这个脚本的那一行即可
   ========================================================== */
(function () {
  "use strict";

  const canvas = document.getElementById("sakura");
  if (!canvas) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const ctx = canvas.getContext("2d");
  let W = 0;
  let H = 0;
  let petals = [];
  let raf = 0;
  let running = true;

  const COLORS = [
    ["#ffd8e6", "#f7a8c4"],
    ["#ffe3ee", "#f2b6cd"],
    ["#ffd0e0", "#eb96b8"],
    ["#fff0f6", "#f8c2d8"]
  ];

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    build();
  }

  function makePetal(fromTop) {
    const c = COLORS[Math.floor(Math.random() * COLORS.length)];
    return {
      x: Math.random() * W,
      y: fromTop ? -30 - Math.random() * H * 0.6 : Math.random() * H,
      size: 6 + Math.random() * 9,
      speedY: 0.28 + Math.random() * 0.62,
      speedX: -0.35 + Math.random() * 0.7,
      angle: Math.random() * Math.PI * 2,
      spin: (-0.012 + Math.random() * 0.024),
      sway: Math.random() * Math.PI * 2,
      swaySpeed: 0.008 + Math.random() * 0.016,
      swayAmp: 0.4 + Math.random() * 0.9,
      alpha: 0.55 + Math.random() * 0.42,
      c1: c[0],
      c2: c[1]
    };
  }

  function build() {
    const density = W < 720 ? 18 : W < 1200 ? 30 : 42;
    petals = [];
    for (let i = 0; i < density; i++) petals.push(makePetal(false));
  }

  function drawPetal(p) {
    const s = p.size;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);
    ctx.globalAlpha = p.alpha;

    const g = ctx.createLinearGradient(-s, -s * 0.6, s, s * 0.6);
    g.addColorStop(0, p.c1);
    g.addColorStop(1, p.c2);
    ctx.fillStyle = g;

    ctx.beginPath();
    ctx.moveTo(0, -s * 0.72);
    ctx.bezierCurveTo(s * 0.86, -s * 0.5, s * 0.72, s * 0.62, 0, s * 0.82);
    ctx.bezierCurveTo(-s * 0.72, s * 0.62, -s * 0.86, -s * 0.5, 0, -s * 0.72);
    ctx.closePath();
    ctx.fill();

    ctx.globalAlpha = p.alpha * 0.45;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.6);
    ctx.lineTo(0, s * 0.62);
    ctx.stroke();

    ctx.restore();
  }

  function frame() {
    if (!running) return;
    ctx.clearRect(0, 0, W, H);
    for (let i = 0; i < petals.length; i++) {
      const p = petals[i];
      p.sway += p.swaySpeed;
      p.x += p.speedX + Math.sin(p.sway) * p.swayAmp;
      p.y += p.speedY;
      p.angle += p.spin;

      if (p.y > H + 40 || p.x < -60 || p.x > W + 60) {
        petals[i] = makePetal(true);
        petals[i].y = -20;
      }
      drawPetal(p);
    }
    raf = requestAnimationFrame(frame);
  }

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      running = false;
      cancelAnimationFrame(raf);
    } else if (!running) {
      running = true;
      frame();
    }
  });

  window.addEventListener("resize", resize);
  resize();
  frame();
})();
