  /* ---------------- Squarespace header offset ---------------- */
  function setSquarespaceHeaderHeight() {
    const candidates = [
      document.querySelector("header.Header"),
      document.querySelector("#header"),
      document.querySelector('header[role="banner"]'),
      document.querySelector(".sqs-site-frame .Header"),
    ].filter(Boolean);

    let h = 0;
    for (const el of candidates) {
      const rect = el.getBoundingClientRect();
      const isVisible = rect.height > 0 && getComputedStyle(el).display !== "none";
      if (isVisible) h = Math.max(h, rect.height);
    }
    document.documentElement.style.setProperty("--ssHeaderH", h + "px");
  }

  /* ---------------- Measure OUR sticky block height ---------------- */
  const navBarEl = document.getElementById("menuNavBar");
  function setStickyActualHeight() {
    if (!navBarEl) return;
    const stickyH = Math.ceil(navBarEl.getBoundingClientRect().height);
    document.documentElement.style.setProperty("--stickyActualH", stickyH + "px");
  }

  function getStickyOffsetPx() {
    const ss = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--ssHeaderH")) || 0;
    const st = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--stickyActualH")) || 0;
    return ss + st;
  }

  /* ---------------- Menu toggle + dynamic section nav ---------------- */
  const sectionNav = document.getElementById("sectionNav");

function updateNavFades() {
  const el = sectionNav; // #sectionNav is your .nav-buttons
  if (!el) return;

  const canScroll = el.scrollWidth > el.clientWidth + 1;
  el.classList.toggle("can-scroll", canScroll);

  if (!canScroll) {
    el.classList.remove("show-left", "show-right");
    return;
  }

  const left = el.scrollLeft;
  const maxLeft = el.scrollWidth - el.clientWidth;

  el.classList.toggle("show-left", left > 1);
  el.classList.toggle("show-right", left < maxLeft - 1);
}

// Call after nav is rebuilt AND on scroll/resize
sectionNav.addEventListener("scroll", updateNavFades, { passive: true });

const _buildNavFor = buildNavFor;
buildNavFor = function(menuWrap){
  _buildNavFor(menuWrap);
  updateNavFades();
};

window.addEventListener("resize", updateNavFades);
document.addEventListener("DOMContentLoaded", updateNavFades);


  // IMPORTANT: fix kids wrapper id to match HTML.
  // Either change HTML to id="kidsMenu" OR change this JS to "kidsMenu".
  const menus = {
    food:   { input: document.getElementById("menuFood"),   wrap: document.getElementById("foodMenu") },
    drinks: { input: document.getElementById("menuDrinks"), wrap: document.getElementById("drinksMenu") },
    kids:   { input: document.getElementById("menuKids"),   wrap: document.getElementById("kidsMenu") }, // <- was kidsMenu
  };

  let io = null;

  function getActiveWrap() {
    return Object.values(menus).find(m => m.input && m.input.checked)?.wrap || null;
  }

function buildNavFor(menuWrap) {
  if (!menuWrap) return;

  // Grab specials BEFORE we clear/replace nav contents
  const specials = document.getElementById("specialsNavWrap");

  const sections = Array.from(
    menuWrap.querySelectorAll('.section-anchor:not([data-hide-nav="true"])')
  );

  // Build new nav links as real nodes (safer than innerHTML)
  const links = sections.map(sec => {
    const a = document.createElement("a");
    a.href = `#${sec.id}`;
    a.textContent = sec.getAttribute("data-label") || sec.id;
    return a;
  });

  // Replace nav contents without destroying specials (if it exists)
  if (specials) {
    sectionNav.replaceChildren(specials, ...links);
  } else {
    sectionNav.replaceChildren(...links);
  }

  setStickyActualHeight();
  syncSpecialsVisibility(); // <-- IMPORTANT: update which specials show
}



  // Scope lookup to active wrap to avoid duplicate ID collisions
  function findSectionInActiveMenu(id) {
    const wrap = getActiveWrap();
    if (!wrap) return null;
    // Prefer exact id match inside the active menu
    return wrap.querySelector(`#${CSS.escape(id)}`);
  }

  function scrollToSectionId(id) {
    const target = findSectionInActiveMenu(id) || document.getElementById(id);
    if (!target) return;

    const topOffset = getStickyOffsetPx();
    const y = target.getBoundingClientRect().top + window.pageYOffset - topOffset;
    window.scrollTo({ top: y, behavior: "smooth" });
  }

  function setupActiveHighlighting() {
    if (io) io.disconnect();

    const navLinks = Array.from(sectionNav.querySelectorAll("a"));
    const sections = navLinks
      .map(a => {
        const id = a.getAttribute("href").slice(1);
        return findSectionInActiveMenu(id);
      })
      .filter(Boolean);

    navLinks.forEach(a => a.classList.remove("active"));
    if (navLinks[0]) navLinks[0].classList.add("active");

    const topOffset = getStickyOffsetPx();

    io = new IntersectionObserver((entries) => {
      const visible = entries
        .filter(e => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;

      navLinks.forEach(a => a.classList.remove("active"));
      const active = navLinks.find(a => a.getAttribute("href") === "#" + visible.target.id);
      if (active) active.classList.add("active");
    }, {
      threshold: [0.25, 0.4, 0.55],
      rootMargin: `-${topOffset}px 0px -60% 0px`,
    });

    sections.forEach(sec => io.observe(sec));
  }

  sectionNav.addEventListener("click", (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;

    e.preventDefault();
    const id = link.getAttribute("href").slice(1);
    scrollToSectionId(id);

    sectionNav.querySelectorAll("a").forEach(a => a.classList.remove("active"));
    link.classList.add("active");
  });

  /* ---------------- Specials dropdown ---------------- */
const specialsNavWrap = document.getElementById("specialsNavWrap");
const specialsBtn = document.getElementById("specialsBtn");
const specialsMenu = document.getElementById("specialsMenu");

function closeSpecials() {
  if (!specialsMenu || !specialsBtn) return;
  specialsMenu.classList.remove("open");
  specialsBtn.setAttribute("aria-expanded", "false");
  document.body.classList.remove("specials-open");
}

function positionSpecialsMenu(){
  if (!specialsMenu || !specialsBtn) return;

  const r = specialsBtn.getBoundingClientRect();

  specialsMenu.style.position = "fixed";
  specialsMenu.style.top = (r.bottom + 10) + "px";
  specialsMenu.style.zIndex = "20000";

  // Make sure we can measure it
  const menuRect = specialsMenu.getBoundingClientRect();
  const menuW = menuRect.width || 220;

  const viewportW = window.innerWidth;
  const gutter = 12;

  // Center under the button
  let left = r.left + (r.width / 2);

  // Clamp inside viewport
  const minLeft = gutter + (menuW / 2);
  const maxLeft = viewportW - gutter - (menuW / 2);
  left = Math.max(minLeft, Math.min(maxLeft, left));

  specialsMenu.style.left = left + "px";
  specialsMenu.style.transform = "translateX(-50%)";
}



function toggleSpecials() {
  const isOpen = specialsMenu.classList.toggle("open");
  specialsBtn.setAttribute("aria-expanded", String(isOpen));

  if (isOpen) {
    document.body.classList.add("specials-open");
    positionSpecialsMenu();
  } else {
    document.body.classList.remove("specials-open");
  }
}


// Show specials only if those anchors exist in the ACTIVE menu
function syncSpecialsVisibility() {
  if (!specialsNavWrap || !specialsMenu) return;
  const wrap = getActiveWrap();
  if (!wrap) { specialsNavWrap.style.display = "none"; return; }

  const links = Array.from(specialsMenu.querySelectorAll('a[href^="#"]'));
  let anyVisible = false;

  links.forEach(a => {
    const id = a.getAttribute("href").slice(1);
    const existsInActive = !!wrap.querySelector(`#${CSS.escape(id)}`);
    a.style.display = existsInActive ? "" : "none";
    if (existsInActive) anyVisible = true;
  });

  specialsNavWrap.style.display = anyVisible ? "" : "none";
  if (!anyVisible) closeSpecials();
}

  if (specialsBtn && specialsMenu) {
    specialsBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleSpecials();
    });

    specialsMenu.addEventListener("click", (e) => {
      e.stopPropagation();
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;

      e.preventDefault();
      const id = link.getAttribute("href").slice(1);
      closeSpecials();
      scrollToSectionId(id);
    });

    window.addEventListener("resize", () => {
      if (specialsMenu.classList.contains("open")) positionSpecialsMenu();
    });

    document.addEventListener("click", () => closeSpecials());

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeSpecials();
    });
  }


function setMenu(key, opts = {}) {
  const { scrollTop = true, pushState = true } = opts;

  Object.entries(menus).forEach(([k, m]) => {
    if (m.wrap) m.wrap.classList.toggle("active", k === key);
  });

  buildNavFor(menus[key]?.wrap);
  setupActiveHighlighting();

  if (pushState) {
    const url = new URL(window.location.href);
    url.searchParams.set("menu", key);
    history.replaceState(null, "", url.toString());
  }

  if (scrollTop) {
    const wrap = menus[key]?.wrap;
    const topOffset = getStickyOffsetPx();

    // Scroll to the first section in the newly active menu (or fall back to nav)
    const firstSection = wrap?.querySelector('.section-anchor');
    const targetEl = firstSection || navBarEl;

    const y = targetEl.getBoundingClientRect().top + window.pageYOffset - topOffset;
    window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
  }
}


  Object.entries(menus).forEach(([key, menu]) => {
    if (!menu.input) return;
    menu.input.addEventListener("change", () => {
      if (menu.input.checked) setMenu(key);
    });
  });

  function applyMenuFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const menu = (params.get("menu") || "food").toLowerCase();
    if (menus[menu]?.input) {
      menus[menu].input.checked = true;
      setMenu(menu, { scrollTop: false, pushState: false });
    }
  }

  function init() {
    setSquarespaceHeaderHeight();

    applyMenuFromUrl();                 // sets initial menu + nav
    setStickyActualHeight();            // ensure final sticky height

    // support ?menu=drinks#cocktail
    const hashId = (location.hash || "").replace("#", "");
    if (hashId) setTimeout(() => scrollToSectionId(hashId), 0);
  }

  document.addEventListener("DOMContentLoaded", init);

  window.addEventListener("resize", () => {
    setSquarespaceHeaderHeight();
    setStickyActualHeight();
    setupActiveHighlighting();
  });
