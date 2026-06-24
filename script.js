const canvas = document.querySelector("#ambient-bg");
const ctx = canvas.getContext("2d");
let width = 0;
let height = 0;
let particles = [];

function resize() {
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

window.addEventListener("resize", resize);
resize();
draw();

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
