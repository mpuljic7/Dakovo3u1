(function () {
  "use strict";

  const root = document.documentElement;
  const body = document.body;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  root.classList.add("js");

  document.querySelectorAll("[data-year]").forEach((element) => {
    element.textContent = String(new Date().getFullYear());
  });

  const menuButton = document.querySelector("[data-menu-toggle]");
  const mobileMenu = document.querySelector("[data-mobile-menu]");

  function setMenu(open) {
    if (!menuButton || !mobileMenu) return;
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute("aria-label", open ? "Zatvori izbornik" : "Otvori izbornik");
    const label = menuButton.querySelector("span");
    if (label) label.textContent = open ? "Zatvori" : "Menu";
    mobileMenu.classList.toggle("is-open", open);
    mobileMenu.setAttribute("aria-hidden", String(!open));
    body.classList.toggle("menu-open", open);
  }

  menuButton?.addEventListener("click", () => {
    setMenu(menuButton.getAttribute("aria-expanded") !== "true");
  });

  mobileMenu?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setMenu(false));
  });

  const progress = document.querySelector(".scroll-progress");
  let ticking = false;

  function updateProgress() {
    if (!progress) return;
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const value = scrollable > 0 ? window.scrollY / scrollable : 0;
    progress.style.transform = `scaleX(${Math.min(1, Math.max(0, value))})`;
    ticking = false;
  }

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        requestAnimationFrame(updateProgress);
        ticking = true;
      }
    },
    { passive: true },
  );
  updateProgress();

  const revealItems = document.querySelectorAll("[data-reveal]");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  } else {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8%", threshold: 0.08 },
    );
    revealItems.forEach((item) => observer.observe(item));
  }

  document.querySelectorAll("a[data-page-link]").forEach((link) => {
    link.addEventListener("click", (event) => {
      if (
        reduceMotion ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        link.target === "_blank"
      ) {
        return;
      }

      const href = link.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      event.preventDefault();
      body.classList.add("is-leaving");
      window.setTimeout(() => {
        window.location.href = href;
      }, 170);
    });
  });

  const galleryButtons = Array.from(document.querySelectorAll("[data-gallery-item]"));
  const lightbox = document.querySelector("[data-lightbox]");
  const lightboxImage = lightbox?.querySelector("[data-lightbox-image]");
  const lightboxCaption = lightbox?.querySelector("[data-lightbox-caption]");
  const lightboxCount = lightbox?.querySelector("[data-lightbox-count]");
  const closeButton = lightbox?.querySelector("[data-lightbox-close]");
  let selected = 0;
  let lastTrigger = null;
  let touchStart = null;

  function renderLightbox() {
    const item = galleryButtons[selected];
    if (!item || !lightboxImage) return;
    lightboxImage.src = item.dataset.src || "";
    lightboxImage.alt = item.dataset.alt || "";
    if (lightboxCaption) lightboxCaption.textContent = item.dataset.alt || "";
    if (lightboxCount) {
      lightboxCount.textContent = `${String(selected + 1).padStart(2, "0")} / ${String(galleryButtons.length).padStart(2, "0")}`;
    }
  }

  function openLightbox(index, trigger) {
    if (!lightbox) return;
    selected = index;
    lastTrigger = trigger;
    renderLightbox();
    lightbox.hidden = false;
    body.classList.add("menu-open");
    closeButton?.focus();
  }

  function closeLightbox() {
    if (!lightbox || lightbox.hidden) return;
    lightbox.hidden = true;
    body.classList.remove("menu-open");
    lastTrigger?.focus();
  }

  function moveLightbox(direction) {
    if (!galleryButtons.length) return;
    selected = (selected + direction + galleryButtons.length) % galleryButtons.length;
    renderLightbox();
  }

  galleryButtons.forEach((button, index) => {
    button.addEventListener("click", () => openLightbox(index, button));
  });

  lightbox?.querySelector("[data-lightbox-prev]")?.addEventListener("click", () => moveLightbox(-1));
  lightbox?.querySelector("[data-lightbox-next]")?.addEventListener("click", () => moveLightbox(1));
  closeButton?.addEventListener("click", closeLightbox);

  lightbox?.addEventListener("touchstart", (event) => {
    touchStart = event.changedTouches[0]?.clientX ?? null;
  }, { passive: true });

  lightbox?.addEventListener("touchend", (event) => {
    if (touchStart === null) return;
    const distance = (event.changedTouches[0]?.clientX ?? 0) - touchStart;
    if (distance > 50) moveLightbox(-1);
    if (distance < -50) moveLightbox(1);
    touchStart = null;
  }, { passive: true });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (lightbox && !lightbox.hidden) closeLightbox();
      else setMenu(false);
    }
    if (lightbox && !lightbox.hidden && event.key === "ArrowLeft") moveLightbox(-1);
    if (lightbox && !lightbox.hidden && event.key === "ArrowRight") moveLightbox(1);
  });
})();
