(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Homepage: loaf turns left-to-right, like a 3D model, as you scroll ----------
     The hero photo's crust is unwrapped into a strip (assets/loaf-3d.js). We wrap that
     strip around the loaf's own profile and slide it, so the loaf spins on its vertical
     axis like it's sitting on a turntable. Lighting stays fixed while the crust moves. */
  const createTurntable = (stage, img) => {
    const D = window.LOAF_3D;
    if (!D) return null;
    const S = D.size;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = S;
    canvas.className = "loaf loaf-3d";
    canvas.setAttribute("aria-hidden", "true");
    const ctx = canvas.getContext("2d");
    const out = ctx.createImageData(S, S);
    const px = out.data;
    let tex = null, texW = 0, texH = 0;
    let pix = null; // per-pixel precomputed mapping

    const tile = new Image();
    tile.onload = () => {
      // Build a seamless 360° crust: three copies of the strip, 120° apart,
      // softly cross-faded where they overlap (no mirroring, so no kaleidoscope).
      const tw = tile.width, th = tile.height, band = D.band; // strip covers -band..+band degrees
      const t = document.createElement("canvas");
      t.width = tw; t.height = th;
      const tc = t.getContext("2d");
      tc.drawImage(tile, 0, 0);
      const src = tc.getImageData(0, 0, tw, th).data;
      texW = Math.round((tw * 360) / (2 * band)); texH = th;
      tex = new Float32Array(texW * th * 4);
      const FADE = band - 120 / 2; // degrees of overlap on each side
      for (let u = 0; u < texW; u++) {
        const lon = (u / texW) * 360;
        const parts = [];
        let wsum = 0;
        for (let k = 0; k < 3; k++) {
          let d = lon - k * 120;
          d = ((d + 180) % 360 + 360) % 360 - 180;
          if (Math.abs(d) > band) continue;
          const w = Math.min(1, (band - Math.abs(d)) / (2 * FADE));
          const sx = Math.min(tw - 1, Math.max(0, ((d + band) / (2 * band)) * tw - 0.5));
          parts.push(sx, w); wsum += w;
        }
        for (let y = 0; y < th; y++) {
          let r = 0, g = 0, b = 0;
          for (let p = 0; p < parts.length; p += 2) {
            const sx = parts[p], w = parts[p + 1] / wsum, x0 = sx | 0, f = sx - x0, x1 = Math.min(tw - 1, x0 + 1);
            const a0 = (y * tw + x0) * 4, a1 = (y * tw + x1) * 4;
            r += (src[a0] * (1 - f) + src[a1] * f) * w;
            g += (src[a0 + 1] * (1 - f) + src[a1 + 1] * f) * w;
            b += (src[a0 + 2] * (1 - f) + src[a1 + 2] * f) * w;
          }
          const o = (y * texW + u) * 4;
          tex[o] = r; tex[o + 1] = g; tex[o + 2] = b;
        }
      }

      // Precompute where every screen pixel lands on the crust.
      const cx = S / 2, radii = D.radii, top = D.top;
      const list = [];
      for (let j = 0; j < radii.length; j++) {
        const r = radii[j];
        if (r < 1) continue;
        const y = top + j;
        if (y < 0 || y >= S) continue;
        const x0 = Math.max(0, Math.floor(cx - r - 1)), x1 = Math.min(S - 1, Math.ceil(cx + r + 1));
        for (let x = x0; x <= x1; x++) {
          const dx = x + 0.5 - cx;
          const alpha = Math.min(1, Math.max(0, r - Math.abs(dx) + 0.5));
          if (alpha <= 0) continue;
          const lon = Math.asin(Math.max(-1, Math.min(1, dx / r)));
          // Fixed light: soft falloff toward the sides, slightly brighter on the upper left.
          const v = (j / (radii.length - 1)) * 2 - 1; // -1 top .. 1 bottom
          const shade = (0.72 + 0.28 * Math.cos(lon) + 0.05 * Math.sin(-lon)) * (0.8 + 0.2 * Math.sqrt(Math.max(0, 1 - v * v)));
          const edge = Math.min(1, (j + 1) / 4, (radii.length - j) / 2);
          list.push((y * S + x) * 4, (lon / (2 * Math.PI)) * texW, j * texW, shade, alpha * edge * 255);
        }
      }
      pix = new Float64Array(list);
      stage.appendChild(canvas);
      draw(lastAngle);
      stage.classList.add("is-3d");
    };
    tile.src = D.tile;

    let lastAngle = 0;
    const draw = (deg) => {
      lastAngle = deg;
      if (!pix) return;
      // Positive angle moves the crust from left to right.
      const shift = (deg / 360) * texW;
      for (let i = 0; i < pix.length; i += 5) {
        let u = pix[i + 1] - shift;
        u = ((u % texW) + texW) % texW;
        const u0 = u | 0, f = u - u0, u1 = u0 + 1 === texW ? 0 : u0 + 1;
        const a = (pix[i + 2] + u0) * 4, b = (pix[i + 2] + u1) * 4, s = pix[i + 3], o = pix[i];
        px[o]     = (tex[a] * (1 - f) + tex[b] * f) * s;
        px[o + 1] = (tex[a + 1] * (1 - f) + tex[b + 1] * f) * s;
        px[o + 2] = (tex[a + 2] * (1 - f) + tex[b + 2] * f) * s;
        px[o + 3] = pix[i + 4];
      }
      ctx.putImageData(out, 0, 0);
    };
    return { draw };
  };

  const track = document.querySelector(".hero-track");
  const loaf = document.querySelector(".loaf");
  if (track && loaf) {
    const stage = loaf.parentElement;
    const turntable = createTurntable(stage, loaf);
    const meter = document.querySelector(".spin-meter");
    const cue = document.querySelector(".scroll-cue");
    const TURNS = 1; // full rotations while the hero scrolls out of view
    let target = 0;
    let current = 0;
    let ticking = false;

    const measure = () => {
      // The page scrolls normally; the loaf turns as it goes, one full turn
      // by the time the hero has scrolled away.
      const span = Math.max(1, track.offsetHeight);
      target = (window.scrollY / span) * 360 * TURNS;
      const progress = Math.min(1, Math.max(0, window.scrollY / span));
      if (meter) meter.style.setProperty("--progress", Math.max(0.05, progress));
      if (cue) cue.style.opacity = progress > 0.08 ? "0" : "1";
      stage.style.setProperty("--grow", 1 + progress * 0.06);
    };

    const render = () => {
      // Ease toward the target so the turn feels like a heavy loaf, not a sticker.
      current = reduceMotion ? target : current + (target - current) * 0.14;
      if (turntable) turntable.draw(current);
      if (Math.abs(target - current) > 0.05) {
        requestAnimationFrame(render);
      } else {
        ticking = false;
      }
    };

    const onScroll = () => {
      measure();
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(render);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();
  }

  /* ---------- Gentle reveal on scroll ---------- */
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("in"));
  }

  /* ---------- Order / hello form → opens an email to Carly ---------- */
  const form = document.querySelector("#hello-form");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const to = form.dataset.email;
      const subject = `Next Dough order request from ${data.get("name")}`;
      const body = [
        `Name: ${data.get("name")}`,
        `Email: ${data.get("email")}`,
        `Loaf: ${data.get("loaf")}`,
        `Pickup week: ${data.get("week") || "Next available"}`,
        "",
        data.get("message") || "",
      ].join("\n");
      window.location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      form.classList.add("sent");
    });
  }

  /* ---------- Footer year ---------- */
  document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
})();
