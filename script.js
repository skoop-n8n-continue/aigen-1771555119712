// --- CONFIGURATION ---
const CONFIG = {
    rainCount: 15000,
    cloudCount: 60,
    fogDensity: 0.012, // Slightly less dense for more depth
    rainSpeed: 120,
    windSpeed: 8,
    citySize: 450,
    streetLightInterval: 40
};

// --- SCENE SETUP ---
const scene = new THREE.Scene();
const bgCol = 0x050510;
scene.background = new THREE.Color(bgCol);
scene.fog = new THREE.FogExp2(bgCol, CONFIG.fogDensity);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 800);
camera.position.set(0, 1.8, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.9;
document.body.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enableZoom = false;
controls.enablePan = false;
controls.rotateSpeed = -0.3; // Inverted for "head look" feel
controls.target.set(0, 1.8, 0.1);
controls.update();

// --- ASSET GENERATION (Procedural) ---

function createNoiseTexture() {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    const imgData = ctx.createImageData(size, size);
    for (let i = 0; i < imgData.data.length; i += 4) {
        const val = 40 + Math.random() * 80; // Darker asphalt base
        imgData.data[i] = val;
        imgData.data[i+1] = val;
        imgData.data[i+2] = val;
        imgData.data[i+3] = 255;
    }
    ctx.putImageData(imgData, 0, 0);
    
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(15, 15);
    tex.anisotropy = 16;
    return tex;
}

function createRainTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, 128);
    grad.addColorStop(0, 'rgba(180, 200, 255, 0)');
    grad.addColorStop(0.5, 'rgba(200, 220, 255, 0.8)');
    grad.addColorStop(1, 'rgba(180, 200, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 128);
    return new THREE.CanvasTexture(canvas);
}

function createCloudTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(40, 40, 45, 0.9)');
    grad.addColorStop(0.4, 'rgba(30, 30, 35, 0.5)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(canvas);
}

function createWindowTexture() {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#080808';
    ctx.fillRect(0, 0, size, size);
    
    ctx.fillStyle = '#ffdfaa'; // Warm light
    // Random grid
    const rows = Math.floor(Math.random() * 3) + 3;
    const cols = Math.floor(Math.random() * 2) + 2;
    
    const w = (size / cols) - 4;
    const h = (size / rows) - 2;
    
    for(let r=0; r<rows; r++) {
        for(let c=0; c<cols; c++) {
            if(Math.random() > 0.4) {
                 // Add variation
                 ctx.globalAlpha = 0.5 + Math.random() * 0.5;
                 ctx.fillRect(c * (size/cols) + 2, r * (size/rows) + 1, w, h);
            }
        }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.magFilter = THREE.NearestFilter;
    return tex;
}

function createFlareTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const g = ctx.createRadialGradient(32,32,0,32,32,32);
    g.addColorStop(0,'rgba(255,160,60,1)');
    g.addColorStop(0.4,'rgba(255,100,20,0.3)');
    g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=g; 
    ctx.fillRect(0,0,64,64);
    return new THREE.CanvasTexture(canvas);
}

const asphaltTex = createNoiseTexture();
const rainTex = createRainTexture();
const cloudTex = createCloudTexture();
const flareTex = createFlareTexture();
const windowTextures = Array(12).fill(0).map(() => createWindowTexture());

// --- LIGHTING ---
const hemiLight = new THREE.HemisphereLight(0x1a1a2e, 0x050505, 0.2);
scene.add(hemiLight);

const moonLight = new THREE.DirectionalLight(0x8899ff, 0.4);
moonLight.position.set(-50, 80, -30);
moonLight.castShadow = true;
moonLight.shadow.mapSize.width = 2048;
moonLight.shadow.mapSize.height = 2048;
moonLight.shadow.camera.near = 0.5;
moonLight.shadow.camera.far = 500;
const d = 150;
moonLight.shadow.camera.left = -d;
moonLight.shadow.camera.right = d;
moonLight.shadow.camera.top = d;
moonLight.shadow.camera.bottom = -d;
moonLight.shadow.bias = -0.0001;
scene.add(moonLight);

const lightning = new THREE.PointLight(0xaaddff, 0, 2000);
lightning.position.set(0, 200, 0);
scene.add(lightning);

// --- WORLD ---

// Ground
const groundMat = new THREE.MeshStandardMaterial({
    color: 0x0a0a0a,
    roughness: 0.02, // Extremely wet/glossy
    metalness: 0.5,
    roughnessMap: asphaltTex,
    bumpMap: asphaltTex,
    bumpScale: 0.02
});
const ground = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000), groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// City
const cityGroup = new THREE.Group();
scene.add(cityGroup);

const buildingGeo = new THREE.BoxGeometry(1, 1, 1);
buildingGeo.translate(0, 0.5, 0);

const buildingMatBase = new THREE.MeshStandardMaterial({
    color: 0x151520,
    roughness: 0.3,
    metalness: 0.2
});

const blockSize = 30;
const streetWidth = 10;
const range = CONFIG.citySize;

// Pre-create flare material
const flareMat = new THREE.SpriteMaterial({ 
    map: flareTex, 
    blending: THREE.AdditiveBlending,
    color: 0xffaa66,
    transparent: true
});

for (let x = -range; x <= range; x += blockSize) {
    for (let z = -range; z <= range; z += blockSize) {
        // Safe zone
        if (Math.abs(x) < 20 && Math.abs(z) < 20) continue;
        
        // Random buildings
        if (Math.random() > 0.15) { // 85% chance of building
            const h = 10 + Math.random() * 50 + (Math.random() > 0.9 ? 70 : 0);
            const w = blockSize - streetWidth;
            const d = blockSize - streetWidth;
            
            let mat = buildingMatBase;
            // Add windows?
            if (Math.random() > 0.2) {
                mat = buildingMatBase.clone();
                mat.emissive = new THREE.Color(0xffffff);
                mat.emissiveMap = windowTextures[Math.floor(Math.random() * windowTextures.length)];
                mat.emissiveIntensity = 0.6;
                // Scale texture
                mat.emissiveMap.repeat.set(1, h / 8); 
                mat.emissiveMap.wrapT = THREE.RepeatWrapping;
            }
            
            const mesh = new THREE.Mesh(buildingGeo, mat);
            mesh.position.set(x, 0, z);
            mesh.scale.set(w, h, d);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            cityGroup.add(mesh);
        }
        
        // Street Lights at intersections (roughly)
        if (Math.random() > 0.75) {
            const px = x - streetWidth/2;
            const pz = z - streetWidth/2;
            
            // Pole
            const poleH = 6;
            const pole = new THREE.Mesh(
                new THREE.CylinderGeometry(0.1, 0.1, poleH),
                new THREE.MeshBasicMaterial({ color: 0x111 })
            );
            pole.position.set(px, poleH/2, pz);
            cityGroup.add(pole);
            
            // Light
            const spot = new THREE.SpotLight(0xffaa44, 1.5, 35, 0.8, 0.5, 1);
            spot.position.set(0, poleH/2, 0);
            spot.target.position.set(0, -10, 0);
            pole.add(spot);
            pole.add(spot.target);
            
            // Visible flare
            const flare = new THREE.Sprite(flareMat);
            flare.position.set(0, poleH/2, 0);
            flare.scale.set(6, 6, 1);
            pole.add(flare);
        }
    }
}

// --- PARTICLES ---

// Rain
const rainGeo = new THREE.BufferGeometry();
const rainCount = CONFIG.rainCount;
const rainPos = new Float32Array(rainCount * 3);
const rainVel = new Float32Array(rainCount);

for(let i=0; i<rainCount; i++) {
    rainPos[i*3] = (Math.random() - 0.5) * 600;
    rainPos[i*3+1] = Math.random() * 200;
    rainPos[i*3+2] = (Math.random() - 0.5) * 600;
    rainVel[i] = CONFIG.rainSpeed + Math.random() * 40;
}
rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));

const rainMat = new THREE.PointsMaterial({
    color: 0x88aaff,
    size: 2.5,
    map: rainTex,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
    depthWrite: false
});
const rainSystem = new THREE.Points(rainGeo, rainMat);
scene.add(rainSystem);

// Clouds
const clouds = new THREE.Group();
scene.add(clouds);
const cloudSpriteMat = new THREE.SpriteMaterial({
    map: cloudTex,
    color: 0x666677, // Blue-ish grey
    transparent: true,
    opacity: 0.3,
    depthWrite: false
});

for(let i=0; i<CONFIG.cloudCount; i++) {
    const c = new THREE.Sprite(cloudSpriteMat.clone()); // Cloning to allow individual tinting if needed later, but here just for safety
    c.position.set(
        (Math.random()-0.5)*800,
        100 + Math.random() * 40,
        (Math.random()-0.5)*800
    );
    c.scale.setScalar(80 + Math.random() * 80);
    c.userData = { 
        speed: CONFIG.windSpeed * (0.8 + Math.random() * 0.4) 
    };
    clouds.add(c);
}

// --- ANIMATION ---
const clock = new THREE.Clock();
let lightningTimer = 0;

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    
    controls.update();
    
    // Rain
    const pos = rainSystem.geometry.attributes.position.array;
    for(let i=0; i<rainCount; i++) {
        pos[i*3+1] -= rainVel[i] * delta; // Y
        pos[i*3] -= CONFIG.windSpeed * delta * 2; // Wind X
        
        if (pos[i*3+1] < 0) {
            pos[i*3+1] = 150 + Math.random() * 50;
            pos[i*3] = (Math.random() - 0.5) * 600;
            pos[i*3+2] = (Math.random() - 0.5) * 600;
        }
    }
    rainSystem.geometry.attributes.position.needsUpdate = true;
    
    // Clouds
    clouds.children.forEach(c => {
        c.position.x += c.userData.speed * delta;
        if (c.position.x > 400) c.position.x = -400;
    });
    
    // Lightning
    if (Math.random() > 0.993 && lightningTimer <= 0) {
        lightningTimer = 0.1 + Math.random() * 0.3;
        lightning.position.x = (Math.random()-0.5) * 400;
        lightning.position.z = (Math.random()-0.5) * 400;
        
        // Random color shift for lightning
        lightning.color.setHSL(0.6, 0.8, 0.8);
    }
    
    if (lightningTimer > 0) {
        lightningTimer -= delta;
        const intensity = Math.random() * 5 + 5; // Bright!
        lightning.intensity = intensity;
        
        // Flash sky
        const flashIntensity = intensity * 0.05;
            bgCol >> 16 & 255 / 255 + flashIntensity, 
            bgCol >> 8 & 255 / 255 + flashIntensity, 
            bgCol & 255 / 255 + flashIntensity
        );
        // Simple hack: just set to brighter blue
        if(Math.random() > 0.5) {
            scene.background.setHex(0x1a1a35);
            scene.fog.color.setHex(0x1a1a35);
        } else {
             scene.background.setHex(bgCol);
             scene.fog.color.setHex(bgCol);
        }
    } else {
        lightning.intensity = 0;
        scene.background.setHex(bgCol);
        scene.fog.color.setHex(bgCol);
    }
    
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

animate();
