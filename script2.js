//  HTML box where we want to draw
const container = document.getElementById('Simu');

// Three.js Scene, Camera, and Renderer
const scene = new THREE.Scene();
// scene.background = new THREE.Color(0xf0f0f0); 

const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 1000);
camera.position.set(2, 2, 2); 
camera.lookAt(0.5, 0.5, 0.5); 

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(container.clientWidth, container.clientHeight);

// Inject the 3D graphics into our HTML container
container.appendChild(renderer.domElement);

renderer.localClippingEnabled = true;

const cellWalls = [
    new THREE.Plane(new THREE.Vector3( 1,  0,  0), 0), // Left wall (X=0)
    new THREE.Plane(new THREE.Vector3(-1,  0,  0), 1), // Right wall (X=1)
    new THREE.Plane(new THREE.Vector3( 0,  1,  0), 0), // Bottom wall (Y=0)
    new THREE.Plane(new THREE.Vector3( 0, -1,  0), 1), // Top wall (Y=1)
    new THREE.Plane(new THREE.Vector3( 0,  0,  1), 0), // Back wall (Z=0)
    new THREE.Plane(new THREE.Vector3( 0,  0, -1), 1)  // Front wall (Z=1)
];

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.target.set(0.5, 0.5, 0.5);
controls.update();

const geometry = new THREE.BoxGeometry(1, 1, 1);
geometry.translate(0.5, 0.5, 0.5); 

const edges = new THREE.EdgesGeometry(geometry); // draw the edges
const material = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
const unitCell = new THREE.LineSegments(edges, material);
scene.add(unitCell);

// Ambient light 
const ambientLight = new THREE.AmbientLight(0x606060); 
scene.add(ambientLight);

// Directional light acts like the sun, giving the spheres 3D shading
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8); 
directionalLight.position.set(5, 5, 5); 
scene.add(directionalLight);

// Atom Template 
// SphereGeometry(radius, widthSegments, heightSegments)
const atomGeometry = new THREE.SphereGeometry(0.1, 32, 32); 
// MeshPhongMaterial is a special material that reflects light
const atomMaterial = new THREE.MeshPhongMaterial({ color: 0xaaaaaa }); // Grey

//Placing Atoms at the 8 Corners

for (let x = 0; x <= 1; x++) {
    for (let y = 0; y <= 1; y++) {
        for (let z = 0; z <= 1; z++) {
            const atom = new THREE.Mesh(atomGeometry, atomMaterial);
            atom.position.set(x, y, z);
            scene.add(atom);
        }
    }
}

//Draw the X, Y, and Z axes
const axesHelper = new THREE.AxesHelper(1.5);
scene.add(axesHelper);

//The Render Loop (Keeps drawing the frame over and over)
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

const positionH = new THREE.Vector3(1.2, 0, 0); 

function updateLabels() {
   
    const screenPosition = positionH.clone().project(camera);

    const x = (screenPosition.x * 0.5 + 0.5) * container.clientWidth;
    const y = (screenPosition.y * -0.5 + 0.5) * container.clientHeight;

    labelH.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
}
// Start
let currentPlane = null;
let currentDirection = null;
document.querySelector("button").addEventListener("click", function() {
    if (currentDirection) {
        scene.remove(currentDirection);
    }

    let u = parseFloat(document.getElementById("dirh").value);
    let v = parseFloat(document.getElementById("dirk").value);
    let w = parseFloat(document.getElementById("dirl").value);

    // DIRECTION LOGIC WITH ORIGIN SHIFT
    if (u !== 0 || v !== 0 || w !== 0) {
        //Start with default origin at (0, 0, 0)
        let originX = 0;
        let originY = 0;
        let originZ = 0;

        //logic: if an index is negative, shift that origin coordinate to 1
        
        if (u < 0) {
            originX = 1;
        }
        
        if (v < 0) {
            originY = 1;
        }
       
        if (w < 0) {
            originZ = 1;
        }

        // Set the new shifted origin
        const origin = new THREE.Vector3(originX, originY, originZ);
        
        const Dir = new THREE.Vector3(u, v, w);

        const length = Dir.length() - 0.1;
        Dir.normalize();

        currentDirection = new THREE.ArrowHelper(Dir, origin, length, 0x0000ff, 0.2, 0.1);
        scene.add(currentDirection);
    }

    if (currentPlane) {
        scene.remove(currentPlane);
        currentPlane.geometry.dispose();
        currentPlane.material.dispose();
    }

    let h = parseFloat(document.getElementById("planeh").value) || 0;
    let k = parseFloat(document.getElementById("planek").value) || 0;
    let l = parseFloat(document.getElementById("planel").value) || 0;

    //same logic as direction one but applied to plane positioning
    if (h !== 0 || k !== 0 || l !== 0) {
        
        const planeGeometry = new THREE.PlaneGeometry(10, 10);

        const planeMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff0000, 
            side: THREE.DoubleSide, 
            transparent: true, 
            opacity: 0.6,
            clippingPlanes: cellWalls // Erases everything outside the cube
        });

        currentPlane = new THREE.Mesh(planeGeometry, planeMaterial);
        

        const normal = new THREE.Vector3(h, k, l);
        
        // Calculate perpendicular distance from origin to the Miller plane
        const distance = 1 / Math.sqrt(h*h + k*k + l*l); 
        normal.normalize();

        const basePoint = normal.clone().multiplyScalar(distance);

        if (h < 0) basePoint.x += 1.001;// Shift slightly beyond the cell boundary to ensure it doesn't get clipped
        if (k < 0) basePoint.y += 1.001;
        if (l < 0) basePoint.z += 1.001;

        currentPlane.position.copy(basePoint);
        currentPlane.lookAt(currentPlane.position.clone().add(normal));

        scene.add(currentPlane);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

    const material = new THREE.MeshBasicMaterial({ 
        color: 0x0077ff, 
        side: THREE.DoubleSide, 
        transparent: true, 
        opacity: 0.7 
    });

    currentPlane = new THREE.Mesh(geometry, material);
    scene.add(currentPlane);
});
animate();

const bgCanvas = document.getElementById('bg-canvas');
const bgScene = new THREE.Scene();
const bgCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const bgRenderer = new THREE.WebGLRenderer({ canvas: bgCanvas, alpha: true, antialias: true });

bgRenderer.setSize(window.innerWidth, window.innerHeight);
bgRenderer.setPixelRatio(window.devicePixelRatio);

// 1,000 floating particles
const particlesGeometry = new THREE.BufferGeometry();
const particlesCount = 1000;
const posArray = new Float32Array(particlesCount * 3);

for(let i = 0; i < particlesCount * 3; i++) {
    // Spread them randomly across a large 3D space
    posArray[i] = (Math.random() - 0.5) * 15;
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

const particlesMaterial = new THREE.PointsMaterial({
    size: 0.03,
    color: 0x4a90e2,
    transparent: true,
    opacity: 0.8
});

const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
bgScene.add(particlesMesh);
bgCamera.position.z = 5;

// Animate the background 
function animateBackground() {
    requestAnimationFrame(animateBackground);
    particlesMesh.rotation.y += 0.0005; 
    particlesMesh.rotation.x += 0.0002; 
    bgRenderer.render(bgScene, bgCamera);
}
animateBackground();
