(() => {
  const root = document.getElementById("brel-menu");
  if (!root || root.dataset.initialised) return;
  root.dataset.initialised = "true";
  const tabs = [...root.querySelectorAll(".menu-tab")];
  const panels = [...root.querySelectorAll(".menu-panel")];
  const subnavs = [...root.querySelectorAll(".menu-subnav")];
  const dietary = root.querySelector(".dietary-filter");
  const filterButtons = [...root.querySelectorAll(".dietary-filter-button")];
  let currentFilter = "all";
  function matches(item, filter) {
    if (filter === "all") return true;
    const tags = item.querySelector(
      ".menu-heading .menu-title > .dietary-tags",
    );
    if (!tags) return false;
    if (filter === "veggie") return !!tags.querySelector(".veggie,.vegan");
    return !!tags.querySelector("." + filter);
  }
  function applyFilter(filter) {
    currentFilter = filter;
    filterButtons.forEach((b) =>
      b.setAttribute(
        "aria-pressed",
        String(b.dataset.dietaryFilter === filter),
      ),
    );
    panels.forEach((panel) => {
      if (panel.id === "drinks-menu") return;
      panel
        .querySelectorAll(".box")
        .forEach((item) => (item.hidden = !matches(item, filter)));
      panel
        .querySelectorAll(".special-feature")
        .forEach((item) => (item.hidden = filter !== "all"));
      panel.querySelectorAll(".featured-board").forEach((item) => {
        item.hidden = filter !== "all";
      });
      panel.querySelectorAll(".section-container").forEach((section) => {
        const items = [
          ...section.querySelectorAll(
            ".box:not(.featured-board .box),.special-feature,.featured-board",
          ),
        ];
        section.hidden =
          filter !== "all" && !items.some((item) => !item.hidden);
        // Hide headings and empty size controls when filtering a section
      });
      const empty = panel.querySelector(".filter-empty-state");
      if (empty)
        empty.hidden =
          filter === "all" ||
          !!panel.querySelector(".section-container:not([hidden])");
      const subnav = root.querySelector(
        `.menu-subnav[data-subnav="${panel.id.replace("-menu", "")}"]`,
      );
      if (subnav)
        subnav.querySelectorAll('a[href^="#"]').forEach((link) => {
          const target = root.querySelector(link.getAttribute("href"));
          link.hidden =
            filter !== "all" &&
            !!target &&
            (target.hidden || !!target.closest(".section-container[hidden]"));
        });
    });
    refreshHeight();
  }
  function activateMenu(name, changeUrl = false) {
    if (!["food", "drinks", "kids"].includes(name)) name = "food";
    tabs.forEach((tab) =>
      tab.setAttribute("aria-selected", String(tab.dataset.menu === name)),
    );
    panels.forEach((panel) => (panel.hidden = panel.id !== name + "-menu"));
    subnavs.forEach((nav) => (nav.hidden = nav.dataset.subnav !== name));
    dietary.hidden = name === "drinks";
    applyFilter("all");
    if (changeUrl) history.pushState(null, "", "#" + name);
    requestAnimationFrame(() => {
      refreshHeight();
      window.dispatchEvent(new Event("resize"));
    });
  }
  function openFromHash() {
    const hash = decodeURIComponent(location.hash.slice(1));
    if (["food", "drinks", "kids"].includes(hash)) {
      activateMenu(hash);
      return;
    }
    const target = hash ? document.getElementById(hash) : null;
    if (target && root.contains(target)) {
      const panel = target.closest(".menu-panel");
      if (panel) {
        activateMenu(panel.id.replace("-menu", ""));
        requestAnimationFrame(() =>
          requestAnimationFrame(() =>
            target.scrollIntoView({ behavior: "smooth", block: "start" }),
          ),
        );
        return;
      }
    }
    activateMenu("food");
  }
  tabs.forEach((tab) =>
    tab.addEventListener("click", () => {
      activateMenu(tab.dataset.menu, true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }),
  );
  filterButtons.forEach((b) =>
    b.addEventListener("click", () => applyFilter(b.dataset.dietaryFilter)),
  );
  root.querySelectorAll(".drink-size-filter").forEach((group) => {
    // Prices are updated only until the next group heading, never across sections.
    let node = group.nextElementSibling;
    const nextGrid = node && node.classList.contains("box-grid") ? node : null;
    if (!nextGrid) return;
    const buttons = [...group.querySelectorAll(".drink-size-button")];
    buttons.forEach((button) =>
      button.addEventListener("click", () => {
        const ix = Number(button.dataset.priceIndex);
        buttons.forEach((b) =>
          b.setAttribute("aria-pressed", String(b === button)),
        );
        nextGrid.querySelectorAll(".drink-price").forEach((el) => {
          el.textContent = el.dataset.prices.split("|")[ix] || "—";
        });
      }),
    );
  });
  function refreshHeight() {
    const sqs = root.closest(".sqs-block");
    const fe = root.closest(".fe-block");
    const engine = root.closest(".fluid-engine");
    const section = root.closest(".page-section");
    if (sqs)
      sqs
        .querySelectorAll(".sqs-blockStatus,.removed-script")
        .forEach((e) => e.style.setProperty("display", "none", "important"));
    if (fe && engine) {
      fe.style.setProperty("grid-row-start", "1", "important");
      fe.style.setProperty("grid-row-end", "2", "important");
      fe.style.setProperty("height", "auto", "important");
      fe.style.setProperty("min-height", "0", "important");
      engine.style.setProperty(
        "grid-template-rows",
        "minmax(0,auto)",
        "important",
      );
      engine.style.setProperty("grid-auto-rows", "auto", "important");
      engine.style.setProperty("height", "auto", "important");
      engine.style.setProperty("min-height", "0", "important");
    }
    if (section) {
      section.style.setProperty("height", "auto", "important");
      section.style.setProperty("min-height", "0", "important");
    }
  }
  window.addEventListener("hashchange", openFromHash);
  window.addEventListener("load", refreshHeight);
  window.addEventListener("resize", () => requestAnimationFrame(refreshHeight));
  openFromHash();
})();
