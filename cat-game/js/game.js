/* ============================================================
   get the cat food — vanilla JS mini-game
   ------------------------------------------------------------
   - Trust screen (yes / no → crying version with two yes buttons)
   - Cat follows the mouse smoothly (exponential lerp) + arrow
     keys fallback (delta-time based, frame-rate independent)
   - Food circles: max 20 active, 10s lifetime, ~300px replacement
     distance from the collected circle, 300 global spawn limit
   - Coupons every 30 collected, game ends at 5 coupons OR at the
     300th spawned circle (immediately)
   ============================================================ */

"use strict";

(function () {
  /* ---------------- constants ---------------- */
  const MAX_ACTIVE_CIRCLES = 20;              // simultaneous circles on screen
  const MAX_SPAWNED_CIRCLES = 300;            // global lifetime spawn limit
  const CIRCLE_LIFETIME_MS = 10000;           // 10 seconds per circle
  const CIRCLE_WARN_MS = 7500;                // pulse warning before expiring
  const MIN_REPLACEMENT_DISTANCE = 300;       // px away from collected circle
  const EDGE_MARGIN = 30;                     // keep circles inside the viewport
  const OVERLAP_GAP = 44;                     // min px between two circles
  const FOOD_RADIUS = 16;
  const COUPON_STEP = 30;                     // circles per coupon
  const MAX_COUPONS = 5;                      // game over at 5 coupons
  const TREATS_VISIBLE_AT = 5;                // countdown appears at 5 collected
  const KEY_SPEED = 450;                      // keyboard speed, px per second
  const FOLLOW_RATE = 12;                     // mouse-follow smoothing (1/s)
  const MAX_FRAME_DT = 0.05;                  // clamp huge frame gaps (tab switch)

  const STATE = { TRUST: "trust", PLAYING: "playing", GAME_OVER: "gameOver" };
  const MOVE_KEYS = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
  const SCROLL_KEYS = [" ", "PageUp", "PageDown", "Home", "End"];

  /* ---------------- dom refs ---------------- */
  const gameContainer = document.getElementById("game-container");
  const trustModal = document.getElementById("trust-modal");
  const trustQuestion = document.getElementById("trust-question");
  const trustActions = document.getElementById("trust-actions");
  const gameOverModal = document.getElementById("game-over-modal");
  const playArea = document.getElementById("play-area");  const catEl = document.getElementById("cat");
  const foodContainer = document.getElementById("food-container");
  const foodCountEl = document.getElementById("food-count");
  const treatCountdownEl = document.getElementById("treat-countdown");
  const couponBox = document.getElementById("coupon-box");
  const couponCountEl = document.getElementById("coupon-count");

  /* ---------------- game state ---------------- */
  let state = STATE.TRUST;
  let rafId = 0;
  let lastTs = 0;

  let playW = 0;
  let playH = 0;
  let catW = 0;
  let catH = 0;

  let catX = 0;          // cat center (px, relative to play area)
  let catY = 0;
  let targetX = 0;       // where the cat wants to be (cursor / keys)
  let targetY = 0;

  const keys = new Set();
  const activeCircles = [];   // { el, x, y, timer, warnTimer }
  let totalSpawned = 0;        // global counter, never exceeds 300
  let foodCollected = 0;
  const feedbacks = new Set(); // { el, timer } floating "+1"

  /* ---------------- helpers ---------------- */
  const clamp = (v, min, max) => (v < min ? min : v > max ? max : v);

  function foodBounds() {
    const minX = Math.min(EDGE_MARGIN, playW / 2);
    const maxX = Math.max(minX, playW - EDGE_MARGIN);
    const minY = Math.min(EDGE_MARGIN, playH / 2);
    const maxY = Math.max(minY, playH - EDGE_MARGIN);
    return { minX, maxX, minY, maxY };
  }

  function catBounds() {
    const minX = catW / 2;
    const maxX = Math.max(minX, playW - catW / 2);
    const minY = catH / 2;
    const maxY = Math.max(minY, playH - catH / 2);
    return { minX, maxX, minY, maxY };
  }

  function measure() {
    playW = playArea.clientWidth;
    playH = playArea.clientHeight;
    const r = catEl.getBoundingClientRect();
    catW = r.width || 160;
    catH = r.height || 46;
  }

  function distance(ax, ay, bx, by) {
    return Math.hypot(ax - bx, ay - by);
  }

  function isPositionFree(x, y) {
    // Keep circles from overlapping one another …
    for (const c of activeCircles) {
      if (distance(x, y, c.x, c.y) < OVERLAP_GAP) return false;
    }
    // … and never spawn one directly on top of the cat either.
    if (
      Math.abs(x - catX) < catW / 2 + FOOD_RADIUS + 8 &&
      Math.abs(y - catY) < catH / 2 + FOOD_RADIUS + 8
    ) {
      return false;
    }
    return true;
  }

  /**
   * Pick a position inside the playable area.
   * - With a reference (collected circle): must be >= ~300px away when the
   *   viewport allows it; otherwise the closest-to-300 practical position.
   * - Always tries not to overlap other active circles.
   */
  function findSpawnPosition(reference) {
    const b = foodBounds();
    const diag = Math.hypot(playW, playH);
    // Viewports too small for a full 300px separation use the maximum
    // practical distance instead of never spawning.
    const minDist =
      diag < MIN_REPLACEMENT_DISTANCE ? diag * 0.9 : MIN_REPLACEMENT_DISTANCE;

    const attempts = reference ? 80 : 60;
    let best = null;
    let bestScore = -Infinity;

    for (let i = 0; i < attempts; i++) {
      const x = b.minX + Math.random() * (b.maxX - b.minX);
      const y = b.minY + Math.random() * (b.maxY - b.minY);

      const dist = reference ? distance(x, y, reference.x, reference.y) : Infinity;
      const distOk = !reference || dist >= minDist;
      const freeOk = isPositionFree(x, y);

      if (distOk && freeOk) return { x, y };

      // Fallback: prefer the 300px rule, then non-overlap, then max distance.
      const distScore = reference ? Math.min(dist / minDist, 1) : 1;
      const score = (distOk ? 100 : distScore) + (freeOk ? 10 : 0);
      if (score > bestScore) {
        bestScore = score;
        best = { x, y };
      }
    }
    return best || { x: (b.minX + b.maxX) / 2, y: (b.minY + b.maxY) / 2 };
  }

  /* ---------------- food spawning ---------------- */
  function spawnFood(reference) {
    if (state !== STATE.PLAYING) return;
    if (totalSpawned >= MAX_SPAWNED_CIRCLES) return;

    const pos = findSpawnPosition(reference);

    const el = document.createElement("div");
    el.className = "food-circle";
    el.textContent = "\u25C9"; // ◉
    el.style.left = pos.x + "px";
    el.style.top = pos.y + "px";
    foodContainer.appendChild(el);

    const circle = { el, x: pos.x, y: pos.y, timer: 0, warnTimer: 0 };
    activeCircles.push(circle);
    totalSpawned += 1;
    // Observability for QA (not gameplay): total spawns so far.
    foodContainer.dataset.spawned = String(totalSpawned);

    circle.warnTimer = setTimeout(() => {
      if (state !== STATE.PLAYING) return;
      el.classList.add("expiring");
    }, CIRCLE_WARN_MS);

    circle.timer = setTimeout(() => expireCircle(circle), CIRCLE_LIFETIME_MS);

    // Reaching the 300th spawned circle ends the game IMMEDIATELY.
    if (totalSpawned >= MAX_SPAWNED_CIRCLES) {
      endGame();
    }
  }

  function removeCircle(circle) {
    const idx = activeCircles.indexOf(circle);
    if (idx !== -1) activeCircles.splice(idx, 1);
    clearTimeout(circle.timer);
    clearTimeout(circle.warnTimer);
    circle.el.remove();
  }

  function expireCircle(circle) {
    if (state !== STATE.PLAYING) return;
    if (activeCircles.indexOf(circle) === -1) return;
    removeCircle(circle);
    // Maintain up to 20 active circles while the global limit allows it.
    if (activeCircles.length < MAX_ACTIVE_CIRCLES) {
      spawnFood(null);
    }
  }

  /* ---------------- collection ---------------- */
  function collectCircle(circle) {
    const prev = { x: circle.x, y: circle.y };
    removeCircle(circle);

    foodCollected += 1;
    updateCounters();
    showFeedback(prev.x, prev.y);

    // Condition 1: five coupons (150 collected) ends the game immediately.
    if (Math.floor(foodCollected / COUPON_STEP) >= MAX_COUPONS) {
      endGame();
      return;
    }

    // Replacement appears ~300px away from the collected circle's position.
    if (activeCircles.length < MAX_ACTIVE_CIRCLES) {
      spawnFood(prev);
    }
  }

  function showFeedback(x, y) {
    const el = document.createElement("div");
    el.className = "collect-feedback";
    el.textContent = "+1";
    el.style.left = x + "px";
    el.style.top = y + "px";
    playArea.appendChild(el);
    const entry = { el, timer: setTimeout(() => {
      feedbacks.delete(entry);
      el.remove();
    }, 700) };
    feedbacks.add(entry);
  }

  /* ---------------- counters ---------------- */
  function treatsRemaining(collected) {
    const mod = collected % COUPON_STEP;
    // Multiples of 30 (after a coupon) restart the countdown at 25,
    // otherwise count down 25 … 1 toward the next 30-circle milestone.
    return mod === 0 ? 25 : COUPON_STEP - mod;
  }

  function updateCounters() {
    foodCountEl.textContent = String(foodCollected);

    if (foodCollected >= TREATS_VISIBLE_AT) {
      const remaining = treatsRemaining(foodCollected);
      treatCountdownEl.style.display = "block";
      treatCountdownEl.textContent =
        remaining + (remaining === 1 ? " treat to coupon" : " treats to coupon");
    } else {
      treatCountdownEl.style.display = "none";
    }

    const coupons = Math.floor(foodCollected / COUPON_STEP);
    if (coupons > 0) {
      couponBox.style.display = "block";
      couponCountEl.textContent = String(coupons);
    } else {
      couponBox.style.display = "none";
    }
  }

  /* ---------------- cat movement ---------------- */
  function moveCat(dt) {
    // --- keyboard fallback: delta-time based speed ---
    let dx = 0;
    let dy = 0;
    if (keys.has("ArrowUp")) dy -= 1;
    if (keys.has("ArrowDown")) dy += 1;
    if (keys.has("ArrowLeft")) dx -= 1;
    if (keys.has("ArrowRight")) dx += 1;
    if (dx !== 0 || dy !== 0) {
      const len = Math.hypot(dx, dy);
      const cb = catBounds();
      targetX = clamp(targetX + (dx / len) * KEY_SPEED * dt, cb.minX, cb.maxX);
      targetY = clamp(targetY + (dy / len) * KEY_SPEED * dt, cb.minY, cb.maxY);
    }

    // --- smooth follow of the target (cursor or keys) ---
    const k = 1 - Math.exp(-FOLLOW_RATE * dt); // frame-rate independent lerp
    catX += (targetX - catX) * k;
    catY += (targetY - catY) * k;

    // Never leave the visible game area.
    const cb = catBounds();
    catX = clamp(catX, cb.minX, cb.maxX);
    catY = clamp(catY, cb.minY, cb.maxY);

    catEl.style.left = catX + "px";
    catEl.style.top = catY + "px";
  }

  function detectCollisions() {
    // Copy so removal during iteration stays safe.
    for (const circle of activeCircles.slice()) {
      if (state !== STATE.PLAYING) return;
      const hitX = Math.abs(catX - circle.x) < catW / 2 + FOOD_RADIUS;
      const hitY = Math.abs(catY - circle.y) < catH / 2 + FOOD_RADIUS;
      if (hitX && hitY) collectCircle(circle);
    }
  }

  /* ---------------- main loop ---------------- */
  function loop(ts) {
    if (state !== STATE.PLAYING) return;
    rafId = requestAnimationFrame(loop);

    let dt = (ts - lastTs) / 1000;
    lastTs = ts;
    if (dt < 0) dt = 0;
    if (dt > MAX_FRAME_DT) dt = MAX_FRAME_DT;

    moveCat(dt);
    detectCollisions();
  }

  /* ---------------- game end ---------------- */
  function endGame() {
    if (state !== STATE.PLAYING) return;
    state = STATE.GAME_OVER;

    // Stop movement, spawning, collisions and every active timer.
    cancelAnimationFrame(rafId);
    keys.clear();
    for (const circle of activeCircles) {
      clearTimeout(circle.timer);
      clearTimeout(circle.warnTimer);
    }
    for (const fb of feedbacks) {
      clearTimeout(fb.timer);
      fb.el.remove();
    }
    feedbacks.clear();

    // Freeze decorative animations so the game clearly looks over.
    gameContainer.classList.add("game-over");

    gameOverModal.style.display = "flex";
  }

  /* ---------------- game start ---------------- */
  function startGame() {
    if (state === STATE.PLAYING) return;
    state = STATE.PLAYING;

    trustModal.classList.add("hidden");
    gameContainer.classList.remove("game-over");
    trustStage = 0; // reset the trust flow for a clean state

    // Reset state (also safe if ever restarted).
    activeCircles.length = 0;
    foodContainer.innerHTML = "";
    totalSpawned = 0;
    foodCollected = 0;
    updateCounters();

    measure();
    const cb = catBounds();
    catX = clamp(playW / 2, cb.minX, cb.maxX);
    catY = clamp(playH * 0.6, cb.minY, cb.maxY);
    targetX = catX;
    targetY = catY;
    catEl.style.left = catX + "px";
    catEl.style.top = catY + "px";

    // Populate the screen with the 20 active circles allowed at once.
    for (let i = 0; i < MAX_ACTIVE_CIRCLES; i++) {
      spawnFood(null);
    }

    lastTs = performance.now();
    rafId = requestAnimationFrame(loop);
  }

  /* ---------------- trust screen ----------------
     Progressive flow:
       0. "do you trust me?"        → yes | no
       1. "… T-T"                   → yes | but whyy
       2. "… T-T T-T"               → now im sad
       3. "… T-T T-T T-T"           → yes | yes   (either starts the game)
     One more T-T is added on every redisplay.               */
  const TRUST_STAGES = [
    {
      crying: 0,
      buttons: [
        { label: "yes", cls: "btn-pink", action: "start" },
        { label: "no", cls: "btn-purple", action: 1 },
      ],
    },
    {
      crying: 1,
      buttons: [
        { label: "yes", cls: "btn-pink", action: "start" },
        { label: "but whyy", cls: "btn-purple", action: 2 },
      ],
    },
    {
      crying: 2,
      buttons: [{ label: "now im sad", cls: "btn-pink", action: 3 }],
    },
    {
      crying: 3,
      buttons: [
        { label: "yes", cls: "btn-pink", action: "start" },
        { label: "yes", cls: "btn-purple", action: "start" },
      ],
    },
  ];
  let trustStage = 0;

  function renderTrustStage() {
    const stage = TRUST_STAGES[trustStage];
    const crying =
      stage.crying > 0 ? " " + Array(stage.crying).fill("T-T").join(" ") : "";
    trustQuestion.textContent = "do you trust me?" + crying;
    trustActions.innerHTML = "";
    for (const spec of stage.buttons) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "btn btn-trust " + spec.cls;
      b.textContent = spec.label;
      b.addEventListener("click", () => {
        if (spec.action === "start") {
          startGame();
        } else {
          trustStage = spec.action;
          renderTrustStage();
        }
      });
      trustActions.appendChild(b);
    }
  }

  /* ---------------- input ---------------- */
  function onMouseMove(e) {
    if (state !== STATE.PLAYING) return;
    const cb = catBounds();
    targetX = clamp(e.clientX, cb.minX, cb.maxX);
    targetY = clamp(e.clientY, cb.minY, cb.maxY);
  }

  function onKeyDown(e) {
    // Scrolling must never happen.
    if (MOVE_KEYS.includes(e.key) || SCROLL_KEYS.includes(e.key)) {
      e.preventDefault();
    }
    if (state !== STATE.PLAYING) return;
    if (MOVE_KEYS.includes(e.key)) keys.add(e.key);
  }

  function onKeyUp(e) {
    keys.delete(e.key);
  }

  function onBlur() {
    keys.clear();
  }

  function onResize() {
    measure();
    if (state === STATE.TRUST) return; // nothing to reposition yet
    const cb = catBounds();
    catX = clamp(catX, cb.minX, cb.maxX);
    catY = clamp(catY, cb.minY, cb.maxY);
    targetX = clamp(targetX, cb.minX, cb.maxX);
    targetY = clamp(targetY, cb.minY, cb.maxY);
    catEl.style.left = catX + "px";
    catEl.style.top = catY + "px";

    // Keep every active circle inside the new playable area.
    const fb = foodBounds();
    for (const c of activeCircles) {
      c.x = clamp(c.x, fb.minX, fb.maxX);
      c.y = clamp(c.y, fb.minY, fb.maxY);
      c.el.style.left = c.x + "px";
      c.el.style.top = c.y + "px";
    }
  }

  /* ---------------- init ---------------- */
  renderTrustStage();

  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("keydown", onKeyDown, { passive: false });
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", onBlur);
  window.addEventListener("resize", onResize);
  window.addEventListener(
    "wheel",
    (e) => e.preventDefault(),
    { passive: false }
  );
  window.addEventListener(
    "touchmove",
    (e) => e.preventDefault(),
    { passive: false }
  );
})();
