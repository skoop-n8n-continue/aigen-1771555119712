// Initialize Three.js Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a2e); // Dark blue-ish background
scene.fog = new THREE.FogExp2(0x1a1a2e, 0.015); // Fog for depth

// Camera Setup
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
// Position camera at "eye level" (y=2) but slightly offset from center for OrbitControls to work
camera.position.set(0.1, 2, 0); 

// Renderer Setup
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// Controls
// To simulate "looking around" from a fixed point, we use OrbitControls
// orbiting around a target very close to the camera.
// By reversing rotate speed, dragging feels like rotating the head/camera.
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enableZoom = false;
controls.enablePan = false;
controls.rotateSpeed = -0.5; // Invert control for "look" feel
controls.target.set(0, 2, 0); // Target is "eye level" center
controls.update();

// Lighting
// Ambient light for base visibility
const ambientLight = new THREE.AmbientLight(0x404040, 2); // Soft white light
scene.add(ambientLight);

// Directional light (Sun/Moon) - Dim for rainy weather
const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
dirLight.position.set(-1, 1, 0);
scene.add(dirLight);

// Hemisphere light for sky/ground color variance
const hemiLight = new THREE.HemisphereLight(0x1a1a2e, 0x000000, 0.6);
scene.add(hemiLight);

// --- CITY GENERATION ---

// Ground
const planeGeometry = new THREE.PlaneGeometry(2000, 2000);
const planeMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x111111,
    roughness: 0.8,
    metalness: 0.2
});
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2;
scene.add(plane);

// Buildings
const buildingGeometry = new THREE.BoxGeometry(1, 1, 1);
// Move pivot to bottom of box so scaling works upwards
buildingGeometry.translate(0, 0.5, 0);

const buildingMaterial = new THREE.MeshStandardMaterial({
    color: 0x2a2a35,
    roughness: 0.6,
    metalness: 0.1,
    flatShading: true
});

const buildingCount = 400;
const minRadius = 15; // Clear area around camera
const maxRadius = 300;

for (let i = 0; i < buildingCount; i++) {
    const mesh = new THREE.Mesh(buildingGeometry, buildingMaterial);
    
    // Random position in polar coordinates
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.sqrt(Math.random()) * (maxRadius - minRadius) + minRadius;
    
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    
    // Random dimensions
    const width = Math.random() * 5 + 2;
    const depth = Math.random() * 5 + 2;
    const height = Math.random() * 40 + 5; // Height 5 to 45
    
    mesh.position.set(x, 0, z);
    mesh.scale.set(width, height, depth);
    
    // Random rotation
    mesh.rotation.y = Math.random() * Math.PI;
    
    scene.add(mesh);
    
    // Add simple "windows" (emissive dots)
    if (Math.random() > 0.3) {
        const windowGeo = new THREE.PlaneGeometry(0.5, 0.5);
        const windowMat = new THREE.MeshBasicMaterial({ color: 0xffffaa, side: THREE.DoubleSide });
        
        // Add a few windows per building
        const floors = Math.floor(height / 3);
        for(let j=1; j<floors; j++) {
            if(Math.random() > 0.4) continue; // Sparse windows
            
            const win = new THREE.Mesh(windowGeo, windowMat);
            // Position on one face
            // Simplified: Just put some random lights floating near building surface
            // Better: Add them as children, but scaling parent scales children.
            // Let's just place them in world space for simplicity or skip for now to save complexity.
        }
    }
}

// Street Lights (Simple spheres)
for (let i = 0; i < 20; i++) {
    const light = new THREE.PointLight(0xffaa00, 1, 30);
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * 50 + 10;
    light.position.set(Math.cos(angle) * radius, 4, Math.sin(angle) * radius);
    scene.add(light);
    
    // Pole
    const poleGeo = new THREE.CylinderGeometry(0.1, 0.1, 4);
    const poleMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.set(light.position.x, 2, light.position.z);
    scene.add(pole);
}


// --- WEATHER SYSTEMS ---

// Rain
const rainCount = 15000;
const rainGeometry = new THREE.BufferGeometry();
const rainPositions = new Float32Array(rainCount * 3);
const rainVelocities = [];

for (let i = 0; i < rainCount; i++) {
    rainPositions[i * 3] = (Math.random() - 0.5) * 400; // x
    rainPositions[i * 3 + 1] = Math.random() * 200;     // y
    rainPositions[i * 3 + 2] = (Math.random() - 0.5) * 400; // z
    rainVelocities.push(0.5 + Math.random() * 0.5); // speed
}

rainGeometry.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));

const rainMaterial = new THREE.PointsMaterial({
    color: 0xaaaaaa,
    size: 0.2,
    transparent: true,
    opacity: 0.6
});

const rainSystem = new THREE.Points(rainGeometry, rainMaterial);
scene.add(rainSystem);

// Clouds
const cloudGroup = new THREE.Group();
scene.add(cloudGroup);

const cloudGeo = new THREE.IcosahedronGeometry(1, 0);
const cloudMat = new THREE.MeshStandardMaterial({
    color: 0x888899,
    flatShading: true,
    opacity: 0.6,
    transparent: true
});

function createCloud(x, z) {
    const cloud = new THREE.Group();
    const blobs = Math.floor(Math.random() * 5) + 3;
    
    for(let i=0; i<blobs; i++) {
        const mesh = new THREE.Mesh(cloudGeo, cloudMat);
        mesh.position.set(
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 5,
            (Math.random() - 0.5) * 10
        );
        mesh.scale.setScalar(Math.random() * 5 + 2);
        cloud.add(mesh);
    }
    
    cloud.position.set(x, Math.random() * 20 + 60, z); // Height 60-80
    return cloud;
}

// Generate clouds
for(let i=0; i<30; i++) {
    const x = (Math.random() - 0.5) * 600;
    const z = (Math.random() - 0.5) * 600;
    cloudGroup.add(createCloud(x, z));
}


// --- ANIMATION LOOP ---

const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    
    const delta = clock.getDelta();
    const time = clock.getElapsedTime();
    
    controls.update();
    
    // Animate Rain
    const positions = rainSystem.geometry.attributes.position.array;
    for (let i = 0; i < rainCount; i++) {
        // Update Y
        positions[i * 3 + 1] -= rainVelocities[i];
        
        // Reset if below ground
        if (positions[i * 3 + 1] < 0) {
            positions[i * 3 + 1] = 200;
        }
    }
    rainSystem.geometry.attributes.position.needsUpdate = true;
    
    // Animate Clouds (Slow drift)
    cloudGroup.children.forEach(cloud => {
        cloud.position.x += 0.5 * delta;
        if(cloud.position.x > 300) cloud.position.x = -300;
    });
    
    // Subtle lightning effect (random flash)
    if (Math.random() > 0.99) {
        scene.background = new THREE.Color(0x333344);
        setTimeout(() => {
            scene.background = new THREE.Color(0x1a1a2e);
        }, 50);
    }
    
    renderer.render(scene, camera);
}

// Handle Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
