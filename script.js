/* =========================================================
   LITTLE BLOSSOMS — script.js
   Handles: nav behavior, scroll reveal, mobile menu,
   and the Three.js 3D hero scene (with WebGL fallback).
   ========================================================= */

/* ---------- Year in footer ---------- */
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ---------- Sticky nav shrink + active link on scroll ---------- */
const navbar = document.getElementById('navbar');
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('main > section, .hero, .admission');

function onScroll() {
  navbar.classList.toggle('scrolled', window.scrollY > 30);

  let current = 'home';
  const scrollPos = window.scrollY + window.innerHeight * 0.35;
  sections.forEach(sec => {
    if (sec.offsetTop <= scrollPos) current = sec.id;
  });
  navLinks.forEach(link => {
    link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
  });
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ---------- Mobile menu toggle ---------- */
const navToggle = document.getElementById('navToggle');
const navLinksList = document.getElementById('navLinks');
navToggle.addEventListener('click', () => {
  const isOpen = navLinksList.classList.toggle('open');
  navToggle.classList.toggle('open', isOpen);
  navToggle.setAttribute('aria-expanded', String(isOpen));
});
navLinksList.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    navLinksList.classList.remove('open');
    navToggle.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

/* ---------- Scroll reveal animations ---------- */
const revealEls = document.querySelectorAll('[data-reveal]');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      // small stagger based on position among siblings
      const siblings = Array.from(entry.target.parentElement.children)
        .filter(el => el.hasAttribute('data-reveal'));
      const idx = siblings.indexOf(entry.target);
      entry.target.style.transitionDelay = `${Math.min(idx * 90, 360)}ms`;
      entry.target.classList.add('in-view');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

revealEls.forEach(el => revealObserver.observe(el));

/* ---------- Gallery lightbox (with per-item photo/video grid) ---------- */
const lightbox = document.getElementById('lightbox');
const lightboxEmoji = document.getElementById('lightboxEmoji');
const lightboxTitle = document.getElementById('lightboxTitle');
const lightboxDesc = document.getElementById('lightboxDesc');
const lightboxMedia = document.getElementById('lightboxMedia');
let lastFocusedEl = null;
let mediaLoadToken = 0;

const MEDIA_SLOTS = 8; // how many numbered files to look for per folder
const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'webp'];
const VIDEO_EXTS = ['mp4', 'webm'];

// Checks whether an image exists/loads at the given src.
function probeImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ ok: true, src });
    img.onerror = () => resolve({ ok: false });
    img.src = src;
  });
}
// Checks whether a video exists/loads at the given src.
function probeVideo(src) {
  return new Promise((resolve) => {
    const vid = document.createElement('video');
    vid.preload = 'metadata';
    vid.onloadedmetadata = () => resolve({ ok: true, src });
    vid.onerror = () => resolve({ ok: false });
    vid.src = src;
  });
}

async function findSlotMedia(folder, slot) {
  for (const ext of IMAGE_EXTS) {
    const res = await probeImage(`media/${folder}/${slot}.${ext}`);
    if (res.ok) return { type: 'image', src: res.src };
  }
  for (const ext of VIDEO_EXTS) {
    const res = await probeVideo(`media/${folder}/${slot}.${ext}`);
    if (res.ok) return { type: 'video', src: res.src };
  }
  return null;
}

async function loadGalleryMedia(folder, token) {
  lightboxMedia.innerHTML = '<p class="lightbox-loading">Loading…</p>';

  const slotChecks = Array.from({ length: MEDIA_SLOTS }, (_, i) => findSlotMedia(folder, i + 1));
  const results = await Promise.all(slotChecks);
  if (token !== mediaLoadToken) return; // a newer item was opened meanwhile

  const found = results.filter(Boolean);

  if (found.length === 0) {
    lightboxMedia.innerHTML = `
      <div class="lightbox-empty">
        No photos or videos added yet for this section.<br>
        Add files to <code>media/${folder}/</code> named <code>1.jpg</code>, <code>2.mp4</code>, etc.
        and they'll show up here automatically.
      </div>`;
    return;
  }

  lightboxMedia.innerHTML = '';
  found.forEach(item => {
    if (item.type === 'image') {
      const img = document.createElement('img');
      img.src = item.src;
      img.alt = '';
      img.loading = 'lazy';
      lightboxMedia.appendChild(img);
    } else {
      const vid = document.createElement('video');
      vid.src = item.src;
      vid.controls = true;
      vid.preload = 'metadata';
      lightboxMedia.appendChild(vid);
    }
  });
}

function openLightbox(card) {
  lastFocusedEl = document.activeElement;
  lightboxEmoji.textContent = card.dataset.emoji || '🌸';
  lightboxTitle.textContent = card.dataset.title || '';
  lightboxDesc.textContent = card.dataset.desc || '';
  lightbox.classList.add('open');
  lightbox.setAttribute('aria-hidden', 'false');
  lightbox.querySelector('.lightbox-close').focus();
  document.body.style.overflow = 'hidden';

  const folder = card.dataset.folder;
  if (folder) {
    mediaLoadToken += 1;
    loadGalleryMedia(folder, mediaLoadToken);
  } else {
    lightboxMedia.innerHTML = '';
  }
}
function closeLightbox() {
  lightbox.classList.remove('open');
  lightbox.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  if (lastFocusedEl) lastFocusedEl.focus();
  // stop any playing videos
  lightboxMedia.querySelectorAll('video').forEach(v => v.pause());
}
document.querySelectorAll('[data-gallery-item]').forEach(card => {
  card.addEventListener('click', () => openLightbox(card));
});
document.querySelectorAll('[data-lightbox-close]').forEach(el => {
  el.addEventListener('click', closeLightbox);
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && lightbox.classList.contains('open')) closeLightbox();
});

/* =========================================================
   3D HERO SCENE (Three.js)
   ========================================================= */
function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch (e) {
    return false;
  }
}

const heroCanvas = document.getElementById('hero-canvas');
const hero = document.querySelector('.hero');

if (!supportsWebGL()) {
  // Fallback: hide canvas, hero background gradient (already in CSS) carries the scene.
  heroCanvas.style.display = 'none';
  hero.classList.add('no-webgl');
} else {
  initHeroScene();
}

async function initHeroScene() {
  const THREE = await import('three');

  let width = hero.clientWidth;
  let height = hero.clientHeight;
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xfff3e0, 14, 34);

  const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
  camera.position.set(0, 3.6, 13);
  camera.lookAt(0, 1.6, 0);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas: heroCanvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
  } catch (e) {
    heroCanvas.style.display = 'none';
    hero.classList.add('no-webgl');
    return;
  }
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(width, height);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  /* ---------- Lighting ---------- */
  const hemi = new THREE.HemisphereLight(0xfff3d6, 0xf3c9c9, 1.05);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xfff0d0, 1.6);
  sun.position.set(6, 10, 6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -10;
  sun.shadow.camera.right = 10;
  sun.shadow.camera.top = 10;
  sun.shadow.camera.bottom = -10;
  sun.shadow.camera.far = 30;
  sun.shadow.bias = -0.0025;
  scene.add(sun);

  const fill = new THREE.PointLight(0xffd9e8, 0.6, 20);
  fill.position.set(-6, 4, 4);
  scene.add(fill);

  /* ---------- Materials (flat, soft toy palette) ---------- */
  const mat = (color, roughness = 0.75, metalness = 0.05) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness });

  const matWall = mat(0xfff3e2, 0.9);
  const matRoof = mat(0xff8fa3, 0.6);
  const matRoofDeep = mat(0xe8536b, 0.6);
  const matDoor = mat(0x7fb685, 0.7);
  const matWindow = mat(0xbfe3f5, 0.35, 0.1);
  const matGrass = mat(0x9fd6a6, 0.95);
  const matGrassDeep = mat(0x7fb685, 0.95);
  const matTrunk = mat(0xb08463, 0.9);
  const matLeaf = mat(0x6fbf7a, 0.8);
  const matLeafDeep = mat(0x4f9d5c, 0.8);
  const matPath = mat(0xffe2b8, 0.9);
  const matCloud = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, transparent: true, opacity: 0.92 });

  const balloonColors = [0xff6f81, 0xffc259, 0x8fcbe8, 0x9fd6a6, 0xd9bff5];

  /* ---------- Group root (for parallax rotation) ---------- */
  const world = new THREE.Group();
  scene.add(world);

  /* ---------- Ground ---------- */
  const ground = new THREE.Mesh(new THREE.CircleGeometry(14, 48), matGrass);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  world.add(ground);

  const groundRing = new THREE.Mesh(new THREE.RingGeometry(6.6, 14, 48), matGrassDeep);
  groundRing.rotation.x = -Math.PI / 2;
  groundRing.position.y = -0.02;
  world.add(groundRing);

  // simple curved path to the door
  const path = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 4.2), matPath);
  path.rotation.x = -Math.PI / 2;
  path.position.set(0, 0.01, 4.6);
  world.add(path);

  /* ---------- Preschool building ---------- */
  const building = new THREE.Group();
  building.position.set(0, 0, -1);

  const base = new THREE.Mesh(new THREE.BoxGeometry(5.2, 2.6, 3.6), matWall);
  base.position.y = 1.3;
  base.castShadow = true;
  base.receiveShadow = true;
  building.add(base);

  const roof = new THREE.Mesh(new THREE.ConeGeometry(3.9, 1.8, 4), matRoof);
  roof.position.y = 2.6 + 0.9;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  building.add(roof);

  const roofTrim = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.08, 8, 24), matRoofDeep);
  roofTrim.position.y = 2.6 + 0.02;
  roofTrim.rotation.x = Math.PI / 2;
  building.add(roofTrim);

  const door = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 1.5, 16, 1, false, 0, Math.PI), matDoor);
  door.rotation.z = Math.PI;
  door.rotation.y = Math.PI / 2;
  door.position.set(0, 0.75, 1.81);
  building.add(door);

  const windowGeo = new THREE.CircleGeometry(0.45, 20);
  [-1.55, 1.55].forEach(x => {
    const win = new THREE.Mesh(windowGeo, matWindow);
    win.position.set(x, 1.55, 1.81);
    building.add(win);
    const frame = new THREE.Mesh(new THREE.RingGeometry(0.45, 0.53, 20), matRoofDeep);
    frame.position.set(x, 1.55, 1.815);
    building.add(frame);
  });

  const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.1, 0.45), matRoofDeep);
  chimney.position.set(1.6, 3.5, -0.6);
  chimney.castShadow = true;
  building.add(chimney);

  const signPost = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1), matTrunk);
  signPost.position.set(-2.6, 3.1, 1.9);
  building.add(signPost);
  const signBoard = new THREE.Mesh(new THREE.CircleGeometry(0.42, 24), matRoof);
  signBoard.position.set(-2.6, 3.6, 1.9);
  building.add(signBoard);

  world.add(building);

  /* ---------- Small playground: swing + slide (simple shapes) ---------- */
  const playground = new THREE.Group();
  playground.position.set(4.6, 0, 1.4);

  const slideFrameMat = mat(0xffc259, 0.6);
  const slideBoardMat = mat(0xff6f81, 0.5);

  const slideLeg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.6), slideFrameMat);
  slideLeg1.position.set(-0.6, 0.8, 0);
  playground.add(slideLeg1);
  const slideLeg2 = slideLeg1.clone();
  slideLeg2.position.set(0.6, 0.8, 0);
  playground.add(slideLeg2);

  const slideBoard = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.08, 2.1), slideBoardMat);
  slideBoard.position.set(0, 1.55, 0.6);
  slideBoard.rotation.x = -0.55;
  slideBoard.castShadow = true;
  playground.add(slideBoard);

  playground.children.forEach(c => (c.castShadow = true));
  world.add(playground);

  // swing set
  const swing = new THREE.Group();
  swing.position.set(4.9, 0, -1.6);
  const swingMat = mat(0x8fcbe8, 0.6);
  const barGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.8);
  const barL = new THREE.Mesh(barGeo, swingMat); barL.position.set(-0.9, 0.9, 0); swing.add(barL);
  const barR = new THREE.Mesh(barGeo, swingMat); barR.position.set(0.9, 0.9, 0); swing.add(barR);
  const barTop = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.9), swingMat);
  barTop.rotation.z = Math.PI / 2;
  barTop.position.set(0, 1.8, 0);
  swing.add(barTop);
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.25), mat(0xff8fa3, 0.6));
  seat.position.set(0, 0.9, 0);
  swing.add(seat);
  swing.children.forEach(c => (c.castShadow = true));
  world.add(swing);

  /* ---------- Trees ---------- */
  function makeTree(scale = 1) {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 1.1, 8), matTrunk);
    trunk.position.y = 0.55;
    trunk.castShadow = true;
    g.add(trunk);
    const leafA = new THREE.Mesh(new THREE.SphereGeometry(0.75, 12, 10), matLeaf);
    leafA.position.y = 1.35;
    leafA.castShadow = true;
    g.add(leafA);
    const leafB = new THREE.Mesh(new THREE.SphereGeometry(0.55, 12, 10), matLeafDeep);
    leafB.position.set(0.45, 1.7, 0.15);
    leafB.castShadow = true;
    g.add(leafB);
    const leafC = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 10), matLeafDeep);
    leafC.position.set(-0.4, 1.55, -0.25);
    leafC.castShadow = true;
    g.add(leafC);
    g.scale.setScalar(scale);
    return g;
  }
  const treePositions = [
    [-5.4, 0, 2.2, 1.1], [-6.4, 0, -1.4, 0.9], [-4.4, 0, -3.2, 0.75],
    [6.4, 0, -3.6, 0.95], [5.6, 0, 3.8, 0.8], [-2.2, 0, -4.6, 0.7],
  ];
  treePositions.forEach(([x, y, z, s]) => {
    const t = makeTree(s);
    t.position.set(x, y, z);
    world.add(t);
  });

  /* ---------- Flowers scattered on the lawn ---------- */
  function makeFlower(color) {
    const g = new THREE.Group();
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.4, 6), matLeafDeep);
    stem.position.y = 0.2;
    g.add(stem);
    const petalMat = mat(color, 0.5);
    for (let i = 0; i < 5; i++) {
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), petalMat);
      const a = (i / 5) * Math.PI * 2;
      p.position.set(Math.cos(a) * 0.12, 0.42, Math.sin(a) * 0.12);
      g.add(p);
    }
    const center = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), mat(0xffc259, 0.5));
    center.position.y = 0.42;
    g.add(center);
    return g;
  }
  const flowerColors = [0xff6f81, 0xffc259, 0xd9bff5, 0xffffff];
  for (let i = 0; i < 22; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 3.4 + Math.random() * 6.2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    if (Math.abs(x) < 2.6 && z > 2.5 && z < 6) continue; // keep path clear
    const f = makeFlower(flowerColors[i % flowerColors.length]);
    f.position.set(x, 0, z);
    f.scale.setScalar(0.8 + Math.random() * 0.5);
    world.add(f);
  }

  /* ---------- Clouds ---------- */
  function makeCloud(scale = 1) {
    const g = new THREE.Group();
    const puffs = [
      [0, 0, 0, 0.55], [0.55, 0.08, 0, 0.4], [-0.55, 0.05, 0, 0.42],
      [0.2, 0.32, 0, 0.38], [-0.25, 0.28, 0, 0.34],
    ];
    puffs.forEach(([x, y, z, r]) => {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), matCloud);
      puff.position.set(x, y, z);
      g.add(puff);
    });
    g.scale.setScalar(scale);
    return g;
  }
  const clouds = [];
  const cloudSpecs = [
    [-6, 6.4, -6, 1.1], [5.5, 7.2, -5, 0.9], [0.5, 8, -8, 1.3], [-3, 5.6, 4, 0.6],
  ];
  cloudSpecs.forEach(([x, y, z, s]) => {
    const c = makeCloud(s);
    c.position.set(x, y, z);
    world.add(c);
    clouds.push(c);
  });

  /* ---------- Balloons ---------- */
  const balloons = [];
  function makeBalloon(color) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 16), mat(color, 0.35, 0.05));
    body.scale.set(0.9, 1.15, 0.9);
    body.castShadow = true;
    g.add(body);
    const knot = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.1, 8), mat(color, 0.35));
    knot.position.y = -0.5;
    g.add(knot);
    const stringGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, -0.55, 0),
      new THREE.Vector3(0, -1.7, 0),
    ]);
    const stringMat = new THREE.LineBasicMaterial({ color: 0x8a7a72, transparent: true, opacity: 0.6 });
    const line = new THREE.Line(stringGeo, stringMat);
    g.add(line);
    return g;
  }
  const balloonSpecs = [
    [-3.2, 3.2, 3.6], [3.6, 3.7, 3.2], [-1.6, 4.4, 4.4], [2.2, 4.9, 4.0], [0, 5.4, 3.2],
  ];
  balloonSpecs.forEach(([x, y, z], i) => {
    const b = makeBalloon(balloonColors[i % balloonColors.length]);
    b.position.set(x, y, z);
    world.add(b);
    balloons.push({ mesh: b, baseY: y, phase: Math.random() * Math.PI * 2, speed: 0.6 + Math.random() * 0.4 });
  });

  /* ---------- Resize ---------- */
  function handleResize() {
    width = hero.clientWidth;
    height = hero.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }
  window.addEventListener('resize', handleResize);

  /* ---------- Mouse / touch parallax ---------- */
  let targetRotY = 0;
  let targetRotX = 0;
  let curRotY = 0;
  let curRotX = 0;

  function setPointer(nx, ny) {
    // nx, ny in range -1..1
    targetRotY = nx * 0.28;
    targetRotX = ny * 0.08;
  }
  window.addEventListener('pointermove', (e) => {
    const rect = hero.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    setPointer(nx, ny);
  }, { passive: true });

  let touchActive = false;
  hero.addEventListener('touchmove', (e) => {
    if (!e.touches[0]) return;
    touchActive = true;
    const rect = hero.getBoundingClientRect();
    const t = e.touches[0];
    const nx = ((t.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((t.clientY - rect.top) / rect.height) * 2 - 1;
    setPointer(nx, ny);
  }, { passive: true });

  /* ---------- Idle auto-drift (when no pointer interaction) ---------- */
  const clock = new THREE.Clock();
  let idleAngle = 0;

  /* ---------- Scroll fade / parallax for whole scene ---------- */
  let scrollFactor = 0;
  function onHeroScroll() {
    const rect = hero.getBoundingClientRect();
    scrollFactor = Math.min(Math.max(-rect.top / rect.height, 0), 1);
  }
  window.addEventListener('scroll', onHeroScroll, { passive: true });

  /* ---------- Pause rendering when hero is off-screen (perf) ---------- */
  let isVisible = true;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => { isVisible = entry.isIntersecting; });
  }, { threshold: 0 });
  io.observe(hero);

  /* ---------- Animate ---------- */
  function animate() {
    requestAnimationFrame(animate);
    if (!isVisible) return;

    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    if (!touchActive) {
      idleAngle += dt * 0.05;
      targetRotY = Math.sin(idleAngle) * 0.12 + targetRotY * 0.0; // gentle idle sway, pointer still dominant if moved
    }

    curRotY += (targetRotY - curRotY) * 0.04;
    curRotX += (targetRotX - curRotX) * 0.04;

    world.rotation.y = curRotY + Math.sin(t * 0.05) * 0.03;
    world.rotation.x = curRotX * 0.3;

    // gentle whole-scene bob
    world.position.y = -1.4 - scrollFactor * 1.6 + Math.sin(t * 0.6) * 0.03;
    camera.position.y = 3.6 + scrollFactor * 0.6;
    scene.fog.near = 14 - scrollFactor * 4;

    balloons.forEach(b => {
      b.mesh.position.y = b.baseY + Math.sin(t * b.speed + b.phase) * 0.18;
      b.mesh.rotation.z = Math.sin(t * b.speed * 0.5 + b.phase) * 0.05;
    });

    clouds.forEach((c, i) => {
      c.position.x += Math.sin(t * 0.05 + i) * 0.0006;
      c.position.y += Math.sin(t * 0.3 + i) * 0.0004;
    });

    swing.children.forEach(() => {}); // static seat, reserved for future motion
    seat.rotation.x = Math.sin(t * 0.8) * 0.05;

    renderer.render(scene, camera);
  }

  handleResize();
  animate();
}
