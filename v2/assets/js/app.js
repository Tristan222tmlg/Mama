/* Bessere Welt ergärtnern – v2 app
   Hash router (#seite, #seite--detail) plus the interactive parts: plant archive with
   filters, bloom calendar, plant finder, before/after garden, forms. */

(function () {
  "use strict";

  var BW = window.BW;
  var doc = document;
  doc.documentElement.classList.add("js");

  var NOW_MONTH = new Date().getMonth() + 1;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- helpers ---------- */

  function $(sel, root) { return (root || doc).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || doc).querySelectorAll(sel)); }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function icon(id, cls) {
    return '<svg class="i' + (cls ? " " + cls : "") + '" aria-hidden="true"><use href="#' + id + '"></use></svg>';
  }

  // mix a hex colour with white; amt = share of white
  function tint(hex, amt) {
    var n = parseInt(hex.slice(1), 16);
    var r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    var m = function (c) { return Math.round(c + (255 - c) * amt); };
    return "rgb(" + m(r) + "," + m(g) + "," + m(b) + ")";
  }

  var plantBy = {}, animalBy = {}, postBy = {};
  BW.plants.forEach(function (p) { plantBy[p.slug] = p; });
  BW.animals.forEach(function (a) { animalBy[a.slug] = a; a.hosts = []; });
  BW.posts.forEach(function (p) { postBy[p.slug] = p; });
  // reverse index: which plants does an animal use, and how
  BW.plants.forEach(function (p) {
    p.guests.forEach(function (gu) { animalBy[gu.a].hosts.push({ p: p, roles: gu.roles }); });
  });

  function monthSpan(ms, long) {
    var names = long ? BW.months : BW.monthsShort;
    var a = names[ms[0] - 1], b = names[ms[ms.length - 1] - 1];
    return ms.length > 1 ? a + (long ? " bis " : "–") + b : a;
  }

  function lightLabel(p) {
    return p.light.map(function (l) { return BW.light[l].label; }).join(" bis ");
  }

  // animal groups a plant feeds or shelters, plus "kinder" if it raises caterpillars/larvae
  function helps(p) {
    var set = {};
    p.guests.forEach(function (gu) {
      set[animalBy[gu.a].group] = true;
      if (gu.roles.indexOf("kinder") > -1) set.kinder = true;
    });
    return set;
  }

  function lens(item, kind, size) {
    var style = "--size:" + (typeof size === "number" ? size + "px" : size);
    if (item.photo) {
      return '<span class="lens" style="' + style + '"><img src="' + BW.img[item.photo] + '" alt="" loading="lazy" /></span>';
    }
    var ic = kind === "plant" ? BW.forms[item.form] : item.icon || BW.groups[item.group].icon;
    var bg = kind === "plant" ? tint(item.bloom, 0.55) : item.tint || BW.groups[item.group].tint || "var(--mist)";
    return '<span class="lens is-empty" style="' + style + ";--tint:" + bg + '">' + icon(ic) + "</span>";
  }

  function bloomStrip(p, large) {
    var cells = "";
    for (var m = 1; m <= 12; m++) {
      var cls = (p.months.indexOf(m) > -1 ? "on" : "") + (m === NOW_MONTH ? " now" : "");
      cells += '<span class="' + cls.trim() + '"></span>';
    }
    return '<span class="bloom' + (large ? " bloom-lg" : "") + '" style="--bloom:' + p.bloom + '" role="img" aria-label="Blüte von ' + monthSpan(p.months, true) + '">' + cells + "</span>";
  }

  function rolesHtml(roles) {
    return '<span class="roles">' + roles.map(function (r) {
      return '<span class="role">' + icon(BW.roles[r].icon) + BW.roles[r].label + "</span>";
    }).join("") + "</span>";
  }

  function readingMinutes(post) {
    var words = post.lede.split(/\s+/).length;
    post.body.forEach(function (b) {
      var t = b.p || b.h || b.tip || b.quote || (b.ul ? b.ul.join(" ") : "");
      words += t.split(/\s+/).length;
    });
    return Math.max(1, Math.round(words / 190));
  }

  var RING = '<svg class="ring" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="48.5" fill="none" stroke="url(#ring-grad)" stroke-width="1.3" stroke-linecap="round" pathLength="360" stroke-dasharray="150 16 166 28" transform="rotate(-62 50 50)" /></svg>';

  // Related plants or animals sit on the ring around the big lens.
  // Angles in degrees, 0 = top, clockwise; the caption sits at the bottom.
  var SAT_ANGLES = [[], [305], [305, 145], [305, 215, 40], [305, 235, 35, 145], [305, 235, 35, 145, 270]];
  function ringSats(items) {
    items = items.slice(0, 5);
    var angles = SAT_ANGLES[items.length];
    return '<div class="dsats" aria-hidden="true">' + items.map(function (it, i) {
      var a = (angles[i] * Math.PI) / 180;
      var x = 50 + 48.5 * Math.sin(a), y = 50 - 48.5 * Math.cos(a);
      return '<a class="dsat" tabindex="-1" href="' + it.href + '" style="--x:' + x.toFixed(1) + "%;--y:" + y.toFixed(1) + "%;--d:" + i * 0.12 + 's">' +
        lens(it.item, it.kind, "100%") + '<span class="sat-label">' + esc(it.item.name) + "</span></a>";
    }).join("") + "</div>";
  }

  // Posts without a photo get a typographic cover in the brand greens.
  function cover(post, cls) {
    return '<span class="' + cls + ' is-cover" aria-hidden="true">' +
      '<span class="cover-kicker">' + esc(post.kicker) + "</span>" +
      '<span class="cover-orb"><svg class="cover-ring" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" stroke-opacity=".55" stroke-width="1.2" stroke-linecap="round" pathLength="360" stroke-dasharray="230 22 70 38" transform="rotate(-20 50 50)" /></svg>' + icon(post.icon || "i-leaf") + "</span>" +
      '<span class="cover-word">' + esc(post.season) + "</span></span>";
  }

  function monthTips(month, title) {
    var tips = BW.calendar && BW.calendar[month - 1];
    if (!tips) return "";
    return '<div class="month-tips"><h3>' + title + "</h3><ul>" + tips.map(function (t) {
      return "<li><strong>" + esc(t[0]) + "</strong>" + esc(t[1]) + "</li>";
    }).join("") + "</ul></div>";
  }

  function slugify(t) {
    return t.toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  /* ---------- static hydration ---------- */

  $$("img[data-img]").forEach(function (img) { img.src = BW.img[img.getAttribute("data-img")]; });

  var cfg = BW.config;
  $$('[data-config="region"]').forEach(function (el) { el.textContent = cfg.region; });
  $$('[data-config="email-link"]').forEach(function (el) {
    el.href = "mailto:" + cfg.contactEmail;
    el.textContent = cfg.contactEmail;
  });
  $$('[data-config="email-note"]').forEach(function (el) {
    el.textContent = cfg.contactIsPlaceholder ? "Platzhalter – echte Adresse folgt" : "";
  });
  var year = $("#year");
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- header & navigation ---------- */

  var header = $(".site-header");
  var nav = $("#site-nav");
  var navToggle = $(".nav-toggle");

  function onScroll() { header.classList.toggle("is-scrolled", window.scrollY > 8); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  function setNav(open) {
    nav.classList.toggle("open", open);
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    $("use", navToggle).setAttribute("href", open ? "#i-close" : "#i-menu");
  }
  navToggle.addEventListener("click", function () { setNav(!nav.classList.contains("open")); });
  doc.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && nav.classList.contains("open")) { setNav(false); navToggle.focus(); }
  });

  var skip = $(".skip-link");
  if (skip) skip.addEventListener("click", function (e) {
    e.preventDefault();
    var main = $("#main");
    main.setAttribute("tabindex", "-1");
    main.focus();
  });

  /* ---------- reveal on scroll ---------- */

  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
    });
  }, { rootMargin: "0px 0px 10% 0px" }) : null;

  var REVEAL = ".section-head, .pair, .audience-card, .garden-legend li, .post-card, .formats li, .steps li, .values li, .timeline li, .project, .animal-card, .guest";

  // Only blocks that start below the fold get the entrance; whatever is on
  // screen when a view opens stays as it is, so every first frame is complete.
  function reveal(root) {
    if (!io || reduceMotion) return;
    var fold = window.innerHeight;
    $$(REVEAL, root).forEach(function (el) {
      if (el.classList.contains("reveal")) return;
      if (el.getBoundingClientRect().top < fold) return;
      var sibs = el.parentNode ? Array.prototype.indexOf.call(el.parentNode.children, el) : 0;
      el.style.setProperty("--rd", Math.min(sibs, 5) * 60 + "ms");
      el.classList.add("reveal");
      io.observe(el);
    });
  }

  /* ---------- router ---------- */

  var pages = $$(".page");
  var NAV_FOR = { pflanze: "pflanzen", tier: "pflanzen", artikel: "journal" };
  var firstRoute = true;

  function show(name, title) {
    var target = null;
    pages.forEach(function (pg) {
      var on = pg.getAttribute("data-page") === name;
      pg.hidden = !on;
      if (on) target = pg;
    });
    doc.title = title || target.getAttribute("data-title") || doc.title;
    var navKey = NAV_FOR[name] || name;
    $$("[data-nav]").forEach(function (a) {
      if (a.getAttribute("data-nav") === navKey) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
    setNav(false);
    // after the route has reset the scroll position
    requestAnimationFrame(function () { reveal(target); });
    return target;
  }

  function focusHeading(page) {
    if (firstRoute) return;
    var h = $("h1", page);
    if (h) h.focus({ preventScroll: true });
  }

  function scrollToSection(id) {
    var el = id && doc.getElementById(id);
    if (el) {
      requestAnimationFrame(function () { el.scrollIntoView({ block: "start", behavior: firstRoute || reduceMotion ? "auto" : "smooth" }); });
      return true;
    }
    window.scrollTo(0, 0);
    return false;
  }

  // Routes are plain hash names, so they survive being shared or embedded:
  // #ueber-mich, #pflanze--moschusmalve, #angebot--schulen, #artikel--liegen-lassen--a-laub-ist-kein-abfall
  var PAGES = ["start", "ueber-mich", "angebot", "pflanzen", "journal", "projekte", "faq", "kontakt", "impressum", "datenschutz"];
  var DETAIL = { pflanze: renderPlant, tier: renderAnimal, artikel: renderArticle };

  function route() {
    var raw = decodeURIComponent(location.hash.slice(1));
    var parts = (raw || "start").split("--");
    var name = parts[0], arg = parts[1], page;

    // in-page anchors that are not routes (e.g. a heading id) leave the view alone
    if (PAGES.indexOf(name) === -1 && !DETAIL[name] && doc.getElementById(raw)) {
      if (!firstRoute) return;
      name = "start";
    }

    if (name === "start") {
      page = show("start");
      initHome();
      window.scrollTo(0, 0);
    } else if (DETAIL[name]) {
      page = DETAIL[name](arg);
      if (scrollToSection(name === "artikel" ? parts[2] : null)) { firstRoute = false; return; }
    } else {
      if (PAGES.indexOf(name) === -1) name = "notfound";
      page = show(name);
      if (name === "angebot") selectTab(arg);
      if (name === "pflanzen") initPflanzen();
      if (name === "journal") renderJournalList();
      if (name === "kontakt") prefillTopic(arg);
      if (scrollToSection(name === "pflanzen" ? arg : null)) { firstRoute = false; return; }
    }
    focusHeading(page);
    firstRoute = false;
  }

  window.addEventListener("hashchange", route);

  /* ---------- home ---------- */

  var PAIRS = [
    { a: "zitronenfalter", p: ["faulbaum", "kreuzdorn"], note: "Seine Raupen fressen nur an Faulbaum und Kreuzdorn – an keinen anderen Pflanzen." },
    { a: "efeu-seidenbiene", p: ["efeu"], note: "Sie fliegt im Herbst, genau zur Efeublüte, und sammelt ihren Pollen fast nur dort." },
    { a: "eichenblattroller", p: ["stieleiche"], note: "Er rollt Eichenblätter zur Kinderstube für seine Larven – selten auch Edelkastanie, nie andere Blätter." },
    { a: "hauhechel-blaeuling", p: ["hornklee"], note: "Kinderstube der Raupen ist der Hornklee. Nektar holt sich der Falter zum Beispiel am Wilden Dost." },
  ];

  var homeReady = false;
  function initHome() {
    if (homeReady) return;
    homeReady = true;

    $("#pairs").innerHTML = PAIRS.map(function (pr) {
      var a = animalBy[pr.a];
      var ps = pr.p.map(function (s) { return plantBy[s]; });
      var plantLens = ps.length === 1 ? lens(ps[0], "plant", 58)
        : '<span class="lens-stack">' + lens(ps[0], "plant", 46) + lens(ps[1], "plant", 46) + "</span>";
      return '<li class="pair">' +
        '<a class="pair-end" href="#tier--' + a.slug + '">' + lens(a, "animal", 58) +
          "<span><strong>" + esc(a.name) + "</strong><em>" + esc(a.latin) + "</em></span></a>" +
        '<span class="pair-link" aria-hidden="true">' + icon("i-key") + "</span>" +
        '<div class="pair-end pair-plant">' + plantLens + "<span><strong>" +
          ps.map(function (p) { return '<a href="#pflanze--' + p.slug + '">' + esc(p.name) + "</a>"; }).join(" &amp; ") +
          "</strong><em>" + ps.map(function (p) { return esc(p.latin); }).join(" · ") + "</em></span></div>" +
        '<p class="pair-note">' + esc(pr.note) + "</p></li>";
    }).join("");

    renderNowBlooming();
    $("#journal-teasers").innerHTML = BW.posts.slice(0, 3).map(postCard).join("");
    initGarden();
    reveal($('[data-page="start"]'));

    var hero = $(".hero");
    var lensImg = $(".orbit-lens img");
    var go = function () { hero.classList.add("is-ready"); };
    if (lensImg.complete) go(); else { lensImg.addEventListener("load", go); setTimeout(go, 1200); }
  }

  function renderNowBlooming() {
    var month = BW.months[NOW_MONTH - 1];
    var now = BW.plants.filter(function (p) { return p.months.indexOf(NOW_MONTH) > -1; });
    var list = now.length
      ? '<ul class="now-list">' + now.map(function (p) {
          return '<li><a href="#pflanze--' + p.slug + '">' + lens(p, "plant", 40) + "<strong>" + esc(p.name) + "</strong></a></li>";
        }).join("") + "</ul>"
      : '<p>Jetzt ruht der Garten. Zeit für Samenstände, Laubhaufen und Pläne fürs Frühjahr – und für die Vögel, die von Beeren und Samen leben.</p>';
    $("#now-blooming").innerHTML =
      "<div><p class=\"eyebrow\">Was blüht gerade?</p><p class=\"now-month\">" + month + "</p>" +
      "<p>" + (now.length ? "Diese Pflanzen aus meinem Archiv blühen jetzt – und versorgen ihre Gäste." : "Im Winter blüht im Archiv nichts – und das ist ganz normal.") + "</p>" +
      '<a class="link-arrow" href="#pflanzen--kalender">Zum Blühkalender ' + icon("i-arrow") + "</a></div>" +
      "<div>" + list + monthTips(NOW_MONTH, "Jetzt im Garten: tun – oder lassen") + "</div>";
  }

  function postCard(post) {
    var media = post.photo
      ? '<span class="post-media"><img src="' + BW.img[post.photo] + '" alt="" loading="lazy" /></span>'
      : cover(post, "post-media");
    return '<a class="post-card" href="#artikel--' + post.slug + '">' + media +
      '<span><span class="post-kicker"><span class="chip">' + esc(post.kicker) + "</span>" + esc(post.season) + " · " + readingMinutes(post) + " Min. Lesezeit</span>" +
      "<h3>" + esc(post.title) + "</h3><p>" + esc(post.lede) + "</p></span></a>";
  }

  /* ---------- Pflanzen page ---------- */

  var pflanzenReady = false;
  function initPflanzen() {
    if (pflanzenReady) return;
    pflanzenReady = true;
    initFinder();
    initFilters();
    wireWheelBox($("#bloom-wheel"));
    renderWheel(NOW_MONTH);
    $("#animal-grid").innerHTML = BW.animals.map(function (a) {
      return '<li><a class="animal-card" href="#tier--' + a.slug + '">' + lens(a, "animal", 92) +
        "<strong>" + esc(a.name) + "</strong><em>" + esc(a.latin) + "</em><small>" +
        BW.groups[a.group].label + (a.hosts.length ? " · " + a.hosts.length + (a.hosts.length === 1 ? " Pflanze" : " Pflanzen") : "") +
        "</small></a></li>";
    }).join("");
    reveal($('[data-page="pflanzen"]'));
  }

  /* filters */

  var FILTERS = [
    { key: "light", label: "Standort", opts: [["sonne", "Sonne", "i-sun"], ["halbschatten", "Halbschatten", "i-halfsun"], ["schatten", "Schatten", "i-shade"]] },
    { key: "form", label: "Wuchs", opts: [["Staude", "Staude", "i-herb"], ["Strauch", "Strauch", "i-shrub"], ["Baum", "Baum", "i-tree"], ["Kletterpflanze", "Kletterpflanze", "i-vine"]] },
    { key: "season", label: "Blüte", opts: [["fruehling", "Frühling", "i-sprout"], ["sommer", "Sommer", "i-sun"], ["herbst", "Herbst", "i-leaf"]] },
    { key: "help", label: "Hilft", opts: [["biene", "Wildbienen & Hummeln", "i-bee"], ["falter", "Schmetterlingen", "i-butterfly"], ["kinder", "Raupen & Larven", "i-caterpillar"], ["vogel", "Vögeln", "i-bird"]] },
  ];
  var SEASONS = { fruehling: [3, 4, 5], sommer: [6, 7, 8], herbst: [9, 10, 11] };
  var fstate = { q: "", pot: false, light: {}, form: {}, season: {}, help: {} };

  function initFilters() {
    var box = $("#plant-filters");
    box.innerHTML =
      '<div class="filter-top">' +
        '<label class="search">' + icon("i-search") + '<span class="sr-only">Pflanzen durchsuchen</span>' +
          '<input type="search" id="plant-q" placeholder="Suchen: Name, Tier, Familie …" autocomplete="off" /></label>' +
        '<button type="button" class="toggle" data-pot aria-pressed="false">' + icon("i-pot") + "Für Balkon &amp; Topf</button>" +
        '<button type="button" class="filter-reset" hidden>' + icon("i-reset") + "Filter zurücksetzen</button>" +
      "</div>" +
      FILTERS.map(function (f) {
        return '<div class="filter-group" role="group" aria-label="' + f.label + '"><span class="filter-label" aria-hidden="true">' + f.label + "</span>" +
          f.opts.map(function (o) {
            return '<button type="button" class="toggle" data-key="' + f.key + '" data-val="' + o[0] + '" aria-pressed="false">' + icon(o[2]) + o[1] + "</button>";
          }).join("") + "</div>";
      }).join("");

    box.addEventListener("click", function (e) {
      var btn = e.target.closest("button");
      if (!btn) return;
      if (btn.classList.contains("filter-reset")) {
        fstate = { q: "", pot: false, light: {}, form: {}, season: {}, help: {} };
        $("#plant-q").value = "";
        $$("[aria-pressed]", box).forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
      } else if (btn.hasAttribute("data-pot")) {
        fstate.pot = !fstate.pot;
        btn.setAttribute("aria-pressed", String(fstate.pot));
      } else {
        var set = fstate[btn.getAttribute("data-key")], val = btn.getAttribute("data-val");
        if (set[val]) delete set[val]; else set[val] = true;
        btn.setAttribute("aria-pressed", String(!!set[val]));
      }
      applyFilters();
    });
    $("#plant-q").addEventListener("input", function (e) { fstate.q = e.target.value.trim().toLowerCase(); applyFilters(); });
    applyFilters();
  }

  function matches(p) {
    if (fstate.pot && !p.pot) return false;
    var keys = function (o) { return Object.keys(o); };
    if (keys(fstate.light).length && !p.light.some(function (l) { return fstate.light[l]; })) return false;
    if (keys(fstate.form).length && !fstate.form[p.form]) return false;
    if (keys(fstate.season).length && !keys(fstate.season).some(function (s) {
      return SEASONS[s].some(function (m) { return p.months.indexOf(m) > -1; });
    })) return false;
    if (keys(fstate.help).length) {
      var h = helps(p);
      if (!keys(fstate.help).some(function (k) { return h[k]; })) return false;
    }
    if (fstate.q) {
      var hay = [p.name, p.alias || "", p.latin, p.family, p.form].concat(p.guests.map(function (g) { return animalBy[g.a].name; })).join(" ").toLowerCase();
      if (hay.indexOf(fstate.q) === -1) return false;
    }
    return true;
  }

  function plantCard(p) {
    var h = helps(p);
    var helpIcons = ["biene", "falter", "vogel"].filter(function (k) { return h[k]; })
      .map(function (k) { return icon(BW.groups[k].icon); }).join("");
    var helpText = ["biene", "falter", "vogel"].filter(function (k) { return h[k]; })
      .map(function (k) { return BW.groups[k].label; }).join(", ");
    return '<li><a class="plant-card" href="#pflanze--' + p.slug + '">' + lens(p, "plant", 78) +
      "<span>" +
        '<span class="plant-name">' + esc(p.name) + "</span>" +
        '<span class="plant-latin">' + esc(p.latin) + "</span>" +
        bloomStrip(p) +
        '<span class="bloom-label">Blüte ' + monthSpan(p.months) + "</span>" +
        '<span class="plant-meta">' +
          "<span>" + icon(BW.forms[p.form]) + p.form + "</span>" +
          "<span>" + p.light.map(function (l) { return icon(BW.light[l].icon); }).join("") + '<span class="sr-only">' + lightLabel(p) + "</span></span>" +
          (p.pot ? "<span>" + icon("i-pot") + "Topf</span>" : "") +
          (helpIcons ? '<span title="Hilft: ' + helpText + '">' + helpIcons + '<span class="sr-only">Hilft: ' + helpText + "</span></span>" : "") +
        "</span>" +
      "</span></a></li>";
  }

  function applyFilters() {
    var list = BW.plants.filter(matches);
    var total = BW.plants.length;
    $("#plant-grid").innerHTML = list.length
      ? list.map(plantCard).join("")
      : '<li class="empty">Für diese Auswahl ist noch keine Pflanze im Archiv. Lockere die Filter – oder frag mich direkt.</li>';
    $("#plant-count").textContent = list.length === total ? total + " Pflanzen im Archiv" : list.length + " von " + total + " Pflanzen passen";
    var active = fstate.q || fstate.pot || ["light", "form", "season", "help"].some(function (k) { return Object.keys(fstate[k]).length; });
    $(".filter-reset").hidden = !active;
  }

  /* bloom wheel */

  function polar(c, r, deg) {
    var a = (deg * Math.PI) / 180;
    return [c + r * Math.sin(a), c - r * Math.cos(a)];
  }
  function arcPath(c, r, d0, d1) {
    var p0 = polar(c, r, d0), p1 = polar(c, r, d1);
    return "M" + p0[0].toFixed(2) + " " + p0[1].toFixed(2) + "A" + r + " " + r + " 0 " + (d1 - d0 > 180 ? 1 : 0) + " 1 " + p1[0].toFixed(2) + " " + p1[1].toFixed(2);
  }
  function wedgePath(c, r0, r1, d0, d1) {
    var a = polar(c, r0, d0), b = polar(c, r1, d0), d = polar(c, r1, d1), e = polar(c, r0, d1);
    return "M" + a.join(" ") + "L" + b.join(" ") + "A" + r1 + " " + r1 + " 0 0 1 " + d.join(" ") + "L" + e.join(" ") + "A" + r0 + " " + r0 + " 0 0 0 " + a.join(" ") + "Z";
  }

  var wheelMonth = NOW_MONTH;
  function renderWheel(month) {
    wheelMonth = month;
    var S = 600, C = S / 2, rIn = 96, rOut = 248;
    var plants = BW.plants.slice().sort(function (a, b) { return a.months[0] - b.months[0] || a.months.length - b.months.length; });
    var step = (rOut - rIn) / plants.length, w = step * 0.72;
    var svg = '<svg class="wheel" viewBox="0 0 ' + S + " " + S + '" aria-hidden="true">';

    for (var m = 1; m <= 12; m++) {
      svg += '<path class="month-wedge' + (m === month ? " sel" : "") + '" data-month="' + m + '" d="' + wedgePath(C, rIn - 10, rOut + 36, (m - 1) * 30, m * 30) + '" />';
    }
    plants.forEach(function (p, i) {
      var r = rIn + step * (i + 0.5);
      svg += '<circle class="track-bg" cx="' + C + '" cy="' + C + '" r="' + r.toFixed(2) + '" />';
      var cap = ((w / 2) / r) * (180 / Math.PI);
      var d = arcPath(C, r, (p.months[0] - 1) * 30 + cap + 1.5, p.months[p.months.length - 1] * 30 - cap - 1.5);
      svg += '<path class="arc-edge" d="' + d + '" stroke-width="' + (w + 1.6).toFixed(2) + '" />' +
        '<path class="arc" data-slug="' + p.slug + '" d="' + d + '" stroke="' + p.bloom + '" stroke-width="' + w.toFixed(2) + '"><title>' + esc(p.name) + ": " + monthSpan(p.months, true) + "</title></path>";
    });
    for (var k = 0; k < 12; k++) {
      var a0 = polar(C, rIn - 8, k * 30), a1 = polar(C, rOut + 6, k * 30);
      svg += '<line class="divider" x1="' + a0[0] + '" y1="' + a0[1] + '" x2="' + a1[0] + '" y2="' + a1[1] + '" />';
    }
    for (var n = 1; n <= 12; n++) {
      var pt = polar(C, rOut + 22, (n - 0.5) * 30);
      svg += '<text class="month-label' + (n === month ? " sel" : "") + '" x="' + pt[0].toFixed(1) + '" y="' + pt[1].toFixed(1) + '">' + BW.monthsShort[n - 1] + "</text>";
    }
    var tick = polar(C, rOut + 38, (NOW_MONTH - 0.5) * 30);
    svg += '<circle class="now-tick" cx="' + tick[0].toFixed(1) + '" cy="' + tick[1].toFixed(1) + '" r="4" />';
    var count = plants.filter(function (p) { return p.months.indexOf(month) > -1; }).length;
    svg += '<text class="center-month" x="' + C + '" y="' + (C - 2) + '">' + BW.months[month - 1] + "</text>" +
      '<text class="center-count" x="' + C + '" y="' + (C + 24) + '">' + (count ? count + (count === 1 ? " Pflanze blüht" : " Pflanzen blühen") : "Winterruhe") + "</text></svg>";

    var blooming = plants.filter(function (p) { return p.months.indexOf(month) > -1; });
    var side = '<div class="wheel-side">' +
      '<div class="wheel-months" role="group" aria-label="Monat wählen">' +
        BW.monthsShort.map(function (lbl, idx) {
          return '<button type="button" data-month="' + (idx + 1) + '" aria-pressed="' + (idx + 1 === month) + '" aria-label="' + BW.months[idx] + '">' + lbl + "</button>";
        }).join("") + "</div>" +
      "<h3>Im " + BW.months[month - 1] + (month === NOW_MONTH ? " – also jetzt –" : "") + " blühen</h3>" +
      (blooming.length
        ? '<ul class="wheel-list">' + blooming.map(function (p) {
            return '<li><a href="#pflanze--' + p.slug + '" data-slug="' + p.slug + '"><span class="dot" style="--bloom:' + p.bloom + '"></span><strong>' + esc(p.name) + "</strong><em>" + monthSpan(p.months) + "</em></a></li>";
          }).join("") + "</ul>"
        : '<p class="wheel-empty">In diesem Monat blüht keine Pflanze aus dem Archiv. Jetzt zählen Samenstände, Beeren und ein ruhiger Laubhaufen.</p>') +
      monthTips(month, (month === NOW_MONTH ? "Jetzt" : "Im " + BW.months[month - 1]) + ": tun – oder lassen") +
      "</div>";

    var box = $("#bloom-wheel");
    box.innerHTML = svg + side;
    wireWheelSvg(box);
  }

  // The container persists across re-renders, so its listeners are bound once;
  // the SVG is replaced on every month change and gets fresh listeners.
  var wheelHover = function () {};
  function wireWheelSvg(box) {
    var svg = $("svg", box);
    var center = $(".center-month", svg), count = $(".center-count", svg);
    var monthText = center.textContent, countText = count.textContent;

    wheelHover = function (slug) {
      svg.classList.toggle("has-hover", !!slug);
      $$(".arc", svg).forEach(function (a) { a.classList.toggle("hover", a.getAttribute("data-slug") === slug); });
      $$(".wheel-list a", box).forEach(function (a) { a.classList.toggle("hover", a.getAttribute("data-slug") === slug); });
      var p = slug && plantBy[slug];
      center.textContent = p ? p.name : monthText;
      count.textContent = p ? monthSpan(p.months, true) : countText;
    };
    svg.addEventListener("mouseover", function (e) {
      var arc = e.target.closest(".arc");
      wheelHover(arc ? arc.getAttribute("data-slug") : null);
    });
    svg.addEventListener("mouseleave", function () { wheelHover(null); });
    svg.addEventListener("click", function (e) {
      var arc = e.target.closest(".arc");
      if (arc) { location.hash = "#pflanze--" + arc.getAttribute("data-slug"); return; }
      var wedge = e.target.closest(".month-wedge");
      if (wedge) renderWheel(+wedge.getAttribute("data-month"));
    });
  }

  function wireWheelBox(box) {
    box.addEventListener("mouseover", function (e) {
      var a = e.target.closest(".wheel-list a");
      if (a) wheelHover(a.getAttribute("data-slug"));
    });
    box.addEventListener("mouseout", function (e) {
      if (e.target.closest(".wheel-list a") && !(e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest(".wheel-list a"))) wheelHover(null);
    });
    box.addEventListener("click", function (e) {
      var b = e.target.closest(".wheel-months button");
      if (!b) return;
      var m = b.getAttribute("data-month");
      renderWheel(+m);
      $('.wheel-months button[data-month="' + m + '"]', box).focus();
    });
  }

  /* finder */

  var QUIZ = [
    { key: "ort", q: "Wo möchtest du etwas verändern?", opts: [["balkon", "Balkon oder Terrasse", "i-pot"], ["garten", "Garten – Beet oder Wiese", "i-herb"], ["hecke", "Hecke oder Gehölzrand", "i-shrub"], ["gelaende", "Schul- oder Firmengelände", "i-building"]] },
    { key: "licht", q: "Wie viel Sonne bekommt der Ort?", opts: [["sonne", "Sonnig", "i-sun"], ["halbschatten", "Halbschattig", "i-halfsun"], ["schatten", "Eher schattig", "i-shade"]] },
    { key: "wem", q: "Wem möchtest du vor allem helfen?", opts: [["biene", "Wildbienen & Hummeln", "i-bee"], ["falter", "Schmetterlingen", "i-butterfly"], ["vogel", "Vögeln", "i-bird"], ["alle", "Allen ein bisschen", "i-heart"]] },
    { key: "wann", q: "Wann soll es vor allem blühen?", opts: [["fruehling", "Im Frühling", "i-sprout"], ["sommer", "Im Sommer", "i-sun"], ["herbst", "Im Herbst", "i-leaf"], ["lange", "Möglichst lange", "i-calendar"]] },
  ];
  var answers = {}, qStep = 0;

  function scorePlant(p, a) {
    var s = 0, why = [];
    if (a.ort === "balkon") {
      if (!p.pot) return null;
      s += 3; why.push("wächst auch im Topf");
    } else if (a.ort === "garten") {
      if (p.form === "Staude") { s += 2; why.push("Staude fürs Beet"); } else if (p.form === "Baum") s -= 2;
    } else if (a.ort === "hecke") {
      if (p.form === "Strauch") { s += 3; why.push("Strauch für eine freiwachsende Hecke"); }
      else if (p.form === "Kletterpflanze") { s += 2; why.push("rankt an Hecke und Mauer"); }
      else if (p.form === "Staude" && p.light.indexOf("halbschatten") > -1) { s += 1; why.push("passt an den Gehölzrand"); }
      else s -= 1;
    } else if (a.ort === "gelaende") {
      if (p.form === "Baum" || p.form === "Strauch") { s += 2; why.push("viel Wirkung auf großer Fläche"); } else s += 1;
    }
    if (p.light.indexOf(a.licht) > -1) { s += 2; why.push("mag " + BW.light[a.licht].label); } else s -= 3;
    var h = helps(p);
    if (a.wem === "alle") {
      var n = ["biene", "falter", "vogel"].filter(function (k) { return h[k]; }).length;
      s += n; if (n >= 2) why.push("hilft mehreren Tiergruppen");
    } else if (h[a.wem]) {
      s += 3;
      if (a.wem === "falter") why.push(h.kinder && p.guests.some(function (g) { return animalBy[g.a].group === "falter" && g.roles.indexOf("kinder") > -1; }) ? "Kinderstube für Raupen" : "Nektar für Falter");
      else why.push(a.wem === "biene" ? "Futter für Wildbienen" : "Futter und Schutz für Vögel");
    }
    if (a.wann === "lange") {
      if (p.months.length >= 4) { s += 2; why.push("blüht " + monthSpan(p.months, true)); }
    } else if (SEASONS[a.wann].some(function (m) { return p.months.indexOf(m) > -1; })) {
      s += 2; why.push("blüht " + monthSpan(p.months, true));
    }
    return s > 1 ? { p: p, s: s, why: why } : null;
  }

  function initFinder() {
    var box = $("#finder-app");
    box.innerHTML = '<div class="finder-intro"><p class="eyebrow">Pflanzen-Finder</p><h2>Vier Fragen, ein paar Vorschläge</h2>' +
      "<p>Beantworte vier kurze Fragen – ich schlage dir Pflanzen aus meinem Archiv vor, die zu deinem Ort passen. Für einen richtigen Plan sprechen wir dann am besten persönlich.</p></div>" +
      '<div class="finder-stage" aria-live="polite"></div>';
    box.addEventListener("click", function (e) {
      var opt = e.target.closest(".finder-option");
      if (opt) {
        answers[QUIZ[qStep].key] = opt.getAttribute("data-val");
        $$(".finder-option", box).forEach(function (b) { b.setAttribute("aria-pressed", String(b === opt)); });
        setTimeout(function () { qStep++; drawFinder(true); }, reduceMotion ? 0 : 160);
      }
      if (e.target.closest(".finder-back")) { qStep = Math.max(0, qStep - 1); drawFinder(true); }
      if (e.target.closest(".finder-restart")) { answers = {}; qStep = 0; drawFinder(true); }
    });
    drawFinder(false);
  }

  function drawFinder(moveFocus) {
    var stage = $("#finder-app .finder-stage");
    var bars = QUIZ.map(function (_, i) { return '<span class="' + (i < qStep ? "done" : i === qStep ? "current" : "") + '"></span>'; }).join("");
    if (qStep < QUIZ.length) {
      var step = QUIZ[qStep];
      stage.innerHTML = '<div class="finder-progress" aria-hidden="true">' + bars + "</div>" +
        '<div class="finder-step" role="group" aria-labelledby="finder-q">' +
          '<h3 class="finder-q" id="finder-q" tabindex="-1">' + '<span class="sr-only">Frage ' + (qStep + 1) + " von " + QUIZ.length + ": </span>" + step.q + "</h3>" +
          '<div class="finder-options">' + step.opts.map(function (o) {
            return '<button type="button" class="finder-option" data-val="' + o[0] + '" aria-pressed="' + (answers[step.key] === o[0]) + '">' + icon(o[2]) + o[1] + "</button>";
          }).join("") + "</div>" +
          '<div class="finder-nav"><button type="button" class="finder-back"' + (qStep === 0 ? " disabled" : "") + ">" + icon("i-arrow-left") + "Zurück</button>" +
          '<span class="result-count">Frage ' + (qStep + 1) + " von " + QUIZ.length + "</span></div>" +
        "</div>";
      if (moveFocus) $("#finder-q").focus({ preventScroll: true });
      return;
    }
    var results = BW.plants.map(function (p) { return scorePlant(p, answers); }).filter(Boolean)
      .sort(function (a, b) { return b.s - a.s; }).slice(0, 4);
    stage.innerHTML = '<div class="finder-progress" aria-hidden="true">' + bars + "</div>" +
      '<h3 class="finder-q" id="finder-q" tabindex="-1">' + (results.length ? "Das könnte zu deinem Ort passen" : "Dafür planen wir am besten gemeinsam") + "</h3>" +
      (results.length
        ? '<ul class="finder-results">' + results.map(function (r) {
            return '<li><a class="finder-result" href="#pflanze--' + r.p.slug + '">' + lens(r.p, "plant", 58) +
              "<span><strong>" + esc(r.p.name) + '</strong><span class="why">' + esc(r.why.join(" · ")) + "</span></span></a></li>";
          }).join("") + "</ul>"
        : "<p>Für diese Kombination habe ich noch keine passende Pflanze im Archiv – aber ganz sicher eine Idee. Schreib mir, dann schauen wir uns deinen Ort zusammen an.</p>") +
      '<div class="actions"><a class="btn btn-primary" href="#kontakt">Gemeinsam planen ' + icon("i-arrow") + "</a>" +
      '<button type="button" class="btn btn-quiet finder-restart">' + icon("i-reset") + "Neu starten</button></div>";
    if (moveFocus) $("#finder-q").focus({ preventScroll: true });
  }

  /* ---------- detail pages ---------- */

  function pager(list, idx, base, label) {
    var prev = list[(idx - 1 + list.length) % list.length], next = list[(idx + 1) % list.length];
    return '<nav class="pager" aria-label="Weitere ' + label + '">' +
      '<a href="' + base + prev.slug + '"><span>' + icon("i-arrow-left") + " Zurück</span><strong>" + esc(prev.name || prev.title) + "</strong></a>" +
      '<a href="' + base + next.slug + '"><span>Weiter ' + icon("i-arrow") + "</span><strong>" + esc(next.name || next.title) + "</strong></a></nav>";
  }

  function renderPlant(slug) {
    var p = plantBy[slug];
    if (!p) return show("notfound");
    var months = BW.monthsShort.map(function (m) { return "<span>" + m.charAt(0) + "</span>"; }).join("");
    var guests = p.guests.map(function (gu) {
      var a = animalBy[gu.a];
      return '<li><a class="guest" href="#tier--' + a.slug + '">' + lens(a, "animal", 64) +
        "<span><strong>" + esc(a.name) + "</strong>" + rolesHtml(gu.roles) + "</span></a></li>";
    }).join("");
    var idx = BW.plants.indexOf(p);
    $("#plant-detail").innerHTML =
      '<section class="section"><div class="wrap">' +
        '<nav class="crumbs" aria-label="Brotkrumen"><a href="#pflanzen--archiv">' + icon("i-arrow-left") + "Pflanzenarchiv</a></nav>" +
        '<div class="detail-hero">' +
          '<figure class="detail-lens">' + lens(p, "plant", "100%") + RING +
            ringSats(p.guests.map(function (gu) { return { item: animalBy[gu.a], kind: "animal", href: "#tier--" + gu.a }; })) +
            "<figcaption>" + esc(p.photoCaption || "Foto folgt") + "</figcaption></figure>" +
          "<div>" +
            '<p class="eyebrow">' + esc(p.family) + "</p>" +
            '<h1 class="detail-title" tabindex="-1">' + esc(p.name) + (p.alias ? ' <span class="detail-alias">(' + esc(p.alias) + ")</span>" : "") + "</h1>" +
            '<p class="detail-latin">' + esc(p.latin) + (p.latinNote ? " <small>– " + esc(p.latinNote) + "</small>" : "") + "</p>" +
            '<p class="lede">' + esc(p.lede) + "</p>" +
            '<dl class="specs">' +
              "<div><dt>Wuchs</dt><dd>" + icon(BW.forms[p.form]) + p.form + "</dd></div>" +
              "<div><dt>Höhe</dt><dd>" + esc(p.height) + "</dd></div>" +
              "<div><dt>Standort</dt><dd>" + p.light.map(function (l) { return icon(BW.light[l].icon); }).join("") + lightLabel(p) + "</dd></div>" +
              "<div><dt>Boden</dt><dd>" + esc(p.soil) + "</dd></div>" +
              "<div><dt>Blüte</dt><dd>" + monthSpan(p.months, true) + "</dd></div>" +
              "<div><dt>Balkon &amp; Topf</dt><dd>" + (p.pot ? icon("i-check") + "geeignet" : "besser im Garten") + "</dd></div>" +
            "</dl>" +
            bloomStrip(p, true) + '<div class="bloom-months" aria-hidden="true">' + months + "</div>" +
          "</div>" +
        "</div>" +
      "</div></section>" +
      '<section class="section tint"><div class="wrap detail-body">' +
        '<div class="prose">' + p.text.map(function (t) { return "<p>" + esc(t) + "</p>"; }).join("") +
          (p.steckbrief ? '<figure class="steckbrief"><img src="' + BW.img[p.steckbrief] + '" alt="Sabines Steckbrief der ' + esc(p.name) + ' mit Wuchshöhe, Blütezeit und tierischen Gästen" loading="lazy" /><figcaption>Mein Steckbrief zur ' + esc(p.name) + " – so sieht das Format aus, in dem ich Pflanzen vorstelle.</figcaption></figure>" : "") +
        "</div>" +
        "<div><h2>Wer hier zu Gast ist</h2><ul class=\"guests\">" + guests + "</ul>" +
          '<div style="margin-top:1.4rem">' +
          (p.tip ? '<div class="callout">' + icon("i-sprout") + "<p><strong>Tipp</strong>" + esc(p.tip) + "</p></div>" : "") +
          (p.note ? '<div class="callout callout-warn">' + icon("i-warn") + "<p><strong>Gut zu wissen</strong>" + esc(p.note) + "</p></div>" : "") +
          "</div></div>" +
      "</div></section>" +
      '<div class="wrap" style="padding-bottom:clamp(2.5rem,6vw,4.5rem)">' + pager(BW.plants, idx, "#pflanze--", "Pflanzen") + "</div>";
    return show("pflanze", p.name + " – Pflanzenarchiv – Bessere Welt ergärtnern");
  }

  function renderAnimal(slug) {
    var a = animalBy[slug];
    if (!a) return show("notfound");
    var hosts = a.hosts.length
      ? '<ul class="guests">' + a.hosts.map(function (h) {
          return '<li><a class="guest" href="#pflanze--' + h.p.slug + '">' + lens(h.p, "plant", 64) +
            "<span><strong>" + esc(h.p.name) + "</strong>" + rolesHtml(h.roles) + "</span></a></li>";
        }).join("") + "</ul>"
      : '<p class="prose">' + esc(a.needs || "") + "</p>";
    var more = a.readMore && postBy[a.readMore]
      ? '<a class="link-arrow" href="#artikel--' + a.readMore + '" style="margin-top:1.2rem">Im Journal: ' + esc(postBy[a.readMore].title) + " " + icon("i-arrow") + "</a>"
      : "";
    var idx = BW.animals.indexOf(a);
    $("#animal-detail").innerHTML =
      '<section class="section"><div class="wrap">' +
        '<nav class="crumbs" aria-label="Brotkrumen"><a href="#pflanzen--tiere">' + icon("i-arrow-left") + "Alle Tiere</a></nav>" +
        '<div class="detail-hero">' +
          '<figure class="detail-lens">' + lens(a, "animal", "100%") + RING +
            ringSats(a.hosts.map(function (h) { return { item: h.p, kind: "plant", href: "#pflanze--" + h.p.slug }; })) +
            "<figcaption>" + (a.photo ? esc(a.name) : "Foto folgt") + "</figcaption></figure>" +
          "<div>" +
            '<p class="eyebrow">' + BW.groups[a.group].label + (a.isGroup ? " · Gruppe" : "") + "</p>" +
            '<h1 class="detail-title" tabindex="-1">' + esc(a.name) + "</h1>" +
            '<p class="detail-latin">' + esc(a.latin) + "</p>" +
            '<p class="lede">' + esc(a.lede) + "</p>" +
            '<dl class="specs"><div><dt>Unterwegs</dt><dd>' + icon("i-calendar") + esc(a.active) + "</dd></div>" +
            "<div><dt>Braucht</dt><dd>" + (a.hosts.length ? a.hosts.length + (a.hosts.length === 1 ? " Pflanze" : " Pflanzen") + " im Archiv" : "eine selten gemähte Wiese") + "</dd></div></dl>" +
          "</div>" +
        "</div>" +
      "</div></section>" +
      '<section class="section tint"><div class="wrap detail-body">' +
        '<div class="prose">' + a.text.map(function (t) { return "<p>" + esc(t) + "</p>"; }).join("") + more + "</div>" +
        "<div><h2>" + (a.hosts.length ? "Diese Pflanzen braucht es" : "Was es braucht") + "</h2>" + hosts + "</div>" +
      "</div></section>" +
      '<div class="wrap" style="padding-bottom:clamp(2.5rem,6vw,4.5rem)">' + pager(BW.animals, idx, "#tier--", "Tiere") + "</div>";
    return show("tier", a.name + " – Tiere – Bessere Welt ergärtnern");
  }

  /* ---------- journal ---------- */

  var journalReady = false;
  function renderJournalList() {
    if (journalReady) return;
    journalReady = true;
    $("#journal-list").innerHTML = BW.posts.map(postCard).join("");
    reveal($('[data-page="journal"]'));
  }

  var articleShown = null;
  function renderArticle(slug) {
    var post = postBy[slug];
    if (!post) return show("notfound");
    var title = post.title + " – Journal – Bessere Welt ergärtnern";
    // jumping within the open article (?zu=...) keeps the page and focus as they are
    if (articleShown === slug && !$('[data-page="artikel"]').hidden) return show("artikel", title);
    articleShown = slug;
    var toc = [];
    var body = post.body.map(function (b) {
      if (b.h) {
        var id = "a-" + slugify(b.h);
        toc.push('<li><a href="#artikel--' + post.slug + "--" + id + '">' + esc(b.h) + "</a></li>");
        return '<h2 id="' + id + '">' + esc(b.h) + "</h2>";
      }
      if (b.p) return "<p>" + esc(b.p) + "</p>";
      if (b.ul) return "<ul>" + b.ul.map(function (li) { return "<li>" + esc(li) + "</li>"; }).join("") + "</ul>";
      if (b.quote) return "<blockquote>" + esc(b.quote) + "</blockquote>";
      if (b.tip) return '<div class="callout">' + icon("i-sprout") + "<p><strong>Tipp</strong>" + esc(b.tip) + "</p></div>";
      return "";
    }).join("");
    var related = (post.plants || []).map(function (s) {
      var p = plantBy[s];
      return '<a href="#pflanze--' + p.slug + '">' + lens(p, "plant", 34) + esc(p.name) + "</a>";
    }).concat((post.animals || []).map(function (s) {
      var a = animalBy[s];
      return '<a href="#tier--' + a.slug + '">' + lens(a, "animal", 34) + esc(a.name) + "</a>";
    })).join("");
    var media = post.photo
      ? '<figure class="article-media"><img src="' + BW.img[post.photo] + '" alt="" /></figure>'
      : cover(post, "article-media");
    var idx = BW.posts.indexOf(post);
    $("#article").innerHTML =
      '<section class="section"><div class="wrap">' +
        '<nav class="crumbs" aria-label="Brotkrumen"><a href="#journal">' + icon("i-arrow-left") + "Journal</a></nav>" +
        '<header class="article-head"><p class="eyebrow">' + esc(post.kicker) + "</p>" +
          '<h1 tabindex="-1">' + esc(post.title) + "</h1>" +
          '<p class="lede">' + esc(post.lede) + "</p>" +
          '<div class="article-meta"><span class="chip">' + esc(post.season) + "</span><span>" + readingMinutes(post) + " Min. Lesezeit</span><span>von Sabine Schröder-Gravendyck</span></div>" +
        "</header>" + media +
        '<div class="article-layout">' +
          '<div class="article-body">' + body + "</div>" +
          '<aside class="article-aside" aria-label="Zum Beitrag">' +
            (toc.length > 1 ? '<nav class="aside-block toc-block" aria-label="Inhalt"><h2>Inhalt</h2><ol class="toc">' + toc.join("") + "</ol></nav>" : "") +
            (related ? '<div class="aside-block"><h2>In diesem Beitrag</h2><div class="related-list">' + related + "</div></div>" : "") +
            '<div class="aside-block author"><img src="' + BW.img.portrait + '" alt="" width="54" height="54" />' +
              "<p><strong>Sabine Schröder-Gravendyck</strong>Tierärztin und Begleiterin für lebendige Gärten</p>" +
              '<a class="link-arrow" href="#kontakt">Frag mich direkt ' + icon("i-arrow") + "</a></div>" +
          "</aside>" +
        "</div>" +
        pager(BW.posts, idx, "#artikel--", "Beiträge") +
      "</div></section>";
    return show("artikel", title);
  }

  /* ---------- Angebot tabs ---------- */

  var tabs = $$('[role="tab"]');
  function selectTab(key, focus) {
    var tab = tabs.filter(function (t) { return t.getAttribute("data-key") === key; })[0];
    if (!tab) return;
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      $("#" + t.getAttribute("aria-controls")).hidden = !on;
    });
    if (focus) tab.focus();
  }
  tabs.forEach(function (t, i) {
    t.addEventListener("click", function () { selectTab(t.getAttribute("data-key")); });
    t.addEventListener("keydown", function (e) {
      var dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (e.key === "Home") dir = -i;
      if (e.key === "End") dir = tabs.length - 1 - i;
      if (!dir) return;
      e.preventDefault();
      selectTab(tabs[(i + dir + tabs.length) % tabs.length].getAttribute("data-key"), true);
    });
  });

  /* ---------- garden before/after ---------- */

  function rng(seed) {
    return function () {
      seed = (seed + 0x6d2b79f5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function paintScene(lush, W, H, dpr) {
    var cv = doc.createElement("canvas");
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    var g = cv.getContext("2d");
    g.scale(dpr, dpr);
    // Narrow boxes (phones) keep the scene's own proportions; the extra height becomes sky.
    var boxH = H;
    H = Math.min(H, W / 2.35);
    var skyOff = boxH - H;
    var R = rng(lush ? 7 : 11);
    var u = Math.min(W / 1200, H / 520) * 1.0;
    var ground = H * 0.86;
    var pick = function (arr) { return arr[Math.floor(R() * arr.length)]; };
    var between = function (a, b) { return a + R() * (b - a); };
    function ell(x, y, rx, ry, rot, col) {
      g.fillStyle = col;
      g.beginPath();
      g.ellipse(x, y, Math.max(rx, 0.3), Math.max(ry, 0.3), rot, 0, Math.PI * 2);
      g.fill();
    }
    function dot(x, y, r, col) { ell(x, y, r, r, 0, col); }
    function rrect(x, y, w, h, r) {
      g.beginPath();
      if (g.roundRect) g.roundRect(x, y, w, h, r); else g.rect(x, y, w, h);
      g.fill();
    }
    // Organic outline: a superellipse whose radius wobbles with the angle.
    // inside() and path() use the same polar angle, so fill and leaves agree.
    function blobShape(cx, cy, rx, ry, n) {
      var ph = [R() * 6.3, R() * 6.3, R() * 6.3];
      var lump = function (t) { return 1 + 0.06 * Math.sin(6 * t + ph[0]) + 0.045 * Math.sin(11 * t + ph[1]) + 0.03 * Math.sin(17 * t + ph[2]); };
      return {
        inside: function (x, y) {
          var dx = (x - cx) / rx, dy = (y - cy) / ry;
          return Math.pow(Math.pow(Math.abs(dx), n) + Math.pow(Math.abs(dy), n), 1 / n) < lump(Math.atan2(dy, dx));
        },
        path: function () {
          g.beginPath();
          for (var i = 0; i <= 200; i++) {
            var t = (i / 200) * Math.PI * 2, c = Math.cos(t), s = Math.sin(t);
            var nx = Math.sign(c) * Math.pow(Math.abs(c), 2 / n), ny = Math.sign(s) * Math.pow(Math.abs(s), 2 / n);
            var L = lump(Math.atan2(ny, nx));
            if (i) g.lineTo(cx + rx * L * nx, cy + ry * L * ny); else g.moveTo(cx + rx * L * nx, cy + ry * L * ny);
          }
          g.closePath();
        },
        topAt: function (x) {
          for (var y = cy - ry * 1.3; y < cy; y += 1) if (this.inside(x, y)) return y;
          return cy - ry;
        },
      };
    }
    function clipToGround(draw) {
      g.save();
      g.beginPath();
      g.rect(0, -skyOff, W, ground + 3 * u + skyOff);
      g.clip();
      draw();
      g.restore();
    }

    var sky = g.createLinearGradient(0, 0, 0, boxH);
    sky.addColorStop(0, lush ? "#E5EEF3" : "#EDEFEE");
    sky.addColorStop(0.8, lush ? "#F3F6EC" : "#F2F3F1");
    g.fillStyle = sky;
    g.fillRect(0, 0, W, boxH);
    g.translate(0, skyOff);

    // soft ground shadow across the scene
    var sh = g.createRadialGradient(W * 0.5, ground + 8 * u, 0, W * 0.5, ground + 8 * u, W * 0.55);
    sh.addColorStop(0, lush ? "rgba(44,99,52,0.16)" : "rgba(90,96,90,0.14)");
    sh.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = sh;
    g.fillRect(0, ground - 40 * u, W, H - ground + 40 * u);

    /* hedge (left) */
    var hx0 = W * 0.03, hx1 = W * 0.27, htop = H * 0.15;
    if (!lush) {
      g.fillStyle = "#8C958A";
      rrect(hx0 + W * 0.01, htop, hx1 - hx0 - W * 0.02, ground - htop + 4 * u, 5 * u);
      for (var i = 0; i < 1400; i++) {
        g.fillStyle = R() < 0.55 ? "rgba(60,68,58,0.16)" : "rgba(255,255,255,0.14)";
        g.fillRect(between(hx0 + W * 0.01, hx1 - W * 0.01), between(htop, ground), 2.2 * u, 3.4 * u);
      }
      g.fillStyle = "rgba(255,255,255,0.18)";
      g.fillRect(hx0 + W * 0.01, htop, hx1 - hx0 - W * 0.02, 4 * u);
    } else {
      // free-growing hedge: taller and wider than the clipped one, ragged edge
      var htop2 = H * 0.11, hry = (ground - htop2) / 2 + H * 0.05;
      var hedge = blobShape(W * 0.15, htop2 + hry, W * 0.13, hry, 2.6);
      var light = ["#8DB43F", "#A4C463", "#6E9D44", "#7BA84A"], dark = ["#2C6334", "#3A7139", "#558A3D", "#22502E", "#447C3C"];
      clipToGround(function () {
        hedge.path();
        g.fillStyle = "#1C442A";
        g.fill();
        for (var l = 0; l < 5600; l++) {
          var x = between(0, W * 0.32), y = between(htop2 - H * 0.04, ground + 4 * u);
          if (!hedge.inside(x, y)) continue;
          var t = (y - htop2) / (ground - htop2);
          var lit = R() < (1 - t) * 0.6 + (x < W * 0.12 ? 0.1 : 0);
          ell(x, y, between(4.5, 8.5) * u, between(2.2, 4.2) * u, R() * Math.PI, lit ? pick(light) : pick(dark));
        }
        for (var f = 0; f < 26; f++) {
          var fx = between(0, W * 0.3), fy = between(htop2, H * 0.55);
          if (!hedge.inside(fx, fy)) continue;
          for (var fl = 0; fl < 8; fl++) dot(fx + between(-6, 6) * u, fy + between(-4, 4) * u, 1.7 * u, "rgba(255,255,255,0.95)");
        }
        for (var be = 0; be < 30; be++) {
          var ex = between(0, W * 0.3), ey = between(H * 0.3, ground - 18 * u);
          if (!hedge.inside(ex, ey)) continue;
          var col = R() < 0.55 ? "#8E1F2F" : "#2B1B30";
          for (var bq = 0; bq < 4; bq++) dot(ex + between(-4, 4) * u, ey + between(-3, 3) * u, 2.3 * u, col);
        }
      });
      // robin on the hedge top
      var rx = W * 0.13;
      var ry = hedge.topAt(rx) - 5 * u;
      g.fillStyle = "#5E4636";
      g.beginPath(); g.moveTo(rx - 9 * u, ry + 1 * u); g.lineTo(rx - 19 * u, ry - 4 * u); g.lineTo(rx - 17 * u, ry + 4 * u); g.closePath(); g.fill();
      ell(rx, ry, 10 * u, 7.5 * u, -0.15, "#6E5340");
      ell(rx + 4 * u, ry + 1.5 * u, 5.5 * u, 5.5 * u, 0, "#E0733A");
      dot(rx + 8 * u, ry - 6 * u, 5.2 * u, "#6E5340");
      ell(rx + 10 * u, ry - 4 * u, 3.2 * u, 3 * u, 0, "#E0733A");
      dot(rx + 10.5 * u, ry - 7.5 * u, 1.1 * u, "#1D1712");
      g.fillStyle = "#2E241C";
      g.beginPath(); g.moveTo(rx + 13 * u, ry - 6.5 * u); g.lineTo(rx + 17 * u, ry - 5.5 * u); g.lineTo(rx + 13 * u, ry - 4.5 * u); g.closePath(); g.fill();
    }

    /* lawn band (middle) */
    var lx0 = W * 0.2, lx1 = W * 0.8, lh = 18 * u;
    g.fillStyle = lush ? "#4F8A3F" : "#9AA396";
    rrect(lx0, ground - lh * 0.55, lx1 - lx0, lh, lh / 2);
    if (!lush) {
      g.strokeStyle = "rgba(110,118,108,0.7)";
      g.lineWidth = 1.2 * u;
      for (var gx = lx0 + 8 * u; gx < lx1 - 8 * u; gx += 7 * u) {
        g.beginPath(); g.moveTo(gx, ground - lh * 0.5); g.lineTo(gx, ground - lh * 0.5 - 4 * u); g.stroke();
      }
    } else {
      var grass = ["#3E7638", "#558A3D", "#6E9D44", "#8DB43F", "#2C6334"];
      g.lineCap = "round";
      for (var gb = 0; gb < 1100; gb++) {
        var sx = between(lx0 + 6 * u, lx1 - 6 * u), sy = ground - lh * 0.35 + between(-2, 2) * u;
        var hgt = between(5, 22) * u, lean = between(-5, 5) * u;
        g.strokeStyle = pick(grass);
        g.lineWidth = between(1, 1.8) * u;
        g.beginPath(); g.moveTo(sx, sy); g.quadraticCurveTo(sx + lean * 0.3, sy - hgt * 0.6, sx + lean, sy - hgt); g.stroke();
      }
      var islands = [
        { cx: 0.31, cols: ["#E7BE2E", "#F3D65A", "#FFFFFF"] },
        { cx: 0.43, cols: ["#4E79C4", "#6C8FD6", "#8C5FB6"] },
        { cx: 0.555, cols: ["#E36FA9", "#B76E9F", "#C7A3D6"] },
        { cx: 0.67, cols: ["#E7BE2E", "#E58BB5", "#FFFFFF", "#4E79C4"] },
      ];
      var maxStem = Math.min(78 * u, H * 0.34);
      islands.forEach(function (isl) {
        var n = 16 + Math.floor(R() * 8);
        for (var s = 0; s < n; s++) {
          var bxs = W * isl.cx + between(-0.05, 0.05) * W, bys = ground - lh * 0.3;
          var top = bys - between(0.35, 1) * maxStem, lean2 = between(-8, 8) * u;
          g.strokeStyle = pick(["#3E7638", "#558A3D", "#2C6334"]);
          g.lineWidth = 1.4 * u;
          g.beginPath(); g.moveTo(bxs, bys); g.quadraticCurveTo(bxs + lean2 * 0.2, (bys + top) / 2, bxs + lean2, top); g.stroke();
          var c = pick(isl.cols), fx2 = bxs + lean2, fy2 = top;
          if (c === "#FFFFFF") {
            for (var pt = 0; pt < 7; pt++) {
              var ang = (pt / 7) * Math.PI * 2;
              ell(fx2 + Math.cos(ang) * 3.4 * u, fy2 + Math.sin(ang) * 3.4 * u, 2.6 * u, 1.3 * u, ang, "#FFFFFF");
            }
            dot(fx2, fy2, 1.8 * u, "#E7BE2E");
          } else {
            dot(fx2, fy2, between(3, 5.2) * u, c);
            if (R() < 0.5) dot(fx2 + between(-4, 4) * u, fy2 + between(2, 6) * u, between(2, 3.4) * u, c);
          }
        }
      });
    }

    /* shrub (right) */
    var scx = W * 0.865;
    if (!lush) {
      // rhododendron: a compact grey dome of long, leathery leaves
      var rtop = H * 0.24, rry = (ground - rtop) / 2 + H * 0.03;
      var rhodo = blobShape(scx, rtop + rry, W * 0.1, rry, 2);
      clipToGround(function () {
        rhodo.path();
        g.fillStyle = "#7E867C";
        g.fill();
        for (var rl = 0; rl < 1300; rl++) {
          var lx = scx + between(-0.13, 0.13) * W, ly = between(rtop - H * 0.04, ground);
          if (!rhodo.inside(lx, ly)) continue;
          ell(lx, ly, between(9, 15) * u, between(3.2, 5) * u, R() * Math.PI, pick(["#7A8278", "#8C948A", "#9AA298", "#6F776D", "#848C82"]));
        }
      });
    } else {
      // native shrub: soft dark haze behind a layered leafy dome
      var stop = H * 0.16, sry = (ground - stop) / 2 + H * 0.05;
      var shrub = blobShape(scx, stop + sry, W * 0.11, sry, 2.15);
      var scy = stop + sry;
      clipToGround(function () {
        for (var wc = 0; wc < 34; wc++) {
          var a2 = R() * Math.PI * 2, r2 = Math.sqrt(R());
          var wx = scx + Math.cos(a2) * r2 * W * 0.1, wy = scy - H * 0.1 + Math.sin(a2) * r2 * sry * 0.7;
          var wr = between(40, 76) * u;
          var hz = g.createRadialGradient(wx, wy, 0, wx, wy, wr);
          hz.addColorStop(0, "rgba(28,68,42,0.2)");
          hz.addColorStop(1, "rgba(28,68,42,0)");
          g.fillStyle = hz;
          g.fillRect(wx - wr, wy - wr, wr * 2, wr * 2);
        }
        shrub.path();
        g.fillStyle = "#20482C";
        g.fill();
        var sLight = ["#8DB43F", "#A4C463", "#7BA84A", "#B4CE77"], sDark = ["#2C6334", "#3E7638", "#558A3D", "#447C3C", "#6E9D44"];
        for (var sl = 0; sl < 4400; sl++) {
          var lx2 = scx + between(-0.15, 0.15) * W, ly2 = between(stop - H * 0.04, ground + 4 * u);
          if (!shrub.inside(lx2, ly2)) continue;
          var tt = (ly2 - stop) / (ground - stop);
          var lit2 = R() < (1 - tt) * 0.55 + (lx2 < scx ? 0.12 : 0);
          ell(lx2, ly2, between(4, 7.5) * u, between(2, 3.6) * u, R() * Math.PI, lit2 ? pick(sLight) : pick(sDark));
        }
        // feathery edge: fine sprigs reaching out of the outline
        g.lineCap = "round";
        for (var fe = 0; fe < 1400; fe++) {
          var ex2 = scx + between(-0.15, 0.15) * W, ey2 = between(stop - H * 0.02, ground - 10 * u);
          if (!shrub.inside(ex2, ey2) || shrub.inside(ex2, ey2 - 9 * u)) continue;
          var ang3 = -Math.PI / 2 + between(-0.7, 0.7), len3 = between(6, 14) * u;
          g.strokeStyle = pick(sLight);
          g.lineWidth = between(1, 1.6) * u;
          g.beginPath(); g.moveTo(ex2, ey2); g.lineTo(ex2 + Math.cos(ang3) * len3, ey2 + Math.sin(ang3) * len3); g.stroke();
        }
        for (var wf = 0; wf < 22; wf++) {
          var bx2 = scx + between(-0.1, 0.1) * W, by2 = between(stop, H * 0.55);
          if (!shrub.inside(bx2, by2)) continue;
          for (var wfl = 0; wfl < 7; wfl++) dot(bx2 + between(-5, 5) * u, by2 + between(-4, 4) * u, 1.6 * u, "rgba(255,255,255,0.95)");
        }
        for (var sbe = 0; sbe < 16; sbe++) {
          var bx3 = scx + between(-0.1, 0.1) * W, by3 = between(H * 0.4, ground - 20 * u);
          if (!shrub.inside(bx3, by3)) continue;
          for (var sbq = 0; sbq < 3; sbq++) dot(bx3 + between(-3, 3) * u, by3 + between(-3, 3) * u, 2.2 * u, "#8E1F2F");
        }
      });
    }

    /* life */
    if (lush) {
      var flies = [
        { x: 0.39, y: 0.44, c: "#F2D64B", s: 1.1, r: -0.3 },
        { x: 0.5, y: 0.3, c: "#7FA8E8", s: 0.95, r: 0.25 },
        { x: 0.62, y: 0.47, c: "#E58A3A", s: 1, r: -0.15 },
        { x: 0.715, y: 0.28, c: "#F2D64B", s: 0.8, r: 0.35 },
      ];
      flies.forEach(function (fl) {
        var x = fl.x * W, y = fl.y * H, s = fl.s * u;
        g.save(); g.translate(x, y); g.rotate(fl.r);
        ell(-6 * s, -4 * s, 7 * s, 5 * s, -0.5, fl.c);
        ell(6 * s, -4 * s, 7 * s, 5 * s, 0.5, fl.c);
        ell(-4.5 * s, 4.5 * s, 4.5 * s, 3.4 * s, 0.6, fl.c);
        ell(4.5 * s, 4.5 * s, 4.5 * s, 3.4 * s, -0.6, fl.c);
        ell(0, 0, 1.3 * s, 7 * s, 0, "#2B2A22");
        g.restore();
      });
      for (var bz = 0; bz < 7; bz++) {
        var bxx = between(0.28, 0.7) * W, byy = ground - between(0.18, 0.4) * H;
        ell(bxx - 2 * u, byy - 3 * u, 3 * u, 2 * u, -0.5, "rgba(255,255,255,0.8)");
        ell(bxx + 2 * u, byy - 3 * u, 3 * u, 2 * u, 0.5, "rgba(255,255,255,0.8)");
        ell(bxx, byy, 4 * u, 2.8 * u, 0, "#D8A221");
        g.fillStyle = "#2B2A22";
        g.fillRect(bxx - 1.2 * u, byy - 2.6 * u, 1.3 * u, 5.2 * u);
        g.fillRect(bxx + 1.6 * u, byy - 2.4 * u, 1.1 * u, 4.8 * u);
      }
    }
    return cv;
  }

  function initGarden() {
    var box = $("#garden");
    if (!box) return;
    var canvas = $("canvas", box), range = $(".garden-range", box);
    var split = 0.5, before = null, after = null, lastW = 0;

    function build() {
      var r = box.getBoundingClientRect();
      if (!r.width || Math.round(r.width) === lastW) return;
      lastW = Math.round(r.width);
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
      before = paintScene(false, r.width, r.height, dpr);
      after = paintScene(true, r.width, r.height, dpr);
      compose();
    }
    function compose() {
      if (!before) return;
      var ctx = canvas.getContext("2d");
      var sx = Math.round(split * canvas.width);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(before, 0, 0);
      ctx.save();
      ctx.beginPath();
      ctx.rect(sx, 0, canvas.width - sx, canvas.height);
      ctx.clip();
      ctx.drawImage(after, 0, 0);
      ctx.restore();
      box.style.setProperty("--split", split * 100 + "%");
      range.value = Math.round(split * 100);
    }
    var drag = false;
    function move(e) {
      var r = box.getBoundingClientRect();
      split = Math.min(0.98, Math.max(0.02, (e.clientX - r.left) / r.width));
      compose();
    }
    box.addEventListener("pointerdown", function (e) { drag = true; box.setPointerCapture(e.pointerId); move(e); });
    box.addEventListener("pointermove", function (e) { if (drag) move(e); });
    box.addEventListener("pointerup", function () { drag = false; });
    box.addEventListener("pointercancel", function () { drag = false; });
    range.addEventListener("input", function () { split = range.value / 100; compose(); });

    if ("ResizeObserver" in window) {
      var t;
      new ResizeObserver(function () { clearTimeout(t); t = setTimeout(build, 120); }).observe(box);
    } else {
      window.addEventListener("resize", build);
    }
    build();
  }

  /* ---------- forms ---------- */

  var TOPICS = { privat: "Garten, Balkon oder Hof", schulen: "Schule oder Kita", unternehmen: "Unternehmen oder Gelände", workshop: "Vortrag oder Workshop", programm: "Online-Programm (Pilotgruppe)", sonstiges: "Anfrage" };

  function prefillTopic(key) {
    if (key && TOPICS[key]) $("#f-topic").value = key;
  }

  var emailOk = function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); };

  function fieldError(input, msg) {
    var err = $("#" + input.id + "-err");
    input.setAttribute("aria-invalid", msg ? "true" : "false");
    if (err) err.textContent = msg || "";
    return !msg;
  }

  var form = $("#contact-form");
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = $("#f-name"), email = $("#f-email"), msg = $("#f-message"), consent = $("#f-consent");
    var ok = [
      fieldError(name, name.value.trim() ? "" : "Wie darf ich dich ansprechen?"),
      fieldError(email, emailOk(email.value.trim()) ? "" : "Bitte gib eine gültige E-Mail-Adresse an, damit ich antworten kann."),
      fieldError(msg, msg.value.trim().length >= 10 ? "" : "Erzähl mir in ein, zwei Sätzen, worum es geht."),
      fieldError(consent, consent.checked ? "" : "Bitte bestätige, dass ich deine Angaben dafür verwenden darf."),
    ];
    if (ok.indexOf(false) > -1) {
      $('[aria-invalid="true"]', form).focus();
      return;
    }
    var topic = TOPICS[$("#f-topic").value];
    var body = "Name: " + name.value.trim() + "\nE-Mail: " + email.value.trim() +
      ($("#f-place").value.trim() ? "\nOrt/Fläche: " + $("#f-place").value.trim() : "") + "\n\n" + msg.value.trim();
    var done = $("#contact-success");
    if (cfg.contactIsPlaceholder) {
      done.innerHTML = icon("i-check") + "<p><strong>Danke, " + esc(name.value.trim()) + "!</strong>" +
        "Deine Nachricht ist fertig vorbereitet. In dieser Vorschau ist noch keine E-Mail-Adresse hinterlegt – auf der fertigen Seite öffnet sich jetzt dein E-Mail-Programm mit der Nachricht.</p>";
    } else {
      location.href = "mailto:" + cfg.contactEmail + "?subject=" + encodeURIComponent("Anfrage über die Website: " + topic) + "&body=" + encodeURIComponent(body);
      done.innerHTML = icon("i-check") + "<p><strong>Danke, " + esc(name.value.trim()) + "!</strong>Dein E-Mail-Programm öffnet sich mit der fertigen Nachricht – du musst sie nur noch absenden.</p>";
    }
    done.hidden = false;
    done.focus();
  });
  $$("input, textarea", form).forEach(function (el) {
    el.addEventListener("input", function () { if (el.getAttribute("aria-invalid") === "true") fieldError(el, ""); });
  });

  var letter = $("#letter-form");
  letter.addEventListener("submit", function (e) {
    e.preventDefault();
    var input = $("#l-email"), out = $("#l-msg");
    if (!emailOk(input.value.trim())) {
      out.className = "letter-msg err";
      out.textContent = "Bitte gib eine gültige E-Mail-Adresse ein.";
      input.focus();
      return;
    }
    out.className = "letter-msg";
    if (cfg.contactIsPlaceholder) {
      out.textContent = "Vorschau: Die Anmeldung zum Gartenbrief wird noch angebunden – es wurde nichts gespeichert.";
    } else {
      location.href = "mailto:" + cfg.contactEmail + "?subject=" + encodeURIComponent("Gartenbrief abonnieren") + "&body=" + encodeURIComponent("Bitte nimm " + input.value.trim() + " in den Gartenbrief auf.");
      out.textContent = "Danke! Dein E-Mail-Programm öffnet sich – einfach absenden.";
    }
  });

  /* ---------- go ---------- */

  route();
})();
