export const BOYLES_LAW_HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Boyle's Law 3D</title>
    <style>
        body { 
            margin: 0; 
            overflow: hidden; 
            background: #0a0a1a;
            /* ✅ CRITICAL FIX: Disable browser scrolling gestures so Three.js gets them */
            touch-action: none; 
        }
        /* Hide web controls, we use React Native UI */
        #controls, #info, #stats, #law { display: none; } 
    </style>
</head>
<body>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.min.js"></script>

    <script>
        // ==========================================
        // 1. GLOBAL VARIABLES (Shared State)
        // ==========================================
        let scene, camera, renderer, piston, controls;
        let particles = [];
        let forceArrows = [];
        let pistonZ = 3.0; // Range: 1.0 to 5.0
        let temperature = 300; // Range: 200 to 500
        
        // Simulation Stats
        let collisionCount = 0;
        let collisionsPerSec = 0;
        let lastCollisionUpdate = performance.now();
        let pressure = 1.0;

        // Container Constants
        const wallWidth = 8;
        const wallHeight = 6;
        const wallDepthInitial = 6;
        const backZ = -3.0;

        // ==========================================
        // 2. THE BRIDGE (Talk to React Native)
        // ==========================================
        
        // LISTEN: Receive commands from React Native Sliders
        document.addEventListener("message", function(event) {
            try {
                const data = JSON.parse(event.data);
                
                // Volume Slider (20% to 100%) -> Moves Piston
                if (data.type === 'UPDATE_VOLUME') {
                    const val = data.value; 
                    // Map 20-100 to Z 1.0-5.0
                    pistonZ = 1.0 + (val - 20) * (4.0 / 80.0);
                    
                    if(piston) piston.position.z = pistonZ;
                    updateForceArrows(); // Move arrows with piston
                }
                
                // Temp Slider (200K to 500K) -> Changes Speed
                if (data.type === 'UPDATE_TEMP') {
                    temperature = data.value;
                    updateParticleSpeed();
                }
            } catch (e) {
                // Ignore errors
            }
        });

        // SPEAK: Send Stats back to React Native UI
        setInterval(() => {
            if(window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'STATS',
                    pressure: pressure,
                    collisions: collisionsPerSec
                }));
            }
        }, 500);

        // ==========================================
        // 3. THREE.JS SIMULATION LOGIC
        // ==========================================

        function init() {
            // Setup Scene
            scene = new THREE.Scene();
            scene.background = new THREE.Color(0x0a0a1a);

            camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
            camera.position.set(10, 6, 14); // Adjusted for mobile view
            camera.lookAt(0, 0, 0);

            renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.shadowMap.enabled = true;
            document.body.appendChild(renderer.domElement);

            // ✅ CRITICAL FIX: Orbit Controls allow touch rotation
            controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;
            controls.enableZoom = true;
            controls.enablePan = false; // Disable pan to make rotation easier

            // Lights
            const ambient = new THREE.AmbientLight(0x404060);
            scene.add(ambient);
            const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
            dirLight.position.set(5, 15, 10);
            dirLight.castShadow = true;
            scene.add(dirLight);

            // Materials
            const glassMaterial = new THREE.MeshPhysicalMaterial({
                color: 0xaaccff, transparent: true, opacity: 0.2, 
                roughness: 0.1, side: THREE.DoubleSide
            });
            const pistonMaterial = new THREE.MeshPhongMaterial({
                color: 0xff5722, transparent: true, opacity: 0.5, 
                side: THREE.DoubleSide, emissive: 0x441100
            });

            // --- BUILD CONTAINER ---
            const containerGroup = new THREE.Group();

            // Walls
            const createWall = (w, h, x, y, z, rx, ry) => {
                const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), glassMaterial);
                mesh.position.set(x, y, z);
                if(rx) mesh.rotation.x = rx;
                if(ry) mesh.rotation.y = ry;
                containerGroup.add(mesh);
            };

            createWall(wallWidth, wallHeight, 0, 0, backZ, 0, Math.PI); // Back
            createWall(wallDepthInitial, wallHeight, -wallWidth/2, 0, 0, 0, Math.PI/2); // Left
            createWall(wallDepthInitial, wallHeight, wallWidth/2, 0, 0, 0, -Math.PI/2); // Right
            createWall(wallWidth, wallDepthInitial, 0, wallHeight/2, 0, -Math.PI/2, 0); // Top
            createWall(wallWidth, wallDepthInitial, 0, -wallHeight/2, 0, Math.PI/2, 0); // Bottom

            // Piston (Movable)
            piston = new THREE.Mesh(new THREE.PlaneGeometry(wallWidth, wallHeight), pistonMaterial);
            piston.position.set(0, 0, pistonZ);
            containerGroup.add(piston);

            // Edges (Wireframe)
            const boxGeo = new THREE.BoxGeometry(wallWidth, wallHeight, wallDepthInitial);
            const edges = new THREE.EdgesGeometry(boxGeo);
            const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x4fc3f7 }));
            containerGroup.add(line);

            scene.add(containerGroup);

            // Create Initial Arrows & Particles
            createForceArrows(containerGroup);
            createParticles(80); // Default count

            // Start Loop
            animate();
        }

        // --- HELPER FUNCTIONS ---

        function createForceArrows(group) {
            // Clears old arrows and adds new ones based on pistonZ
            if(forceArrows.length > 0) {
                forceArrows.forEach(a => group.remove(a));
                forceArrows = [];
            }

            const color = 0xff3333;
            // Add arrows to Piston
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    const arrow = new THREE.ArrowHelper(
                        new THREE.Vector3(0, 0, -1), // Dir
                        new THREE.Vector3(i*2.5, j*1.8, pistonZ-0.2), // Origin
                        1.2, color, 0.5, 0.3
                    );
                    group.add(arrow);
                    forceArrows.push(arrow);
                }
            }
        }

        function updateForceArrows() {
            // Update arrow positions when piston moves
            let idx = 0;
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    if (forceArrows[idx]) {
                        forceArrows[idx].position.set(i*2.5, j*1.8, pistonZ-0.2);
                        // Scale arrow based on pressure (Visual feedback)
                        const scale = Math.min(2.0, pressure * 0.5);
                        forceArrows[idx].setLength(0.8 + scale, 0.3, 0.2);
                    }
                    idx++;
                }
            }
        }

        function createParticles(count) {
            particles.forEach(p => scene.remove(p));
            particles = [];
            
            const geo = new THREE.SphereGeometry(0.18, 8, 8);
            const mat = new THREE.MeshStandardMaterial({ color: 0x4fc3f7, emissive: 0x12456b });

            for (let i = 0; i < count; i++) {
                const sphere = new THREE.Mesh(geo, mat);
                sphere.position.set(
                    (Math.random() - 0.5) * (wallWidth - 0.8),
                    (Math.random() - 0.5) * (wallHeight - 0.8),
                    (Math.random() - 0.5) * (wallDepthInitial - 0.8)
                );
                
                // Velocity based on Temp
                const baseSpeed = 0.05 * (temperature/300);
                sphere.userData = {
                    vel: new THREE.Vector3(
                        (Math.random()-0.5)*baseSpeed, 
                        (Math.random()-0.5)*baseSpeed, 
                        (Math.random()-0.5)*baseSpeed
                    )
                };
                
                scene.add(sphere);
                particles.push(sphere);
            }
        }

        function updateParticleSpeed() {
            const factor = Math.sqrt(temperature / 300); 
            // Real physics: v proportional to sqrt(T)
            particles.forEach(p => {
                const baseSpeed = 0.05 * factor;
                p.userData.vel.set(
                     (Math.random()-0.5)*baseSpeed,
                     (Math.random()-0.5)*baseSpeed,
                     (Math.random()-0.5)*baseSpeed
                );
            });
        }

        // --- ANIMATION LOOP ---
        function animate() {
            requestAnimationFrame(animate);

            // Physics Step
            let currentCollisionCount = 0;

            particles.forEach(p => {
                p.position.add(p.userData.vel);

                // Bounce X
                if (p.position.x > wallWidth/2 - 0.2 || p.position.x < -wallWidth/2 + 0.2) {
                    p.userData.vel.x *= -1;
                    currentCollisionCount++;
                }
                // Bounce Y
                if (p.position.y > wallHeight/2 - 0.2 || p.position.y < -wallHeight/2 + 0.2) {
                    p.userData.vel.y *= -1;
                    currentCollisionCount++;
                }
                // Bounce Z (Back Wall & Piston)
                if (p.position.z > pistonZ - 0.2) {
                    p.position.z = pistonZ - 0.2;
                    p.userData.vel.z *= -1;
                    currentCollisionCount++;
                }
                if (p.position.z < backZ + 0.2) {
                    p.position.z = backZ + 0.2;
                    p.userData.vel.z *= -1;
                    currentCollisionCount++;
                }
            });

            // Update Stats
            collisionCount += currentCollisionCount;
            const now = performance.now();
            if (now - lastCollisionUpdate > 1000) {
                collisionsPerSec = collisionCount;
                
                // Ideal Gas Law Approx: P = nRT / V
                const vol = (pistonZ - backZ);
                const T = temperature;
                pressure = (collisionsPerSec * T) / (vol * 10000); 
                if(pressure < 0.1) pressure = 0.5; 

                collisionCount = 0;
                lastCollisionUpdate = now;
            }

            // ✅ CRITICAL FIX: Update Controls
            if(controls) controls.update();
            renderer.render(scene, camera);
        }

        // Start
        init();

    </script>
</body>
</html>
`;
