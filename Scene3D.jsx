/* ── 3D beach majlis ──────────────────────────── */
function Scene3D() {
  const host = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const THREE = window.THREE;
    const el = host.current;
    if (!THREE || !el) { setFailed(true); return; }

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    } catch (err) { setFailed(true); return; }
    if (!renderer.getContext()) { setFailed(true); return; }

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const small = window.innerWidth < 760;
    const trash = [];
    const keep = (o) => { trash.push(o); return o; };

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.5 : 1.85));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.93;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x04050A, 1);
    el.appendChild(renderer.domElement);
    renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;touch-action:pan-y';

    /* ── smooth value noise: organic flicker, never a strobe ── */
    const NT = new Float32Array(512);
    for (let i = 0; i < 512; i++) NT[i] = Math.random();
    const snoise = (x) => {
      const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
      const a = NT[i & 511], b = NT[(i + 1) & 511];
      return a + (b - a) * u;
    };
    const fbm = (x) => snoise(x) * .55 + snoise(x * 2.17 + 11.3) * .28 + snoise(x * 4.61 + 41.7) * .17;

    /* ── procedural textures ─────────────────────── */
    const tex = (w, h, paint, { srgb = false, repeat, aniso = 4 } = {}) => {
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      paint(c.getContext('2d'), w, h);
      const t = keep(new THREE.CanvasTexture(c));
      if (srgb) t.encoding = THREE.sRGBEncoding;
      if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
      t.anisotropy = Math.min(aniso, renderer.capabilities.getMaxAnisotropy());
      return t;
    };
    const grain = (x, W, H, spread) => {
      const img = x.getImageData(0, 0, W, H), d = img.data;
      for (let i = 0; i < W * H; i++) {
        const n = (Math.random() - .5) * spread;
        d[i * 4] = Math.max(0, Math.min(255, d[i * 4] + n));
        d[i * 4 + 1] = Math.max(0, Math.min(255, d[i * 4 + 1] + n));
        d[i * 4 + 2] = Math.max(0, Math.min(255, d[i * 4 + 2] + n));
        d[i * 4 + 3] = 255;
      }
      x.putImageData(img, 0, 0);
    };

    const sandBump = tex(512, 512, (x, S) => {
      x.fillStyle = '#7E7E7E'; x.fillRect(0, 0, S, S);
      x.lineWidth = 2.3; x.lineCap = 'round';
      for (let row = -20; row < S + 20; row += 12) {
        const amp = 4 + Math.random() * 12, fq = .011 + Math.random() * .02, ph = Math.random() * 99;
        x.strokeStyle = `rgba(255,255,255,${(.10 + Math.random() * .14).toFixed(3)})`;
        x.beginPath(); for (let p = 0; p <= S; p += 6) x.lineTo(p, row + Math.sin(p * fq + ph) * amp); x.stroke();
        x.strokeStyle = `rgba(0,0,0,${(.09 + Math.random() * .12).toFixed(3)})`;
        x.beginPath(); for (let p = 0; p <= S; p += 6) x.lineTo(p, row + 4 + Math.sin(p * fq + ph) * amp); x.stroke();
      }
      grain(x, S, S, 48);
    }, { repeat: [26, 12] });

    const sandRough = tex(256, 256, (x, S) => {
      x.fillStyle = '#E2E2E2'; x.fillRect(0, 0, S, S); grain(x, S, S, 36);
    }, { repeat: [26, 12] });

    const paintSadu = (x, W, H, bump) => {
      const ground = bump ? '#888888' : '#D9CBAB';
      const pick = (light, colour) => (bump ? (light ? '#D6D6D6' : '#6C6C6C') : colour);
      x.fillStyle = ground; x.fillRect(0, 0, W, H);
      const band = (y, h, f) => { x.fillStyle = f; x.fillRect(0, y, W, h); };
      band(0, 30, pick(0, '#171108')); band(H - 30, 30, pick(0, '#171108'));
      band(36, 4, pick(1, '#241B10')); band(H - 40, 4, pick(1, '#241B10'));
      band(50, 22, pick(0, '#7C2620')); band(H - 72, 22, pick(0, '#7C2620'));
      band(80, 3, pick(1, '#241B10')); band(H - 83, 3, pick(1, '#241B10'));
      const row = (cy, f) => {
        for (let cx = 0; cx <= W; cx += 62) {
          x.beginPath();
          x.moveTo(cx, cy - 25); x.lineTo(cx + 31, cy); x.lineTo(cx, cy + 25); x.lineTo(cx - 31, cy);
          x.closePath(); x.fillStyle = pick(0, f); x.fill();
          x.lineWidth = 2.2; x.strokeStyle = pick(1, '#1B1510'); x.stroke();
          x.beginPath();
          x.moveTo(cx, cy - 11); x.lineTo(cx + 14, cy); x.lineTo(cx, cy + 11); x.lineTo(cx - 14, cy);
          x.closePath(); x.fillStyle = ground; x.fill();
        }
      };
      row(124, '#9A6333'); row(H - 124, '#9A6333');
      x.lineWidth = 2.6;
      for (let cx = 14; cx <= W; cx += 46) {
        x.strokeStyle = pick(1, '#26415E');
        x.beginPath();
        x.moveTo(cx - 8, H / 2 - 15); x.lineTo(cx, H / 2); x.lineTo(cx - 8, H / 2 + 15);
        x.moveTo(cx + 8, H / 2 - 15); x.lineTo(cx, H / 2); x.lineTo(cx + 8, H / 2 + 15);
        x.stroke();
      }
      // warp threads — reads as woven rather than printed
      x.globalAlpha = bump ? .6 : .15; x.lineWidth = 1;
      for (let p = 0; p < W; p += 3) {
        x.strokeStyle = p % 6 ? '#FFFFFF' : '#000000';
        x.beginPath(); x.moveTo(p, 0); x.lineTo(p, H); x.stroke();
      }
      x.globalAlpha = 1;
      if (!bump) grain(x, W, H, 15);
    };
    const saduMap = tex(768, 384, (x, W, H) => paintSadu(x, W, H, false), { srgb: true, repeat: [2, 1], aniso: 8 });
    const saduBump = tex(768, 384, (x, W, H) => paintSadu(x, W, H, true), { repeat: [2, 1], aniso: 8 });

    const linen = tex(256, 256, (x, S) => {
      x.fillStyle = '#808080'; x.fillRect(0, 0, S, S);
      x.globalAlpha = .5; x.lineWidth = 1;
      for (let i = 0; i < S; i += 3) {
        x.strokeStyle = i % 6 ? '#CFCFCF' : '#5A5A5A';
        x.beginPath(); x.moveTo(i, 0); x.lineTo(i, S); x.stroke();
        x.beginPath(); x.moveTo(0, i + 1.5); x.lineTo(S, i + 1.5); x.stroke();
      }
      x.globalAlpha = 1; grain(x, S, S, 26);
    }, { repeat: [3, 3] });

    const glow = tex(160, 160, (x, W) => {
      const g = x.createRadialGradient(W / 2, W / 2, 0, W / 2, W / 2, W / 2);
      g.addColorStop(0, 'rgba(255,252,242,1)');
      g.addColorStop(.11, 'rgba(252,236,203,.66)');
      g.addColorStop(.36, 'rgba(214,176,116,.18)');
      g.addColorStop(1, 'rgba(214,176,116,0)');
      x.fillStyle = g; x.fillRect(0, 0, W, W);
    });

    const streakTex = tex(128, 512, (x, W, H) => {
      x.clearRect(0, 0, W, H);
      for (let y = 0; y < H; y++) {
        const v = y / H, wd = 5 + v * v * 58;
        const a = (1 - v) * .8 * (.5 + .5 * Math.sin(v * 52)) * (.6 + .4 * Math.random());
        x.fillStyle = `rgba(252,238,208,${Math.max(0, a).toFixed(3)})`;
        x.fillRect(W / 2 - wd / 2, y, wd, 1);
      }
    });

    /* sky: gradient + Milky Way + Canopus, doubles as the IBL source */
    const STAR_X = 12.5, STAR_Y = 6.1, STAR_Z = -72;
    const skyEquirect = tex(2048, 1024, (x, W, H) => {
      const g = x.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#010104');
      g.addColorStop(.34, '#03040B');
      g.addColorStop(.50, '#070813');
      g.addColorStop(.585, '#0D0A16');
      g.addColorStop(.74, '#160F11');
      g.addColorStop(1, '#050509');
      x.fillStyle = g; x.fillRect(0, 0, W, H);

      // Milky Way: a soft diagonal band of dust with stars packed into it
      x.save();
      x.translate(W * .30, H * .17); x.rotate(-.42);
      for (let i = 0; i < 4; i++) {
        const bw = W * .95, bh = H * (.085 + i * .052);
        const mg = x.createLinearGradient(0, -bh / 2, 0, bh / 2);
        const a = (.052 - i * .011).toFixed(3);
        mg.addColorStop(0, 'rgba(120,132,178,0)');
        mg.addColorStop(.5, `rgba(146,150,196,${a})`);
        mg.addColorStop(1, 'rgba(120,132,178,0)');
        x.fillStyle = mg; x.fillRect(-bw / 2, -bh / 2, bw, bh);
      }
      for (let i = 0; i < 2600; i++) {
        const px = (Math.random() - .5) * W * .95;
        const py = (Math.random() + Math.random() + Math.random() - 1.5) * H * .07;
        const a = Math.pow(Math.random(), 2.2) * .8;
        x.fillStyle = `rgba(226,220,204,${a.toFixed(3)})`;
        x.fillRect(px, py, 1, 1);
      }
      // dust lanes
      x.globalCompositeOperation = 'destination-out';
      for (let i = 0; i < 26; i++) {
        x.fillStyle = `rgba(0,0,0,${(.05 + Math.random() * .09).toFixed(3)})`;
        x.beginPath();
        x.ellipse((Math.random() - .5) * W * .9, (Math.random() - .5) * H * .09,
          40 + Math.random() * 190, 5 + Math.random() * 16, Math.random() * .6, 0, Math.PI * 2);
        x.fill();
      }
      x.globalCompositeOperation = 'source-over';
      x.restore();

      // field stars
      for (let i = 0; i < 2000; i++) {
        const px = Math.random() * W, py = Math.random() * H * .5;
        const a = Math.pow(Math.random(), 2.6) * .95;
        const s = Math.random() < .04 ? 2 : 1;
        x.fillStyle = `rgba(238,229,206,${a.toFixed(3)})`;
        x.fillRect(px, py, s, s);
      }

      // Canopus — the brand's star, low on the southern horizon
      const sx = W * .70, sy = H * .445;
      const halo = x.createRadialGradient(sx, sy, 0, sx, sy, 300);
      halo.addColorStop(0, 'rgba(255,248,228,.92)');
      halo.addColorStop(.06, 'rgba(250,226,182,.30)');
      halo.addColorStop(.30, 'rgba(206,166,108,.10)');
      halo.addColorStop(1, 'rgba(206,166,108,0)');
      x.fillStyle = halo; x.fillRect(sx - 310, sy - 310, 620, 620);
      const bandG = x.createLinearGradient(0, H * .46, 0, H * .55);
      bandG.addColorStop(0, 'rgba(150,116,72,0)');
      bandG.addColorStop(.5, 'rgba(150,116,72,.075)');
      bandG.addColorStop(1, 'rgba(150,116,72,0)');
      x.fillStyle = bandG; x.fillRect(0, H * .46, W, H * .09);
    }, { srgb: true, aniso: 2 });

    /* ── scene, atmosphere, IBL ──────────────────── */
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0A0B14, 0.0074);

    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    skyEquirect.mapping = THREE.EquirectangularReflectionMapping;
    const envRT = pmrem.fromEquirectangular(skyEquirect);
    scene.environment = envRT.texture;
    pmrem.dispose();

    const camera = new THREE.PerspectiveCamera(44, 1, 0.5, 620);

    scene.add(new THREE.Mesh(
      keep(new THREE.SphereGeometry(300, 48, 30)),
      keep(new THREE.MeshBasicMaterial({ map: skyEquirect, side: THREE.BackSide, fog: false, depthWrite: false }))));

    const sprite = (color, scale) => {
      const s = new THREE.Sprite(keep(new THREE.SpriteMaterial({
        map: glow, color, transparent: true, blending: THREE.AdditiveBlending,
        depthWrite: false, fog: false })));
      s.scale.set(scale, scale, 1);
      return s;
    };
    const halo = sprite(0xFFF4DE, 19); halo.position.set(STAR_X, STAR_Y, STAR_Z); scene.add(halo);
    const core = sprite(0xFFFFFF, 5.2); core.position.set(STAR_X, STAR_Y, STAR_Z); scene.add(core);

    // near star layer: parallaxes against the dome so the sky has depth
    const N = small ? 700 : 1400;
    const sp = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const a = Math.random() * Math.PI * 2, e = Math.pow(Math.random(), 1.8) * Math.PI * .47, r = 248;
      sp[i * 3] = Math.cos(e) * Math.sin(a) * r;
      sp[i * 3 + 1] = Math.sin(e) * r + 6;
      sp[i * 3 + 2] = Math.cos(e) * Math.cos(a) * r;
    }
    const starGeo = keep(new THREE.BufferGeometry());
    starGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    const stars = new THREE.Points(starGeo, keep(new THREE.PointsMaterial({
      color: 0xF4ECD8, size: 1.7, map: glow, sizeAttenuation: true, transparent: true,
      opacity: .85, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })));
    scene.add(stars);

    /* ── water ───────────────────────────────────── */
    const segX = small ? 56 : 104, segZ = small ? 32 : 60;
    const seaGeo = keep(new THREE.PlaneGeometry(340, 128, segX, segZ));
    seaGeo.rotateX(-Math.PI / 2);
    const seaBase = Float32Array.from(seaGeo.attributes.position.array);
    const sea = new THREE.Mesh(seaGeo, keep(new THREE.MeshStandardMaterial({
      color: 0x070E16, roughness: .14, metalness: 0, envMapIntensity: .85 })));
    sea.position.set(0, -.12, -76); scene.add(sea);

    const streak = new THREE.Mesh(keep(new THREE.PlaneGeometry(19, 60)), keep(new THREE.MeshBasicMaterial({
      map: streakTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })));
    streak.rotation.x = -Math.PI / 2; streak.rotation.z = Math.PI - .16;
    streak.position.set(STAR_X * .42, .5, -43); scene.add(streak);

    const sandGeo = keep(new THREE.PlaneGeometry(340, 130, 70, 34));
    sandGeo.rotateX(-Math.PI / 2);
    {
      const p = sandGeo.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const x0 = p.getX(i), z0 = p.getZ(i);
        p.setY(i, Math.sin(x0 * .06) * .16 + Math.sin(z0 * .09 + 1.3) * .12 + Math.sin(x0 * .21 + z0 * .17) * .05);
      }
      sandGeo.computeVertexNormals();
    }
    const sand = new THREE.Mesh(sandGeo, keep(new THREE.MeshStandardMaterial({
      color: 0x241B13, roughness: 1, metalness: 0,
      bumpMap: sandBump, bumpScale: .26, roughnessMap: sandRough, envMapIntensity: .22 })));
    sand.position.set(0, -.02, 48); sand.receiveShadow = true; scene.add(sand);

    const foam = new THREE.Mesh(keep(new THREE.PlaneGeometry(340, 4)), keep(new THREE.MeshBasicMaterial({
      color: 0x6E7374, transparent: true, opacity: .2, fog: false, depthWrite: false })));
    foam.rotation.x = -Math.PI / 2; foam.position.set(0, .05, -13.2); scene.add(foam);

    /* ── geometry kit ────────────────────────────── */
    // rounds a box and lets it bulge, so cushions read as stuffed fabric
    const plush = (w, h, d, r, bulge = 0, seg = 7) => {
      const g = new THREE.BoxGeometry(w, h, d, seg, seg, seg);
      const p = g.attributes.position;
      const hw = Math.max(0, w / 2 - r), hh = Math.max(0, h / 2 - r), hd = Math.max(0, d / 2 - r);
      const v = new THREE.Vector3(), c = new THREE.Vector3();
      for (let i = 0; i < p.count; i++) {
        v.fromBufferAttribute(p, i);
        c.set(THREE.MathUtils.clamp(v.x, -hw, hw),
              THREE.MathUtils.clamp(v.y, -hh, hh),
              THREE.MathUtils.clamp(v.z, -hd, hd));
        v.sub(c);
        if (v.lengthSq() > 1e-9) v.setLength(r); else v.set(0, 0, 0);
        v.add(c);
        if (bulge) {
          const fx = Math.max(0, 1 - Math.pow(Math.abs(v.x) / (w / 2), 2));
          const fz = Math.max(0, 1 - Math.pow(Math.abs(v.z) / (d / 2), 2));
          const f = fx * fz;
          v.y += Math.sign(v.y || 1) * bulge * f;
          v.x *= 1 + bulge * .1 * f; v.z *= 1 + bulge * .1 * f;
        }
        p.setXYZ(i, v.x, v.y, v.z);
      }
      g.computeVertexNormals();
      return keep(g);
    };
    const lathe = (pts, seg = 34, s = 1) =>
      keep(new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x * s, y * s)), seg));
    // a cloth lathe with soft vertical folds — kills the "turned on a machine" look
    const drape = (pts, seg = 40, folds = 9, depth = .014) => {
      const g = lathe(pts, seg);
      const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
        const r = Math.hypot(x, z);
        if (r < 1e-4) continue;
        const a = Math.atan2(z, x);
        const k = 1 + Math.sin(a * folds + y * 2.5) * depth + Math.sin(a * folds * 2.3) * depth * .45;
        p.setXYZ(i, Math.cos(a) * r * k, y, Math.sin(a) * r * k);
      }
      g.computeVertexNormals();
      return g;
    };
    const limb = (r0, r1, len, seg = 12) => keep(new THREE.CylinderGeometry(r0, r1, len, seg, 1));
    const ball = (r, seg = 16) => keep(new THREE.SphereGeometry(r, seg, Math.round(seg * .7)));

    /* ── materials ───────────────────────────────── */
    const cloth = (color, rough = .95) => keep(new THREE.MeshStandardMaterial({
      color, roughness: rough, metalness: 0, bumpMap: linen, bumpScale: .016, envMapIntensity: .3 }));
    const brass = keep(new THREE.MeshPhysicalMaterial({
      color: 0xC08A3E, metalness: 1, roughness: .16,
      clearcoat: .5, clearcoatRoughness: .28, envMapIntensity: 1.5 }));
    const porcelain = keep(new THREE.MeshPhysicalMaterial({
      color: 0xE8DFCE, metalness: 0, roughness: .16,
      clearcoat: 1, clearcoatRoughness: .08, envMapIntensity: .8 }));
    const wood = keep(new THREE.MeshStandardMaterial({
      color: 0x38281B, roughness: .62, metalness: .06, envMapIntensity: .55 }));
    const iron = keep(new THREE.MeshStandardMaterial({
      color: 0x14110E, roughness: .42, metalness: .85, envMapIntensity: .9 }));
    const stone = keep(new THREE.MeshStandardMaterial({
      color: 0x3B352E, roughness: .95, metalness: 0, bumpMap: sandBump, bumpScale: .1 }));
    const skinMat = (c) => keep(new THREE.MeshStandardMaterial({
      color: c, roughness: .66, metalness: 0, envMapIntensity: .55 }));

    const cream = cloth(0x877B64), camelCloth = cloth(0x7A5029), deepCloth = cloth(0x262320);

    /* ── the majlis ──────────────────────────────── */
    const majlis = new THREE.Group(); majlis.position.set(0, 0, -4.6); scene.add(majlis);

    const rugGeo = keep(new THREE.PlaneGeometry(9.8, 7.0, 44, 30));
    rugGeo.rotateX(-Math.PI / 2);
    {
      const p = rugGeo.attributes.position;
      for (let i = 0; i < p.count; i++)
        p.setY(i, Math.sin(p.getX(i) * 1.5) * .014 + Math.sin(p.getZ(i) * 2.0) * .014);
      rugGeo.computeVertexNormals();
    }
    const rug = new THREE.Mesh(rugGeo, keep(new THREE.MeshStandardMaterial({
      map: saduMap, bumpMap: saduBump, bumpScale: .055,
      roughness: .96, metalness: 0, envMapIntensity: .4 })));
    rug.position.y = .02; rug.receiveShadow = true; majlis.add(rug);

    const matGeo = plush(2.3, .26, 1.0, .12, .04);
    const backGeo = plush(2.3, .5, .26, .11, .04);
    const bolsterGeo = limb(.14, .14, 2.2, 20);
    const pillowGeo = plush(.44, .36, .19, .09, .05);

    const seat = (x, z, rot) => {
      const s = new THREE.Group(); s.position.set(x, 0, z); s.rotation.y = rot;
      const pad = new THREE.Mesh(matGeo, cream);
      pad.position.y = .14; pad.castShadow = true; pad.receiveShadow = true; s.add(pad);
      const back = new THREE.Mesh(backGeo, cream);
      back.position.set(0, .40, .52); back.rotation.x = -.16;
      back.castShadow = true; back.receiveShadow = true; s.add(back);
      const bol = new THREE.Mesh(bolsterGeo, camelCloth);
      bol.rotation.z = Math.PI / 2; bol.position.set(0, .22, .34); bol.castShadow = true; s.add(bol);
      [-.72, .72].forEach((px, i) => {
        const p = new THREE.Mesh(pillowGeo, i ? deepCloth : camelCloth);
        p.position.set(px, .38, .33); p.rotation.set(-.22, i ? .18 : -.18, i ? .07 : -.07);
        p.castShadow = true; s.add(p);
      });
      majlis.add(s);
      return s;
    };
    // a U opening toward the water, so the family faces one another across the fire
    seat(-1.9, 2.5, Math.PI); seat(1.9, 2.5, Math.PI);
    seat(-3.7, .1, Math.PI / 2); seat(3.7, .1, -Math.PI / 2);
    seat(-1.5, -2.6, 0); seat(1.5, -2.6, 0);

    /* دلّة — lathed brass, the one object meant to catch every light */
    const dallahGroup = () => {
      const g = new THREE.Group();
      const body = new THREE.Mesh(lathe([
        [0, 0], [.20, 0], [.215, .035], [.185, .07], [.20, .12], [.245, .21],
        [.263, .30], [.252, .39], [.215, .46], [.158, .51], [.122, .55],
        [.118, .62], [.146, .665], [.175, .70], [.128, .715], [0, .72]
      ], 46), brass);
      body.castShadow = true; g.add(body);
      const lid = new THREE.Mesh(lathe([
        [0, 0], [.13, .012], [.115, .06], [.07, .10], [.035, .145], [.052, .17], [0, .195]
      ], 30), brass);
      lid.position.y = .705; lid.castShadow = true; g.add(lid);
      const spout = new THREE.Mesh(keep(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
        new THREE.Vector3(.22, .30, 0), new THREE.Vector3(.40, .44, 0),
        new THREE.Vector3(.50, .62, 0), new THREE.Vector3(.44, .77, 0)
      ]), 26, .045, 12, false)), brass);
      spout.castShadow = true; g.add(spout);
      const handle = new THREE.Mesh(keep(new THREE.TorusGeometry(.17, .028, 10, 26, Math.PI * 1.25)), brass);
      handle.position.set(-.21, .52, 0); handle.rotation.set(Math.PI / 2, 0, -.5);
      handle.castShadow = true; g.add(handle);
      return g;
    };
    const finjanGeo = lathe([[0, 0], [.035, 0], [.042, .012], [.03, .03], [.052, .072], [.058, .086], [.052, .09], [0, .09]], 22);

    const table = (x, z, rot) => {
      const t = new THREE.Group(); t.position.set(x, 0, z); t.rotation.y = rot;
      const top = new THREE.Mesh(plush(1.32, .11, 1.32, .05, 0, 4), wood);
      top.position.y = .46; top.castShadow = true; top.receiveShadow = true; t.add(top);
      const leg = new THREE.Mesh(limb(.14, .21, .44, 18), wood);
      leg.position.y = .22; leg.castShadow = true; t.add(leg);
      const tray = new THREE.Mesh(limb(.42, .40, .035, 34), brass);
      tray.position.y = .535; tray.castShadow = true; t.add(tray);
      for (let i = 0; i < 4; i++) {
        const cup = new THREE.Mesh(finjanGeo, porcelain);
        const a = .8 + i * .55;
        cup.position.set(Math.cos(a) * .27 - .06, .555, Math.sin(a) * .27);
        cup.castShadow = true; t.add(cup);
      }
      majlis.add(t);
      return t;
    };
    const tA = table(-2.3, 1.5, .3); table(2.5, -1.4, -.4);
    { const d = dallahGroup(); d.position.set(.1, .55, -.02); d.scale.setScalar(.92); tA.add(d); }

    /* lanterns */
    const lanterns = [];
    const lantern = (x, z, lit) => {
      const g = new THREE.Group(); g.position.set(x, 0, z);
      const post = new THREE.Mesh(limb(.032, .05, .66, 12), iron);
      post.position.y = .33; post.castShadow = true; g.add(post);
      const base = new THREE.Mesh(limb(.17, .21, .06, 16), iron);
      base.position.y = .03; base.castShadow = true; g.add(base);
      const glass = new THREE.Mesh(limb(.17, .19, .38, 6), keep(new THREE.MeshStandardMaterial({
        color: 0xFFE7BE, emissive: 0xFFA646, emissiveIntensity: 1.6,
        roughness: .35, metalness: 0, transparent: true, opacity: .93 })));
      glass.position.y = .88; g.add(glass);
      const cap = new THREE.Mesh(keep(new THREE.ConeGeometry(.24, .2, 6)), iron);
      cap.position.y = 1.16; cap.castShadow = true; g.add(cap);
      const ring = new THREE.Mesh(keep(new THREE.TorusGeometry(.05, .012, 8, 16)), iron);
      ring.position.y = 1.29; ring.rotation.x = Math.PI / 2; g.add(ring);
      const h = sprite(0xFFAE60, 3.2); h.position.y = .88; g.add(h);
      let light = null;
      if (lit) { light = new THREE.PointLight(0xFFA34E, 2.0, 16, 2); light.position.set(0, .92, 0); g.add(light); }
      majlis.add(g);
      lanterns.push({ glass, halo: h, light, seed: Math.random() * 40 });
    };
    lantern(-4.5, 3.0, true); lantern(4.5, 3.0, true);
    lantern(-4.5, -3.0, false); lantern(4.5, -3.0, false);

    /* fire pit */
    const pit = new THREE.Group(); pit.position.set(0, 0, -.3); majlis.add(pit);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const rock = new THREE.Mesh(keep(new THREE.DodecahedronGeometry(.17 + Math.random() * .07, 0)), stone);
      rock.position.set(Math.cos(a) * .68, .1, Math.sin(a) * .68);
      rock.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
      rock.castShadow = true; rock.receiveShadow = true; pit.add(rock);
    }
    const logs = new THREE.Group(); pit.add(logs);
    for (let i = 0; i < 4; i++) {
      const log = new THREE.Mesh(limb(.055, .07, .74, 9), keep(new THREE.MeshStandardMaterial({
        color: 0x17100A, roughness: .95, emissive: 0xFF5A18, emissiveIntensity: .35 })));
      log.rotation.set(Math.PI / 2 - .3, (i / 4) * Math.PI, 0);
      log.position.y = .12; log.castShadow = true; logs.add(log);
    }
    const flame = [sprite(0xFF7A22, 2.0), sprite(0xFFA83C, 1.35), sprite(0xFFE2A0, .8)];
    flame.forEach((f, i) => { f.position.set(0, .34 + i * .11, 0); pit.add(f); });

    const EMB = small ? 34 : 62;
    const ePos = new Float32Array(EMB * 3), eSize = new Float32Array(EMB);
    const eLife = new Float32Array(EMB), eSpeed = new Float32Array(EMB), eSeed = new Float32Array(EMB);
    for (let i = 0; i < EMB; i++) {
      eLife[i] = Math.random(); eSpeed[i] = .16 + Math.random() * .26;
      eSeed[i] = Math.random() * 100; eSize[i] = .05 + Math.random() * .09;
    }
    const emberGeo = keep(new THREE.BufferGeometry());
    emberGeo.setAttribute('position', new THREE.BufferAttribute(ePos, 3));
    emberGeo.setAttribute('size', new THREE.BufferAttribute(eSize, 1));
    // custom points shader: per-ember size and a fade as it climbs and cools
    const emberMat = keep(new THREE.ShaderMaterial({
      uniforms: { uMap: { value: glow }, uScale: { value: 380 } },
      vertexShader: `
        attribute float size; varying float vA;
        uniform float uScale;
        void main(){
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vA = clamp(1.0 - position.y / 3.2, 0.0, 1.0);
          gl_PointSize = size * uScale / max(-mv.z, 0.001);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        uniform sampler2D uMap; varying float vA;
        void main(){
          vec4 t = texture2D(uMap, gl_PointCoord);
          vec3 hot = mix(vec3(1.0,0.32,0.06), vec3(1.0,0.78,0.36), vA);
          gl_FragColor = vec4(hot, t.a * vA * 0.95);
        }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
    }));
    const embers = new THREE.Points(emberGeo, emberMat); pit.add(embers);

    /* ── the family ──────────────────────────────── */
    // A seated person in a thobe reads as a draped mass with knees pushing
    // through — that silhouette, not a mannequin, is what sells the pose.
    const people = [];
    const buildPerson = (opts) => {
      const {
        pose = 'sit', robe, over, head: headCloth, drapeCol, skin,
        scale = 1, lean = 0, turn = 0, armPose = 'rest'
      } = opts;
      const g = new THREE.Group();
      const robeMat = cloth(robe, .96), skinM = skinMat(skin);
      const overMat = over != null ? cloth(over, .92) : null;

      const torso = new THREE.Group();
      torso.rotation.set(lean, turn, 0);

      if (pose === 'stand') {
        const gown = new THREE.Mesh(drape([
          [0, 0], [.26, 0], [.252, .14], [.234, .34], [.218, .56], [.205, .78],
          [.196, .97], [.188, 1.09], [.176, 1.15], [.125, 1.18], [0, 1.19]
        ], 42, 10, .012), robeMat);
        gown.castShadow = true; gown.receiveShadow = true; g.add(gown);
        torso.position.y = 1.14;
      } else {
        // thobe pooled over folded legs
        const skirt = new THREE.Mesh(drape([
          [0, 0], [.45, .012], [.458, .055], [.435, .12], [.395, .21],
          [.345, .29], [.295, .355], [.25, .40], [.215, .425], [.15, .44], [0, .445]
        ], 42, 11, .016), robeMat);
        skirt.castShadow = true; skirt.receiveShadow = true; g.add(skirt);
        [[-.235, .155, .235], [.235, .155, .235]].forEach(([kx, ky, kz]) => {
          const knee = new THREE.Mesh(ball(.145, 14), robeMat);
          knee.position.set(kx, ky, kz); knee.scale.set(1, .85, 1.2);
          knee.castShadow = true; g.add(knee);
        });
        torso.position.y = .40;
      }

      const chest = new THREE.Mesh(lathe([
        [0, 0], [.185, 0], [.198, .09], [.196, .20], [.184, .30], [.162, .38], [.105, .42], [0, .43]
      ], 26), robeMat);
      chest.castShadow = true; torso.add(chest);

      const shoulders = new THREE.Mesh(ball(.178, 20), robeMat);
      shoulders.position.y = .385; shoulders.scale.set(1.44, .66, .92);
      shoulders.castShadow = true; torso.add(shoulders);

      if (overMat) { // بشت / عباية over the shoulders
        const cloak = new THREE.Mesh(drape([
          [0, 0], [.245, .015], [.256, .10], [.246, .22], [.228, .33], [.204, .40], [.158, .44], [0, .45]
        ], 34, 8, .02), overMat);
        cloak.position.y = -.02; cloak.scale.set(1.12, 1.02, 1.12);
        cloak.castShadow = true; torso.add(cloak);
      }

      const arm = (side, rotU, rotF) => {
        const a = new THREE.Group();
        a.position.set(.188 * side, .345, .015);
        a.rotation.set(rotU[0], rotU[1], rotU[2]);
        const sh = new THREE.Mesh(ball(.072, 14), robeMat); a.add(sh);
        const upper = new THREE.Mesh(limb(.068, .057, .26), robeMat);
        upper.position.y = -.14; upper.castShadow = true; a.add(upper);
        const fg = new THREE.Group();
        fg.position.y = -.27; fg.rotation.set(rotF[0], rotF[1], rotF[2]); a.add(fg);
        const el = new THREE.Mesh(ball(.056, 12), robeMat); fg.add(el);
        const fore = new THREE.Mesh(limb(.054, .042, .245), robeMat);
        fore.position.y = -.13; fore.castShadow = true; fg.add(fore);
        const hand = new THREE.Mesh(ball(.051, 12), skinM);
        hand.position.y = -.262; hand.scale.set(1, 1.18, .74); hand.castShadow = true; fg.add(hand);
        fg.userData.hand = hand;
        a.userData.fore = fg;
        torso.add(a);
        return a;
      };

      const POSES = {
        rest:  [[[-.30, 0, .40], [-.85, 0, .12]], [[-.30, 0, -.40], [-.85, 0, -.12]]],
        talk:  [[[-.55, .25, .55], [-1.35, .2, .25]], [[-.22, 0, -.34], [-.70, 0, -.1]]],
        cup:   [[[-.70, .35, .30], [-1.60, .30, .15]], [[-.25, 0, -.38], [-.75, 0, -.12]]],
        pour:  [[[-1.05, .30, .22], [-.85, .25, .10]], [[-.80, -.25, -.30], [-1.05, -.2, -.12]]],
        hug:   [[[-.25, 0, .34], [-.70, 0, .12]], [[-.95, -.55, -.55], [-1.05, -.3, -.2]]]
      };
      const [L, R] = POSES[armPose] || POSES.rest;
      const armL = arm(1, L[0], L[1]);
      const armR = arm(-1, R[0], R[1]);

      const neck = new THREE.Mesh(limb(.05, .066, .095, 12), skinM);
      neck.position.y = .435; torso.add(neck);
      const head = new THREE.Mesh(ball(.113, 22), skinM);
      head.position.y = .545; head.scale.set(1, 1.15, 1.03);
      head.castShadow = true; torso.add(head);

      if (headCloth === 'ghutra') {
        const gh = new THREE.Mesh(drape([
          [0, 0], [.225, .01], [.218, .06], [.198, .12], [.166, .185], [.129, .24], [.082, .285], [.038, .31], [0, .318]
        ], 30, 7, .018), cloth(drapeCol, .9));
        gh.position.y = .418; gh.castShadow = true; torso.add(gh);
        const ig = new THREE.Mesh(keep(new THREE.TorusGeometry(.127, .022, 10, 28)), keep(new THREE.MeshStandardMaterial({
          color: 0x0E0B07, roughness: .5, metalness: .2 })));
        ig.position.y = .648; ig.rotation.x = Math.PI / 2; ig.scale.set(1, 1, .82); torso.add(ig);
      } else if (headCloth === 'shayla') {
        const sh = new THREE.Mesh(drape([
          [0, 0], [.252, .012], [.246, .078], [.228, .155], [.198, .232], [.153, .292], [.097, .335], [.042, .356], [0, .36]
        ], 30, 9, .02), cloth(drapeCol, .93));
        sh.position.y = .378; sh.scale.set(1.04, 1, 1.12); sh.castShadow = true; torso.add(sh);
      }

      g.add(torso);
      g.userData = { torso, head, armL, armR, seed: Math.random() * 60 };
      g.scale.setScalar(scale);
      return g;
    };

    const place = (x, z, rot, opts) => {
      const p = buildPerson(opts);
      p.position.set(x, .27, z); p.rotation.y = rot;
      p.userData.baseRot = rot;
      majlis.add(p); people.push(p);
      return p;
    };

    // near edge, backs to us, facing across the fire
    place(-1.9, 2.15, Math.PI + .12, {
      robe: 0xB4A78C, drapeCol: 0xC3B89E, head: 'ghutra', skin: 0x6B4F39,
      armPose: 'talk', lean: -.05, turn: .22 });
    place(1.9, 2.15, Math.PI - .30, {
      robe: 0x8E8574, over: 0x1E1B22, drapeCol: 0xBDB299, head: 'ghutra', skin: 0x5F462F,
      armPose: 'cup', turn: -.26, scale: 1.02 });
    // far edge, lit from below by the fire
    place(-1.5, -2.25, .16, {
      robe: 0x22202A, over: 0x15141B, drapeCol: 0x1A1822, head: 'shayla', skin: 0x8A6A4E,
      armPose: 'hug', scale: .97 });
    place(1.5, -2.25, -.22, {
      robe: 0x2B2731, drapeCol: 0x201D27, head: 'shayla', skin: 0x7D5E42,
      armPose: 'talk', turn: -.3, scale: .96 });
    // a child leaning in toward the fire
    place(.45, -1.75, .5, {
      robe: 0x6E4A2C, drapeCol: 0x7A5434, head: 'none', skin: 0x8F6E4C,
      armPose: 'rest', scale: .64, lean: .16 });
    // left side, in profile
    place(-3.45, .25, Math.PI / 2 - .26, {
      robe: 0x35312B, drapeCol: 0x27241F, head: 'ghutra', skin: 0x86653F,
      armPose: 'rest', scale: .95 });

    // the host, kneeling to pour qahwa for the guest on the right
    const pourer = place(2.95, 1.35, -Math.PI / 2 - .45, {
      pose: 'stand', robe: 0xC6BBA2, over: 0x2A2A33, drapeCol: 0xD2C8B0,
      head: 'ghutra', skin: 0x704F35, armPose: 'pour', scale: .74, lean: .22 });
    {
      const d = dallahGroup();
      d.scale.setScalar(.62); d.rotation.set(0, 0, -1.02);
      d.position.set(.26, -.34, .04);
      pourer.userData.armL.userData.fore.add(d);
      const pourCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0), new THREE.Vector3(.02, -.22, .01), new THREE.Vector3(.01, -.44, 0)
      ]);
      const stream = new THREE.Mesh(keep(new THREE.TubeGeometry(pourCurve, 14, .0095, 6, false)),
        keep(new THREE.MeshStandardMaterial({
          color: 0x6B3A18, roughness: .28, metalness: .1,
          emissive: 0x3A1C08, emissiveIntensity: .35, transparent: true, opacity: .92 })));
      stream.position.set(.46, -.52, .06);
      pourer.userData.armL.userData.fore.add(stream);
    }

    /* ── cinematic lighting ──────────────────────── */
    scene.add(new THREE.AmbientLight(0x141828, .13));
    const moon = new THREE.DirectionalLight(0x9FB6DC, .55);
    moon.position.set(STAR_X * 1.2, 26, STAR_Z * .28);
    moon.target.position.set(0, 0, -4.6); scene.add(moon.target);
    moon.castShadow = true;
    moon.shadow.mapSize.set(small ? 1024 : 2048, small ? 1024 : 2048);
    moon.shadow.camera.left = -13; moon.shadow.camera.right = 13;
    moon.shadow.camera.top = 13; moon.shadow.camera.bottom = -11;
    moon.shadow.camera.near = 4; moon.shadow.camera.far = 72;
    moon.shadow.bias = -.0012; moon.shadow.normalBias = .035; moon.shadow.radius = 3;
    scene.add(moon);

    const rim = new THREE.DirectionalLight(0x7C90BC, .16);
    rim.position.set(-14, 9, -20); scene.add(rim);
    scene.add(new THREE.HemisphereLight(0x221C30, 0x070504, .12));

    const fire = new THREE.PointLight(0xFF6E28, 4.4, 18, 2);
    fire.position.set(0, .85, 0);
    if (!small) {
      fire.castShadow = true;
      fire.shadow.mapSize.set(512, 512);
      fire.shadow.bias = -.006; fire.shadow.normalBias = .04;
      fire.shadow.camera.near = .4; fire.shadow.camera.far = 17;
    }
    pit.add(fire);
    // a second, dimmer ember light keeps faces warm when the flame dips
    const coals = new THREE.PointLight(0xFF4A12, 1.2, 9, 2);
    coals.position.set(0, .22, 0); pit.add(coals);

    /* ── depth-of-field + vignette + grain ───────── */
    let composer = null;
    if (!small && !reduce) {
      try {
        const dt = new THREE.DepthTexture(1, 1);
        dt.type = THREE.UnsignedShortType;
        const rt = new THREE.WebGLRenderTarget(1, 1, {
          minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter,
          format: THREE.RGBAFormat, depthTexture: dt, depthBuffer: true, stencilBuffer: false });
        rt.texture.encoding = THREE.sRGBEncoding;
        const quadMat = new THREE.ShaderMaterial({
          uniforms: {
            tDiffuse: { value: rt.texture }, tDepth: { value: dt },
            uTexel: { value: new THREE.Vector2(1, 1) },
            uNear: { value: camera.near }, uFar: { value: camera.far },
            uFocus: { value: 13 }, uRange: { value: 38 }, uMax: { value: 1 },
            uTime: { value: 0 }
          },
          vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
          fragmentShader: `
            uniform sampler2D tDiffuse; uniform sampler2D tDepth;
            uniform vec2 uTexel; uniform float uNear, uFar, uFocus, uRange, uMax, uTime;
            varying vec2 vUv;
            float linz(float d){ float z = d * 2.0 - 1.0; return (2.0*uNear*uFar)/(uFar+uNear-z*(uFar-uNear)); }
            void main(){
              float depth = linz(texture2D(tDepth, vUv).x);
              float coc = clamp((depth - uFocus) / uRange, 0.0, 1.0);
              coc = pow(coc, 1.5) * uMax;
              vec4 col = texture2D(tDiffuse, vUv);
              if (coc > 0.004) {
                vec4 sum = vec4(0.0); float w = 0.0;
                for (int i = 0; i < 12; i++) {
                  float a = float(i) * 0.5236;
                  float r = mod(float(i), 2.0) < 0.5 ? 1.0 : 0.55;
                  vec2 off = vec2(cos(a), sin(a)) * r * coc * uTexel * 13.0;
                  sum += texture2D(tDiffuse, vUv + off); w += 1.0;
                }
                col = mix(col, sum / w, clamp(coc * 1.6, 0.0, 1.0));
              }
              vec2 q = vUv - 0.5;
              col.rgb *= 1.0 - dot(q, q) * 0.62;
              float g = fract(sin(dot(vUv * uTime, vec2(12.9898, 78.233))) * 43758.5453);
              col.rgb += (g - 0.5) * 0.016;
              gl_FragColor = vec4(col.rgb, 1.0);
            }`,
          depthTest: false, depthWrite: false
        });
        const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), quadMat);
        const quadScene = new THREE.Scene(); quadScene.add(quad);
        const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        composer = { rt, dt, quadMat, quadScene, quadCam, quad };
      } catch (err) { composer = null; }
    }

    /* ── camera: slow, weighted, VIP ─────────────── */
    const RADIUS = 10.6, CAM_Y = 3.7, PIVOT_Z = -1.4;
    const TARGET = new THREE.Vector3(0, 2.25, -15);
    let yaw = 0, pitch = 0, tYaw = 0, tPitch = 0, dragging = false, px = 0, py = 0;

    const onDown = (e) => { dragging = true; px = e.clientX; py = e.clientY; };
    const onMove = (e) => {
      if (dragging) {
        tYaw = THREE.MathUtils.clamp(tYaw + (e.clientX - px) * .0018, -.40, .40);
        tPitch = THREE.MathUtils.clamp(tPitch - (e.clientY - py) * .0011, -.09, .15);
        px = e.clientX; py = e.clientY;
      } else if (e.pointerType === 'mouse') {
        const r = el.getBoundingClientRect();
        tYaw = ((e.clientX - r.left) / r.width - .5) * .24;
        tPitch = ((e.clientY - r.top) / r.height - .5) * -.07;
      }
    };
    const onUp = () => { dragging = false; };
    renderer.domElement.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);

    const resize = () => {
      const w = el.clientWidth, h = el.clientHeight;
      if (!w || !h) return;
      const aspect = w / h;
      camera.aspect = aspect;
      camera.fov = aspect < 1.5
        ? THREE.MathUtils.clamp(
            THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(44) / 2) * (1.5 / aspect))),
            44, 72)
        : 44;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
      if (composer) {
        const dpr = renderer.getPixelRatio();
        const bw = Math.max(1, Math.floor(w * dpr)), bh = Math.max(1, Math.floor(h * dpr));
        composer.rt.setSize(bw, bh);
        composer.quadMat.uniforms.uTexel.value.set(1 / bw, 1 / bh);
      }
    };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(el);

    /* ── loop ────────────────────────────────────── */
    let raf = 0, running = false, cleanupIO = null;
    const seaPos = seaGeo.attributes.position;
    const emberPos = emberGeo.attributes.position;

    const frame = (ms) => {
      const t = ms / 1000;
      yaw += (tYaw - yaw) * .022;
      pitch += (tPitch - pitch) * .022;
      const drift = reduce ? 0 : Math.sin(t * .055) * .14;
      const bob = reduce ? 0 : Math.sin(t * .042) * .24;

      camera.position.set(
        Math.sin(yaw + drift) * RADIUS,
        CAM_Y + pitch * 6 + bob,
        PIVOT_Z + Math.cos(yaw + drift) * RADIUS
      );
      camera.lookAt(TARGET);

      if (!reduce) {
        for (let i = 0; i < seaPos.count; i++) {
          const x0 = seaBase[i * 3], z0 = seaBase[i * 3 + 2];
          seaPos.array[i * 3 + 1] =
            Math.sin(x0 * .15 + t * .80) * .24 +
            Math.sin(z0 * .25 - t * .58) * .17 +
            Math.sin((x0 + z0) * .085 + t * .36) * .11 +
            Math.sin(x0 * .52 - z0 * .33 + t * 1.5) * .04;
        }
        seaPos.needsUpdate = true;
        seaGeo.computeVertexNormals();

        for (const L of lanterns) {
          const f = fbm(t * 1.25 + L.seed);
          L.glass.material.emissiveIntensity = 1.05 + f * 1.05;
          L.halo.scale.setScalar(2.85 + f * .85);
          if (L.light) L.light.intensity = 1.5 + f * 1.05;
        }

        const fl = fbm(t * 2.1) * .7 + fbm(t * 5.4 + 13.7) * .3;
        fire.intensity = 3.5 + fl * 2.2;
        coals.intensity = 1.0 + fbm(t * .7 + 31.2) * .7;
        flame[0].scale.setScalar(1.8 + fl * .45);
        flame[1].scale.setScalar(1.2 + fl * .34);
        flame[2].scale.setScalar(.7 + fl * .2);
        flame.forEach((f, i) => {
          f.position.x = (fbm(t * 1.9 + i * 7.3) - .5) * .085;
          f.position.z = (fbm(t * 1.7 + i * 3.1 + 50) - .5) * .085;
        });
        logs.children.forEach((l, i) => { l.material.emissiveIntensity = .22 + fbm(t * 1.3 + i * 9) * .5; });

        for (let i = 0; i < EMB; i++) {
          eLife[i] += eSpeed[i] * .0062;
          if (eLife[i] > 1) eLife[i] -= 1;
          const L = eLife[i], s = eSeed[i];
          const spread = .22 + L * .85;
          emberPos.array[i * 3] = Math.cos(s + L * 4.2) * spread + (fbm(t * .8 + s) - .5) * .5 * L;
          emberPos.array[i * 3 + 1] = .28 + L * 3.0;
          emberPos.array[i * 3 + 2] = Math.sin(s + L * 4.2) * spread + (fbm(t * .8 + s + 20) - .5) * .5 * L;
        }
        emberPos.needsUpdate = true;

        const tw = .9 + .1 * Math.sin(t * .8);
        core.scale.setScalar(5.2 * tw); halo.scale.setScalar(19 * tw);
        stars.rotation.y = t * .0026;

        for (const p of people) {
          const u = p.userData, s = u.seed;
          const breath = fbm(t * .42 + s);
          p.rotation.y = u.baseRot + (fbm(t * .22 + s) - .5) * .09;
          u.torso.scale.y = 1 + (breath - .5) * .012;
          u.head.rotation.y = (fbm(t * .3 + s * 1.3) - .5) * .5;
          u.head.rotation.x = (fbm(t * .26 + s * 2.1) - .5) * .2;
          u.armL.rotation.z = u.armL.userData.z0 ?? (u.armL.userData.z0 = u.armL.rotation.z);
          u.armL.rotation.z += (fbm(t * .33 + s) - .5) * .05;
          u.armR.rotation.z = u.armR.userData.z0 ?? (u.armR.userData.z0 = u.armR.rotation.z);
          u.armR.rotation.z += (fbm(t * .31 + s + 9) - .5) * .05;
        }
      }

      if (composer) {
        composer.quadMat.uniforms.uTime.value = t;
        renderer.setRenderTarget(composer.rt);
        renderer.render(scene, camera);
        renderer.setRenderTarget(null);
        renderer.render(composer.quadScene, composer.quadCam);
      } else {
        renderer.render(scene, camera);
      }
      if (running) raf = requestAnimationFrame(frame);
    };

    const start = () => { if (!running) { running = true; raf = requestAnimationFrame(frame); } };
    const stop = () => { running = false; cancelAnimationFrame(raf); };

    if (reduce) frame(0);
    else {
      start();
      const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()), { threshold: 0 });
      io.observe(el);
      cleanupIO = () => io.disconnect();
    }
    const onVis = () => (document.hidden ? stop() : (!reduce && start()));
    document.addEventListener('visibilitychange', onVis);

    return () => {
      stop();
      if (cleanupIO) cleanupIO();
      document.removeEventListener('visibilitychange', onVis);
      renderer.domElement.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      ro.disconnect();
      envRT.dispose();
      if (composer) {
        composer.rt.dispose(); composer.dt.dispose();
        composer.quadMat.dispose(); composer.quad.geometry.dispose();
      }
      trash.forEach((o) => o.dispose && o.dispose());
      renderer.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    };
  }, []);

  if (failed) return <NightSky />;
  return <div ref={host} className="absolute inset-0 h-full w-full" aria-hidden="true" />;
}

