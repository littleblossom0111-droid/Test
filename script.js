/* =========================================================
   LITTLE BLOSSOMS — script.js
   Fixed Version
   - Gallery photos/videos
   - GitHub Pages compatible paths
   - Supports 1.mp4, 2.mp4 AND lit1.mp4, lit2.mp4
   - Three.js CDN import
   - Mobile safe
   - Scroll reveal
   - Mobile navigation
   ========================================================= */


/* =========================================================
   BASIC HELPERS
   ========================================================= */

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);


/* =========================================================
   YEAR
   ========================================================= */

const yearEl = document.getElementById("year");

if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}


/* =========================================================
   NAVIGATION
   ========================================================= */

const navbar = document.getElementById("navbar");
const navLinks = document.querySelectorAll(".nav-link");

const sections = document.querySelectorAll(
  "main > section, .hero, .admission"
);


function onScroll() {

  if (navbar) {
    navbar.classList.toggle(
      "scrolled",
      window.scrollY > 30
    );
  }

  let current = "home";

  const scrollPos =
    window.scrollY +
    window.innerHeight * 0.35;

  sections.forEach((section) => {

    if (
      section.offsetTop <= scrollPos &&
      section.id
    ) {
      current = section.id;
    }

  });

  navLinks.forEach((link) => {

    link.classList.toggle(
      "active",
      link.getAttribute("href") === `#${current}`
    );

  });

}

window.addEventListener(
  "scroll",
  onScroll,
  { passive: true }
);

onScroll();


/* =========================================================
   MOBILE MENU
   ========================================================= */

const navToggle = document.getElementById("navToggle");
const navLinksList = document.getElementById("navLinks");

if (navToggle && navLinksList) {

  navToggle.addEventListener("click", () => {

    const isOpen =
      navLinksList.classList.toggle("open");

    navToggle.classList.toggle(
      "open",
      isOpen
    );

    navToggle.setAttribute(
      "aria-expanded",
      String(isOpen)
    );

  });


  navLinksList
    .querySelectorAll("a")
    .forEach((link) => {

      link.addEventListener("click", () => {

        navLinksList.classList.remove("open");

        navToggle.classList.remove("open");

        navToggle.setAttribute(
          "aria-expanded",
          "false"
        );

      });

    });

}


/* =========================================================
   SCROLL REVEAL
   ========================================================= */

const revealEls =
  document.querySelectorAll("[data-reveal]");

if ("IntersectionObserver" in window) {

  const revealObserver =
    new IntersectionObserver(
      (entries) => {

        entries.forEach((entry) => {

          if (!entry.isIntersecting) return;

          const parent =
            entry.target.parentElement;

          let index = 0;

          if (parent) {

            const siblings =
              Array.from(parent.children)
                .filter((el) =>
                  el.hasAttribute("data-reveal")
                );

            index =
              siblings.indexOf(entry.target);

          }

          entry.target.style.transitionDelay =
            `${Math.min(index * 90, 360)}ms`;

          entry.target.classList.add("in-view");

          revealObserver.unobserve(
            entry.target
          );

        });

      },
      {
        threshold: 0.15,
        rootMargin: "0px 0px -60px 0px"
      }
    );


  revealEls.forEach((el) => {
    revealObserver.observe(el);
  });

} else {

  revealEls.forEach((el) => {
    el.classList.add("in-view");
  });

}


/* =========================================================
   GALLERY LIGHTBOX
   ========================================================= */

const lightbox =
  document.getElementById("lightbox");

const lightboxEmoji =
  document.getElementById("lightboxEmoji");

const lightboxTitle =
  document.getElementById("lightboxTitle");

const lightboxDesc =
  document.getElementById("lightboxDesc");

const lightboxMedia =
  document.getElementById("lightboxMedia");


let lastFocusedEl = null;
let mediaLoadToken = 0;


/*
   Number of files to check.
   Example:

   classroom/
   1.mp4
   2.mp4
   3.jpg
   lit1.mp4
   lit2.mp4
*/

const MEDIA_SLOTS = 12;

const IMAGE_EXTS = [
  "jpg",
  "jpeg",
  "png",
  "webp"
];

const VIDEO_EXTS = [
  "mp4",
  "webm",
  "mov"
];


/* =========================================================
   GITHUB PAGES BASE PATH
   ========================================================= */

function mediaPath(folder, filename) {

  /*
     Relative path is safest for GitHub Pages project sites.
     Example:

     /Test/media/classroom/1.mp4

     when page is:

     /Test/
  */

  return `media/${folder}/${filename}`;
}


/* =========================================================
   IMAGE CHECK
   ========================================================= */

function probeImage(src) {

  return new Promise((resolve) => {

    const img = new Image();

    let finished = false;

    const finish = (ok) => {

      if (finished) return;

      finished = true;

      resolve({
        ok,
        src
      });

    };

    img.onload = () => finish(true);

    img.onerror = () => finish(false);

    img.src = src;

  });

}


/* =========================================================
   VIDEO CHECK
   ========================================================= */

function probeVideo(src) {

  return new Promise((resolve) => {

    const video =
      document.createElement("video");

    let finished = false;

    const finish = (ok) => {

      if (finished) return;

      finished = true;

      resolve({
        ok,
        src
      });

    };

    video.preload = "metadata";

    video.muted = true;

    video.playsInline = true;

    video.onloadedmetadata = () => {
      finish(true);
    };

    video.onerror = () => {
      finish(false);
    };

    video.src = src;

    video.load();


    /*
       Some mobile browsers don't immediately
       fire loadedmetadata.
    */

    setTimeout(() => {

      if (
        !finished &&
        video.readyState >= 1
      ) {
        finish(true);
      }

    }, 3000);

  });

}


/* =========================================================
   FIND MEDIA
   ========================================================= */

async function findSlotMedia(
  folder,
  slot
) {

  /*
     First check normal files:

     1.jpg
     1.png
     1.mp4

     Then check:

     lit1.jpg
     lit1.png
     lit1.mp4
  */

  const names = [
    `${slot}`,
    `lit${slot}`
  ];


  /* ---------- IMAGES ---------- */

  for (const name of names) {

    for (const ext of IMAGE_EXTS) {

      const src =
        mediaPath(
          folder,
          `${name}.${ext}`
        );

      const result =
        await probeImage(src);

      if (result.ok) {

        return {
          type: "image",
          src: result.src
        };

      }

    }

  }


  /* ---------- VIDEOS ---------- */

  for (const name of names) {

    for (const ext of VIDEO_EXTS) {

      const src =
        mediaPath(
          folder,
          `${name}.${ext}`
        );

      const result =
        await probeVideo(src);

      if (result.ok) {

        return {
          type: "video",
          src: result.src
        };

      }

    }

  }


  return null;
}


/* =========================================================
   LOAD GALLERY MEDIA
   ========================================================= */

async function loadGalleryMedia(
  folder,
  token
) {

  if (!lightboxMedia) return;


  lightboxMedia.innerHTML = `
    <div class="lightbox-loading">
      Loading photos & videos...
    </div>
  `;


  const checks = [];

  for (
    let i = 1;
    i <= MEDIA_SLOTS;
    i++
  ) {

    checks.push(
      findSlotMedia(folder, i)
    );

  }


  const results =
    await Promise.all(checks);


  /*
     If user clicked another gallery item
     while loading old item, stop.
  */

  if (token !== mediaLoadToken) {
    return;
  }


  const found =
    results.filter(Boolean);


  /* ---------- NOTHING FOUND ---------- */

  if (!found.length) {

    lightboxMedia.innerHTML = `
      <div class="lightbox-empty">

        <strong>No photos or videos found.</strong>

        <br><br>

        Folder:
        <code>media/${folder}/</code>

        <br><br>

        Use names like:

        <br>

        <code>1.jpg</code>

        <br>

        <code>2.jpg</code>

        <br>

        <code>1.mp4</code>

        <br>

        <code>lit1.mp4</code>

      </div>
    `;

    return;
  }


  /* ---------- DISPLAY MEDIA ---------- */

  lightboxMedia.innerHTML = "";


  found.forEach((item) => {

    if (item.type === "image") {

      const img =
        document.createElement("img");

      img.src = item.src;

      img.alt = "Little Blossoms";

      img.loading = "lazy";

      img.decoding = "async";

      lightboxMedia.appendChild(img);

    }


    else if (item.type === "video") {

      const video =
        document.createElement("video");

      video.src = item.src;

      video.controls = true;

      video.preload = "metadata";

      video.playsInline = true;

      video.setAttribute(
        "playsinline",
        ""
      );

      video.setAttribute(
        "webkit-playsinline",
        ""
      );

      lightboxMedia.appendChild(video);

    }

  });

}


/* =========================================================
   OPEN LIGHTBOX
   ========================================================= */

function openLightbox(card) {

  if (!lightbox) return;


  lastFocusedEl =
    document.activeElement;


  if (lightboxEmoji) {

    lightboxEmoji.textContent =
      card.dataset.emoji || "🌸";

  }


  if (lightboxTitle) {

    lightboxTitle.textContent =
      card.dataset.title || "";

  }


  if (lightboxDesc) {

    lightboxDesc.textContent =
      card.dataset.desc || "";

  }


  lightbox.classList.add("open");

  lightbox.setAttribute(
    "aria-hidden",
    "false"
  );


  document.body.style.overflow =
    "hidden";


  const closeButton =
    lightbox.querySelector(
      ".lightbox-close"
    );

  if (closeButton) {
    closeButton.focus();
  }


  const folder =
    card.dataset.folder;


  if (folder) {

    mediaLoadToken++;

    loadGalleryMedia(
      folder,
      mediaLoadToken
    );

  }

}


/* =========================================================
   CLOSE LIGHTBOX
   ========================================================= */

function closeLightbox() {

  if (!lightbox) return;


  lightbox.classList.remove("open");

  lightbox.setAttribute(
    "aria-hidden",
    "true"
  );


  document.body.style.overflow = "";


  if (lastFocusedEl) {

    try {
      lastFocusedEl.focus();
    } catch (e) {}

  }


  if (lightboxMedia) {

    lightboxMedia
      .querySelectorAll("video")
      .forEach((video) => {

        video.pause();

        video.currentTime = 0;

      });

  }

}


/* =========================================================
   GALLERY CLICK EVENTS
   ========================================================= */

document
  .querySelectorAll("[data-gallery-item]")
  .forEach((card) => {

    card.addEventListener(
      "click",
      () => openLightbox(card)
    );

  });


document
  .querySelectorAll("[data-lightbox-close]")
  .forEach((element) => {

    element.addEventListener(
      "click",
      closeLightbox
    );

  });


document.addEventListener(
  "keydown",
  (event) => {

    if (
      event.key === "Escape" &&
      lightbox &&
      lightbox.classList.contains("open")
    ) {

      closeLightbox();

    }

  }
);


/* =========================================================
   WEBGL CHECK
   ========================================================= */

function supportsWebGL() {

  try {

    const canvas =
      document.createElement("canvas");

    return !!(
      window.WebGLRenderingContext &&
      (
        canvas.getContext("webgl") ||
        canvas.getContext(
          "experimental-webgl"
        )
      )
    );

  } catch (error) {

    return false;

  }

}


/* =========================================================
   HERO
   ========================================================= */

const heroCanvas =
  document.getElementById(
    "hero-canvas"
  );

const hero =
  document.querySelector(".hero");


if (
  heroCanvas &&
  hero &&
  supportsWebGL()
) {

  initHeroScene();

}

else if (heroCanvas && hero) {

  heroCanvas.style.display =
    "none";

  hero.classList.add(
    "no-webgl"
  );

}


/* =========================================================
   THREE.JS HERO
   ========================================================= */

async function initHeroScene() {

  let THREE;


  /*
     IMPORTANT FIX:

     Old:
     import("three")

     This does NOT work directly on
     GitHub Pages.

     New:
     Import Three.js from CDN.
  */

  try {

    THREE = await import(
      "https://cdn.jsdelivr.net/npm/three@0.179.1/build/three.module.js"
    );

  } catch (error) {

    console.error(
      "Three.js failed to load:",
      error
    );

    if (heroCanvas) {
      heroCanvas.style.display =
        "none";
    }

    if (hero) {
      hero.classList.add(
        "no-webgl"
      );
    }

    return;
  }


  /* ---------- SIZE ---------- */

  let width =
    hero.clientWidth || window.innerWidth;

  let height =
    hero.clientHeight || 700;


  const pixelRatio =
    Math.min(
      window.devicePixelRatio || 1,
      1.8
    );


  /* ---------- SCENE ---------- */

  const scene =
    new THREE.Scene();


  scene.fog =
    new THREE.Fog(
      0xfff3e0,
      14,
      34
    );


  /* ---------- CAMERA ---------- */

  const camera =
    new THREE.PerspectiveCamera(
      42,
      width / height,
      0.1,
      100
    );


  camera.position.set(
    0,
    3.6,
    13
  );


  camera.lookAt(
    0,
    1.6,
    0
  );


  /* ---------- RENDERER ---------- */

  let renderer;


  try {

    renderer =
      new THREE.WebGLRenderer({

        canvas: heroCanvas,

        antialias: true,

        alpha: true,

        powerPreference:
          "high-performance"

      });

  } catch (error) {

    console.error(
      "WebGL renderer error:",
      error
    );

    heroCanvas.style.display =
      "none";

    hero.classList.add(
      "no-webgl"
    );

    return;

  }


  renderer.setPixelRatio(
    pixelRatio
  );

  renderer.setSize(
    width,
    height,
    false
  );


  renderer.shadowMap.enabled =
    true;

  renderer.shadowMap.type =
    THREE.PCFSoftShadowMap;


  if (
    "outputColorSpace" in renderer
  ) {

    renderer.outputColorSpace =
      THREE.SRGBColorSpace;

  }


  /* =======================================================
     LIGHTING
     ======================================================= */

  const hemi =
    new THREE.HemisphereLight(
      0xfff3d6,
      0xf3c9c9,
      1.05
    );

  scene.add(hemi);


  const sun =
    new THREE.DirectionalLight(
      0xfff0d0,
      1.6
    );

  sun.position.set(
    6,
    10,
    6
  );

  sun.castShadow = true;


  sun.shadow.mapSize.set(
    1024,
    1024
  );


  sun.shadow.camera.left = -10;
  sun.shadow.camera.right = 10;
  sun.shadow.camera.top = 10;
  sun.shadow.camera.bottom = -10;
  sun.shadow.camera.far = 30;

  sun.shadow.bias = -0.0025;

  scene.add(sun);


  const fill =
    new THREE.PointLight(
      0xffd9e8,
      0.6,
      20
    );

  fill.position.set(
    -6,
    4,
    4
  );

  scene.add(fill);


  /* =======================================================
     MATERIALS
     ======================================================= */

  const mat = (
    color,
    roughness = 0.75,
    metalness = 0.05
  ) => {

    return new THREE.MeshStandardMaterial({
      color,
      roughness,
      metalness
    });

  };


  const matWall =
    mat(0xfff3e2, 0.9);

  const matRoof =
    mat(0xff8fa3, 0.6);

  const matRoofDeep =
    mat(0xe8536b, 0.6);

  const matDoor =
    mat(0x7fb685, 0.7);

  const matWindow =
    mat(
      0xbfe3f5,
      0.35,
      0.1
    );

  const matGrass =
    mat(
      0x9fd6a6,
      0.95
    );

  const matGrassDeep =
    mat(
      0x7fb685,
      0.95
    );

  const matTrunk =
    mat(
      0xb08463,
      0.9
    );

  const matLeaf =
    mat(
      0x6fbf7a,
      0.8
    );

  const matLeafDeep =
    mat(
      0x4f9d5c,
      0.8
    );

  const matPath =
    mat(
      0xffe2b8,
      0.9
    );


  const matCloud =
    new THREE.MeshStandardMaterial({

      color: 0xffffff,

      roughness: 1,

      transparent: true,

      opacity: 0.92

    });


  const balloonColors = [
    0xff6f81,
    0xffc259,
    0x8fcbe8,
    0x9fd6a6,
    0xd9bff5
  ];


  /* =======================================================
     WORLD
     ======================================================= */

  const world =
    new THREE.Group();

  scene.add(world);


  /* ---------- GROUND ---------- */

  const ground =
    new THREE.Mesh(
      new THREE.CircleGeometry(
        14,
        48
      ),
      matGrass
    );


  ground.rotation.x =
    -Math.PI / 2;

  ground.receiveShadow =
    true;

  world.add(ground);


  const groundRing =
    new THREE.Mesh(
      new THREE.RingGeometry(
        6.6,
        14,
        48
      ),
      matGrassDeep
    );


  groundRing.rotation.x =
    -Math.PI / 2;

  groundRing.position.y =
    -0.02;

  world.add(groundRing);


  /* ---------- PATH ---------- */

  const path =
    new THREE.Mesh(
      new THREE.PlaneGeometry(
        1.6,
        4.2
      ),
      matPath
    );


  path.rotation.x =
    -Math.PI / 2;

  path.position.set(
    0,
    0.01,
    4.6
  );

  world.add(path);


  /* =======================================================
     PRESCHOOL BUILDING
     ======================================================= */

  const building =
    new THREE.Group();


  building.position.set(
    0,
    0,
    -1
  );


  const base =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        5.2,
        2.6,
        3.6
      ),
      matWall
    );


  base.position.y =
    1.3;

  base.castShadow = true;

  base.receiveShadow = true;

  building.add(base);


  const roof =
    new THREE.Mesh(
      new THREE.ConeGeometry(
        3.9,
        1.8,
        4
      ),
      matRoof
    );


  roof.position.y =
    3.5;

  roof.rotation.y =
    Math.PI / 4;

  roof.castShadow =
    true;

  building.add(roof);


  const roofTrim =
    new THREE.Mesh(
      new THREE.TorusGeometry(
        0.18,
        0.08,
        8,
        24
      ),
      matRoofDeep
    );


  roofTrim.position.y =
    2.62;

  roofTrim.rotation.x =
    Math.PI / 2;

  building.add(roofTrim);


  /* ---------- DOOR ---------- */

  const door =
    new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.55,
        0.55,
        1.5,
        16,
        1,
        false,
        0,
        Math.PI
      ),
      matDoor
    );


  door.rotation.z =
    Math.PI;

  door.rotation.y =
    Math.PI / 2;

  door.position.set(
    0,
    0.75,
    1.81
  );

  building.add(door);


  /* ---------- WINDOWS ---------- */

  const windowGeo =
    new THREE.CircleGeometry(
      0.45,
      20
    );


  [-1.55, 1.55].forEach(
    (x) => {

      const win =
        new THREE.Mesh(
          windowGeo,
          matWindow
        );


      win.position.set(
        x,
        1.55,
        1.81
      );


      building.add(win);


      const frame =
        new THREE.Mesh(
          new THREE.RingGeometry(
     