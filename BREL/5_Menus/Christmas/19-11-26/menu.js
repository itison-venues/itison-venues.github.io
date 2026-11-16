/* Brel menu: loads three JSON files from the same GitHub Pages folder as this script. */
(() => {
  "use strict";
  const script = document.currentScript;
  const base = new URL(".", script ? script.src : location.href);
  const root = document.getElementById("brel-menu");
  if (!root) return;
  const names = ["food", "drinks", "kids"];
  const labels = { food: "Food", drinks: "Drinks", kids: "Kids" };
  const dietaryLabels = {
    all: "All",
    veggie: "Vegetarian",
    vegan: "Vegan",
    gluten: "Gluten Free",
  };
  const dietaryClass = {
    V: "veggie",
    VG: "vegan",
    VGA: "vegan",
    GF: "gluten",
    GFA: "gluten",
  };
  let active = "food";
  let filter = "all";
  const menus = {};

  const escape = (value) =>
    String(value ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  // Rich description/paragraph markup comes only from JSON files maintained in your own repository.
  // Do not insert untrusted third-party HTML into these fields.
  const rich = (value) => String(value || "");

  function itemMarkup(item, sizes) {
    const tags = (item.dietary || [])
      .map(
        (tag) =>
          `<span class="${dietaryClass[tag] || ""}">${escape(tag)}</span>`,
      )
      .join("");
    let price = escape(item.price || "");
    if (item.prices && item.prices.length) {
      price =
        sizes && sizes.length
          ? escape(item.prices[0])
          : escape(item.prices.join(" / "));
    }
    return `<div class="box" data-dietary="${escape((item.dietary || []).join(" "))}">
      <div class="menu-heading"><div class="menu-title"><span class="dish-name">${escape(item.name)}</span>${tags ? `<span class="dietary-tags">${tags}</span>` : ""}</div>
      <span class="price${item.prices && sizes ? " drink-price" : ""}"${item.prices && sizes ? ` data-prices="${escape(item.prices.join("|"))}"` : ""}>${price}</span></div>
      ${item.descriptionHtml ? `<div class="description">${rich(item.descriptionHtml)}</div>` : ""}
    </div>`;
  }

  function blockMarkup(block) {
    if (block.type === "special") {
      const image = block.image
        ? `<div class="special-media"><img src="${escape(block.image.src)}" alt="${escape(block.image.alt)}" loading="lazy"></div>`
        : "";
      const paragraphs = (block.paragraphs || [])
        .map((p) => `<p>${rich(p)}</p>`)
        .join("");
      const link = block.link
        ? `<a class="special-link" href="${escape(block.link.url)}">${escape(block.link.label)}</a>`
        : "";
      return `<div class="special-feature" id="${escape(block.id)}">${image}<div class="special-copy"><h4>${escape(block.title)}</h4>${paragraphs}${link}</div></div>`;
    }
    const title = block.title
      ? `<h4 class="group-heading">${escape(block.title)}</h4>`
      : "";
    const sizes = block.sizes || [];
    const picker = sizes.length
      ? `<div class="drink-size-filter" role="group" aria-label="${escape(block.title || "Drink")} serving size">${sizes.map((size, i) => `<button class="drink-size-button" type="button" data-price-index="${i}" aria-pressed="${i === 0}">${escape(size)}</button>`).join("")}</div>`
      : "";
    return `${title}${picker}<div class="box-grid">${(block.items || []).map((item) => itemMarkup(item, sizes)).join("")}</div>`;
  }

  function panelMarkup(name, data) {
    const sections = (data.sections || [])
      .map(
        (
          section,
        ) => `<section class="section-container${section.fullWidth ? " full-width" : ""}" id="${escape(section.id)}">
      <div class="title-container${section.headerAddon ? " menu-title-with-addon" : ""}"><h3 class="title">${escape(section.title)}</h3>${section.headerAddon ? `<span class="add-on header-add-on">${escape(section.headerAddon)}</span>` : ""}</div>
      ${(section.blocks || []).map(blockMarkup).join("")}
    </section>`,
      )
      .join("");
    const footnotes = (data.footnotes || []).length
      ? `<div class="menu-footnote">${data.footnotes.map((p) => `<p>${rich(p)}</p>`).join("")}</div>`
      : "";
    return `<div class="menu-panel" id="${name}-menu"${name !== "food" ? " hidden" : ""}><div class="header-container"><h2>${escape(data.title)}</h2></div><p class="filter-empty-state" hidden>No menu items match this dietary filter.</p><div class="menu-columns">${sections}</div>${footnotes}</div>`;
  }

  function subnavMarkup(name, data) {
    if (name === "kids") return "";
    const links = [];
    for (const section of data.sections || []) {
      links.push(
        `<a href="#${escape(section.id)}">${escape(section.title)}</a>`,
      );
      if (name === "food") {
        for (const block of section.blocks || []) {
          if (block.type === "special" && block.id)
            links.push(
              `<a href="#${escape(block.id)}">${escape(block.title)}</a>`,
            );
        }
      }
    }
    return `<nav class="menu-subnav" data-subnav="${name}" aria-label="${escape(labels[name])} sections"${name !== "food" ? " hidden" : ""}>${links.join("")}</nav>`;
  }

  function render() {
    const tabs = names
      .map(
        (name) =>
          `<button class="menu-tab" type="button" data-menu="${name}" aria-selected="${name === active}">${labels[name]}</button>`,
      )
      .join("");
    const filters = Object.entries(dietaryLabels)
      .map(
        ([key, label]) =>
          `<button class="dietary-filter-button" type="button" data-dietary-filter="${key}" aria-pressed="${key === filter}">${label}</button>`,
      )
      .join("");
    root.innerHTML = `<div class="menu-navigation"><nav class="menu-tabs" aria-label="Choose a menu">${tabs}</nav>
      ${subnavMarkup("food", menus.food)}${subnavMarkup("drinks", menus.drinks)}
      <div class="dietary-filter" aria-label="Filter by dietary requirement"><span class="dietary-filter-label">Filter:</span><div class="dietary-filter-buttons" role="group" aria-label="Dietary filters">${filters}</div></div></div>
      ${names.map((name) => panelMarkup(name, menus[name])).join("")}`;
    updateView();
  }

  function matchesDietary(itemTags) {
    if (filter === "all") return true;
    const tags = (itemTags || "").split(/\s+/);
    if (filter === "veggie")
      return tags.some((x) => ["V", "VG", "VGA"].includes(x));
    if (filter === "vegan") return tags.some((x) => ["VG", "VGA"].includes(x));
    if (filter === "gluten") return tags.some((x) => ["GF", "GFA"].includes(x));
    return true;
  }

  function updateView() {
    root
      .querySelectorAll(".menu-tab")
      .forEach((btn) =>
        btn.setAttribute("aria-selected", String(btn.dataset.menu === active)),
      );
    root.querySelectorAll(".menu-panel").forEach((panel) => {
      panel.hidden = panel.id !== `${active}-menu`;
    });
    root.querySelectorAll(".menu-subnav").forEach((nav) => {
      nav.hidden = nav.dataset.subnav !== active;
    });
    const dietary = root.querySelector(".dietary-filter");
    if (dietary) dietary.hidden = active === "drinks";
    root
      .querySelectorAll(".dietary-filter-button")
      .forEach((btn) =>
        btn.setAttribute(
          "aria-pressed",
          String(btn.dataset.dietaryFilter === filter),
        ),
      );
    for (const name of ["food", "kids"]) {
      const panel = root.querySelector(`#${name}-menu`);
      if (!panel) continue;
      let visibleCount = 0;
      panel.querySelectorAll(".box[data-dietary]").forEach((box) => {
        box.hidden = !matchesDietary(box.dataset.dietary);
        if (!box.hidden) visibleCount++;
      });
      panel.querySelectorAll(".box-grid").forEach((grid) => {
        grid.hidden = ![...grid.querySelectorAll(".box")].some(
          (box) => !box.hidden,
        );
      });
      panel.querySelectorAll(".section-container").forEach((section) => {
        const hasItems = [...section.querySelectorAll(".box")].some(
          (box) => !box.hidden,
        );
        const hasSpecial = !!section.querySelector(".special-feature");
        section.hidden = !hasItems && !hasSpecial;
      });
      const empty = panel.querySelector(".filter-empty-state");
      if (empty) empty.hidden = visibleCount > 0 || filter === "all";
    }
  }

  root.addEventListener("click", (event) => {
    const tab = event.target.closest(".menu-tab");
    if (tab && root.contains(tab)) {
      active = tab.dataset.menu;
      updateView();
      return;
    }
    const dietaryButton = event.target.closest(".dietary-filter-button");
    if (dietaryButton && root.contains(dietaryButton)) {
      filter = dietaryButton.dataset.dietaryFilter;
      updateView();
      return;
    }
    const sizeButton = event.target.closest(".drink-size-button");
    if (sizeButton && root.contains(sizeButton)) {
      const group = sizeButton.closest(".section-container .drink-size-filter");
      if (!group) return;
      const block = group.nextElementSibling;
      group
        .querySelectorAll(".drink-size-button")
        .forEach((btn) =>
          btn.setAttribute("aria-pressed", String(btn === sizeButton)),
        );
      if (block)
        block.querySelectorAll(".drink-price[data-prices]").forEach((price) => {
          const options = price.dataset.prices.split("|");
          price.textContent =
            options[Number(sizeButton.dataset.priceIndex)] || options[0];
        });
      return;
    }
    const anchor = event.target.closest(".menu-subnav a");
    if (anchor && root.contains(anchor)) {
      const target = document.getElementById(
        anchor.getAttribute("href").slice(1),
      );
      if (target) {
        event.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  });

  root.setAttribute("aria-busy", "true");
  root.textContent = "Loading menus…";
  Promise.all(
    names.map(async (name) => {
      const response = await fetch(new URL(`data/${name}.json`, base), {
        cache: "no-cache",
      });
      if (!response.ok)
        throw new Error(`${name}.json returned HTTP ${response.status}`);
      menus[name] = await response.json();
    }),
  )
    .then(() => {
      render();
      root.removeAttribute("aria-busy");
    })
    .catch((error) => {
      console.error("Brel menu load failed:", error);
      root.removeAttribute("aria-busy");
      root.textContent =
        "Menus are temporarily unavailable. Please ask our team for the latest menu.";
    });
})();
