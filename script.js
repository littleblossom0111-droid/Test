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
            0.45,
            0.53,
            20
          ),
          matRoofDeep
        );


      frame.position.set(
        x,
        1.55,
        1.815
      );


      building.add(frame);

    }
  );


  /* ---------- CHIMNEY ---------- */

  const chimney =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        0.45,
        1.1,
        0.45
      ),
      matRoofDeep
    );


  chimney.position.set(
    1.6,
    3.5,
    -0.6
  );

  chimney.castShadow =
    true;

  building.add(chimney);


  /* ---------- SIGN ---------- */

  const signPost =
    new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.05,
        0.05,
        1
      ),
      matTrunk
    );


  signPost.position.set(
    -2.6,
    3.1,
    1.9
  );


  building.add(signPost);


  const signBoard =
    new THREE.Mesh(
      new THREE.CircleGeometry(
        0.42,
        24
      ),
      matRoof
    );


  signBoard.position.set(
    -2.6,
    3.6,
    1.9
  );


  building.add(signBoard);


  world.add(building);


  /* =======================================================
     PLAYGROUND
     ======================================================= */

  const playground =
    new THREE.Group();


  playground.position.set(
    4.6,
    0,
    1.4
  );


  const slideFrameMat =
    mat(
      0xffc259,
      0.6
    );


  const slideBoardMat =
    mat(
      0xff6f81,
      0.5
    );


  const slideLeg1 =
    new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.06,
        0.06,
        1.6
      ),
      slideFrameMat
    );


  slideLeg1.position.set(
    -0.6,
    0.8,
    0
  );


  playground.add(
    slideLeg1
  );


  const slideLeg2 =
    slideLeg1.clone();


  slideLeg2.position.set(
    0.6,
    0.8,
    0
  );


  playground.add(
    slideLeg2
  );


  const slideBoard =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        1.3,
        0.08,
        2.1
      ),
      slideBoardMat
    );


  slideBoard.position.set(
    0,
    1.55,
    0.6
  );


  slideBoard.rotation.x =
    -0.55;


  slideBoard.castShadow =
    true;


  playground.add(
    slideBoard
  );


  playground.children.forEach(
    (child) => {
      child.castShadow = true;
    }
  );


  world.add(playground);


  /* =======================================================
     SWING
     ======================================================= */

  const swing =
    new THREE.Group();


  swing.position.set(
    4.9,
    0,
    -1.6
  );


  const swingMat =
    mat(
      0x8fcbe8,
      0.6
    );


  const barGeo =
    new THREE.CylinderGeometry(
      0.05,
      0.05,
      1.8
    );


  const barL =
    new THREE.Mesh(
      barGeo,
      swingMat
    );


  barL.position.set(
    -0.9,
    0.9,
    0
  );


  swing.add(barL);


  const barR =
    new THREE.Mesh(
      barGeo,
      swingMat
    );


  barR.position.set(
    0.9,
    0.9,
    0
  );


  swing.add(barR);


  const barTop =
    new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.05,
        0.05,
        1.9
      ),
      swingMat
    );


  barTop.rotation.z =
    Math.PI / 2;


  barTop.position.set(
    0,
    1.8,
    0
  );


  swing.add(barTop);


  const seat =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        0.5,
        0.06,
        0.25
      ),
      mat(
        0xff8fa3,
        0.6
      )
    );


  seat.position.set(
    0,
    0.9,
    0
  );


  swing.add(seat);


  swing.children.forEach(
    (child) => {
      child.castShadow = true;
    }
  );


  world.add(swing);


  /* =======================================================
     TREES
     ======================================================= */

  function makeTree(
    scale = 1
  ) {

    const group =
      new THREE.Group();


    const trunk =
      new THREE.Mesh(
        new THREE.CylinderGeometry(
          0.12,
          0.16,
          1.1,
          8
        ),
        matTrunk
      );


    trunk.position.y =
      0.55;

    trunk.castShadow =
      true;

    group.add(trunk);


    const leafA =
      new THREE.Mesh(
        new THREE.SphereGeometry(
          0.75,
          12,
          10
        ),
        matLeaf
      );


    leafA.position.y =
      1.35;

    leafA.castShadow =
      true;

    group.add(leafA);


    const leafB =
      new THREE.Mesh(
        new THREE.SphereGeometry(
          0.55,
          12,
          10
        ),
        matLeafDeep
      );


    leafB.position.set(
      0.45,
      1.7,
      0.15
    );


    leafB.castShadow =
      true;

    group.add(leafB);


    const leafC =
      new THREE.Mesh(
        new THREE.SphereGeometry(
          0.5,
          12,
          10
        ),
        matLeafDeep
      );


    leafC.position.set(
      -0.4,
      1.55,
      -0.25
    );


    leafC.castShadow =
      true;

    group.add(leafC);


    group.scale.setScalar(
      scale
    );


    return group;

  }


  const treePositions = [

    [-5.4, 0, 2.2, 1.1],

    [-6.4, 0, -1.4, 0.9],

    [-4.4, 0, -3.2, 0.75],

    [6.4, 0, -3.6, 0.95],

    [5.6, 0, 3.8, 0.8],

    [-2.2, 0, -4.6, 0.7]

  ];


  treePositions.forEach(
    ([x, y, z, scale]) => {

      const tree =
        makeTree(scale);

      tree.position.set(
        x,
        y,
        z
      );

      world.add(tree);

    }
  );


  /* =======================================================
     FLOWERS
     ======================================================= */

  function makeFlower(color) {

    const group =
      new THREE.Group();


    const stem =
      new THREE.Mesh(
        new THREE.CylinderGeometry(
          0.025,
          0.025,
          0.4,
          6
        ),
        matLeafDeep
      );


    stem.position.y =
      0.2;


    group.add(stem);


    const petalMat =
      mat(
        color,
        0.5
      );


    for (
      let i = 0;
      i < 5;
      i++
    ) {

      const petal =
        new THREE.Mesh(
          new THREE.SphereGeometry(
            0.09,
            8,
            8
          ),
          petalMat
        );


      const angle =
        (i / 5) *
        Math.PI *
        2;


      petal.position.set(
        Math.cos(angle) * 0.12,
        0.42,
        Math.sin(angle) * 0.12
      );


      group.add(petal);

    }


    const center =
      new THREE.Mesh(
        new THREE.SphereGeometry(
          0.07,
          8,
          8
        ),
        mat(
          0xffc259,
          0.5
        )
      );


    center.position.y =
      0.42;


    group.add(center);


    return group;

  }


  const flowerColors = [
    0xff6f81,
    0xffc259,
    0xd9bff5,
    0xffffff
  ];


  for (
    let i = 0;
    i < 22;
    i++
  ) {

    const angle =
      Math.random() *
      Math.PI *
      2;


    const radius =
      3.4 +
      Math.random() * 6.2;


    const x =
      Math.cos(angle) *
      radius;


    const z =
      Math.sin(angle) *
      radius;


    if (
      Math.abs(x) < 2.6 &&
      z > 2.5 &&
      z < 6
    ) {
      continue;
    }


    const flower =
      makeFlower(
        flowerColors[
          i %
          flowerColors.length
        ]
      );


    flower.position.set(
      x,
      0,
      z
    );


    flower.scale.setScalar(
      0.8 +
      Math.random() * 0.5
    );


    world.add(flower);

  }


  /* =======================================================
     CLOUDS
     ======================================================= */

  function makeCloud(
    scale = 1
  ) {

    const group =
      new THREE.Group();


    const puffs = [

      [0, 0, 0, 0.55],

      [0.55, 0.08, 0, 0.4],

      [-0.55, 0.05, 0, 0.42],

      [0.2, 0.32, 0, 0.38],

      [-0.25, 0.28, 0, 0.34]

    ];


    puffs.forEach(
      ([x, y, z, radius]) => {

        const puff =
          new THREE.Mesh(
            new THREE.SphereGeometry(
              radius,
              10,
              8
            ),
            matCloud
          );


        puff.position.set(
          x,
          y,
          z
        );


        group.add(puff);

      }
    );


    group.scale.setScalar(
      scale
    );


    return group;

  }


  const clouds = [];


  const cloudSpecs = [

    [-6, 6.4, -6, 1.1],

    [5.5, 7.2, -5, 0.9],

    [0.5, 8, -8, 1.3],

    [-3, 5.6, 4, 0.6]

  ];


  cloudSpecs.forEach(
    ([x, y, z, scale]) => {

      const cloud =
        makeCloud(scale);


      cloud.position.set(
        x,
        y,
        z
      );


      world.add(cloud);

      clouds.push(cloud);

    }
  );


  /* =======================================================
     BALLOONS
     ======================================================= */

  const balloons = [];


  function makeBalloon(color) {

    const group =
      new THREE.Group();


    const body =
      new THREE.Mesh(
        new THREE.SphereGeometry(
          0.4,
          16,
          16
        ),
        mat(
          color,
          0.35,
          0.05
        )
      );


    body.scale.set(
      0.9,
      1.15,
      0.9
    );


    body.castShadow =
      true;


    group.add(body);


    const knot =
      new THREE.Mesh(
        new THREE.ConeGeometry(
          0.06,
          0.1,
          8
        ),
        mat(
          color,
          0.35
        )
      );


    knot.position.y =
      -0.5;


    group.add(knot);


    const stringGeo =
      new THREE.BufferGeometry()
        .setFromPoints([

          new THREE.Vector3(
            0,
            -0.55,
            0
          ),

          new THREE.Vector3(
            0,
            -1.7,
            0
          )

        ]);


    const stringMat =
      new THREE.LineBasicMaterial({
        color: 0x8a7a72,
        transparent: true,
        opacity: 0.6
      });


    const line =
      new THREE.Line(
        stringGeo,
        stringMat
      );


    group.add(line);


    return group;

  }


  const balloonSpecs = [

    [-3.2, 3.2, 3.6],

    [3.6, 3.7, 3.2],

    [-1.6, 4.4, 4.4],

    [2.2, 4.9, 4.0],

    [0, 5.4, 3.2]

  ];


  balloonSpecs.forEach(
    ([x, y, z], index) => {

      const balloon =
        makeBalloon(
          balloonColors[
            index %
            balloonColors.length
          ]
        );


      balloon.position.set(
        x,
        y,
        z
      );


      world.add(balloon);


      balloons.push({

        mesh: balloon,

        baseY: y,

        phase:
          Math.random() *
          Math.PI *
          2,

        speed:
          0.6 +
          Math.random() *
          0.4

      });

    }
  );


  /* =======================================================
     RESIZE
     ======================================================= */

  function handleResize() {

    width =
      hero.clientWidth ||
      window.innerWidth;


    height =
      hero.clientHeight ||
      700;


    camera.aspect =
      width / height;


    camera.updateProjectionMatrix();


    renderer.setSize(
      width,
      height,
      false
    );

  }


  window.addEventListener(
    "resize",
    handleResize
  );


  /* =======================================================
     PARALLAX
     ======================================================= */

  let targetRotY = 0;

  let targetRotX = 0;

  let currentRotY = 0;

  let currentRotX = 0;


  function setPointer(
    x,
    y
  ) {

    targetRotY =
      x * 0.28;


    targetRotX =
      y * 0.08;

  }


  window.addEventListener(
    "pointermove",
    (event) => {

      const rect =
        hero.getBoundingClientRect();


      const nx =
        (
          (event.clientX -
            rect.left) /
          rect.width
        ) * 2 - 1;


      const ny =
        (
          (event.clientY -
            rect.top) /
          rect.height
        ) * 2 - 1;


      setPointer(
        nx,
        ny
      );

    },
    {
      passive: true
    }
  );


  /* =======================================================
     SCROLL
     ======================================================= */

  let scrollFactor = 0;


  function onHeroScroll() {

    const rect =
      hero.getBoundingClientRect();


    scrollFactor =
      Math.min(
        Math.max(
          -rect.top /
          rect.height,
          0
        ),
        1
      );

  }


  window.addEventListener(
    "scroll",
    onHeroScroll,
    {
      passive: true
    }
  );


  /* =======================================================
     VISIBILITY
     ======================================================= */

  let isVisible = true;


  const visibilityObserver =
    new IntersectionObserver(
      (entries) => {

        entries.forEach(
          (entry) => {

            isVisible =
              entry.isIntersecting;

          }
        );

      },
      {
        threshold: 0
      }
    );


  visibilityObserver.observe(
    hero
  );


  /* =======================================================
     ANIMATION
     ======================================================= */

  const clock =
    new THREE.Clock();


  let idleAngle = 0;


  function animate() {

    requestAnimationFrame(
      animate
    );


    if (!isVisible) {
      return;
    }


    const dt =
      Math.min(
        clock.getDelta(),
        0.05
      );


    const time =
      clock.elapsedTime;


    /* ---------- IDLE MOVEMENT ---------- */

    idleAngle +=
      dt * 0.05;


    const idleRotation =
      Math.sin(
        idleAngle
      ) * 0.12;


    currentRotY +=
      (
        idleRotation -
        currentRotY
      ) * 0.015;


    currentRotX +=
      (
        targetRotX -
        currentRotX
      ) * 0.04;


    world.rotation.y =
      currentRotY +
      Math.sin(
        time * 0.05
      ) * 0.03;


    world.rotation.x =
      currentRotX * 0.3;


    /* ---------- BOB ---------- */

    world.position.y =
      -1.4 -
      scrollFactor * 1.6 +
      Math.sin(
        time * 0.6
      ) * 0.03;


    camera.position.y =
      3.6 +
      scrollFactor * 0.6;


    scene.fog.near =
      14 -
      scrollFactor * 4;


    /* ---------- BALLOONS ---------- */

    balloons.forEach(
      (balloon) => {

        balloon.mesh.position.y =
          balloon.baseY +
          Math.sin(
            time *
            balloon.speed +
            balloon.phase
          ) * 0.18;


        balloon.mesh.rotation.z =
          Math.sin(
            time *
            balloon.speed *
            0.5 +
            balloon.phase
          ) * 0.05;

      }
    );


    /* ---------- CLOUDS ---------- */

    clouds.forEach(
      (cloud, index) => {

        cloud.position.x +=
          Math.sin(
            time * 0.05 +
            index
          ) * 0.0006;


        cloud.position.y +=
          Math.sin(
            time * 0.3 +
            index
          ) * 0.0004;

      }
    );


    /* ---------- SWING ---------- */

    seat.rotation.x =
      Math.sin(
        time * 0.8
      ) * 0.05;


    /* ---------- RENDER ---------- */

    renderer.render(
      scene,
      camera
    );

  }


  /* ---------- START ---------- */

  handleResize();

  onHeroScroll();

  animate();

}