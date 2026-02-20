// --- CONFIGURATION ---
const CONFIG = {
    rainCount: 20000,
    cloudCount: 50,
    fogDensity: 0.007, 
    rainSpeed: 160,
    windSpeed: 15,
    citySize: 600,
    blockSize: 30,
    streetWidth: 10
};

// --- SCENE SETUP ---
const scene = new THREE.Scene();
const bgCol = 0x050510;
scene.background = new THREE.Color(bgCol);
scene.fog = new THREE.FogExp2(bgCol, CONFIG.fogDensity);

const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.8, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
document.body.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enableZoom = false;
controls.enablePan = false;
controls.rotateSpeed = -0.3;
controls.target.set(0, 1.8, 1);
controls.update();

// --- TEXTURE GENERATION ---

// High-res asphalt with noise
function createNoiseTexture() {
    const size = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    // Base
    ctx.fillStyle = '#111111';
    ctx.fillRect(0, 0, size, size);
    
    // Noise
    const imgData = ctx.getImageData(0, 0, size, size);
    for (let i = 0; i < imgData.data.length; i += 4) {
        const val = Math.random() * 40; 
        imgData.data[i] += val;
        imgData.data[i+1] += val;
        imgData.data[i+2] += val;
    }
    ctx.putImageData(imgData, 0, 0);
    
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(20, 20);
    tex.anisotropy = 16;
    return tex;
}

// Better rain streak
function createRainTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, 'rgba(200, 220, 255, 0)');
    grad.addColorStop(0.2, 'rgba(200, 220, 255, 0.1)');
    grad.addColorStop(0.5, 'rgba(220, 240, 255, 0.6)');
    grad.addColorStop(0.8, 'rgba(200, 220, 255, 0.1)');
    grad.addColorStop(1, 'rgba(200, 220, 255, 0)');
    
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 256);
    return new THREE.CanvasTexture(canvas);
}

// Soft cloud
function createCloudTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    grad.addColorStop(0, 'rgba(60, 60, 70, 0.7)');
    grad.addColorStop(0.5, 'rgba(40, 40, 50, 0.3)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(canvas);
}

// Window light pattern
function createWindowTexture(hue) {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, size, size);
    
    // Windows
    const rows = 8;
    const cols = 4;
    const w = (size / cols) - 4;
    const h = (size / rows) - 2;
    
    for(let r=0; r<rows; r++) {
        for(let c=0; c<cols; c++) {
            if(Math.random() > 0.3) {
                 const intensity = 0.5 + Math.random() * 0.5;
                 // Varied warm/cool lights
                 const isWarm = Math.random() > 0.3;
                 ctx.fillStyle = isWarm 
                    ? `rgba(255, 220, 150, ${intensity})` 
                    : `rgba(200, 230, 255, ${intensity})`;
                 
                 ctx.fillRect(c * (size/cols) + 2, r * (size/rows) + 1, w, h);
            }
        }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.magFilter = THREE.NearestFilter;
    return tex;
}

// Streetlight flare
function createFlareTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    // Soft outer glow
    let g = ctx.createRadialGradient(64,64,0,64,64,64);
    g.addColorStop(0,'rgba(255,180,100,0.8)');
    g.addColorStop(0.2,'rgba(255,140,50,0.2)');
    g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=g; 
    ctx.fillRect(0,0,128,128);
    
    // Sharp core
    g = ctx.createRadialGradient(64,64,0,64,64,10);
    g.addColorStop(0,'rgba(255,255,255,1)');
    g.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=g;
    ctx.fillRect(0,0,128,128);
    
    return new THREE.CanvasTexture(canvas);
}

// Car headlight/taillight texture
function createLightTexture(color) {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const g = ctx.createRadialGradient(32,32,0,32,32,32);
    g.addColorStop(0, color);
    g.addColorStop(0.5, color.replace('1)', '0.2)'));
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0,0,64,64);
    return new THREE.CanvasTexture(canvas);
}

const asphaltTex = createNoiseTexture();
const rainTex = createRainTexture();
const cloudTex = createCloudTexture();
const flareTex = createFlareTexture();
const headLightTex = createLightTexture('rgba(255, 240, 200, 1)');
const tailLightTex = createLightTexture('rgba(255, 20, 20, 1)');
const windowTextures = Array(8).fill(0).map(() => createWindowTexture());

// --- LIGHTING ---
const ambientLight = new THREE.HemisphereLight(0x202040, 0x101015, 1.5); // Boosted base brightness
scene.add(ambientLight);

const moonLight = new THREE.DirectionalLight(0xaaccff, 0.5);
moonLight.position.set(-100, 200, -50);
moonLight.castShadow = true;
moonLight.shadow.mapSize.width = 2048;
moonLight.shadow.mapSize.height = 2048;
moonLight.shadow.camera.near = 0.5;
moonLight.shadow.camera.far = 800;
const d = 300;
moonLight.shadow.camera.left = -d;
moonLight.shadow.camera.right = d;
moonLight.shadow.camera.top = d;
moonLight.shadow.camera.bottom = -d;
moonLight.shadow.bias = -0.0005;
scene.add(moonLight);

const lightning = new THREE.PointLight(0xaaddff, 0, 5000);
lightning.position.set(0, 500, 0);
scene.add(lightning);

// Local intersection lights (Just a few to light the immediate area without killing shaders)
const intersectionLights = [];
const localLightPositions = [
    {x: 10, z: 10}, {x: -10, z: 10}, {x: 10, z: -10}, {x: -10, z: -10}
];
localLightPositions.forEach(pos => {
    const pl = new THREE.PointLight(0xffaa44, 2, 40);
    pl.position.set(pos.x, 8, pos.z);
    pl.castShadow = false; // Too expensive
    scene.add(pl);
    intersectionLights.push(pl);
});


// --- WORLD ---

// Ground
const groundMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.1, 
    metalness: 0.6,
    roughnessMap: asphaltTex,
    bumpMap: asphaltTex,
    bumpScale: 0.05
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
    color: 0x222225,
    roughness: 0.2,
    metalness: 0.3
});

const flareMat = new THREE.SpriteMaterial({ 
    map: flareTex, 
    blending: THREE.AdditiveBlending,
    color: 0xffaa66,
    transparent: true,
    depthWrite: false
});

const poleGeo = new THREE.CylinderGeometry(0.15, 0.15, 8);
const poleMat = new THREE.MeshStandardMaterial({ color: 0x222 });
const bulbGeo = new THREE.SphereGeometry(0.3, 8, 8);
const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffcc88 });

const blockSize = CONFIG.blockSize;
const streetWidth = CONFIG.streetWidth;
const range = CONFIG.citySize;

const roads = []; // Store road segments for traffic

// Create city grid
for (let x = -range; x <= range; x += blockSize) {
    // Add road segments for X axis
    roads.push({ x: x - streetWidth/2, z: 0, dir: 'z' }); // Vertical road at this X
    
    for (let z = -range; z <= range; z += blockSize) {
        // Safe zone (plaza)
        if (Math.abs(x) < 25 && Math.abs(z) < 25) continue;
        
        // Random buildings
        if (Math.random() > 0.1) {
            const h = 10 + Math.random() * 60 + (Math.random() > 0.9 ? 80 : 0);
            const w = blockSize - streetWidth;
            const d = blockSize - streetWidth;
            
            let mat = buildingMatBase;
            if (Math.random() > 0.25) {
                mat = buildingMatBase.clone();
                mat.emissive = new THREE.Color(0xffffff);
                mat.emissiveMap = windowTextures[Math.floor(Math.random() * windowTextures.length)];
                mat.emissiveIntensity = 0.8;
                mat.emissiveMap.repeat.set(1, h / 10); 
                mat.emissiveMap.wrapT = THREE.RepeatWrapping;
            }
            
            const mesh = new THREE.Mesh(buildingGeo, mat);
            mesh.position.set(x, 0, z);
            mesh.scale.set(w, h, d);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            cityGroup.add(mesh);
        }
        
        // Street Lights
        // Place them at corners of blocks
        if (Math.random() > 0.6) {
            const px = x - streetWidth/2;
            const pz = z - streetWidth/2;
            
            const pole = new THREE.Mesh(poleGeo, poleMat);
            pole.position.set(px, 4, pz);
            cityGroup.add(pole);
            
            // Glowing bulb
            const bulb = new THREE.Mesh(bulbGeo, bulbMat);
            bulb.position.set(0, 4, 0); // Relative to pole center
            pole.add(bulb);
            
            // Flare Sprite
            const flare = new THREE.Sprite(flareMat);
            flare.position.set(0, 4, 0);
            flare.scale.set(12, 12, 1);
            pole.add(flare);
        }
    }
}

// --- TRAFFIC SYSTEM ---
const cars = [];
const carGeo = new THREE.BoxGeometry(1.5, 0.8, 3.5);
const carMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.2 });
const carHeadMat = new THREE.SpriteMaterial({ map: headLightTex, color: 0xffffff, blending: THREE.AdditiveBlending });
const carTailMat = new THREE.SpriteMaterial({ map: tailLightTex, color: 0xff0000, blending: THREE.AdditiveBlending });

function spawnCar() {
    const isX = Math.random() > 0.5;
    const roadOffset = (Math.floor(Math.random() * (range/blockSize * 2)) - (range/blockSize)) * blockSize - streetWidth/2;
    
    // Determine lane (left or right side of road)
    const laneOffset = 2.5; 
    const direction = Math.random() > 0.5 ? 1 : -1;
    
    const car = new THREE.Group();
    const chassis = new THREE.Mesh(carGeo, carMat);
    chassis.castShadow = true;
    car.add(chassis);
    
    // Lights
    const h1 = new THREE.Sprite(carHeadMat); h1.scale.set(4,4,1); h1.position.set(0.5, 0.5, 1.8); car.add(h1);
    const h2 = new THREE.Sprite(carHeadMat); h2.scale.set(4,4,1); h2.position.set(-0.5, 0.5, 1.8); car.add(h2);
    const t1 = new THREE.Sprite(carTailMat); t1.scale.set(3,3,1); t1.position.set(0.5, 0.5, -1.8); car.add(t1);
    const t2 = new THREE.Sprite(carTailMat); t2.scale.set(3,3,1); t2.position.set(-0.5, 0.5, -1.8); car.add(t2);
    
    if (isX) {
        car.position.set(-range * direction, 0.5, roadOffset + (direction * laneOffset));
        car.rotation.y = direction > 0 ? Math.PI / 2 : -Math.PI / 2;
        car.userData = { axis: 'x', dir: direction, speed: 20 + Math.random() * 20 };
    } else {
        car.position.set(roadOffset - (direction * laneOffset), 0.5, -range * direction);
        car.rotation.y = direction > 0 ? 0 : Math.PI;
        car.userData = { axis: 'z', dir: direction, speed: 20 + Math.random() * 20 };
    }
    
    scene.add(car);
    cars.push(car);
}

// Initial traffic
for(let i=0; i<60; i++) spawnCar();

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
    color: 0xaaccff,
    size: 4, // Bigger streaks
    map: rainTex,
    transparent: true,
    opacity: 0.7,
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
    color: 0x444455,
    transparent: true,
    opacity: 0.15,
    depthWrite: false
});

for(let i=0; i<CONFIG.cloudCount; i++) {
    const c = new THREE.Sprite(cloudSpriteMat.clone());
    c.position.set(
        (Math.random()-0.5)*800,
        80 + Math.random() * 60,
        (Math.random()-0.5)*800
    );
    c.scale.setScalar(150 + Math.random() * 150);
    c.userData = { 
        speed: CONFIG.windSpeed * (0.5 + Math.random() * 0.5) 
    };
    clouds.add(c);
}

// --- ANIMATION ---
const clock = new THREE.Clock();
let lightningTimer = 0;

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    const time = clock.getElapsedTime();
    
    controls.update();
    
    // Rain
    const pos = rainSystem.geometry.attributes.position.array;
    for(let i=0; i<rainCount; i++) {
        pos[i*3+1] -= rainVel[i] * delta; // Y
        pos[i*3] -= CONFIG.windSpeed * delta * 2; // Wind X
        
        if (pos[i*3+1] < 0) {
            pos[i*3+1] = 180 + Math.random() * 50;
            pos[i*3] = (Math.random() - 0.5) * 600 + (Math.sin(time*0.1)*50); // Drift
            pos[i*3+2] = (Math.random() - 0.5) * 600;
        }
    }
    rainSystem.geometry.attributes.position.needsUpdate = true;
    
    // Clouds
    clouds.children.forEach(c => {
        c.position.x += c.userData.speed * delta;
        if (c.position.x > 500) c.position.x = -500;
    });
    
    // Traffic
    for (let i = cars.length - 1; i >= 0; i--) {
        const car = cars[i];
        const speed = car.userData.speed * delta;
        
        if (car.userData.axis === 'x') {
            car.position.x += speed * car.userData.dir;
            if (Math.abs(car.position.x) > range + 50) {
                scene.remove(car);
                cars.splice(i, 1);
                spawnCar();
            }
        } else {
            car.position.z += speed * car.userData.dir;
            if (Math.abs(car.position.z) > range + 50) {
                scene.remove(car);
                cars.splice(i, 1);
                spawnCar();
            }
        }
    }
    
    // Lightning
    if (Math.random() > 0.99 && lightningTimer <= 0) {
        lightningTimer = 0.1 + Math.random() * 0.2;
        lightning.position.x = (Math.random()-0.5) * 500;
        lightning.position.z = (Math.random()-0.5) * 500;
        lightning.intensity = 5000 + Math.random() * 5000;
    }
    
    if (lightningTimer > 0) {
        lightningTimer -= delta;
        
        // Random flicker
        const flash = Math.random() > 0.3 ? 0.3 : 0.0;
        
        // Flash Ambient
        ambientLight.intensity = 1.5 + flash * 5;
        
        // Flash Fog
        scene.fog.color.setHSL(0.6, 0.2, 0.05 + flash * 0.1);
        scene.background.setHSL(0.6, 0.3, 0.02 + flash * 0.1);
        
    } else {
        lightning.intensity = 0;
        // Restore ambient
        ambientLight.intensity = THREE.MathUtils.lerp(ambientLight.intensity, 1.5, delta * 5);
        
        scene.fog.color.setHex(bgCol);
        scene.background.setHex(bgCol);
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
