// ai-background.js — Neural network + data-stream AI atmosphere

(function () {
    if (typeof THREE === 'undefined') return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const themeColors = { cyan: 0x00f0ff, purple: 0xb24bf3 };
    const themeSecondary = { cyan: 0x7b2cbf, purple: 0x00f0ff };

    // ─── 2D data stream canvas (flowing AI tokens) ─────────────────────────────
    function initDataStreams() {
        const canvas = document.getElementById('ai-stream-canvas');
        if (!canvas || prefersReducedMotion) return null;

        const ctx = canvas.getContext('2d');
        const chars = '01アイネural∑∆θλ0101AI<>{}[]';
        const streams = [];
        const streamCount = Math.floor(window.innerWidth / 14);

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();

        for (let i = 0; i < streamCount; i++) {
            streams.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                speed: 0.4 + Math.random() * 1.2,
                size: 10 + Math.random() * 6,
                chars: Array.from({ length: 12 + Math.floor(Math.random() * 18) }, () =>
                    chars[Math.floor(Math.random() * chars.length)]
                ),
            });
        }

        let themeHue = 180;

        const observer = new MutationObserver(() => {
            const theme = document.body.getAttribute('data-theme');
            themeHue = theme === 'purple' ? 280 : 180;
        });
        observer.observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.font = '12px "Space Grotesk", monospace';

            streams.forEach((s) => {
                s.y -= s.speed;
                if (s.y < -s.chars.length * 14) {
                    s.y = canvas.height + Math.random() * 200;
                    s.x = Math.random() * canvas.width;
                }

                s.chars.forEach((ch, i) => {
                    const y = s.y + i * 14;
                    if (y < 0 || y > canvas.height) return;
                    const alpha = Math.max(0, 1 - i / s.chars.length) * 0.35;
                    ctx.fillStyle = `hsla(${themeHue}, 90%, 65%, ${alpha})`;
                    ctx.fillText(ch, s.x, y);
                });
            });

            requestAnimationFrame(draw);
        };

        draw();
        window.addEventListener('resize', resize);
        return { resize };
    }

    // ─── 3D neural network ───────────────────────────────────────────────────────
    function initNeuralNetwork() {
        const canvas = document.getElementById('webgl-canvas');
        if (!canvas) return null;

        let targetPrimary = new THREE.Color(themeColors.cyan);
        let targetSecondary = new THREE.Color(themeSecondary.cyan);

        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x030308, 0.065);

        const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
        camera.position.z = 7;

        const renderer = new THREE.WebGLRenderer({
            canvas,
            alpha: true,
            antialias: true,
            powerPreference: 'high-performance',
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        const nodeCount = prefersReducedMotion ? 45 : 95;
        const positions = new Float32Array(nodeCount * 3);
        const nodeMeta = [];

        // Fibonacci sphere distribution — even neural node placement
        const golden = Math.PI * (3 - Math.sqrt(5));
        for (let i = 0; i < nodeCount; i++) {
            const y = 1 - (i / (nodeCount - 1)) * 2;
            const radius = Math.sqrt(1 - y * y);
            const theta = golden * i;
            const r = 2.8 + Math.random() * 1.8;
            let x = Math.cos(theta) * radius * r;
            let z = Math.sin(theta) * radius * r;
            const py = y * r;

            // Keep center clear so hero text stays readable
            const flatR = Math.sqrt(x * x + z * z);
            const minHole = 2.1;
            if (flatR < minHole) {
                const push = minHole / Math.max(flatR, 0.01);
                x *= push;
                z *= push;
            }

            positions[i * 3] = x;
            positions[i * 3 + 1] = py;
            positions[i * 3 + 2] = z;
            nodeMeta.push({
                phase: Math.random() * Math.PI * 2,
                speed: 0.3 + Math.random() * 0.5,
                baseX: x,
                baseY: py,
                baseZ: z,
            });
        }

        // Build synapse connections
        const maxDist = 2.4;
        const maxPerNode = 4;
        const linePositions = [];
        const edgePairs = [];

        for (let i = 0; i < nodeCount; i++) {
            const neighbors = [];
            for (let j = 0; j < nodeCount; j++) {
                if (i === j) continue;
                const dx = positions[i * 3] - positions[j * 3];
                const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
                const dz = positions[i * 3 + 2] - positions[j * 3 + 2];
                neighbors.push({ j, dist: Math.sqrt(dx * dx + dy * dy + dz * dz) });
            }
            neighbors.sort((a, b) => a.dist - b.dist);

            let added = 0;
            for (const { j, dist } of neighbors) {
                if (added >= maxPerNode || dist > maxDist) break;
                if (i < j) {
                    linePositions.push(
                        positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2],
                        positions[j * 3], positions[j * 3 + 1], positions[j * 3 + 2]
                    );
                    edgePairs.push({ from: i, to: j });
                    added++;
                }
            }
        }

        const lineGeo = new THREE.BufferGeometry();
        lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
        const lineMat = new THREE.LineBasicMaterial({
            color: themeColors.cyan,
            transparent: true,
            opacity: 0.22,
            blending: THREE.AdditiveBlending,
        });
        const synapses = new THREE.LineSegments(lineGeo, lineMat);

        // Neural nodes
        const nodeGeo = new THREE.BufferGeometry();
        nodeGeo.setAttribute('position', new THREE.BufferAttribute(positions.slice(), 3));
        const nodeMat = new THREE.PointsMaterial({
            size: 0.06,
            color: themeColors.cyan,
            transparent: true,
            opacity: 0.95,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true,
        });
        const nodes = new THREE.Points(nodeGeo, nodeMat);

        const networkGroup = new THREE.Group();
        networkGroup.add(synapses, nodes);
        scene.add(networkGroup);

        // Distant star field
        const starCount = prefersReducedMotion ? 400 : 1200;
        const starPos = new Float32Array(starCount * 3);
        for (let i = 0; i < starCount * 3; i++) {
            starPos[i] = (Math.random() - 0.5) * 40;
        }
        const starGeo = new THREE.BufferGeometry();
        starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
        const stars = new THREE.Points(
            starGeo,
            new THREE.PointsMaterial({
                size: 0.02,
                color: 0x4466ff,
                transparent: true,
                opacity: 0.4,
                blending: THREE.AdditiveBlending,
            })
        );
        scene.add(stars);

        // AI core — wireframe icosahedron
        const coreGroup = new THREE.Group();

        const coreGeo = new THREE.IcosahedronGeometry(0.85, 1);
        const core = new THREE.Mesh(
            coreGeo,
            new THREE.MeshBasicMaterial({
                color: themeColors.cyan,
                wireframe: true,
                transparent: true,
                opacity: 0.5,
            })
        );
        coreGroup.add(core);

        const coreGlow = new THREE.Mesh(
            new THREE.IcosahedronGeometry(0.5, 0),
            new THREE.MeshBasicMaterial({
                color: themeColors.cyan,
                transparent: true,
                opacity: 0.12,
                blending: THREE.AdditiveBlending,
            })
        );
        coreGroup.add(coreGlow);

        const coreRing = new THREE.Mesh(
            new THREE.TorusGeometry(1.4, 0.008, 8, 64),
            new THREE.MeshBasicMaterial({
                color: themeColors.cyan,
                transparent: true,
                opacity: 0.3,
                blending: THREE.AdditiveBlending,
            })
        );
        coreRing.rotation.x = Math.PI / 2;
        coreGroup.add(coreRing);

        const coreRing2 = coreRing.clone();
        coreRing2.scale.set(1.35, 1.35, 1.35);
        coreRing2.rotation.x = Math.PI / 3;
        coreRing2.rotation.z = Math.PI / 4;
        coreGroup.add(coreRing2);

        networkGroup.add(coreGroup);

        const layoutNetwork = () => {
            const wide = window.innerWidth > 900;
            const offsetX = wide ? 2.2 : 0.6;
            const offsetY = wide ? -0.8 : -1.2;
            networkGroup.position.set(offsetX, offsetY, 0);
            coreGroup.position.set(wide ? 0.4 : 0, 0, 0);
            camera.position.x = wide ? -0.35 : 0;
        };
        layoutNetwork();
        window.addEventListener('resize', layoutNetwork);

        // Data packets traveling along synapses
        const packetCount = prefersReducedMotion ? 12 : 40;
        const packets = [];
        const packetGeo = new THREE.BufferGeometry();
        const packetPos = new Float32Array(packetCount * 3);
        packetGeo.setAttribute('position', new THREE.BufferAttribute(packetPos, 3));

        for (let i = 0; i < packetCount; i++) {
            const edge = edgePairs[Math.floor(Math.random() * edgePairs.length)];
            if (!edge) continue;
            packets.push({
                from: edge.from,
                to: edge.to,
                t: Math.random(),
                speed: 0.15 + Math.random() * 0.35,
            });
        }

        const packetMesh = new THREE.Points(
            packetGeo,
            new THREE.PointsMaterial({
                size: 0.1,
                color: 0xffffff,
                transparent: true,
                opacity: 0.9,
                blending: THREE.AdditiveBlending,
            })
        );
        networkGroup.add(packetMesh);

        // Theme sync
        const themeObserver = new MutationObserver(() => {
            const theme = document.body.getAttribute('data-theme') || 'cyan';
            targetPrimary.set(themeColors[theme] || themeColors.cyan);
            targetSecondary.set(themeSecondary[theme] || themeSecondary.cyan);
        });
        themeObserver.observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });

        let mouseX = 0;
        let mouseY = 0;
        let scrollProgress = 0;

        document.addEventListener('mousemove', (e) => {
            mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
            mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
        });

        if (typeof ScrollTrigger !== 'undefined') {
            ScrollTrigger.create({
                trigger: document.body,
                start: 'top top',
                end: 'bottom bottom',
                onUpdate: (self) => {
                    scrollProgress = self.progress;
                },
            });
        }

        const clock = new THREE.Clock();

        const tick = () => {
            const t = clock.getElapsedTime();
            const posAttr = nodeGeo.attributes.position.array;

            // Breathing neural nodes
            for (let i = 0; i < nodeCount; i++) {
                const m = nodeMeta[i];
                const pulse = Math.sin(t * m.speed + m.phase) * 0.08;
                posAttr[i * 3] = m.baseX + m.baseX * pulse;
                posAttr[i * 3 + 1] = m.baseY + m.baseY * pulse;
                posAttr[i * 3 + 2] = m.baseZ + m.baseZ * pulse;
            }
            nodeGeo.attributes.position.needsUpdate = true;

            // Update synapse lines from node positions
            const lineArr = lineGeo.attributes.position.array;
            edgePairs.forEach(({ from, to }, e) => {
                const li = e * 6;
                lineArr[li] = posAttr[from * 3];
                lineArr[li + 1] = posAttr[from * 3 + 1];
                lineArr[li + 2] = posAttr[from * 3 + 2];
                lineArr[li + 3] = posAttr[to * 3];
                lineArr[li + 4] = posAttr[to * 3 + 1];
                lineArr[li + 5] = posAttr[to * 3 + 2];
            });
            lineGeo.attributes.position.needsUpdate = true;

            // Data packets along edges
            const pktArr = packetGeo.attributes.position.array;
            packets.forEach((p, idx) => {
                p.t += p.speed * 0.008;
                if (p.t > 1) {
                    p.t = 0;
                    const edge = edgePairs[Math.floor(Math.random() * edgePairs.length)];
                    if (edge) {
                        p.from = edge.from;
                        p.to = edge.to;
                    }
                }
                const fi = p.from * 3;
                const ti = p.to * 3;
                const ease = p.t * p.t * (3 - 2 * p.t);
                pktArr[idx * 3] = posAttr[fi] + (posAttr[ti] - posAttr[fi]) * ease;
                pktArr[idx * 3 + 1] = posAttr[fi + 1] + (posAttr[ti + 1] - posAttr[fi + 1]) * ease;
                pktArr[idx * 3 + 2] = posAttr[fi + 2] + (posAttr[ti + 2] - posAttr[fi + 2]) * ease;
            });
            packetGeo.attributes.position.needsUpdate = true;

            // Color lerp
            nodeMat.color.lerp(targetPrimary, 0.04);
            lineMat.color.lerp(targetSecondary, 0.03);
            core.material.color.lerp(targetPrimary, 0.04);
            coreGlow.material.color.lerp(targetPrimary, 0.04);
            coreRing.material.color.lerp(targetSecondary, 0.03);
            coreRing2.material.color.lerp(targetPrimary, 0.03);
            lineMat.opacity = 0.15 + Math.sin(t * 0.8) * 0.06 + scrollProgress * 0.08;

            // Rotation & parallax
            const rotSpeed = prefersReducedMotion ? 0.03 : 0.08;
            networkGroup.rotation.y = t * rotSpeed + scrollProgress * 0.6;
            networkGroup.rotation.x = Math.sin(t * 0.15) * 0.12;
            stars.rotation.y = t * 0.01;

            core.rotation.x = t * 0.4;
            core.rotation.y = t * 0.55;
            coreGlow.rotation.copy(core.rotation);
            coreRing.rotation.z = t * 0.3;
            coreRing2.rotation.z = -t * 0.2;
            core.scale.setScalar(1 + Math.sin(t * 1.5) * 0.06);
            coreGlow.scale.setScalar(1.2 + Math.sin(t * 2) * 0.15);

            const baseCamX = window.innerWidth > 900 ? -0.35 : 0;
            const targetCamX = baseCamX + mouseX * 0.25;
            camera.position.x += (targetCamX - camera.position.x) * 0.03;
            camera.position.y += (-mouseY * 0.4 - camera.position.y) * 0.03;
            camera.lookAt(0, 0, 0);

            renderer.render(scene, camera);
            requestAnimationFrame(tick);
        };

        tick();

        const onResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        };
        window.addEventListener('resize', onResize);

        return { onResize };
    }

    initDataStreams();
    initNeuralNetwork();
})();
