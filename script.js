// =============================================
//  ULTRA-REALISTIC 3D WEATHER CITY
//  Three.js r128 — No build step required
// =============================================

// --- CONFIG ---
const CONFIG = {
    rainCount: 25000,
    cloudCount: 80,
    fogDensity: 0.005,
    rainSpeed: 180,
    windSpeed: 8,
    cityRadius: 700,
    blockSize: 28,
    streetWidth: 7,
};

// --- RENDERER ---
const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: 'high-performance',
    logarithmicDepthBuffer: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.5));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.4;
renderer.physicallyCorrectLights = true;
document.body.appendChild(renderer.domElement);

// --- SCENE ---
const scene = new THREE.Scene();
const SKY_COLOR = 0x08090f;
scene.background = new THREE.Color(SKY_COLOR);
scene.fog = new THREE.FogExp2(SKY_COLOR, CONFIG.fogDensity);

// --- CAMERA ---
const camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.05, 2000);
camera.position.set(0, 1.7, 0);

// --- CONTROLS ---
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.04;
controls.enableZoom = false;
controls.enablePan = false;
controls.rotateSpeed = -0.25;
controls.target.set(0, 1.7, 0.01);
controls.minPolarAngle = Math.PI * 0.15;
controls.maxPolarAngle = Math.PI * 0.75;
controls.update();

// =============================================
//  PROCEDURAL TEXTURES — High Resolution
// =============================================

// High-resolution window facade texture
function makeWindowTex(rows, cols, size) {
    size = size || 512;
    const c = document.createElement('canvas');
    c.width = size; c.height = size;
    const ctx = c.getContext('2d');

    // Dark building face
    ctx.fillStyle = '#0a0a0e';
    ctx.fillRect(0, 0, size, size);

    const cw = Math.floor(size / cols);
    const ch = Math.floor(size / rows);
    const pw = Math.max(2, Math.floor(cw * 0.65));
    const ph = Math.max(2, Math.floor(ch * 0.6));
    const ox = Math.floor((cw - pw) / 2);
    const oy = Math.floor((ch - ph) / 2);

    for (let r = 0; r < rows; r++) {
        for (let col2 = 0; col2 < cols; col2++) {
            const lit = Math.random() > 0.35;
            if (!lit) continue;
            const warm = Math.random() > 0.25;
            const bright = 0.55 + Math.random() * 0.45;
            if (warm) {
                ctx.fillStyle = `rgba(255,${Math.floor(200 + Math.random()*50)},${Math.floor(100 + Math.random()*80)},${bright})`;
            } else {
                ctx.fillStyle = `rgba(${Math.floor(190+Math.random()*50)},${Math.floor(210+Math.random()*40)},255,${bright})`;
            }
            ctx.fillRect(col2 * cw + ox, r * ch + oy, pw, ph);

            // Subtle glow bleed
            const grd = ctx.createRadialGradient(
                col2 * cw + ox + pw/2, r * ch + oy + ph/2, 0,
                col2 * cw + ox + pw/2, r * ch + oy + ph/2, Math.max(pw, ph) * 1.5
            );
            grd.addColorStop(0, warm ? 'rgba(255,180,80,0.12)' : 'rgba(180,220,255,0.12)');
            grd.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = grd;
            ctx.fillRect(Math.max(0, col2*cw-pw), Math.max(0, r*ch-ph), cw*3, ch*3);
        }
    }

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return tex;
}

// Concrete/facade side texture
function makeConcreteTex() {
    const size = 512;
    const c = document.createElement('canvas');
    c.width = size; c.height = size;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#1a1c22';
    ctx.fillRect(0, 0, size, size);
    // Fine noise
    const img = ctx.getImageData(0, 0, size, size);
    for (let i = 0; i < img.data.length; i += 4) {
        const v = (Math.random() * 20) - 10;
        img.data[i] = Math.max(0, Math.min(255, img.data[i] + v));
        img.data[i+1] = Math.max(0, Math.min(255, img.data[i+1] + v));
        img.data[i+2] = Math.max(0, Math.min(255, img.data[i+2] + v));
    }
    ctx.putImageData(img, 0, 0);
    // Horizontal panel lines
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 1;
    for (let y = 0; y < size; y += 32) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(size, y); ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return tex;
}

// Wet asphalt
function makeAsphaltTex() {
    const size = 1024;
    const c = document.createElement('canvas');
    c.width = size; c.height = size;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#0e0e0e';
    ctx.fillRect(0, 0, size, size);
    const img = ctx.getImageData(0, 0, size, size);
    for (let i = 0; i < img.data.length; i += 4) {
        const v = Math.random() * 28;
        img.data[i] += v; img.data[i+1] += v; img.data[i+2] += v;
    }
    ctx.putImageData(img, 0, 0);
    // Road markings
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 2;
    for (let y = 0; y < size; y += 64) {
        ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(size,y); ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(30, 30);
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return tex;
}

// Rain streak
function makeRainTex() {
    const c = document.createElement('canvas');
    c.width = 4; c.height = 64;
    const ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 0, 64);
    g.addColorStop(0, 'rgba(180,210,255,0)');
    g.addColorStop(0.3, 'rgba(200,225,255,0.55)');
    g.addColorStop(0.6, 'rgba(220,240,255,0.85)');
    g.addColorStop(1, 'rgba(180,210,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 4, 64);
    return new THREE.CanvasTexture(c);
}

// Soft cloud puff
function makeCloudTex() {
    const size = 256;
    const c = document.createElement('canvas');
    c.width = size; c.height = size;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(128,128,0,128,128,128);
    g.addColorStop(0, 'rgba(50,55,70,0.9)');
    g.addColorStop(0.4, 'rgba(35,38,50,0.5)');
    g.addColorStop(0.75, 'rgba(20,22,30,0.15)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(c);
}

// Flare / streetlight glow
function makeGlowTex(r, g2, b) {
    const size = 128;
    const c = document.createElement('canvas');
    c.width = size; c.height = size;
    const ctx = c.getContext('2d');
    const grd = ctx.createRadialGradient(64,64,0,64,64,64);
    grd.addColorStop(0, `rgba(${r},${g2},${b},1)`);
    grd.addColorStop(0.15, `rgba(${r},${g2},${b},0.5)`);
    grd.addColorStop(0.5, `rgba(${Math.floor(r*0.7)},${Math.floor(g2*0.6)},${Math.floor(b*0.4)},0.1)`);
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(c);
}

// Puddle / wet surface reflection
function makePuddleTex() {
    const size = 256;
    const c = document.createElement('canvas');
    c.width = size; c.height = size;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 18; i++) {
        const px = Math.random() * size;
        const py = Math.random() * size;
        const pr = 20 + Math.random() * 60;
        const g = ctx.createRadialGradient(px, py, 0, px, py, pr);
        g.addColorStop(0, 'rgba(30,60,90,0.35)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.ellipse(px, py, pr, pr * 0.4, Math.random() * Math.PI, 0, Math.PI*2);
        ctx.fill();
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(5, 5);
    return tex;
}

// Pre-generate texture pools
const windowTexPool = [];
for (let i = 0; i < 12; i++) {
    const rows = 8 + Math.floor(Math.random() * 12);
    const cols = 3 + Math.floor(Math.random() * 5);
    windowTexPool.push(makeWindowTex(rows, cols));
}
const concreteTex  = makeConcreteTex();
const asphaltTex   = makeAsphaltTex();
const rainTex      = makeRainTex();
const cloudTex     = makeCloudTex();
const glowAmber    = makeGlowTex(255, 160, 60);
const glowBlue     = makeGlowTex(80, 180, 255);
const glowRed      = makeGlowTex(255, 30, 30);
const puddleTex    = makePuddleTex();

// =============================================
//  LIGHTING
// =============================================
const hemi = new THREE.HemisphereLight(0x1a2035, 0x050508, 2.0);
scene.add(hemi);

const moon = new THREE.DirectionalLight(0x8899bb, 0.6);
moon.position.set(-150, 300, -80);
moon.castShadow = true;
moon.shadow.mapSize.set(4096, 4096);
moon.shadow.camera.near = 0.5;
moon.shadow.camera.far = 1200;
const sd = 400;
moon.shadow.camera.left   = -sd; moon.shadow.camera.right = sd;
moon.shadow.camera.top    =  sd; moon.shadow.camera.bottom= -sd;
moon.shadow.bias = -0.0003;
moon.shadow.normalBias = 0.02;
scene.add(moon);

// Lightning point
const lightningLight = new THREE.PointLight(0xbbddff, 0, 3000);
lightningLight.position.set(0, 600, 0);
scene.add(lightningLight);

// Local warm street lights (just 6 near the player)
const nearLightOffsets = [
    [15, 0], [-15, 0], [0, 15], [0, -15], [20, 20], [-20, -20]
];
nearLightOffsets.forEach(([lx, lz]) => {
    const pl = new THREE.PointLight(0xff9944, 1.5, 35, 2);
    pl.position.set(lx, 7, lz);
    scene.add(pl);
});

// =============================================
//  GROUND (Wet Asphalt)
// =============================================
const groundMat = new THREE.MeshStandardMaterial({
    color: 0x101012,
    roughness: 0.08,
    metalness: 0.85,
    map: asphaltTex,
    roughnessMap: asphaltTex,
    envMapIntensity: 1.5,
});
const ground = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000, 1, 1), groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Puddle overlay
const puddleMat = new THREE.MeshStandardMaterial({
    color: 0x223344,
    roughness: 0.0,
    metalness: 1.0,
    transparent: true,
    opacity: 0.35,
    map: puddleTex,
});
const puddle = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000), puddleMat);
puddle.rotation.x = -Math.PI / 2;
puddle.position.y = 0.01;
scene.add(puddle);

// =============================================
//  CITY GENERATION — Detailed Buildings
// =============================================
const cityGroup = new THREE.Group();
scene.add(cityGroup);

// Shared geometries
const boxGeo = new THREE.BoxGeometry(1, 1, 1);
boxGeo.translate(0, 0.5, 0);

// Create a detailed building
function makeBuilding(x, z, bw, bd, h) {
    const group = new THREE.Group();

    // --- Main tower ---
    const winTex = windowTexPool[Math.floor(Math.random() * windowTexPool.length)];
    const wt2 = windowTexPool[Math.floor(Math.random() * windowTexPool.length)];

    const faceW = winTex.clone(); faceW.repeat.set(bw / 5, h / 8); faceW.needsUpdate = true;
    const faceD = wt2.clone();   faceD.repeat.set(bd / 5, h / 8); faceD.needsUpdate = true;
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x111115, roughness: 0.6, metalness: 0.3, map: concreteTex });

    const sideMat = new THREE.MeshStandardMaterial({
        color: 0x1a1c24,
        roughness: 0.3,
        metalness: 0.5,
        emissiveMap: winTex,
        emissive: new THREE.Color(1, 1, 1),
        emissiveIntensity: 0.65,
        map: concreteTex,
    });
    const sideMat2 = sideMat.clone();
    sideMat2.emissiveMap = wt2;

    // Each face gets its own material so we can tile correctly
    const mats = [sideMat2, sideMat2, roofMat, roofMat, sideMat, sideMat];
    mats[0].emissiveMap = wt2; mats[0].needsUpdate = true;
    mats[1].emissiveMap = wt2; mats[1].needsUpdate = true;
    mats[4].emissiveMap = winTex; mats[4].needsUpdate = true;
    mats[5].emissiveMap = winTex; mats[5].needsUpdate = true;

    const towerGeo = new THREE.BoxGeometry(bw, h, bd);
    towerGeo.translate(0, h / 2, 0);
    const tower = new THREE.Mesh(towerGeo, mats);
    tower.castShadow = true;
    tower.receiveShadow = true;
    group.add(tower);

    // --- Setback (architectural step) — taller buildings only ---
    if (h > 30 && Math.random() > 0.4) {
        const sh = 4 + Math.random() * 8;
        const sw = bw + 1.5 + Math.random() * 2;
        const sd = bd + 1.5 + Math.random() * 2;
        const setbackMat = new THREE.MeshStandardMaterial({ color: 0x151820, roughness: 0.5, metalness: 0.4, map: concreteTex });
        const setback = new THREE.Mesh(new THREE.BoxGeometry(sw, sh, sd), setbackMat);
        setback.position.y = sh / 2;
        setback.castShadow = true;
        group.add(setback);
    }

    // --- Rooftop details ---
    if (Math.random() > 0.5) {
        // AC units / water tank
        const detH = 1.5 + Math.random() * 3;
        const detW = 1 + Math.random() * 2;
        const detMat = new THREE.MeshStandardMaterial({ color: 0x1c1c22, roughness: 0.7, metalness: 0.2 });
        for (let di = 0; di < 2 + Math.floor(Math.random() * 3); di++) {
            const det = new THREE.Mesh(new THREE.BoxGeometry(detW, detH, detW * 0.8), detMat);
            det.position.set(
                (Math.random() - 0.5) * (bw * 0.6),
                h + detH / 2,
                (Math.random() - 0.5) * (bd * 0.6)
            );
            group.add(det);
        }
        // Antenna / spire on skyscrapers
        if (h > 50 && Math.random() > 0.5) {
            const spireGeo = new THREE.CylinderGeometry(0.07, 0.2, h * 0.25, 6);
            const spire = new THREE.Mesh(spireGeo, new THREE.MeshStandardMaterial({ color: 0x555566, roughness: 0.4, metalness: 0.8 }));
            spire.position.set(0, h + h * 0.125, 0);
            group.add(spire);
            // Red beacon
            if (Math.random() > 0.5) {
                const beaconGeo = new THREE.SphereGeometry(0.18, 8, 8);
                const beacon = new THREE.Mesh(beaconGeo, new THREE.MeshBasicMaterial({ color: 0xff2222 }));
                beacon.position.set(0, h + h * 0.25 + 0.2, 0);
                group.add(beacon);
            }
        }
    }

    // --- Cornice / ledge ---
    const corniceH = 0.4;
    const corniceGeo = new THREE.BoxGeometry(bw + 0.4, corniceH, bd + 0.4);
    const corniceMat = new THREE.MeshStandardMaterial({ color: 0x282830, roughness: 0.5, metalness: 0.6 });
    const cornice = new THREE.Mesh(corniceGeo, corniceMat);
    cornice.position.y = h + corniceH / 2;
    group.add(cornice);

    // Floor ledges every ~12 units for tall buildings
    if (h > 25) {
        const ledgeGeo = new THREE.BoxGeometry(bw + 0.2, 0.25, bd + 0.2);
        for (let ly = 12; ly < h - 2; ly += 12 + Math.random() * 4) {
            const ledge = new THREE.Mesh(ledgeGeo, corniceMat);
            ledge.position.y = ly;
            group.add(ledge);
        }
    }

    group.position.set(x, 0, z);
    return group;
}

// Grid-based city layout
const bs = CONFIG.blockSize;
const sw = CONFIG.streetWidth;
const cr = CONFIG.cityRadius;

const streetLightPositions = [];

for (let x = -cr; x <= cr; x += bs) {
    for (let z = -cr; z <= cr; z += bs) {
        // Clear zone around player start
        if (Math.abs(x) < bs * 1.5 && Math.abs(z) < bs * 1.5) continue;

        if (Math.random() > 0.08) {
            const bw = bs - sw - (Math.random() > 0.3 ? 0 : Math.random() * 4);
            const bd = bs - sw - (Math.random() > 0.3 ? 0 : Math.random() * 4);
            const h = 6 + Math.pow(Math.random(), 0.7) * 70 + (Math.random() > 0.88 ? 50 + Math.random() * 60 : 0);
            cityGroup.add(makeBuilding(x, z, Math.max(4, bw), Math.max(4, bd), Math.max(6, h)));
        }

        // Street lights at block corners
        if (Math.abs(x) < cr - bs && Math.abs(z) < cr - bs && Math.random() > 0.45) {
            streetLightPositions.push([x - sw / 2 - 1, z - sw / 2 - 1]);
        }
    }
}

// =============================================
//  STREET LIGHTS — Detailed poles
// =============================================
const poleGeo = new THREE.CylinderGeometry(0.08, 0.12, 7.5, 7);
const poleMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1f, roughness: 0.5, metalness: 0.7 });
const armGeo  = new THREE.CylinderGeometry(0.05, 0.05, 2, 6);
const bulbGeo = new THREE.SphereGeometry(0.2, 8, 6);
const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffcc88 });
const flareMat = new THREE.SpriteMaterial({ map: glowAmber, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false });

// Only render lights near the player (within ~200 units) for perf — we still place all of them
const lightGroup = new THREE.Group();
scene.add(lightGroup);

streetLightPositions.forEach(([lx, lz]) => {
    const dist = Math.sqrt(lx * lx + lz * lz);
    if (dist > 250) return; // Skip very far ones for performance

    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.set(lx, 3.75, lz);
    pole.castShadow = false;
    lightGroup.add(pole);

    // Horizontal arm
    const arm = new THREE.Mesh(armGeo, poleMat);
    arm.rotation.z = Math.PI / 2;
    arm.position.set(lx + 1, 7.5, lz);
    lightGroup.add(arm);

    // Bulb
    const bulb = new THREE.Mesh(bulbGeo, bulbMat);
    bulb.position.set(lx + 2, 7.5, lz);
    lightGroup.add(bulb);

    // Flare
    const flare = new THREE.Sprite(flareMat.clone());
    flare.position.set(lx + 2, 7.5, lz);
    flare.scale.set(8, 8, 1);
    lightGroup.add(flare);
});

// =============================================
//  TRAFFIC
// =============================================
const cars = [];
const carColors = [0x223344, 0x1a1a1a, 0x2a2030, 0x0d1520, 0x1c1008, 0x2d1a1a];
const headFlare = new THREE.SpriteMaterial({ map: glowAmber, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });
const tailFlare = new THREE.SpriteMaterial({ map: glowRed,   blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });

function createCar() {
    const g = new THREE.Group();
    const color = carColors[Math.floor(Math.random() * carColors.length)];
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.15, metalness: 0.7 });

    // Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(2, 0.9, 4.2), mat);
    body.position.y = 0.5;
    body.castShadow = true;
    g.add(body);

    // Cabin
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.7, 2.2), mat);
    cabin.position.set(0, 1.35, -0.2);
    g.add(cabin);

    // Wheels (simple flat cylinders)
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 });
    const wheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.2, 10);
    const wp = [[0.95,0,1.3],[-0.95,0,1.3],[0.95,0,-1.3],[-0.95,0,-1.3]];
    wp.forEach(([wx,wy,wz]) => {
        const w = new THREE.Mesh(wheelGeo, wheelMat);
        w.rotation.z = Math.PI/2;
        w.position.set(wx, wy + 0.32, wz);
        g.add(w);
    });

    // Headlights
    const h1 = new THREE.Sprite(headFlare.clone()); h1.scale.set(5,3,1); h1.position.set(0.6,0.6,2.2); g.add(h1);
    const h2 = new THREE.Sprite(headFlare.clone()); h2.scale.set(5,3,1); h2.position.set(-0.6,0.6,2.2); g.add(h2);
    // Taillights
    const t1 = new THREE.Sprite(tailFlare.clone()); t1.scale.set(4,2.5,1); t1.position.set(0.6,0.6,-2.2); g.add(t1);
    const t2 = new THREE.Sprite(tailFlare.clone()); t2.scale.set(4,2.5,1); t2.position.set(-0.6,0.6,-2.2); g.add(t2);

    return g;
}

function spawnCar() {
    const isX = Math.random() > 0.5;
    const lane = (Math.floor(Math.random() * 18) - 9) * bs;
    const dir = Math.random() > 0.5 ? 1 : -1;
    const laneOff = dir > 0 ? 2 : -2;
    const car = createCar();
    car.userData = { axis: isX ? 'x' : 'z', dir, speed: 14 + Math.random() * 18 };

    if (isX) {
        car.position.set(-cr * dir, 0, lane + laneOff);
        car.rotation.y = dir > 0 ? Math.PI / 2 : -Math.PI / 2;
    } else {
        car.position.set(lane - laneOff, 0, -cr * dir);
        car.rotation.y = dir > 0 ? 0 : Math.PI;
    }
    scene.add(car);
    cars.push(car);
}

for (let i = 0; i < 70; i++) spawnCar();

// =============================================
//  RAIN — Instanced Streaks
// =============================================
const rainCount = CONFIG.rainCount;
const rainGeo = new THREE.BufferGeometry();
const rPos = new Float32Array(rainCount * 3);
const rVel = new Float32Array(rainCount);

for (let i = 0; i < rainCount; i++) {
    rPos[i*3]   = (Math.random() - 0.5) * 700;
    rPos[i*3+1] = Math.random() * 200;
    rPos[i*3+2] = (Math.random() - 0.5) * 700;
    rVel[i]     = CONFIG.rainSpeed + Math.random() * 50;
}
rainGeo.setAttribute('position', new THREE.BufferAttribute(rPos, 3));

const rainMat = new THREE.PointsMaterial({
    color: 0xaaccff,
    size: 0.55,
    map: rainTex,
    transparent: true,
    opacity: 0.75,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
});
const rain = new THREE.Points(rainGeo, rainMat);
scene.add(rain);

// Splash rings on ground (instanced)
const splashRingGeo = new THREE.RingGeometry(0.05, 0.2, 12);
splashRingGeo.rotateX(-Math.PI / 2);
const splashMat = new THREE.MeshBasicMaterial({ color: 0x6688aa, transparent: true, opacity: 0.4, depthWrite: false, side: THREE.DoubleSide });
const splashes = [];
for (let i = 0; i < 600; i++) {
    const m = new THREE.Mesh(splashRingGeo, splashMat.clone());
    m.position.set((Math.random()-0.5)*120, 0.02, (Math.random()-0.5)*120);
    m.userData = { phase: Math.random() * Math.PI * 2, speed: 1.5 + Math.random() * 2.5 };
    scene.add(m);
    splashes.push(m);
}

// =============================================
//  CLOUDS
// =============================================
const cloudGroup = new THREE.Group();
scene.add(cloudGroup);

for (let i = 0; i < CONFIG.cloudCount; i++) {
    const cm = new THREE.SpriteMaterial({
        map: cloudTex,
        color: new THREE.Color(0.18, 0.2, 0.28),
        transparent: true,
        opacity: 0.08 + Math.random() * 0.12,
        depthWrite: false,
        blending: THREE.NormalBlending,
    });
    const cs = new THREE.Sprite(cm);
    cs.position.set(
        (Math.random() - 0.5) * 1200,
        75 + Math.random() * 80,
        (Math.random() - 0.5) * 1200
    );
    cs.scale.setScalar(120 + Math.random() * 200);
    cs.userData = { spd: CONFIG.windSpeed * (0.4 + Math.random() * 0.8) };
    cloudGroup.add(cs);
}

// Rain haze layer (near ground mist)
for (let i = 0; i < 20; i++) {
    const hm = new THREE.SpriteMaterial({
        map: cloudTex,
        color: new THREE.Color(0.1, 0.12, 0.16),
        transparent: true,
        opacity: 0.04 + Math.random() * 0.06,
        depthWrite: false,
    });
    const hs = new THREE.Sprite(hm);
    hs.position.set((Math.random()-0.5)*300, 3 + Math.random()*8, (Math.random()-0.5)*300);
    hs.scale.setScalar(60 + Math.random() * 80);
    hs.userData = { spd: CONFIG.windSpeed * 0.3 };
    cloudGroup.add(hs);
}

// =============================================
//  ANIMATION LOOP
// =============================================
const clock = new THREE.Clock();
let ltTimer = 0;

function animate() {
    requestAnimationFrame(animate);
    const dt = clock.getDelta();
    const t  = clock.getElapsedTime();

    controls.update();

    // ---- Rain ----
    const rp = rain.geometry.attributes.position.array;
    for (let i = 0; i < rainCount; i++) {
        rp[i*3+1] -= rVel[i] * dt;
        rp[i*3]   -= CONFIG.windSpeed * dt * 2.2;
        if (rp[i*3+1] < -1) {
            rp[i*3+1] = 190 + Math.random() * 30;
            rp[i*3]   = (Math.random() - 0.5) * 700 + (Math.sin(t * 0.05) * 30);
            rp[i*3+2] = (Math.random() - 0.5) * 700;
        }
    }
    rain.geometry.attributes.position.needsUpdate = true;

    // ---- Splash rings ----
    splashes.forEach(s => {
        const age = ((t * s.userData.speed + s.userData.phase) % 1);
        s.scale.setScalar(0.3 + age * 2.2);
        s.material.opacity = (1 - age) * 0.4;
    });

    // ---- Clouds ----
    cloudGroup.children.forEach(c => {
        c.position.x += c.userData.spd * dt;
        if (c.position.x > 650) c.position.x = -650;
    });

    // ---- Traffic ----
    for (let i = cars.length - 1; i >= 0; i--) {
        const car = cars[i];
        const spd = car.userData.speed * dt;
        if (car.userData.axis === 'x') {
            car.position.x += spd * car.userData.dir;
            if (Math.abs(car.position.x) > cr + 60) {
                scene.remove(car); cars.splice(i, 1); spawnCar();
            }
        } else {
            car.position.z += spd * car.userData.dir;
            if (Math.abs(car.position.z) > cr + 60) {
                scene.remove(car); cars.splice(i, 1); spawnCar();
            }
        }
    }

    // ---- Lightning ----
    if (Math.random() > 0.995 && ltTimer <= 0) {
        ltTimer = 0.08 + Math.random() * 0.18;
        lightningLight.position.x = (Math.random() - 0.5) * 600;
        lightningLight.position.z = (Math.random() - 0.5) * 600;
        lightningLight.intensity = 8000 + Math.random() * 12000;
    }

    if (ltTimer > 0) {
        ltTimer -= dt;
        const flash = Math.random() > 0.35 ? 0.25 : 0;
        hemi.intensity = 2.0 + flash * 6;
        scene.fog.color.setHSL(0.6, 0.15, 0.04 + flash * 0.12);
        scene.background.setHSL(0.6, 0.2, 0.02 + flash * 0.1);
    } else {
        if (lightningLight.intensity > 0) lightningLight.intensity = 0;
        hemi.intensity = THREE.MathUtils.lerp(hemi.intensity, 2.0, dt * 4);
        scene.fog.color.setHex(SKY_COLOR);
        scene.background.setHex(SKY_COLOR);
    }

    renderer.render(scene, camera);
}

// =============================================
//  RESIZE
// =============================================
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.5));
});

animate();
