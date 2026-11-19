
  function setupDrinkPriceFilter(section) {
    const buttons = section.querySelectorAll(".drink-size-button");
    const prices = section.querySelectorAll(".drink-price");

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        const selectedIndex = Number(button.dataset.priceIndex);

        // Only change buttons inside THIS section
        buttons.forEach((sectionButton) => {
          sectionButton.setAttribute(
            "aria-pressed",
            sectionButton === button ? "true" : "false",
          );
        });

        // Only change prices inside THIS section
        prices.forEach((price) => {
          const priceOptions = price.dataset.prices.split("|");

          price.textContent = priceOptions[selectedIndex] || "—";
        });
      });
    });
  }

  document
    .querySelectorAll("#drinks-menu .section-container")
    .forEach((section) => {
      if (section.querySelector(".drink-size-filter")) {
        setupDrinkPriceFilter(section);
      }
    });

  (() => {
    const menuTabs = document.querySelectorAll(".menu-tab");
    const menuPanels = document.querySelectorAll(".menu-panel");
    const menuSubnavs = document.querySelectorAll(".menu-subnav");
    const dietaryFilter = document.querySelector(".dietary-filter");
    const dietaryFilterButtons = document.querySelectorAll(
      ".dietary-filter-button",
    );

    let activeDietaryFilter = "all";

    /* ----------------------------------------------------------
     DIETARY MATCHING
     Only PRIMARY dish tags make a dish qualify for a filter.
     Topping tags are handled separately and never qualify the dish.
     ---------------------------------------------------------- */

    function itemHasPrimaryDietaryTag(item, filterName) {
      const primaryTagContainer = item.querySelector(
        ".menu-heading .menu-title > .dietary-tags",
      );

      if (!primaryTagContainer) {
        return false;
      }

      // Vegan dishes also qualify as vegetarian.
      if (filterName === "veggie") {
        return Boolean(primaryTagContainer.querySelector(".veggie, .vegan"));
      }

      return Boolean(primaryTagContainer.querySelector(`.${filterName}`));
    }

    function toppingMatchesDietaryFilter(topping, filterName) {
      if (filterName === "all") {
        return true;
      }

      // Vegan toppings also qualify as vegetarian.
      if (filterName === "veggie") {
        return Boolean(
          topping.querySelector(".veggie, .veggie-light, .vegan, .vegan-light"),
        );
      }

      if (filterName === "vegan") {
        return Boolean(topping.querySelector(".vegan, .vegan-light"));
      }

      if (filterName === "gluten") {
        return Boolean(topping.querySelector(".gluten, .gluten-light"));
      }

      return false;
    }

    function applyToppingFilter(panel, filterName) {
      panel
        .querySelectorAll(".topping-list li, .burger-toppings li")
        .forEach((topping) => {
          topping.hidden = !toppingMatchesDietaryFilter(topping, filterName);
        });
    }

    /* ----------------------------------------------------------
     SECTION VISIBILITY
     Hide empty sections and their sticky-nav links while filtering.
     ---------------------------------------------------------- */

    function getSectionItems(section) {
      return Array.from(section.querySelectorAll(".box, .mac-feature")).filter(
        (item) => item.closest(".section-container") === section,
      );
    }

    function updateSectionLinks(panel) {
      const menuName = panel.id.replace("-menu", "");
      const matchingSubnav = document.querySelector(
        `.menu-subnav[data-subnav="${menuName}"]`,
      );

      if (!matchingSubnav) {
        return;
      }

      matchingSubnav.querySelectorAll('a[href^="#"]').forEach((link) => {
        const target = panel.querySelector(link.getAttribute("href"));
        link.hidden = activeDietaryFilter !== "all" && target && target.hidden;
      });
    }

    /* ----------------------------------------------------------
     APPLY DIETARY FILTER
     Food and Kids are filterable. Drinks are left untouched.
     ---------------------------------------------------------- */

    function applyDietaryFilter(filterName) {
      activeDietaryFilter = filterName;

      dietaryFilterButtons.forEach((button) => {
        button.setAttribute(
          "aria-pressed",
          button.dataset.dietaryFilter === filterName ? "true" : "false",
        );
      });

      menuPanels.forEach((panel) => {
        if (panel.id === "drinks-menu") {
          return;
        }

        const filterableItems = panel.querySelectorAll(".box, .mac-feature");

        applyToppingFilter(panel, filterName);

        filterableItems.forEach((item) => {
          const shouldShow =
            filterName === "all" || itemHasPrimaryDietaryTag(item, filterName);

          item.hidden = !shouldShow;
        });

        panel.querySelectorAll(".section-container").forEach((section) => {
          const sectionItems = getSectionItems(section);

          if (filterName === "all") {
            section.hidden = false;
            return;
          }

          section.hidden = !sectionItems.some((item) => !item.hidden);
        });

        const hasAnyVisibleItem = Array.from(filterableItems).some(
          (item) => !item.hidden,
        );

        const emptyState = panel.querySelector(".filter-empty-state");
        if (emptyState) {
          emptyState.hidden = filterName === "all" || hasAnyVisibleItem;
        }

        updateSectionLinks(panel);
      });
    }

    /* ----------------------------------------------------------
   MENU TAB SWITCHING + URL HASHES
   Supports:
   /menus#food
   /menus#drinks
   /menus#kids
   ---------------------------------------------------------- */

    function activateMenu(selectedMenu, updateUrl = false) {
      const validMenus = ["food", "drinks", "kids"];

      // Fall back to Food if the hash isn't a recognised menu
      if (!validMenus.includes(selectedMenu)) {
        selectedMenu = "food";
      }

      // Update tab selected state
      menuTabs.forEach((tab) => {
        tab.setAttribute(
          "aria-selected",
          tab.dataset.menu === selectedMenu ? "true" : "false",
        );
      });

      // Show the correct menu panel
      menuPanels.forEach((panel) => {
        panel.hidden = panel.id !== `${selectedMenu}-menu`;
      });

      requestAnimationFrame(() => {
  window.dispatchEvent(new Event("resize"));
});

      // Show the correct sub-navigation
      menuSubnavs.forEach((subnav) => {
        subnav.hidden = subnav.dataset.subnav !== selectedMenu;
      });

      // Dietary filters appear on Food and Kids, but not Drinks
      dietaryFilter.hidden = selectedMenu === "drinks";

      // Reset dietary filtering whenever a menu is opened
      applyDietaryFilter("all");

      // Change the URL when the user clicks a tab
      if (updateUrl) {
        history.pushState(null, "", `#${selectedMenu}`);
      }
    }

    /* TAB CLICKS */

menuTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    activateMenu(tab.dataset.menu, true);

    // Scroll back to the top when switching main menus
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });
});

    /* OPEN MENU FROM URL */

function openMenuFromHash() {
  const hash = window.location.hash.replace("#", "").toLowerCase();

  // Main menu links:
  // #food
  // #drinks
  // #kids
  if (["food", "drinks", "kids"].includes(hash)) {
    activateMenu(hash);
    return;
  }

  // Section links:
  // #cocktails
  // #wine
  // #beers
  // #burgers
  // #desserts
  // etc.
  if (hash) {
    const target = document.getElementById(hash);

    if (target) {
      const parentMenu = target.closest(".menu-panel");

      if (parentMenu) {
        const menuName = parentMenu.id.replace("-menu", "");

        // Open the menu that contains this section
        activateMenu(menuName);

        // Then scroll to the requested section
        requestAnimationFrame(() => {
          target.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
        });

        return;
      }
    }
  }

  // No hash or an invalid hash = Food
  activateMenu("food");
}

    /* If the hash changes manually/back-forward navigation */

    window.addEventListener("hashchange", openMenuFromHash);

    /* Open the correct menu when the page first loads */

    openMenuFromHash();

    /* ----------------------------------------------------------
     DIETARY FILTER BUTTONS
     ---------------------------------------------------------- */

    dietaryFilterButtons.forEach((button) => {
      button.addEventListener("click", () => {
        applyDietaryFilter(button.dataset.dietaryFilter);
      });
    });

    // Establish the initial Food / All state on page load.
    applyDietaryFilter("all");
  })();


  (() => {
  function makeMenuAutoHeight() {
    const menu = document.querySelector(".menu-navigation");

    if (!menu) return;

    const sqsBlock = menu.closest(".sqs-block");
    const feBlock = menu.closest(".fe-block");
    const fluidEngine = menu.closest(".fluid-engine");
    const pageSection = menu.closest(".page-section");

    if (!sqsBlock || !feBlock || !fluidEngine) return;

    /*
     * Squarespace sometimes creates placeholder elements for
     * scripts inside Code Blocks. Remove them from the layout.
     */
    sqsBlock
      .querySelectorAll(".sqs-blockStatus, .removed-script")
      .forEach((element) => {
        element.style.setProperty("display", "none", "important");
      });

    /*
     * Fluid Engine normally gives this block a fixed number
     * of grid rows.
     *
     * Force the menu block to occupy ONE auto-sized row instead.
     * That row will grow/shrink with whichever menu is visible.
     */
    feBlock.style.setProperty("grid-row-start", "1", "important");
    feBlock.style.setProperty("grid-row-end", "2", "important");
    feBlock.style.setProperty("height", "auto", "important");
    feBlock.style.setProperty("min-height", "0", "important");

    /*
     * Collapse the Fluid Engine grid itself down to its content.
     */
    fluidEngine.style.setProperty(
      "grid-template-rows",
      "minmax(0, auto)",
      "important"
    );

    fluidEngine.style.setProperty(
      "grid-auto-rows",
      "auto",
      "important"
    );

    fluidEngine.style.setProperty(
      "height",
      "auto",
      "important"
    );

    fluidEngine.style.setProperty(
      "min-height",
      "0",
      "important"
    );

    /*
     * Remove any minimum section height Squarespace is adding.
     */
    if (pageSection) {
      pageSection.style.setProperty(
        "height",
        "auto",
        "important"
      );

      pageSection.style.setProperty(
        "min-height",
        "0",
        "important"
      );
    }
  }

  /*
   * Run once when the page is ready.
   */
  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      makeMenuAutoHeight
    );
  } else {
    makeMenuAutoHeight();
  }

  /*
   * Run again after Squarespace has completely loaded.
   */
  window.addEventListener("load", makeMenuAutoHeight);

  /*
   * Squarespace can recalculate Fluid Engine when the
   * viewport changes, so reapply our sizing afterwards.
   */
  window.addEventListener("resize", () => {
    requestAnimationFrame(makeMenuAutoHeight);
  });

  /*
   * Reapply whenever Food / Drinks / Kids is selected.
   */
  document.addEventListener("click", (event) => {
    if (event.target.closest(".menu-tab")) {
      requestAnimationFrame(() => {
        requestAnimationFrame(makeMenuAutoHeight);
      });
    }
  });
})();
