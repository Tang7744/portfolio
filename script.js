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

const finishOpening = () => {
  document.body.classList.remove("is-opening");
  document.documentElement.style.setProperty("--opening-progress", "100");
};

if (openingAnimation) {
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
  finishOpening();
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
}
