/* ==========================================================
   站点渲染逻辑 —— 一般不需要改这里
   ========================================================== */
(function () {
  "use strict";

  const SITE = window.SITE || {};
  const POSTS = (window.POSTS || []).slice();
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));

  /* ---------- 工具 ---------- */
  function fmtDate(str) {
    const d = new Date(str + "T00:00:00");
    if (isNaN(d)) return str;
    return d.getFullYear() + " 年 " + (d.getMonth() + 1) + " 月 " + d.getDate() + " 日";
  }
  function daysSince(str) {
    const d = new Date(str + "T00:00:00");
    if (isNaN(d)) return 0;
    return Math.max(1, Math.floor((Date.now() - d.getTime()) / 86400000) + 1);
  }
  const byDate = (a, b) => (a.date < b.date ? 1 : -1);

  /* ---------- 主题 ---------- */
  const THEME_KEY = "xingxie-theme";
  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    const btn = $("#themeBtn");
    if (btn) btn.innerHTML = t === "dark" ? ICON.sun : ICON.moon;
  }
  function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    const prefers = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    applyTheme(saved || prefers);
    const btn = $("#themeBtn");
    if (btn) {
      btn.addEventListener("click", () => {
        const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
        applyTheme(next);
        localStorage.setItem(THEME_KEY, next);
      });
    }
  }

  /* ---------- 图标 ---------- */
  const ICON = {
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 4 4"/></svg>',
    up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m6 14 6-6 6 6"/></svg>',
    down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m6 10 6 6 6-6"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="2.6"/></svg>',
    cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
    pen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L20 8a2.8 2.8 0 0 0-4-4L4 16v4z"/></svg>',
    refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    dice: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3.5" y="3.5" width="17" height="17" rx="4"/><circle cx="8.5" cy="8.5" r="1.4" fill="currentColor" stroke="none"/><circle cx="15.5" cy="15.5" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 13 4 4L19 7"/></svg>',
    dl: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12m-5-5 5 5 5-5M4 19h16"/></svg>'
  };

  /* ---------- 导航 ---------- */
  function renderNav() {
    const nav = $("#nav");
    if (!nav) return;
    const page = document.body.dataset.page || "home";
    const links = [
      { key: "home", name: "首页", href: "index.html" },
      { key: "apps", name: "作品", href: "apps.html" },
      { key: "archive", name: "归档", href: "archive.html" },
      { key: "about", name: "关于", href: "about.html" }
    ];
    nav.innerHTML =
      '<div class="nav-inner">' +
        '<a class="brand" href="index.html"><span class="brand-mark">✿</span><span>' + esc(SITE.title) + "</span></a>" +
        '<nav class="nav-links">' +
          links.map((l) => '<a href="' + l.href + '"' + (l.key === page ? ' class="active"' : "") + ">" + l.name + "</a>").join("") +
        "</nav>" +
        '<div class="nav-tools">' +
          '<button class="icon-btn" id="searchBtn" aria-label="搜索">' + ICON.search + "</button>" +
          '<button class="icon-btn" id="themeBtn" aria-label="切换主题"></button>' +
        "</div>" +
      "</div>";

    // 没有头图的页面，导航栏一开始就是实心（否则白字会看不见）
    const hasHero = !!document.getElementById("hero");
    if (!hasHero) {
      nav.classList.add("solid");
    } else {
      const onScroll = () => nav.classList.toggle("solid", window.scrollY > 20);
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
    }
  }

  /* ---------- 首屏 ---------- */
  function renderHero() {
    const hero = $("#hero");
    if (!hero) return;
    hero.innerHTML =
      '<div class="hero-bg-wrap"><div class="hero-bg" id="heroBgA"></div><div class="hero-bg" id="heroBgB"></div></div>' +
      '<div class="hero-inner">' +
        '<div class="hero-avatar"><img src="' + SITE.avatar + '" alt="' + esc(SITE.author) + '"></div>' +
        '<p class="hero-eyebrow">Hello! 我是 ' + esc(SITE.author) + "</p>" +
        '<h1 class="hero-title">' + esc(SITE.title) + "</h1>" +
        '<p class="hero-sub"><span id="typed"></span><i class="cursor"></i></p>' +
        '<div class="hero-meta">' +
          "<span>" + ICON.pen + "文章 " + POSTS.length + " 篇</span>" +
          "<span>" + ICON.cal + "运行 " + daysSince(SITE.since) + " 天</span>" +
        "</div>" +
      "</div>" +
      '<button class="banner-swap" id="bannerSwap" aria-label="换一张头图" title="换一张头图">' + ICON.refresh + "</button>" +
      '<div class="scroll-hint">' + ICON.down + "</div>";
    heroHitokoto();
  }

  /* 首屏头图：进来随机一张，点按钮切换，两层交叉淡入 */
  function initHeroBanner() {
    const a = $("#heroBgA");
    const b = $("#heroBgB");
    if (!a || !b) return;
    const pool = window.BANNERS || [];
    if (!pool.length) {
      a.style.backgroundImage = "url(" + SITE.hero + ")";
      a.classList.add("show");
      return;
    }
    let cur = Math.floor(Math.random() * pool.length);
    a.style.backgroundImage = "url(" + pool[cur] + ")";
    a.classList.add("show");
    const btn = $("#bannerSwap");
    if (!btn) return;
    btn.addEventListener("click", function () {
      cur = (cur + 1 + Math.floor(Math.random() * (pool.length - 1))) % pool.length;
      const showEl = a.classList.contains("show") ? b : a;
      const hideEl = showEl === a ? b : a;
      showEl.style.backgroundImage = "url(" + pool[cur] + ")";
      showEl.classList.add("show");
      hideEl.classList.remove("show");
    });
  }

  /* 一言：进来随机一句，之后每 9 秒轮换 */
  function heroHitokoto() {
    const el = $("#typed");
    if (!el) return;
    const list =
      window.HITOKOTO && window.HITOKOTO.length
        ? window.HITOKOTO
        : [SITE.subtitle || "欢迎来到这里。"];
    let i = Math.floor(Math.random() * list.length);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.textContent = list[i];
      return;
    }
    typeIn(el, list[i]);
    setInterval(function () {
      i = (i + 1) % list.length;
      typeIn(el, list[i]);
    }, 9000);
  }

  function typeIn(el, text) {
    el.textContent = "";
    let n = 0;
    (function tick() {
      el.textContent = text.slice(0, ++n);
      if (n < text.length) setTimeout(tick, 58 + Math.random() * 52);
    })();
  }

  /* ---------- 打字机（已并入 heroHitokoto） ---------- */

  /* ---------- 文章卡片 ---------- */
  function cardHTML(p) {
    return (
      '<a class="post-card" href="post.html?id=' + encodeURIComponent(p.id) + '">' +
        '<div class="post-thumb">' +
          '<img src="' + p.cover + '" alt="' + esc(p.title) + '" loading="lazy">' +
          '<span class="post-cat">' + esc(p.category) + "</span>" +
        "</div>" +
        '<div class="post-body">' +
          '<h2 class="post-title">' + esc(p.title) + "</h2>" +
          '<p class="post-excerpt">' + esc(p.excerpt) + "</p>" +
          '<div class="post-foot">' +
            "<span>" + fmtDate(p.date) + "</span>" +
            '<span class="dot"></span>' +
            "<span>" + ICON.eye.replace("<svg", '<svg style="width:13px;height:13px;vertical-align:-2px;display:inline"') + " " + (p.views || 0) + "</span>" +
            (p.tags && p.tags[0] ? '<span class="dot"></span><span class="tag">#' + esc(p.tags[0]) + "</span>" : "") +
          "</div>" +
        "</div>" +
      "</a>"
    );
  }

  function renderPostList(el, list) {
    if (!el) return;
    if (!list.length) {
      el.innerHTML =
        '<div class="empty-posts">' +
          '<p class="empty-title">还没有文章</p>' +
          "<p>第一篇写完就会出现在这里。</p>" +
        "</div>";
      return;
    }
    el.innerHTML = list.map(cardHTML).join("");
    reveal($$(".post-card", el));
  }

  function reveal(nodes) {
    if (!("IntersectionObserver" in window)) {
      nodes.forEach((n) => n.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const idx = nodes.indexOf(e.target);
            e.target.style.transitionDelay = Math.min(idx, 5) * 60 + "ms";
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );
    nodes.forEach((n) => io.observe(n));
  }

  /* ---------- 侧边栏 ---------- */
  function renderSidebar() {
    const bar = $("#sidebar");
    if (!bar) return;
    const sorted = POSTS.slice().sort(byDate);
    const tags = Array.from(new Set(POSTS.flatMap((p) => p.tags || []))).slice(0, 14);
    const latest = sorted.slice(0, 4);

    const parts = [];

    parts.push(
      '<div class="widget author">' +
        '<div class="author-avatar"><img src="' + SITE.avatar + '" alt="' + esc(SITE.author) + '"></div>' +
        '<div class="author-name">' + esc(SITE.author) + "</div>" +
        '<p class="author-desc">' + esc(SITE.bio) + "</p>" +
        '<div class="author-stats">' +
          "<div><b>" + POSTS.length + "</b><span>文章</span></div>" +
          "<div><b>" + tags.length + "</b><span>标签</span></div>" +
          "<div><b>" + daysSince(SITE.since) + "</b><span>天</span></div>" +
        "</div>" +
      "</div>"
    );

    /* 没文章时藏掉这三个空小工具，别摆着空壳 */
    if (latest.length) {
      parts.push(
        '<div class="widget">' +
          '<h3 class="widget-title">最新文章</h3>' +
          '<div class="mini-list">' +
            latest.map((p) =>
              '<a class="mini-item" href="post.html?id=' + encodeURIComponent(p.id) + '">' +
                '<img src="' + p.cover + '" alt="" loading="lazy">' +
                "<p>" + esc(p.title) + "</p>" +
              "</a>"
            ).join("") +
          "</div>" +
        "</div>"
      );
    }
    if (tags.length) {
      parts.push(
        '<div class="widget">' +
          '<h3 class="widget-title">标签云</h3>' +
          '<div class="tags">' +
            tags.map((t) => '<a class="tag-pill" href="archive.html?tag=' + encodeURIComponent(t) + '">#' + esc(t) + "</a>").join("") +
          "</div>" +
        "</div>"
      );
    }
    if (POSTS.length) {
      parts.push(
        '<div class="widget">' +
          '<h3 class="widget-title">随便看看</h3>' +
          '<button class="random-btn" id="randomPost">' + ICON.dice + "随机来一篇</button>" +
        "</div>"
      );
    }

    parts.push(
      '<div class="widget">' +
        '<h3 class="widget-title">正在听</h3>' +
        '<div class="music-card">' +
          '<div class="vinyl" id="vinyl"></div>' +
          '<div class="music-info">' +
            "<b>" + esc(SITE.nowPlaying.name) + "</b>" +
            "<span>" + esc(SITE.nowPlaying.artist) + "</span>" +
          "</div>" +
        "</div>" +
      "</div>"
    );

    bar.innerHTML = parts.join("");
  }

  /* ---------- 文章页 ---------- */
  function renderPost() {
    const holder = $("#article");
    if (!holder) return;
    if (!POSTS.length) {
      holder.innerHTML =
        '<div class="article"><div class="article-body" style="text-align:center;padding:70px 30px">' +
        "<h2 style='border:none;padding:0'>还没有文章</h2>" +
        "<p style='color:var(--text-3)'>第一篇写完就会出现在这里。</p>" +
        '<p><a href="index.html">← 回首页</a></p></div></div>';
      return;
    }
    const id = new URLSearchParams(location.search).get("id") || POSTS[0].id;
    const idx = POSTS.findIndex((p) => p.id === id);
    if (idx === -1) {
      holder.innerHTML =
        '<div class="article"><div class="article-body" style="text-align:center;padding:70px 30px">' +
        "<h2 style='border:none;padding:0'>这篇文章不见了</h2>" +
        "<p style='color:var(--text-3)'>可能链接写错了，或者它已经被我删掉。</p>" +
        '<p><a href="index.html">← 回首页</a></p></div></div>';
      return;
    }
    const p = POSTS[idx];
    const sorted = POSTS.slice().sort(byDate);
    const i = sorted.findIndex((x) => x.id === p.id);
    const newer = sorted[i - 1];
    const older = sorted[i + 1];

    document.title = p.title + " · " + SITE.title;
    holder.innerHTML =
      '<article class="article">' +
        '<img class="article-cover" src="' + p.cover + '" alt="' + esc(p.title) + '">' +
        '<header class="article-head">' +
          '<h1 class="article-title">' + esc(p.title) + "</h1>" +
          '<div class="article-meta">' +
            "<span>" + ICON.cal.replace("<svg", '<svg style="width:14px;height:14px;vertical-align:-2px;display:inline"') + " " + fmtDate(p.date) + "</span>" +
            "<span>" + ICON.eye.replace("<svg", '<svg style="width:14px;height:14px;vertical-align:-2px;display:inline"') + " " + (p.views || 0) + " 次阅读</span>" +
            "<span>" + esc(p.category) + "</span>" +
            (p.tags || []).map((t) => '<span class="tag">#' + esc(t) + "</span>").join("") +
          "</div>" +
        "</header>" +
        '<div class="article-body">' + p.content + "</div>" +
      "</article>" +
      '<nav class="article-nav">' +
        (newer
          ? '<a href="post.html?id=' + encodeURIComponent(newer.id) + '"><small>上一篇</small><b>' + esc(newer.title) + "</b></a>"
          : "<span></span>") +
        (older
          ? '<a class="next" href="post.html?id=' + encodeURIComponent(older.id) + '"><small>下一篇</small><b>' + esc(older.title) + "</b></a>"
          : "<span></span>") +
      "</nav>";
    window.scrollTo(0, 0);
  }

  /* ---------- 归档页 ---------- */
  function renderArchive() {
    const el = $("#timeline");
    if (!el) return;
    const tag = new URLSearchParams(location.search).get("tag");
    let list = POSTS.slice().sort(byDate);
    if (tag) list = list.filter((p) => (p.tags || []).includes(tag));
    if ($("#archiveSub")) {
      $("#archiveSub").textContent = tag
        ? "标签「" + tag + "」下的 " + list.length + " 篇文章"
        : "共 " + list.length + " 篇，按时间倒序";
    }
    if (!list.length) {
      el.innerHTML = tag
        ? '<p style="color:var(--text-3)">没有找到相关文章。</p>'
        : '<p style="color:var(--text-3)">还没有文章。第一篇写完就会出现在这里。</p>';
      return;
    }
    const groups = {};
    list.forEach((p) => {
      const y = p.date.slice(0, 4);
      (groups[y] = groups[y] || []).push(p);
    });
    el.innerHTML = Object.keys(groups)
      .sort((a, b) => b - a)
      .map(
        (y) =>
          '<div style="margin-bottom:34px">' +
          '<h3 style="font-size:15px;letter-spacing:2px;color:var(--text-3);margin:0 0 18px;font-weight:500">' + y + " 年</h3>" +
          groups[y]
            .map(
              (p) =>
                '<div class="tl-item">' +
                '<div class="tl-date">' + p.date.slice(5).replace("-", " / ") + " · " + esc(p.category) + "</div>" +
                '<a class="tl-title" href="post.html?id=' + encodeURIComponent(p.id) + '">' + esc(p.title) + "</a>" +
                "</div>"
            )
            .join("") +
          "</div>"
      )
      .join("");
  }

  /* ---------- 关于页 ---------- */
  function renderAbout() {
    const nav = $("#aboutNav");
    if (nav) {
      nav.innerHTML = SITE.links
        .map((l) => '<a href="' + l.url + '" target="_blank" rel="noopener">' + esc(l.name) + "</a>")
        .join("");
    }
    const fr = $("#friendLinks");
    if (fr) {
      fr.innerHTML = SITE.friends
        .map((f) => '<a href="' + f.url + '" target="_blank" rel="noopener">' + esc(f.name) + "</a>")
        .join("");
    }
  }

  /* ---------- 首页：作品横幅 ---------- */
  function renderWorks() {
    const el = $("#worksBanner");
    if (!el) return;
    const app = (window.APPS || [])[0];
    if (!app) {
      el.style.display = "none";
      return;
    }
    el.innerHTML =
      '<a class="works-banner" href="apps.html">' +
        '<img class="works-icon" src="' + esc(app.icon) + '" alt="' + esc(app.name) + '">' +
        '<span class="works-text"><span class="works-label">我的作品</span><b>' + esc(app.name) + "</b><small>" + esc(app.tagline) + "</small></span>" +
        '<span class="works-go">' + ICON.arrow + "</span>" +
      "</a>";
  }

  /* ---------- 作品页 ---------- */
  function renderApps() {
    const el = $("#apps");
    if (!el) return;
    const app = (window.APPS || [])[0];
    if (!app) {
      el.innerHTML = '<div class="widget" style="text-align:center">还没有作品，等一个想法。</div>';
      return;
    }

    const platform = (app.platform || []).map(function (p) {
      return '<span class="app-pill">' + esc(p) + "</span>";
    }).join("");

    const features = (app.features || [])
      .map(function (f) {
        return "<li>" + ICON.check + "<span>" + esc(f) + "</span></li>";
      })
      .join("");

    const downloads = (app.downloads || [])
      .map(function (d, i) {
        return (
          '<a class="dl-btn' + (i === 0 ? " primary" : "") + '" href="' + esc(d.url) + '">' +
          ICON.dl + "<span><b>" + esc(d.label) + "</b><small>" + esc(d.note || "") + "</small></span></a>"
        );
      })
      .join("");

    const changelog = (app.changelog || [])
      .map(function (c) {
        return (
          '<div class="tl-item">' +
          '<div class="tl-date">' + esc(c.date) + " · v" + esc(c.version) + "</div>" +
          '<div class="tl-title" style="font-weight:400;color:var(--text-2);font-size:14px">' + esc(c.text) + "</div>" +
          "</div>"
        );
      })
      .join("");

    const reqs = (app.requirements || []).map(esc).join("　·　");

    el.innerHTML =
      '<div class="app-card">' +
        '<div class="app-visual">' + mockWindow(app) + "</div>" +
        '<div class="app-info">' +
          '<div class="app-head">' +
            '<img class="app-icon" src="' + esc(app.icon) + '" alt="' + esc(app.name) + '">' +
            '<div class="app-titles">' +
              '<h2 class="app-name">' + esc(app.name) + "</h2>" +
              '<div class="app-pills"><span class="app-pill ver">v' + esc(app.version) + "</span>" + platform + "</div>" +
            "</div>" +
          "</div>" +
          '<p class="app-tagline">' + esc(app.tagline) + "</p>" +
          '<p class="app-desc">' + esc(app.desc) + "</p>" +
          (features ? '<ul class="app-features">' + features + "</ul>" : "") +
          '<div class="app-dl">' + downloads + "</div>" +
          '<div class="app-facts"><span>大小 ' + esc(app.size || "—") + '</span><span>更新于 ' + fmtDate(app.updated || SITE.since) + "</span></div>" +
        "</div>" +
      "</div>" +

      '<div class="app-sec">' +
        '<h3 class="widget-title">更新日志</h3>' +
        '<div class="timeline">' + changelog + "</div>" +
      "</div>" +

      '<div class="app-sec">' +
        '<h3 class="widget-title">系统要求</h3>' +
        '<p class="app-req">' + reqs + "</p>" +
      "</div>";
  }

  /* 软件界面示意窗（纯 CSS 画的，不是截图） */
  function mockWindow(app) {
    const rows = [62, 48, 71, 35, 55]
      .map(function (v) {
        return '<div class="mock-row"><b style="width:' + v + '%"></b><i>' + v + "%</i></div>";
      })
      .join("");
    const chart = [];
    for (let i = 0; i < 14; i++) {
      chart.push('<i style="height:' + (20 + Math.round(55 * Math.abs(Math.sin(i * 1.7 + 1)))) + '%"></i>');
    }
    return (
      '<div class="app-mock" aria-hidden="true">' +
      '<div class="mock-bar"><i></i><i></i><i></i><span>' + esc(app.name) + "</span></div>" +
      '<div class="mock-body">' +
      '<div class="mock-side"><span class="on"></span><span></span><span></span><span></span></div>' +
      '<div class="mock-main">' + rows + '<div class="mock-chart">' + chart.join("") + "</div></div>" +
      "</div>" +
      "</div>"
    );
  }

  /* ---------- 随机阅读 ---------- */
  function initRandom() {
    const btn = $("#randomPost");
    if (!btn || !POSTS.length) return;
    btn.addEventListener("click", function () {
      const p = POSTS[Math.floor(Math.random() * POSTS.length)];
      location.href = "post.html?id=" + encodeURIComponent(p.id);
    });
  }

  /* ---------- 搜索 ---------- */
  function initSearch() {
    const mask = $("#searchMask");
    if (!mask) return;
    const input = $("#searchInput");
    const box = $("#searchResults");
    const open = () => {
      mask.classList.add("open");
      setTimeout(() => input.focus(), 60);
      renderHits("");
    };
    const close = () => mask.classList.remove("open");

    function renderHits(q) {
      const kw = q.trim().toLowerCase();
      const hits = !kw
        ? POSTS.slice().sort(byDate).slice(0, 5)
        : POSTS.filter((p) => (p.title + p.excerpt + p.category + (p.tags || []).join("") + p.content).toLowerCase().includes(kw));
      if (!hits.length) {
        box.innerHTML = '<div class="search-empty">没有找到相关内容</div>';
        return;
      }
      box.innerHTML = hits
        .slice(0, 12)
        .map(
          (p) =>
            '<a class="search-hit" href="post.html?id=' + encodeURIComponent(p.id) + '">' +
            "<b>" + esc(p.title) + "</b>" +
            "<span>" + p.date + " · " + esc(p.category) + "</span></a>"
        )
        .join("");
    }

    $("#searchBtn").addEventListener("click", open);
    mask.addEventListener("click", (e) => { if (e.target === mask) close(); });
    input.addEventListener("input", (e) => renderHits(e.target.value));
    document.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") { e.preventDefault(); open(); }
      if (e.key === "Escape") close();
    });
  }

  /* ---------- 悬浮件 ---------- */
  function initDock() {
    const top = $("#toTop");
    if (top) {
      top.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
      const toggle = () => top.classList.toggle("show", window.scrollY > 400);
      toggle();
      window.addEventListener("scroll", toggle, { passive: true });
    }

    const kanban = $("#kanban");
    if (kanban) {
      const bubble = $("#bubble");
      const lines = [
        "今天也要好好吃饭呀。",
        "这篇文章你看到第几段了？",
        "深夜写的东西，第二天看总会想删掉。",
        "Ctrl + K 可以搜索哦。",
        "右上角可以切换夜间模式。",
        "有想说的话，去「关于」页找我。",
        "慢一点也没关系。"
      ];
      const say = () => {
        bubble.textContent = lines[Math.floor(Math.random() * lines.length)];
        bubble.classList.add("show");
        clearTimeout(say._t);
        say._t = setTimeout(() => bubble.classList.remove("show"), 5200);
      };
      $("img", kanban).addEventListener("click", say);
      if (!sessionStorage.getItem("kanban-hello")) {
        sessionStorage.setItem("kanban-hello", "1");
        setTimeout(say, 2600);
      }
      const closeBtn = $("#kanbanClose");
      if (closeBtn) closeBtn.addEventListener("click", () => kanban.classList.add("hide"));
    }

    const vinyl = $("#vinyl");
    if (vinyl) vinyl.addEventListener("click", () => vinyl.classList.toggle("playing"));
  }

  /* ---------- 页脚 ---------- */
  function renderFooter() {
    const f = $("#footer");
    if (!f) return;
    const y = new Date().getFullYear();
    f.innerHTML =
      '<div>© ' + (SITE.since ? SITE.since.slice(0, 4) : y) + " – " + y + " " + esc(SITE.title) +
        " · 由 " + esc(SITE.author) + " 亲手搭建</div>" +
      '<div class="line2">已经陪了我 <b style="color:var(--brand)">' + daysSince(SITE.since) + "</b> 天" +
        (SITE.icp ? " · " + esc(SITE.icp) : "") + "</div>";
  }

  /* ---------- 启动 ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    document.title =
      document.body.dataset.page === "home" ? SITE.title + " · " + SITE.subtitle : document.title;
    renderNav();
    initTheme();
    renderHero();
    initHeroBanner();
    renderSidebar();
    initRandom();
    renderWorks();
    renderPostList($("#postList"), POSTS.slice().sort(byDate));
    renderPost();
    renderArchive();
    renderAbout();
    renderApps();
    renderFooter();
    initSearch();
    initDock();
  });
})();
