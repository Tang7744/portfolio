const canvas = document.querySelector("#ambient-bg");
const ctx = canvas?.getContext("2d");
let width = 0;
let height = 0;
let particles = [];

function resize() {
  if (!canvas || !ctx) return;
  const ratio = window.devicePixelRatio || 1;
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * ratio);
  canvas.height = Math.floor(height * ratio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  particles = Array.from({ length: Math.min(46, Math.floor(width / 28)) }, (_, index) => ({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: 1 + Math.random() * 2.4,
    vx: -0.16 + Math.random() * 0.32,
    vy: -0.1 + Math.random() * 0.2,
    hue: [12, 216, 47, 0][index % 4],
  }));
}

function draw() {
  if (!canvas || !ctx) return;
  ctx.clearRect(0, 0, width, height);

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "rgba(255,255,255,0.72)");
  gradient.addColorStop(0.48, "rgba(246,244,238,0.4)");
  gradient.addColorStop(1, "rgba(230,226,216,0.55)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  particles.forEach((particle, index) => {
    particle.x += particle.vx;
    particle.y += particle.vy;

    if (particle.x < -20) particle.x = width + 20;
    if (particle.x > width + 20) particle.x = -20;
    if (particle.y < -20) particle.y = height + 20;
    if (particle.y > height + 20) particle.y = -20;

    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${particle.hue}, 72%, 54%, 0.16)`;
    ctx.fill();

    for (let next = index + 1; next < particles.length; next += 1) {
      const other = particles[next];
      const dx = particle.x - other.x;
      const dy = particle.y - other.y;
      const distance = Math.hypot(dx, dy);
      if (distance < 140) {
        ctx.strokeStyle = `rgba(5,5,5,${0.035 * (1 - distance / 140)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(particle.x, particle.y);
        ctx.lineTo(other.x, other.y);
        ctx.stroke();
      }
    }
  });

  requestAnimationFrame(draw);
}

if (canvas && ctx) {
  window.addEventListener("resize", resize);
  resize();
  draw();
}

const openingAnimation = document.querySelector(".opening-animation");
const openingCount = document.querySelector(".opening-count");
const openingStorageKey = "yihan-portfolio-opening-played";

const hasSeenOpening = (() => {
  try {
    return window.sessionStorage.getItem(openingStorageKey) === "true";
  } catch {
    return false;
  }
})();

const finishOpening = (remember = true) => {
  document.body.classList.remove("is-opening");
  document.documentElement.style.setProperty("--opening-progress", "100");
  if (remember) {
    try {
      window.sessionStorage.setItem(openingStorageKey, "true");
    } catch {
      // Ignore storage failures in private or restricted browsing modes.
    }
  }
};

if (openingAnimation && !hasSeenOpening) {
  const openingStart = performance.now();
  const openingDuration = 2850;

  const updateOpeningProgress = (now) => {
    const elapsed = Math.min(now - openingStart, openingDuration);
    const progress = Math.round((elapsed / openingDuration) * 100);

    document.documentElement.style.setProperty("--opening-progress", String(progress));
    if (openingCount) openingCount.textContent = `${String(progress).padStart(2, "0")}%`;

    if (elapsed < openingDuration) {
      window.requestAnimationFrame(updateOpeningProgress);
    }
  };

  window.requestAnimationFrame(updateOpeningProgress);
  openingAnimation.addEventListener("animationend", (event) => {
    if (event.animationName === "opening-exit") finishOpening();
  });
  window.setTimeout(finishOpening, 3700);
} else {
  document.body.classList.add("opening-skipped");
  finishOpening(false);
}

const header = document.querySelector(".site-header");
const menuButton = document.querySelector(".menu-button");
const sectionMenu = document.querySelector("#section-menu");

if (header && menuButton && sectionMenu) {
  const closeMenu = () => {
    header.classList.remove("menu-open");
    menuButton.setAttribute("aria-expanded", "false");
  };

  menuButton.addEventListener("click", () => {
    const isOpen = header.classList.toggle("menu-open");
    menuButton.setAttribute("aria-expanded", String(isOpen));
  });

  sectionMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });
}

const navLinks = document.querySelectorAll(".nav-links a[href^='#']");
const navSections = Array.from(navLinks)
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

const setActiveNav = (id) => {
  navLinks.forEach((link) => {
    link.classList.toggle("is-active", link.getAttribute("href") === `#${id}`);
  });
};

if (navLinks.length && navSections.length) {
  let navLockTimer;
  let isNavLocked = false;

  const getCurrentSection = () => {
    const marker = window.scrollY + window.innerHeight * 0.42;
    return navSections.reduce((current, section) => {
      return section.offsetTop <= marker ? section : current;
    }, navSections[0]);
  };

  const updateActiveNav = () => {
    if (isNavLocked) return;
    setActiveNav(getCurrentSection().id);
  };

  const scheduleActiveNav = () => {
    window.requestAnimationFrame(updateActiveNav);
  };

  window.addEventListener("scroll", scheduleActiveNav, { passive: true });
  window.addEventListener("resize", updateActiveNav);
  navLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const target = link.getAttribute("href").slice(1);
      isNavLocked = true;
      window.clearTimeout(navLockTimer);
      setActiveNav(target);
      document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "start" });
      navLockTimer = window.setTimeout(() => {
        isNavLocked = false;
        updateActiveNav();
      }, 720);
    });
  });
  updateActiveNav();
}

const motionSections = document.querySelectorAll(".section");
const motionGroups = [
  ".about .about-panel",
  ".project-card",
  ".strength-grid .collage-stack",
];

motionGroups.forEach((selector) => {
  document.querySelectorAll(selector).forEach((element, index) => {
    element.classList.add("motion-item");
    element.style.setProperty("--motion-index", index);
  });
});

if ("IntersectionObserver" in window) {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
        } else {
          entry.target.classList.remove("is-visible");
        }
      });
    },
    {
      threshold: 0.16,
      rootMargin: "0px 0px -12% 0px",
    },
  );

  motionSections.forEach((section) => sectionObserver.observe(section));
} else {
  motionSections.forEach((section) => section.classList.add("is-visible"));
}

const parallaxItems = document.querySelectorAll(
  ".hero-visual img, .badge-card img, .project-preview, .collage-paper",
);
let parallaxFrame = null;

const updateParallax = () => {
  parallaxFrame = null;
  const viewportHeight = window.innerHeight || 1;

  parallaxItems.forEach((item) => {
    const rect = item.getBoundingClientRect();
    if (rect.bottom < -120 || rect.top > viewportHeight + 120) return;

    const center = rect.top + rect.height / 2;
    const progress = (center - viewportHeight / 2) / viewportHeight;
    const clamped = Math.max(-1, Math.min(1, progress));
    item.style.setProperty("--parallax-y", `${(-22 * clamped).toFixed(1)}px`);
  });
};

const requestParallax = () => {
  if (parallaxFrame) return;
  parallaxFrame = window.requestAnimationFrame(updateParallax);
};

window.addEventListener("scroll", requestParallax, { passive: true });
window.addEventListener("resize", requestParallax);
requestParallax();

const tiltedCard = document.querySelector(".profile-card");

if (tiltedCard) {
  const maxTilt = 10;
  const lanyardBadge = tiltedCard.querySelector(".lanyard-badge");

  tiltedCard.addEventListener("pointermove", (event) => {
    const rect = tiltedCard.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateY = ((x - centerX) / centerX) * maxTilt;
    const rotateX = ((centerY - y) / centerY) * maxTilt;

    tiltedCard.style.setProperty("--tilt-x", `${rotateX.toFixed(2)}deg`);
    tiltedCard.style.setProperty("--tilt-y", `${rotateY.toFixed(2)}deg`);
    tiltedCard.style.setProperty("--tilt-scale", "1.035");
    tiltedCard.style.setProperty("--glare-x", `${((x / rect.width) * 100).toFixed(1)}%`);
    tiltedCard.style.setProperty("--glare-y", `${((y / rect.height) * 100).toFixed(1)}%`);
  });

  tiltedCard.addEventListener("pointerleave", () => {
    tiltedCard.style.setProperty("--tilt-x", "0deg");
    tiltedCard.style.setProperty("--tilt-y", "0deg");
    tiltedCard.style.setProperty("--tilt-scale", "1");
    tiltedCard.style.setProperty("--glare-x", "50%");
    tiltedCard.style.setProperty("--glare-y", "50%");
  });

  const updateLanyard = () => {
    const rect = tiltedCard.getBoundingClientRect();
    const triggerPoint = window.innerHeight * 0.72;
    const visible = rect.top < triggerPoint && rect.bottom > window.innerHeight * 0.12;
    const rawProgress = 1 - Math.max(0, rect.top) / triggerPoint;
    const progress = Math.min(1, Math.max(0, rawProgress));
    const eased = 1 - Math.pow(1 - progress, 3);
    const drop = -210 + 210 * eased;
    const rotate = -12 + 10 * eased;

    if (lanyardBadge) {
      lanyardBadge.style.setProperty("--lanyard-drop", `${drop.toFixed(1)}px`);
      lanyardBadge.style.setProperty("--lanyard-rotate", `${rotate.toFixed(2)}deg`);
    }

    tiltedCard.classList.toggle("lanyard-ready", visible && progress > 0.92);
    tiltedCard.style.setProperty("--lanyard-progress", String(Math.max(0.42, eased).toFixed(2)));
  };

  window.addEventListener("scroll", updateLanyard, { passive: true });
  window.addEventListener("resize", updateLanyard);
  updateLanyard();
}

const aboutTabs = document.querySelectorAll(".about-tab");
const aboutPanels = document.querySelectorAll(".experience-content");

aboutTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const target = tab.dataset.tab;

    aboutTabs.forEach((item) => {
      const isActive = item === tab;
      item.classList.toggle("is-active", isActive);
      item.setAttribute("aria-selected", String(isActive));
    });

    aboutPanels.forEach((panel) => {
      panel.classList.toggle("is-active", panel.dataset.panel === target);
    });
  });
});

const figmaTime = document.querySelector(".figma-time");

if (figmaTime) {
  const beijingTimeFormatter = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    timeZone: "Asia/Shanghai",
  });

  const updateBeijingTime = () => {
    figmaTime.textContent = beijingTimeFormatter.format(new Date());
  };

  updateBeijingTime();
  window.setInterval(updateBeijingTime, 1000);
}

const glowCards = document.querySelectorAll("#about .about-panel, #about .profile-card");

const getEdgeProximity = (rect, x, y) => {
  const cx = rect.width / 2;
  const cy = rect.height / 2;
  const dx = x - cx;
  const dy = y - cy;
  const kx = dx === 0 ? Infinity : cx / Math.abs(dx);
  const ky = dy === 0 ? Infinity : cy / Math.abs(dy);
  return Math.min(Math.max(1 / Math.min(kx, ky), 0), 1);
};

const getCursorAngle = (rect, x, y) => {
  const dx = x - rect.width / 2;
  const dy = y - rect.height / 2;
  if (dx === 0 && dy === 0) return 45;
  const degrees = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
  return degrees < 0 ? degrees + 360 : degrees;
};

glowCards.forEach((card) => {
  card.addEventListener("pointermove", (event) => {
    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const edge = getEdgeProximity(rect, x, y);
    const angle = getCursorAngle(rect, x, y);

    card.style.setProperty("--edge-proximity", `${(edge * 100).toFixed(3)}`);
    card.style.setProperty("--cursor-angle", `${angle.toFixed(3)}deg`);
  });

  card.addEventListener("pointerleave", () => {
    card.style.setProperty("--edge-proximity", "0");
  });
});

const caseShell = document.querySelector("#caseShell");
const caseSlides = Array.from(document.querySelectorAll(".case-slide"));
const caseDots = Array.from(document.querySelectorAll(".case-progress button"));

if (caseShell && caseSlides.length) {
  let currentCaseSlide = Math.max(
    0,
    caseSlides.findIndex((slide) => slide.classList.contains("is-active")),
  );
  let isCaseAnimating = false;
  const wheelThreshold = 24;
  let boundaryWheelDirection = 0;
  let boundaryWheelCount = 0;
  let boundaryWheelTime = 0;
  const boundaryWheelWindow = 1400;
  let autoScrollFrameId = null;
  let autoScrollPauseUntil = 0;
  const pendingExplainUpdates = new WeakSet();

  const scheduleExplainCardUpdate = (slide) => {
    if (!slide || pendingExplainUpdates.has(slide)) return;
    pendingExplainUpdates.add(slide);
    window.requestAnimationFrame(() => {
      pendingExplainUpdates.delete(slide);
      updateVisibleExplainCard(slide);
    });
  };

  const stopAutoScrollFrame = () => {
    if (autoScrollFrameId) {
      window.cancelAnimationFrame(autoScrollFrameId);
      autoScrollFrameId = null;
    }
  };

  const startAutoScrollForActiveSlide = () => {
    stopAutoScrollFrame();
    const activeSlide = caseSlides[currentCaseSlide];
    const autoFrame = activeSlide?.querySelector(".auto-scroll-frame");

    if (!autoFrame || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    autoFrame.scrollTo({ top: 0 });
    autoScrollPauseUntil = performance.now() + 900;

    const tick = (now) => {
      const maxScroll = autoFrame.scrollHeight - autoFrame.clientHeight;
      if (maxScroll <= 0) {
        autoScrollFrameId = window.requestAnimationFrame(tick);
        return;
      }

      if (now > autoScrollPauseUntil) {
        const nextTop = autoFrame.scrollTop + 0.42;
        if (nextTop >= maxScroll - 1) {
          autoFrame.scrollTop = 0;
          autoScrollPauseUntil = now + 1100;
        } else {
          autoFrame.scrollTop = nextTop;
        }
      }

      autoScrollFrameId = window.requestAnimationFrame(tick);
    };

    autoScrollFrameId = window.requestAnimationFrame(tick);
  };
  const updateVisibleExplainCard = (slide) => {
    const scrollFrame = slide?.querySelector(".case-scroll-frame");
    const hotzones = Array.from(slide?.querySelectorAll(".xhs-hotzones span") || []);
    const cards = Array.from(slide?.querySelectorAll(".xhs-explain-placeholders img") || []);
    const cardWrap = slide?.querySelector(".xhs-explain-placeholders");

    if (!scrollFrame || !hotzones.length || !cards.length || !cardWrap) return;

    const frameRect = scrollFrame.getBoundingClientRect();
    const frameCenter = frameRect.top + frameRect.height / 2;
    let activeIndex = -1;
    let activeDistance = Infinity;

    hotzones.forEach((zone, index) => {
      const rect = zone.getBoundingClientRect();
      const visible = rect.bottom > frameRect.top && rect.top < frameRect.bottom;
      if (!visible) return;

      const zoneCenter = rect.top + rect.height / 2;
      const distance = Math.abs(zoneCenter - frameCenter);
      if (distance < activeDistance) {
        activeDistance = distance;
        activeIndex = index;
      }
    });

    if (activeIndex < 0) activeIndex = 0;

    cardWrap.classList.add("is-visible");
    cards.forEach((card, index) => {
      card.classList.toggle("is-active", index === activeIndex);
    });
  };

  const setCaseSlide = (nextIndex) => {
    const targetIndex = Math.max(0, Math.min(caseSlides.length - 1, nextIndex));
    if (targetIndex === currentCaseSlide) return;

    currentCaseSlide = targetIndex;
    caseSlides.forEach((slide, index) => {
      slide.classList.toggle("is-active", index === targetIndex);
    });
    caseDots.forEach((dot, index) => {
      dot.classList.toggle("is-active", index === targetIndex);
    });
    caseSlides[targetIndex].querySelector(".case-scroll-frame")?.scrollTo({ top: 0 });
    caseSlides[targetIndex].querySelector(".case-horizontal-frame")?.scrollTo({ left: 0 });
    boundaryWheelDirection = 0;
    boundaryWheelCount = 0;
    startAutoScrollForActiveSlide();
    updateVisibleExplainCard(caseSlides[targetIndex]);
  };

  const lockCaseWheel = () => {
    isCaseAnimating = true;
    window.setTimeout(() => {
      isCaseAnimating = false;
    }, 820);
  };

  window.addEventListener(
    "wheel",
    (event) => {
      if (window.matchMedia("(max-width: 640px)").matches) return;
      if (Math.abs(event.deltaY) < wheelThreshold) return;

      const activeSlide = caseSlides[currentCaseSlide];
      const scrollFrame = activeSlide?.querySelector(".case-scroll-frame");
      if (scrollFrame) {
        const maxScroll = scrollFrame.scrollHeight - scrollFrame.clientHeight;
        const atTop = scrollFrame.scrollTop <= 0;
        const atBottom = scrollFrame.scrollTop >= maxScroll - 2;
        const direction = event.deltaY > 0 ? 1 : -1;
        const shouldScrollInside =
          maxScroll > 0 && ((direction > 0 && !atBottom) || (direction < 0 && !atTop));

        if (shouldScrollInside) {
          event.preventDefault();
          scrollFrame.scrollTop += event.deltaY * 1.05;
          boundaryWheelDirection = 0;
          boundaryWheelCount = 0;
          scheduleExplainCardUpdate(activeSlide);
          return;
        }

        if (maxScroll > 0 && ((direction > 0 && atBottom) || (direction < 0 && atTop))) {
          const now = Date.now();
          if (direction === boundaryWheelDirection && now - boundaryWheelTime < boundaryWheelWindow) {
            boundaryWheelCount += 1;
          } else {
            boundaryWheelDirection = direction;
            boundaryWheelCount = 1;
          }
          boundaryWheelTime = now;

          if (boundaryWheelCount < 2) {
            event.preventDefault();
            return;
          }

          boundaryWheelDirection = 0;
          boundaryWheelCount = 0;
        }
      }

      const horizontalFrame = activeSlide?.querySelector(".case-horizontal-frame");
      if (horizontalFrame) {
        const maxScroll = horizontalFrame.scrollWidth - horizontalFrame.clientWidth;
        const atStart = horizontalFrame.scrollLeft <= 0;
        const atEnd = horizontalFrame.scrollLeft >= maxScroll - 2;
        const shouldScrollInside =
          maxScroll > 0 && ((event.deltaY > 0 && !atEnd) || (event.deltaY < 0 && !atStart));

        if (shouldScrollInside) {
          event.preventDefault();
          horizontalFrame.scrollLeft += event.deltaY * 1.1;
          return;
        }
      }

      event.preventDefault();
      if (isCaseAnimating) return;

      const direction = event.deltaY > 0 ? 1 : -1;
      const nextIndex = currentCaseSlide + direction;
      if (nextIndex < 0 || nextIndex >= caseSlides.length) return;

      setCaseSlide(nextIndex);
      lockCaseWheel();
    },
    { passive: false },
  );

  window.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown" || event.key === "PageDown" || event.key === " ") {
      event.preventDefault();
      setCaseSlide(currentCaseSlide + 1);
      lockCaseWheel();
    }

    if (event.key === "ArrowUp" || event.key === "PageUp") {
      event.preventDefault();
      setCaseSlide(currentCaseSlide - 1);
      lockCaseWheel();
    }
  });

  caseDots.forEach((dot) => {
    dot.addEventListener("click", () => {
      setCaseSlide(Number(dot.dataset.targetSlide));
      lockCaseWheel();
    });
  });

  caseShell.addEventListener("pointerenter", () => {
    autoScrollPauseUntil = performance.now() + 1200;
  });

  caseShell.addEventListener("wheel", () => {
    autoScrollPauseUntil = performance.now() + 1600;
  });

  caseSlides.forEach((slide) => {
    const scrollFrame = slide.querySelector(".case-scroll-frame");
    if (!scrollFrame) return;

    scrollFrame.addEventListener(
      "scroll",
      () => {
        scheduleExplainCardUpdate(slide);
      },
      { passive: true },
    );
  });

  startAutoScrollForActiveSlide();
  updateVisibleExplainCard(caseSlides[currentCaseSlide]);

  const detailHeader = document.querySelector(".detail-header");
  if (detailHeader) {
    let headerHideTimer;
    let headerFrame = null;

    const showDetailHeader = () => {
      headerFrame = null;
      detailHeader.classList.remove("is-hidden");
      window.clearTimeout(headerHideTimer);
      headerHideTimer = window.setTimeout(() => {
        detailHeader.classList.add("is-hidden");
      }, 3000);
    };

    const scheduleDetailHeader = () => {
      if (headerFrame) return;
      headerFrame = window.requestAnimationFrame(showDetailHeader);
    };

    ["pointermove", "keydown", "wheel", "touchstart"].forEach((eventName) => {
      window.addEventListener(eventName, scheduleDetailHeader, { passive: true });
    });

    showDetailHeader();
  }
}

const tclCarousel = document.querySelector(".tcl-carousel");

if (tclCarousel) {
  const carouselItems = Array.from(tclCarousel.querySelectorAll("[data-carousel-item]"));
  let carouselProgress = 0;
  let carouselVelocity = 0;
  let carouselDragging = false;
  let carouselStartX = 0;
  let carouselStartProgress = 0;
  let carouselLastX = 0;
  let carouselLastTime = 0;
  let carouselFrame = null;
  let carouselAutoPausedUntil = 0;
  let carouselLastFrameTime = performance.now();

  const wrapCarouselOffset = (value) => {
    const count = carouselItems.length || 1;
    return ((value + count / 2) % count + count) % count - count / 2;
  };

  const renderTclCarousel = () => {
    const count = carouselItems.length || 1;
    const spacing = Math.min(window.innerWidth * 0.32, 430);
    const arc = Math.min(window.innerHeight * 0.11, 92);

    carouselItems.forEach((item, index) => {
      const offset = wrapCarouselOffset(index - carouselProgress);
      const distance = Math.abs(offset);
      const x = offset * spacing;
      const y = Math.pow(distance, 1.65) * arc - 34;
      const rotate = offset * 4.2;
      const scale = Math.max(0.72, 1 - distance * 0.1);
      const opacity = distance > count / 2 - 0.18 ? 0 : Math.max(0.42, 1 - distance * 0.2);
      const z = Math.round(100 - distance * 10);

      item.style.setProperty("--carousel-x", `${x.toFixed(2)}px`);
      item.style.setProperty("--carousel-y", `${y.toFixed(2)}px`);
      item.style.setProperty("--carousel-rotate", `${rotate.toFixed(2)}deg`);
      item.style.setProperty("--carousel-scale", scale.toFixed(3));
      item.style.setProperty("--carousel-opacity", opacity.toFixed(3));
      item.style.setProperty("--carousel-z", z);
    });
  };

  const animateTclCarousel = () => {
    const now = performance.now();
    const delta = Math.min(48, now - carouselLastFrameTime);
    carouselLastFrameTime = now;
    carouselFrame = null;
    let shouldContinue = false;

    if (!carouselDragging && Math.abs(carouselVelocity) > 0.002) {
      carouselProgress += carouselVelocity;
      carouselVelocity *= 0.92;
      shouldContinue = true;
    } else if (!carouselDragging && now > carouselAutoPausedUntil) {
      carouselProgress += delta * 0.000045;
      shouldContinue = true;
    }

    if (shouldContinue) {
      renderTclCarousel();
      carouselFrame = window.requestAnimationFrame(animateTclCarousel);
    }
  };

  const startCarouselInertia = () => {
    if (carouselFrame) return;
    carouselLastFrameTime = performance.now();
    carouselFrame = window.requestAnimationFrame(animateTclCarousel);
  };

  tclCarousel.addEventListener("pointerdown", (event) => {
    carouselDragging = true;
    carouselStartX = event.clientX;
    carouselLastX = event.clientX;
    carouselLastTime = performance.now();
    carouselStartProgress = carouselProgress;
    carouselVelocity = 0;
    carouselAutoPausedUntil = performance.now() + 1200;
    tclCarousel.classList.add("is-dragging");
    tclCarousel.setPointerCapture(event.pointerId);
  });

  tclCarousel.addEventListener("pointermove", (event) => {
    if (!carouselDragging) return;

    const now = performance.now();
    const width = Math.max(320, tclCarousel.clientWidth);
    const dragDelta = event.clientX - carouselStartX;
    const moveDelta = event.clientX - carouselLastX;
    const timeDelta = Math.max(16, now - carouselLastTime);

    carouselProgress = carouselStartProgress - (dragDelta / width) * carouselItems.length * 1.15;
    carouselVelocity = -(moveDelta / timeDelta) * 0.82;
    carouselAutoPausedUntil = now + 1400;
    carouselLastX = event.clientX;
    carouselLastTime = now;
    renderTclCarousel();
  });

  const stopCarouselDrag = (event) => {
    if (!carouselDragging) return;
    carouselDragging = false;
    tclCarousel.classList.remove("is-dragging");
    if (tclCarousel.hasPointerCapture(event.pointerId)) {
      tclCarousel.releasePointerCapture(event.pointerId);
    }
    carouselAutoPausedUntil = performance.now() + 1200;
    startCarouselInertia();
  };

  tclCarousel.addEventListener("pointerup", stopCarouselDrag);
  tclCarousel.addEventListener("pointercancel", stopCarouselDrag);
  window.addEventListener("resize", renderTclCarousel);
  renderTclCarousel();
  startCarouselInertia();
}
