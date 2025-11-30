// Three.js Version - Voiceprint Rose
// 使用 WebGL 硬件加速，提升渲染性能

let scene, camera, renderer;
let width, height;

// Three.js objects storage
const threeObjects = {
    baseCircles: [], // 基础圆圈线条
    baseSegments: [], // 基础分段线条
    voiceprintObjects: [], // 声纹对象
    centerPoint: null
};

// Initial radius values (reference point for randomization)
const initialRadii = [0.15, 0.22, 0.31, 0.43]; // Circle 1, 2, 3, 4

// Parameters configuration (与原版相同)
const params = {
    innerCircles: [
        { radius: 0.15, offsetX: 0.02, offsetY: -0.02, color: null, waveHeight: 0.5 },
        { radius: 0.22, offsetX: 0.045, offsetY: 0.025, color: null, waveHeight: 0.5 },
        { radius: 0.31, offsetX: -0.035, offsetY: 0.025, color: null, waveHeight: 1.0 },
        { radius: 0.43, offsetX: 0.05, offsetY: 0.04, color: null, waveHeight: 1.0 }
    ],
    outerCircle5: {
        radius: 0.33,
        segmentCount: 4,
        segmentLength: 0.0,
        selfRotation: 0.12,
        globalRotation: 0,
        segmentColors: [],
        waveHeight: 2.0
    },
    outerCircle6: {
        radius: 0.44,
        segmentCount: 4,
        segmentLength: 0.0,
        selfRotation: 0.12,
        globalRotation: 0.3927,
        segmentColors: [],
        waveHeight: 2.0
    }
};

// Base configuration
const config = {
    maxRadius: 300,
    centerX: 0,
    centerY: 0,
};

// Audio recording configuration
let audioContext = null;
let analyser = null;
let microphone = null;
let dataArray = null;
let mediaStream = null;
let isRecording = false;
let isSimulating = false;
let animationFrameId = null;
let micPermissionGranted = false;

// Voiceprint data storage
const voiceprintData = {
    rings: [],
    globalSampleIndex: 0,
    maxRings: 6
};

// Layer visibility controls
const layerVisibility = {
    showBaseLayer: true,
    showVoiceprintLayer: true
};

// Voiceprint style and settings
const voiceprintSettings = {
    style: 'spectrum-bars',
    showRawWaveforms: true,
    baseHeightRatio: 0.15,
    colorMode: 'romantic-classic'
};

// Color Palettes Configuration (与原版相同)
const PALETTES = {
    'romantic-classic': {
        type: 'romantic',
        rings: ['#8B0000', '#DC143C', '#FF1493', '#FF69B4', '#FFB6C1', '#FFD700']
    },
    'romantic-ocean': {
        type: 'romantic',
        rings: ['#00008B', '#0000CD', '#4169E1', '#00BFFF', '#87CEEB', '#E0FFFF']
    },
    'romantic-forest': {
        type: 'romantic',
        rings: ['#006400', '#008000', '#228B22', '#32CD32', '#90EE90', '#FFD700']
    },
    'romantic-sunset': {
        type: 'romantic',
        rings: ['#4B0082', '#800080', '#8B008B', '#FF00FF', '#FF4500', '#FFD700']
    },
    'gradient-pinkgold': {
        type: 'gradient',
        start: { h: 330, s: 100, l: 80 },
        end: { h: 50, s: 100, l: 60 }
    },
    'gradient-fire': {
        type: 'gradient',
        start: { h: 0, s: 100, l: 50 },
        end: { h: 60, s: 100, l: 60 }
    },
    'gradient-cool': {
        type: 'gradient',
        start: { h: 270, s: 100, l: 60 },
        end: { h: 180, s: 100, l: 60 }
    },
    'gradient-neon': {
        type: 'gradient',
        start: { h: 200, s: 100, l: 60 },
        end: { h: 300, s: 100, l: 60 }
    },
    'monochrome-red': {
        type: 'monochrome',
        h: 345, s: 90, l: 60
    },
    'monochrome-blue': {
        type: 'monochrome',
        h: 220, s: 90, l: 60
    },
    'monochrome-gold': {
        type: 'monochrome',
        h: 45, s: 90, l: 60
    },
    'monochrome-purple': {
        type: 'monochrome',
        h: 270, s: 90, l: 60
    }
};

// FPS counter
const fps = {
    value: 0,
    frameCount: 0,
    lastTime: performance.now()
};

// Helper: Convert hex color to Three.js Color
function hexToColor(hex) {
    return new THREE.Color(hex);
}

// Helper: HSL to Three.js Color
function hslToColor(h, s, l) {
    return new THREE.Color().setHSL(h / 360, s / 100, l / 100);
}

// Generate random rainbow color
function getRandomRainbowColor() {
    const hue = Math.random() * 360;
    return `hsl(${hue}, 85%, 60%)`;
}

// Get gradient color based on base color and position
function getGradientColor(baseColor, position) {
    const match = baseColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    if (!match) return baseColor;

    const h = parseInt(match[1]);
    const s = parseInt(match[2]);
    const l = parseInt(match[3]);

    const newL = Math.min(95, l * (0.7 + position * 0.6));
    const newS = Math.min(100, s * (1 + position * 0.2));

    return `hsl(${h}, ${newS}%, ${newL}%)`;
}

// Initialize random colors
function initializeColors() {
    params.innerCircles.forEach(circle => {
        circle.color = getRandomRainbowColor();
    });

    params.outerCircle5.segmentColors = [];
    for (let i = 0; i < params.outerCircle5.segmentCount; i++) {
        params.outerCircle5.segmentColors.push(getRandomRainbowColor());
    }

    params.outerCircle6.segmentColors = [];
    for (let i = 0; i < params.outerCircle6.segmentCount; i++) {
        params.outerCircle6.segmentColors.push(getRandomRainbowColor());
    }
}

// Get base layer color
function getBaseLayerColor(ringIndex) {
    const modeKey = voiceprintSettings.colorMode;
    const palette = PALETTES[modeKey] || PALETTES['romantic-classic'];
    const type = palette.type;

    if (type === 'romantic') {
        const rings = palette.rings;
        return rings[ringIndex % rings.length];
    } else if (type === 'gradient') {
        const start = palette.start;
        return `hsl(${start.h}, ${start.s}%, ${start.l}%)`;
    } else if (type === 'monochrome') {
        return `hsl(${palette.h}, ${palette.s}%, ${palette.l}%)`;
    }
    return 'white';
}

// Get amplitude color
function getAmplitudeColor(amplitude, ringIndex = 0) {
    const modeKey = voiceprintSettings.colorMode;
    const palette = PALETTES[modeKey] || PALETTES['romantic-classic'];
    const type = palette.type;

    if (type === 'romantic') {
        const rings = palette.rings;
        return rings[ringIndex % rings.length];
    } else if (type === 'gradient') {
        const start = palette.start;
        const end = palette.end;
        const t = amplitude;
        const h = start.h + (end.h - start.h) * t;
        const s = start.s + (end.s - start.s) * t;
        const l = start.l + (end.l - start.l) * t;
        return `hsl(${h}, ${s}%, ${l}%)`;
    } else if (type === 'monochrome') {
        const base = palette;
        const l = base.l + amplitude * 30;
        return `hsl(${base.h}, ${base.s}%, ${Math.min(100, l)}%)`;
    }
    return 'white';
}

// Convert screen coordinates to Three.js world coordinates
function screenToWorld(x, y) {
    const vector = new THREE.Vector3();
    vector.set(
        (x / width) * 2 - 1,
        -(y / height) * 2 + 1,
        0
    );
    vector.unproject(camera);
    return vector;
}

// Initialize Three.js scene
function initThreeJS() {
    const container = document.getElementById('canvas-container');
    if (!container) {
        console.error('Canvas container not found!');
        return;
    }

    width = window.innerWidth;
    height = window.innerHeight;

    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    // Camera (Orthographic for 2D rendering)
    // 根据宽高比正确设置相机，保持圆形不变形
    const aspect = width / height;
    let left, right, top, bottom;
    
    if (width > height) {
        // 宽屏：以高度为基准，左右边界扩展
        const viewHeight = height;
        const viewWidth = viewHeight * aspect;
        left = -viewWidth / 2;
        right = viewWidth / 2;
        top = viewHeight / 2;
        bottom = -viewHeight / 2;
    } else {
        // 高屏：以宽度为基准，上下边界扩展
        const viewWidth = width;
        const viewHeight = viewWidth / aspect;
        left = -viewWidth / 2;
        right = viewWidth / 2;
        top = viewHeight / 2;
        bottom = -viewHeight / 2;
    }
    
    camera = new THREE.OrthographicCamera(left, right, top, bottom, 1, 1000);
    camera.position.z = 100;
    camera.lookAt(0, 0, 0);

    // Renderer
    renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: false,
        powerPreference: "high-performance"
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // 限制像素比，提升性能
    renderer.setClearColor(0x000000, 1);
    container.appendChild(renderer.domElement);

    // Update config
    config.centerX = 0;
    config.centerY = 0;
    config.maxRadius = Math.min(width, height) * 0.4;

    // Create base layer objects
    createBaseLayer();

    // Create center point
    const centerGeometry = new THREE.CircleGeometry(3, 16);
    const centerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    threeObjects.centerPoint = new THREE.Mesh(centerGeometry, centerMaterial);
    threeObjects.centerPoint.position.set(0, 0, 0);
    scene.add(threeObjects.centerPoint);

    // Start render loop
    animate();
}

// Create base layer (circles and segments)
function createBaseLayer() {
    // Clear existing base objects
    threeObjects.baseCircles.forEach(obj => scene.remove(obj));
    threeObjects.baseSegments.forEach(obj => scene.remove(obj));
    threeObjects.baseCircles = [];
    threeObjects.baseSegments = [];

    if (!layerVisibility.showBaseLayer) return;

    // Create inner circles
    const fourCircles = calculateFourCircles();
    fourCircles.forEach((circle, index) => {
        const color = getBaseLayerColor(index);
        const geometry = new THREE.BufferGeometry();
        const segments = 240; // 增加段数，让线条更平滑
        const positions = [];

        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const x = circle.cx + Math.cos(angle) * circle.radius;
            const y = -(circle.cy + Math.sin(angle) * circle.radius); // 翻转Y轴
            positions.push(x, y, 0);
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        // 使用 LineLoop 确保闭合，并移除不支持的 linewidth
        const material = new THREE.LineBasicMaterial({ 
            color: hexToColor(color),
            linecap: 'round',
            linejoin: 'round'
        });
        const line = new THREE.LineLoop(geometry, material); // 使用 LineLoop 确保闭合
        scene.add(line);
        threeObjects.baseCircles.push(line);
    });

    // Create outer segmented circles
    createSegmentedCircle(5, params.outerCircle5);
    createSegmentedCircle(6, params.outerCircle6);
}

// Create segmented circle
function createSegmentedCircle(circleNumber, circleParams) {
    const numSegments = circleParams.segmentCount;
    const baseRadius = config.maxRadius * circleParams.radius;

    const initialUnit = 1.0 / numSegments;
    const actualSegmentLength = initialUnit * (1 + circleParams.segmentLength);
    const segmentAngleSize = actualSegmentLength * Math.PI * 2;
    const gapSize = (Math.PI * 2 - segmentAngleSize * numSegments) / numSegments;

    let currentAngle = circleParams.globalRotation;

    for (let i = 0; i < numSegments; i++) {
        const segmentColor = getBaseLayerColor(4 + (circleNumber - 5));
        const segmentMidAngle = currentAngle + segmentAngleSize * 0.5;
        const centerX = config.centerX + Math.cos(segmentMidAngle) * baseRadius;
        const centerY = config.centerY + Math.sin(segmentMidAngle) * baseRadius; // 这里不需要翻转，因为后面会翻转

        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const segments = 120; // 增加段数，让线条更平滑

        for (let j = 0; j <= segments; j++) {
            const t = j / segments;
            const originalAngle = currentAngle + t * segmentAngleSize;
            const originalX = config.centerX + Math.cos(originalAngle) * baseRadius;
            const originalY = config.centerY + Math.sin(originalAngle) * baseRadius;

            const dx = originalX - centerX;
            const dy = originalY - centerY;
            const cosRot = Math.cos(circleParams.selfRotation);
            const sinRot = Math.sin(circleParams.selfRotation);
            const rotatedX = dx * cosRot - dy * sinRot;
            const rotatedY = dx * sinRot + dy * cosRot;

            positions.push(centerX + rotatedX, -(centerY + rotatedY), 0); // 翻转Y轴
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        const material = new THREE.LineBasicMaterial({ 
            color: hexToColor(segmentColor),
            linecap: 'round',
            linejoin: 'round'
        });
        const line = new THREE.Line(geometry, material);
        scene.add(line);
        threeObjects.baseSegments.push(line);

        currentAngle += segmentAngleSize + gapSize;
    }
}

// Calculate positions for 4 nested circles
function calculateFourCircles() {
    const maxRadius = config.maxRadius * 0.5;
    const circles = [];

    params.innerCircles.forEach((circleParams) => {
        const radius = maxRadius * circleParams.radius;
        const offsetX = maxRadius * circleParams.offsetX;
        const offsetY = maxRadius * circleParams.offsetY;

        circles.push({
            cx: config.centerX + offsetX,
            cy: config.centerY + offsetY,
            radius: radius
        });
    });

    return circles;
}

// Update voiceprint visualization
function updateVoiceprint() {
    // Clear existing voiceprint objects
    threeObjects.voiceprintObjects.forEach(obj => scene.remove(obj));
    threeObjects.voiceprintObjects = [];

    if (!layerVisibility.showVoiceprintLayer || voiceprintData.rings.length === 0) return;

    voiceprintData.rings.forEach((ring, ringIndex) => {
        const maxSamples = ring.sampleIndex;
        if (maxSamples > 0) {
            if (ring.type === 'circle') {
                createCircleVoiceprint(ring, ringIndex, maxSamples);
            } else if (ring.type === 'segmented') {
                createSegmentedVoiceprint(ring, ringIndex, maxSamples);
            }
        }
    });
}

// Create circle voiceprint
function createCircleVoiceprint(ring, ringIndex, maxSamples) {
    const style = voiceprintSettings.style;
    const fourCircles = calculateFourCircles();
    if (ringIndex >= fourCircles.length) return;

    const liveCircle = fourCircles[ringIndex];
    const centerX = liveCircle.cx;
    const centerY = liveCircle.cy;
    const baseRadius = liveCircle.radius;
    const waveHeightScale = params.innerCircles[ringIndex].waveHeight || 1.0;
    const baseHeightRatio = voiceprintSettings.baseHeightRatio;
    const voiceHeightRatio = 1.0 - baseHeightRatio;
    const baseHeight = 60 * baseHeightRatio;
    const voiceHeight = 60 * voiceHeightRatio;

    if (style === 'spectrum-bars') {
        // Use instanced rendering for better performance
        const baseColor = getBaseLayerColor(ringIndex);
        const circumference = 2 * Math.PI * baseRadius;
        const unitWidth = circumference / maxSamples;
        const barWidth = Math.max(0.5, unitWidth * 0.3);

        for (let i = 0; i < maxSamples; i++) {
            const amplitude = ring.samples[i] || 0;
            const angle = (i / ring.sampleCount) * Math.PI * 2;
            const barLength = (baseHeight + amplitude * voiceHeight) * waveHeightScale;

            const cosA = Math.cos(angle);
            const sinA = Math.sin(angle);
            const x1 = centerX + cosA * baseRadius;
            const y1 = -(centerY + sinA * baseRadius); // 翻转Y轴
            const x2 = centerX + cosA * (baseRadius + barLength);
            const y2 = -(centerY + sinA * (baseRadius + barLength)); // 翻转Y轴

            const perpAngle = angle + Math.PI / 2;
            const dx = Math.cos(perpAngle) * barWidth * 0.5;
            const dy = Math.sin(perpAngle) * barWidth * 0.5;

            // Create bar geometry
            const geometry = new THREE.BufferGeometry();
            const positions = new Float32Array([
                x1 - dx, y1 - dy, 0,
                x1 + dx, y1 + dy, 0,
                x2 + dx, y2 + dy, 0,
                x2 - dx, y2 - dy, 0
            ]);
            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geometry.setIndex([0, 1, 2, 0, 2, 3]);

            // 始终使用 getAmplitudeColor 来确保配色模式正确应用
            // 即使振幅很小，也应该显示正确的颜色（特别是 gradient 和 monochrome 模式）
            const color = getAmplitudeColor(amplitude, ringIndex);
            const material = new THREE.MeshBasicMaterial({ 
                color: hexToColor(color),
                transparent: true,
                opacity: amplitude > 0.05 ? 0.9 : 0.5 // 低振幅时降低透明度
            });
            const mesh = new THREE.Mesh(geometry, material);
            scene.add(mesh);
            threeObjects.voiceprintObjects.push(mesh);
        }
    } else if (style === 'gradient-wave') {
        // Create line geometry for waveform
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const colors = [];
        const baseVariation = 50 * baseHeightRatio;
        const voiceVariation = 50 * voiceHeightRatio;

        for (let i = 0; i < maxSamples; i++) {
            const amplitude = ring.samples[i] || 0;
            const angle = (i / ring.sampleCount) * Math.PI * 2;
            const variation = (baseVariation + amplitude * voiceVariation) * waveHeightScale;
            const r = baseRadius + variation;
            const x = centerX + Math.cos(angle) * r;
            const y = -(centerY + Math.sin(angle) * r); // 翻转Y轴

            positions.push(x, y, 0);
            const color = getAmplitudeColor(amplitude, ringIndex);
            const threeColor = hexToColor(color);
            colors.push(threeColor.r, threeColor.g, threeColor.b);
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.setDrawRange(0, maxSamples);

        const material = new THREE.LineBasicMaterial({ 
            vertexColors: true,
            linecap: 'round',
            linejoin: 'round'
        });
        const line = new THREE.Line(geometry, material);
        scene.add(line);
        threeObjects.voiceprintObjects.push(line);
    } else if (style === 'glow-particles') {
        const particleCount = Math.min(80, maxSamples);
        const step = Math.floor(maxSamples / particleCount);
        const baseVar = 45 * baseHeightRatio;
        const voiceVar = 45 * voiceHeightRatio;

        for (let i = 0; i < particleCount; i++) {
            const idx = i * step;
            const amplitude = ring.samples[idx] || 0;
            if (amplitude < 0.1) continue;

            const angle = (idx / ring.sampleCount) * Math.PI * 2;
            const variation = (baseVar + amplitude * voiceVar) * waveHeightScale;
            const r = baseRadius + variation;
            const x = centerX + Math.cos(angle) * r;
            const y = -(centerY + Math.sin(angle) * r); // 翻转Y轴

            const geometry = new THREE.CircleGeometry(2 + amplitude * 4, 8);
            const color = getAmplitudeColor(amplitude, ringIndex);
            const material = new THREE.MeshBasicMaterial({ 
                color: hexToColor(color),
                transparent: true,
                opacity: 0.8
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(x, y, 0);
            scene.add(mesh);
            threeObjects.voiceprintObjects.push(mesh);
        }
    }
}

// Create segmented voiceprint
function createSegmentedVoiceprint(ring, ringIndex, maxSamples) {
    const style = voiceprintSettings.style;
    let circleParams;
    if (ringIndex === 4) circleParams = params.outerCircle5;
    else if (ringIndex === 5) circleParams = params.outerCircle6;
    else return;

    const numSegments = circleParams.segmentCount;
    const baseRadius = config.maxRadius * circleParams.radius;
    const initialUnit = 1.0 / numSegments;
    const actualSegmentLength = initialUnit * (1 + circleParams.segmentLength);
    const segmentAngleSize = actualSegmentLength * Math.PI * 2;
    const gapSize = (Math.PI * 2 - segmentAngleSize * numSegments) / numSegments;
    const maxSamplesPerSegment = Math.floor(ring.sampleCount / numSegments);
    const actualSamplesToDraw = Math.min(maxSamples, maxSamplesPerSegment);
    const cosRot = Math.cos(circleParams.selfRotation);
    const sinRot = Math.sin(circleParams.selfRotation);
    const waveHeightScale = circleParams.waveHeight || 1.0;
    const baseHeightRatio = voiceprintSettings.baseHeightRatio;
    const voiceHeightRatio = 1.0 - baseHeightRatio;
    const baseHeight = 60 * baseHeightRatio;
    const voiceHeight = 60 * voiceHeightRatio;

    // 所有样式统一使用柱状图绘制（简化版本，确保所有样式都能显示）
    const totalArcAngle = segmentAngleSize * numSegments;
    const effectiveCircumference = totalArcAngle * baseRadius;
    const unitWidth = effectiveCircumference / maxSamples;
    const barWidth = Math.max(0.5, unitWidth * 0.3);

    for (let posInSegment = 0; posInSegment < actualSamplesToDraw; posInSegment++) {
        const sampleIdx = posInSegment;
        const amplitude = ring.samples[sampleIdx] || 0;
        const t = posInSegment / maxSamplesPerSegment;

        for (let segmentIdx = 0; segmentIdx < numSegments; segmentIdx++) {
            const segmentStartAngle = circleParams.globalRotation + segmentIdx * (segmentAngleSize + gapSize);
            const segmentMidAngle = segmentStartAngle + segmentAngleSize * 0.5;
            const segCenterX = config.centerX + Math.cos(segmentMidAngle) * baseRadius;
            const segCenterY = config.centerY + Math.sin(segmentMidAngle) * baseRadius;

            const angle = segmentStartAngle + t * segmentAngleSize;
            const cosA = Math.cos(angle);
            const sinA = Math.sin(angle);
            const barLength = (baseHeight + amplitude * voiceHeight) * waveHeightScale;

            const ox1 = config.centerX + cosA * baseRadius;
            const oy1 = config.centerY + sinA * baseRadius;
            const ox2 = config.centerX + cosA * (baseRadius + barLength);
            const oy2 = config.centerY + sinA * (baseRadius + barLength);

            // 应用自旋转
            const dx1 = ox1 - segCenterX;
            const dy1 = oy1 - segCenterY;
            const rx1 = dx1 * cosRot - dy1 * sinRot;
            const ry1 = dx1 * sinRot + dy1 * cosRot;
            const finalX1 = segCenterX + rx1;
            const finalY1 = -(segCenterY + ry1); // 翻转Y轴

            const dx2 = ox2 - segCenterX;
            const dy2 = oy2 - segCenterY;
            const rx2 = dx2 * cosRot - dy2 * sinRot;
            const ry2 = dx2 * sinRot + dy2 * cosRot;
            const finalX2 = segCenterX + rx2;
            const finalY2 = -(segCenterY + ry2); // 翻转Y轴

            // 计算柱子的方向和垂直方向
            const barAngle = Math.atan2(finalY2 - finalY1, finalX2 - finalX1);
            const perpAngle = barAngle + Math.PI / 2;
            const dxBar = Math.cos(perpAngle) * barWidth * 0.5;
            const dyBar = Math.sin(perpAngle) * barWidth * 0.5;

            const geometry = new THREE.BufferGeometry();
            const positions = new Float32Array([
                finalX1 - dxBar, finalY1 - dyBar, 0,
                finalX1 + dxBar, finalY1 + dyBar, 0,
                finalX2 + dxBar, finalY2 + dyBar, 0,
                finalX2 - dxBar, finalY2 - dyBar, 0
            ]);
            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geometry.setIndex([0, 1, 2, 0, 2, 3]);

            const color = getAmplitudeColor(amplitude, ringIndex);
            const material = new THREE.MeshBasicMaterial({ 
                color: hexToColor(color),
                transparent: true,
                opacity: amplitude > 0.05 ? 0.9 : 0.5
            });
            const mesh = new THREE.Mesh(geometry, material);
            scene.add(mesh);
            threeObjects.voiceprintObjects.push(mesh);
        }
    }
}

// Render function
function render() {
    renderer.render(scene, camera);
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    // Update FPS
    const now = performance.now();
    fps.frameCount++;
    if (now - fps.lastTime >= 1000) {
        fps.value = fps.frameCount;
        fps.frameCount = 0;
        fps.lastTime = now;
    }

    render();
}

// Resize handler
function resize() {
    width = window.innerWidth;
    height = window.innerHeight;

    // 根据宽高比正确设置相机，保持圆形不变形
    const aspect = width / height;
    let left, right, top, bottom;
    
    if (width > height) {
        // 宽屏：以高度为基准，左右边界扩展
        const viewHeight = height;
        const viewWidth = viewHeight * aspect;
        left = -viewWidth / 2;
        right = viewWidth / 2;
        top = viewHeight / 2;
        bottom = -viewHeight / 2;
    } else {
        // 高屏：以宽度为基准，上下边界扩展
        const viewWidth = width;
        const viewHeight = viewWidth / aspect;
        left = -viewWidth / 2;
        right = viewWidth / 2;
        top = viewHeight / 2;
        bottom = -viewHeight / 2;
    }
    
    camera.left = left;
    camera.right = right;
    camera.top = top;
    camera.bottom = bottom;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
    config.maxRadius = Math.min(width, height) * 0.4;

    // Recreate base layer
    createBaseLayer();
    updateVoiceprint();
}

window.addEventListener('resize', resize);

// Update function (replaces draw())
function updateThreeJS() {
    createBaseLayer();
    updateVoiceprint();
}

// Initialize function
function init() {
    initializeColors();
    createControlPanel();
    setupRandomizeButton();
    setupRecordingControls();
    initThreeJS();
    console.log('Three.js Rose layout initialized successfully!');
}

// Create control panel UI (same as original, but calls updateThreeJS instead of draw)
function createControlPanel() {
    const innerControls = document.getElementById('innerCirclesControls');
    params.innerCircles.forEach((circle, index) => {
        const circleDiv = document.createElement('div');
        circleDiv.className = 'control-group';
        circleDiv.innerHTML = `
            <label>圆圈 ${index + 1} - 半径 (相对于最大半径):</label>
            <input type="range" id="innerR${index}" min="0.05" max="0.5" step="0.01" value="${circle.radius}">
            <span class="value-display" id="innerR${index}Value">${(circle.radius * 100).toFixed(1)}%</span>
            <label>圆圈 ${index + 1} - X偏移:</label>
            <input type="range" id="innerX${index}" min="-0.1" max="0.1" step="0.005" value="${circle.offsetX}">
            <span class="value-display" id="innerX${index}Value">${(circle.offsetX * 100).toFixed(2)}%</span>
            <label>圆圈 ${index + 1} - Y偏移:</label>
            <input type="range" id="innerY${index}" min="-0.1" max="0.1" step="0.005" value="${circle.offsetY}">
            <span class="value-display" id="innerY${index}Value">${(circle.offsetY * 100).toFixed(2)}%</span>
            <label>圆圈 ${index + 1} - 声波高度:</label>
            <input type="range" id="innerWaveHeight${index}" min="0.5" max="2.0" step="0.1" value="${circle.waveHeight || 1.0}">
            <span class="value-display" id="innerWaveHeight${index}Value">${(circle.waveHeight || 1.0).toFixed(1)}x</span>
        `;
        innerControls.appendChild(circleDiv);

        document.getElementById(`innerR${index}`).addEventListener('input', (e) => {
            params.innerCircles[index].radius = parseFloat(e.target.value);
            document.getElementById(`innerR${index}Value`).textContent = (params.innerCircles[index].radius * 100).toFixed(1) + '%';
            updateThreeJS();
        });
        document.getElementById(`innerX${index}`).addEventListener('input', (e) => {
            params.innerCircles[index].offsetX = parseFloat(e.target.value);
            document.getElementById(`innerX${index}Value`).textContent = (params.innerCircles[index].offsetX * 100).toFixed(2) + '%';
            updateThreeJS();
        });
        document.getElementById(`innerY${index}`).addEventListener('input', (e) => {
            params.innerCircles[index].offsetY = parseFloat(e.target.value);
            document.getElementById(`innerY${index}Value`).textContent = (params.innerCircles[index].offsetY * 100).toFixed(2) + '%';
            updateThreeJS();
        });
        document.getElementById(`innerWaveHeight${index}`).addEventListener('input', (e) => {
            params.innerCircles[index].waveHeight = parseFloat(e.target.value);
            document.getElementById(`innerWaveHeight${index}Value`).textContent = params.innerCircles[index].waveHeight.toFixed(1) + 'x';
            updateThreeJS();
        });
    });

    // Outer circle 5 controls
    const outer5Controls = document.getElementById('outerCircle5Controls');
    outer5Controls.innerHTML = `
        <div class="control-group">
            <label>半径 (相对于最大半径):</label>
            <input type="range" id="outer5Radius" min="0.3" max="0.9" step="0.01" value="${params.outerCircle5.radius}">
            <span class="value-display" id="outer5RadiusValue">${(params.outerCircle5.radius * 100).toFixed(1)}%</span>
        </div>
        <div class="control-group">
            <label>分段数量:</label>
            <input type="range" id="outer5SegmentCount" min="3" max="6" step="1" value="${params.outerCircle5.segmentCount}">
            <span class="value-display" id="outer5SegmentCountValue">${params.outerCircle5.segmentCount}</span>
        </div>
        <div class="control-group">
            <label>每段长度 (变化比例):</label>
            <input type="range" id="outer5Segment" min="0" max="0.2" step="0.01" value="${params.outerCircle5.segmentLength}">
            <span class="value-display" id="outer5SegmentValue">${(() => {
            const initialUnit = 1.0 / params.outerCircle5.segmentCount;
            const actualLength = initialUnit * (1 + params.outerCircle5.segmentLength);
            return (params.outerCircle5.segmentLength * 100).toFixed(1) + '% (实际: ' + (actualLength * 100).toFixed(1) + '%)';
        })()}</span>
        </div>
        <div class="control-group">
            <label>自旋角 (弧度):</label>
            <input type="range" id="outer5SelfRot" min="-0.5" max="0.5" step="0.01" value="${params.outerCircle5.selfRotation}">
            <span class="value-display" id="outer5SelfRotValue">${params.outerCircle5.selfRotation.toFixed(3)}</span>
        </div>
        <div class="control-group">
            <label>整体旋转角 (弧度):</label>
            <input type="range" id="outer5GlobalRot" min="0" max="6.28" step="0.01" value="${params.outerCircle5.globalRotation}">
            <span class="value-display" id="outer5GlobalRotValue">${params.outerCircle5.globalRotation.toFixed(3)}</span>
        </div>
        <div class="control-group">
            <label>声波高度:</label>
            <input type="range" id="outer5WaveHeight" min="0.5" max="2.0" step="0.1" value="${params.outerCircle5.waveHeight || 1.0}">
            <span class="value-display" id="outer5WaveHeightValue">${(params.outerCircle5.waveHeight || 1.0).toFixed(1)}x</span>
        </div>
    `;

    document.getElementById('outer5Radius').addEventListener('input', (e) => {
        params.outerCircle5.radius = parseFloat(e.target.value);
        document.getElementById('outer5RadiusValue').textContent = (params.outerCircle5.radius * 100).toFixed(1) + '%';
        updateThreeJS();
    });
    document.getElementById('outer5SegmentCount').addEventListener('input', (e) => {
        params.outerCircle5.segmentCount = parseInt(e.target.value);
        document.getElementById('outer5SegmentCountValue').textContent = params.outerCircle5.segmentCount;
        const initialUnit = 1.0 / params.outerCircle5.segmentCount;
        const actualLength = initialUnit * (1 + params.outerCircle5.segmentLength);
        document.getElementById('outer5SegmentValue').textContent = (params.outerCircle5.segmentLength * 100).toFixed(1) + '% (实际: ' + (actualLength * 100).toFixed(1) + '%)';
        updateThreeJS();
    });
    document.getElementById('outer5Segment').addEventListener('input', (e) => {
        params.outerCircle5.segmentLength = parseFloat(e.target.value);
        const initialUnit = 1.0 / params.outerCircle5.segmentCount;
        const actualLength = initialUnit * (1 + params.outerCircle5.segmentLength);
        document.getElementById('outer5SegmentValue').textContent = (params.outerCircle5.segmentLength * 100).toFixed(1) + '% (实际: ' + (actualLength * 100).toFixed(1) + '%)';
        updateThreeJS();
    });
    document.getElementById('outer5SelfRot').addEventListener('input', (e) => {
        params.outerCircle5.selfRotation = parseFloat(e.target.value);
        document.getElementById('outer5SelfRotValue').textContent = params.outerCircle5.selfRotation.toFixed(3);
        updateThreeJS();
    });
    document.getElementById('outer5GlobalRot').addEventListener('input', (e) => {
        params.outerCircle5.globalRotation = parseFloat(e.target.value);
        document.getElementById('outer5GlobalRotValue').textContent = params.outerCircle5.globalRotation.toFixed(3);
        updateThreeJS();
    });
    document.getElementById('outer5WaveHeight').addEventListener('input', (e) => {
        params.outerCircle5.waveHeight = parseFloat(e.target.value);
        document.getElementById('outer5WaveHeightValue').textContent = params.outerCircle5.waveHeight.toFixed(1) + 'x';
        updateThreeJS();
    });

    // Outer circle 6 controls
    const outer6Controls = document.getElementById('outerCircle6Controls');
    outer6Controls.innerHTML = `
        <div class="control-group">
            <label>半径 (相对于最大半径):</label>
            <input type="range" id="outer6Radius" min="0.3" max="0.9" step="0.01" value="${params.outerCircle6.radius}">
            <span class="value-display" id="outer6RadiusValue">${(params.outerCircle6.radius * 100).toFixed(1)}%</span>
        </div>
        <div class="control-group">
            <label>分段数量:</label>
            <input type="range" id="outer6SegmentCount" min="3" max="6" step="1" value="${params.outerCircle6.segmentCount}">
            <span class="value-display" id="outer6SegmentCountValue">${params.outerCircle6.segmentCount}</span>
        </div>
        <div class="control-group">
            <label>每段长度 (变化比例):</label>
            <input type="range" id="outer6Segment" min="0" max="0.2" step="0.01" value="${params.outerCircle6.segmentLength}">
            <span class="value-display" id="outer6SegmentValue">${(() => {
            const initialUnit = 1.0 / params.outerCircle6.segmentCount;
            const actualLength = initialUnit * (1 + params.outerCircle6.segmentLength);
            return (params.outerCircle6.segmentLength * 100).toFixed(1) + '% (实际: ' + (actualLength * 100).toFixed(1) + '%)';
        })()}</span>
        </div>
        <div class="control-group">
            <label>自旋角 (弧度):</label>
            <input type="range" id="outer6SelfRot" min="-0.5" max="0.5" step="0.01" value="${params.outerCircle6.selfRotation}">
            <span class="value-display" id="outer6SelfRotValue">${params.outerCircle6.selfRotation.toFixed(3)}</span>
        </div>
        <div class="control-group">
            <label>整体旋转角 (弧度):</label>
            <input type="range" id="outer6GlobalRot" min="0" max="6.28" step="0.01" value="${params.outerCircle6.globalRotation}">
            <span class="value-display" id="outer6GlobalRotValue">${params.outerCircle6.globalRotation.toFixed(3)}</span>
        </div>
        <div class="control-group">
            <label>声波高度:</label>
            <input type="range" id="outer6WaveHeight" min="0.5" max="2.0" step="0.1" value="${params.outerCircle6.waveHeight || 1.0}">
            <span class="value-display" id="outer6WaveHeightValue">${(params.outerCircle6.waveHeight || 1.0).toFixed(1)}x</span>
        </div>
    `;

    document.getElementById('outer6Radius').addEventListener('input', (e) => {
        params.outerCircle6.radius = parseFloat(e.target.value);
        document.getElementById('outer6RadiusValue').textContent = (params.outerCircle6.radius * 100).toFixed(1) + '%';
        updateThreeJS();
    });
    document.getElementById('outer6SegmentCount').addEventListener('input', (e) => {
        params.outerCircle6.segmentCount = parseInt(e.target.value);
        document.getElementById('outer6SegmentCountValue').textContent = params.outerCircle6.segmentCount;
        const initialUnit = 1.0 / params.outerCircle6.segmentCount;
        const actualLength = initialUnit * (1 + params.outerCircle6.segmentLength);
        document.getElementById('outer6SegmentValue').textContent = (params.outerCircle6.segmentLength * 100).toFixed(1) + '% (实际: ' + (actualLength * 100).toFixed(1) + '%)';
        updateThreeJS();
    });
    document.getElementById('outer6Segment').addEventListener('input', (e) => {
        params.outerCircle6.segmentLength = parseFloat(e.target.value);
        const initialUnit = 1.0 / params.outerCircle6.segmentCount;
        const actualLength = initialUnit * (1 + params.outerCircle6.segmentLength);
        document.getElementById('outer6SegmentValue').textContent = (params.outerCircle6.segmentLength * 100).toFixed(1) + '% (实际: ' + (actualLength * 100).toFixed(1) + '%)';
        updateThreeJS();
    });
    document.getElementById('outer6SelfRot').addEventListener('input', (e) => {
        params.outerCircle6.selfRotation = parseFloat(e.target.value);
        document.getElementById('outer6SelfRotValue').textContent = params.outerCircle6.selfRotation.toFixed(3);
        updateThreeJS();
    });
    document.getElementById('outer6GlobalRot').addEventListener('input', (e) => {
        params.outerCircle6.globalRotation = parseFloat(e.target.value);
        document.getElementById('outer6GlobalRotValue').textContent = params.outerCircle6.globalRotation.toFixed(3);
        updateThreeJS();
    });
    document.getElementById('outer6WaveHeight').addEventListener('input', (e) => {
        params.outerCircle6.waveHeight = parseFloat(e.target.value);
        document.getElementById('outer6WaveHeightValue').textContent = params.outerCircle6.waveHeight.toFixed(1) + 'x';
        updateThreeJS();
    });
}

// Setup randomize button
function setupRandomizeButton() {
    const btn = document.getElementById('randomizeButton');
    if (btn) {
        btn.addEventListener('click', () => {
            initializeColors();
            randomizeInnerCircles();
            randomizeOuterCircles();
            updateThreeJS();
        });
    }
    setupShortcuts();
}

function setupShortcuts() {
    document.addEventListener('keydown', (e) => {
        if (e.key >= '1' && e.key <= '6') {
            const select = document.getElementById('voiceprintStyle');
            if (select && select.options.length >= parseInt(e.key)) {
                select.selectedIndex = parseInt(e.key) - 1;
                const event = new Event('change');
                select.dispatchEvent(event);
            }
        }
    });
}

// Randomize functions (same as original)
function randomizeInnerCircles() {
    const maxRadius = config.maxRadius * 0.5;

    params.innerCircles.forEach((circle, index) => {
        const initialRadius = initialRadii[index];
        const variationRange = index === 3 ? 0.1 : 0.15;
        const variation = (Math.random() - 0.5) * (variationRange * 2);
        const newRadius = initialRadius * (1 + variation);
        params.innerCircles[index].radius = Math.max(0.05, Math.min(0.5, newRadius));
    });

    // Calculate positions based on new radii
    const r4 = maxRadius * params.innerCircles[3].radius;
    params.innerCircles[3].offsetX = 0;
    params.innerCircles[3].offsetY = 0;

    const r3 = maxRadius * params.innerCircles[2].radius;
    const actualR3 = Math.min(r3, r4 * 0.99);
    const dist3 = Math.max(0, r4 - actualR3);
    const angle3 = Math.random() * Math.PI * 2;
    params.innerCircles[2].offsetX = (dist3 * Math.cos(angle3)) / maxRadius;
    params.innerCircles[2].offsetY = (dist3 * Math.sin(angle3)) / maxRadius;

    const r2 = maxRadius * params.innerCircles[1].radius;
    const actualR2 = Math.min(r2, actualR3 * 0.99);
    const dist2 = Math.max(0, actualR3 - actualR2);
    const angle2 = Math.random() * Math.PI * 2;
    const c3X = maxRadius * params.innerCircles[2].offsetX;
    const c3Y = maxRadius * params.innerCircles[2].offsetY;
    params.innerCircles[1].offsetX = (c3X + dist2 * Math.cos(angle2)) / maxRadius;
    params.innerCircles[1].offsetY = (c3Y + dist2 * Math.sin(angle2)) / maxRadius;

    const r1 = maxRadius * params.innerCircles[0].radius;
    const actualR1 = Math.min(r1, actualR2 * 0.99);
    const dist1 = Math.max(0, actualR2 - actualR1);
    const angle1 = Math.random() * Math.PI * 2;
    const c2X = maxRadius * params.innerCircles[1].offsetX;
    const c2Y = maxRadius * params.innerCircles[1].offsetY;
    params.innerCircles[0].offsetX = (c2X + dist1 * Math.cos(angle1)) / maxRadius;
    params.innerCircles[0].offsetY = (c2Y + dist1 * Math.sin(angle1)) / maxRadius;

    // Update UI sliders
    params.innerCircles.forEach((circle, index) => {
        const rSlider = document.getElementById(`innerR${index}`);
        const xSlider = document.getElementById(`innerX${index}`);
        const ySlider = document.getElementById(`innerY${index}`);
        if (rSlider) {
            rSlider.value = circle.radius;
            document.getElementById(`innerR${index}Value`).textContent = (circle.radius * 100).toFixed(1) + '%';
        }
        if (xSlider) {
            xSlider.value = circle.offsetX;
            document.getElementById(`innerX${index}Value`).textContent = (circle.offsetX * 100).toFixed(2) + '%';
        }
        if (ySlider) {
            ySlider.value = circle.offsetY;
            document.getElementById(`innerY${index}Value`).textContent = (circle.offsetY * 100).toFixed(2) + '%';
        }
    });

    randomizeOuterCircles();
}

function randomizeOuterCircles() {
    const segmentCount5 = 3 + Math.floor(Math.random() * 3);
    params.outerCircle5.segmentCount = segmentCount5;
    const segmentCount6 = segmentCount5 + Math.floor(Math.random() * (7 - segmentCount5));
    params.outerCircle6.segmentCount = segmentCount6;
    params.outerCircle5.segmentLength = 0.04 + Math.random() * 0.06;
    params.outerCircle5.selfRotation = 0.1 + Math.random() * 0.03;
    params.outerCircle5.globalRotation = Math.random() * Math.PI * 2;
    params.outerCircle6.segmentLength = 0.04 + Math.random() * 0.06;
    params.outerCircle6.selfRotation = 0.1 + Math.random() * 0.03;
    params.outerCircle6.globalRotation = Math.random() * Math.PI * 2;

    // Update UI sliders for Circle 5
    const outer5SegmentCount = document.getElementById('outer5SegmentCount');
    const outer5Segment = document.getElementById('outer5Segment');
    const outer5SelfRot = document.getElementById('outer5SelfRot');
    const outer5GlobalRot = document.getElementById('outer5GlobalRot');

    if (outer5SegmentCount) {
        outer5SegmentCount.value = params.outerCircle5.segmentCount;
        document.getElementById('outer5SegmentCountValue').textContent = params.outerCircle5.segmentCount;
    }
    if (outer5Segment) {
        outer5Segment.value = params.outerCircle5.segmentLength;
        const initialUnit5 = 1.0 / params.outerCircle5.segmentCount;
        const actualLength5 = initialUnit5 * (1 + params.outerCircle5.segmentLength);
        document.getElementById('outer5SegmentValue').textContent = (params.outerCircle5.segmentLength * 100).toFixed(1) + '% (实际: ' + (actualLength5 * 100).toFixed(1) + '%)';
    }
    if (outer5SelfRot) {
        outer5SelfRot.value = params.outerCircle5.selfRotation;
        document.getElementById('outer5SelfRotValue').textContent = params.outerCircle5.selfRotation.toFixed(3);
    }
    if (outer5GlobalRot) {
        outer5GlobalRot.value = params.outerCircle5.globalRotation;
        document.getElementById('outer5GlobalRotValue').textContent = params.outerCircle5.globalRotation.toFixed(3);
    }

    // Update UI sliders for Circle 6
    const outer6SegmentCount = document.getElementById('outer6SegmentCount');
    const outer6Segment = document.getElementById('outer6Segment');
    const outer6SelfRot = document.getElementById('outer6SelfRot');
    const outer6GlobalRot = document.getElementById('outer6GlobalRot');

    if (outer6SegmentCount) {
        outer6SegmentCount.value = params.outerCircle6.segmentCount;
        document.getElementById('outer6SegmentCountValue').textContent = params.outerCircle6.segmentCount;
    }
    if (outer6Segment) {
        outer6Segment.value = params.outerCircle6.segmentLength;
        const initialUnit6 = 1.0 / params.outerCircle6.segmentCount;
        const actualLength6 = initialUnit6 * (1 + params.outerCircle6.segmentLength);
        document.getElementById('outer6SegmentValue').textContent = (params.outerCircle6.segmentLength * 100).toFixed(1) + '% (实际: ' + (actualLength6 * 100).toFixed(1) + '%)';
    }
    if (outer6SelfRot) {
        outer6SelfRot.value = params.outerCircle6.selfRotation;
        document.getElementById('outer6SelfRotValue').textContent = params.outerCircle6.selfRotation.toFixed(3);
    }
    if (outer6GlobalRot) {
        outer6GlobalRot.value = params.outerCircle6.globalRotation;
        document.getElementById('outer6GlobalRotValue').textContent = params.outerCircle6.globalRotation.toFixed(3);
    }
}

// Setup recording controls (same as original, but calls updateThreeJS)
function setupRecordingControls() {
    const permissionBtn = document.getElementById('requestPermission');
    const startBtn = document.getElementById('startRecording');
    const simulateBtn = document.getElementById('simulateInput');
    const styleSelect = document.getElementById('voiceprintStyle');

    if (permissionBtn) {
        permissionBtn.addEventListener('click', requestMicrophonePermission);
    }

    if (startBtn) {
        startBtn.addEventListener('mousedown', () => {
            if (!isRecording && !isSimulating && micPermissionGranted) {
                startRecording();
            }
        });
        startBtn.addEventListener('mouseup', () => {
            if (isRecording) stopRecording();
        });
        startBtn.addEventListener('mouseleave', () => {
            if (isRecording) stopRecording();
        });
        startBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (!isRecording && !isSimulating && micPermissionGranted) {
                startRecording();
            }
        });
        startBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (isRecording) stopRecording();
        });
    }

    if (simulateBtn) {
        simulateBtn.addEventListener('click', () => {
            if (isRecording || isSimulating) {
                stopRecording();
            } else {
                startSimulation();
            }
        });
    }

    if (styleSelect) {
        styleSelect.addEventListener('change', (e) => {
            voiceprintSettings.style = e.target.value;
            updateThreeJS();
        });
    }

    const baseHeightRatioSlider = document.getElementById('baseHeightRatio');
    const baseHeightRatioValue = document.getElementById('baseHeightRatioValue');
    if (baseHeightRatioSlider && baseHeightRatioValue) {
        baseHeightRatioSlider.addEventListener('input', (e) => {
            voiceprintSettings.baseHeightRatio = parseFloat(e.target.value);
            baseHeightRatioValue.textContent = (voiceprintSettings.baseHeightRatio * 100).toFixed(0) + '%';
            updateThreeJS();
        });
    }

    const baseCheck = document.getElementById('showBaseLayer');
    const voiceCheck = document.getElementById('showVoiceprintLayer');
    if (baseCheck) {
        baseCheck.addEventListener('change', (e) => {
            layerVisibility.showBaseLayer = e.target.checked;
            updateThreeJS();
        });
    }
    if (voiceCheck) {
        voiceCheck.addEventListener('change', (e) => {
            layerVisibility.showVoiceprintLayer = e.target.checked;
            updateThreeJS();
        });
    }

    const colorModeSelect = document.getElementById('colorMode');
    if (colorModeSelect) {
        colorModeSelect.addEventListener('change', (e) => {
            voiceprintSettings.colorMode = e.target.value;
            updateThreeJS();
        });
    }
}

// Audio functions (same as original, but calls updateThreeJS instead of draw)
async function requestMicrophonePermission() {
    const permissionBtn = document.getElementById('requestPermission');
    const startBtn = document.getElementById('startRecording');

    try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0.3;
        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
        microphone = audioContext.createMediaStreamSource(mediaStream);
        microphone.connect(analyser);

        if (voiceprintData.rings.length === 0) {
            initializeVoiceprintRings();
        }

        micPermissionGranted = true;
        if (permissionBtn) {
            permissionBtn.disabled = true;
            permissionBtn.textContent = '✓ 麦克风已就绪';
            permissionBtn.style.background = 'linear-gradient(135deg, #00c896 0%, #00a878 100%)';
        }
        if (startBtn) startBtn.disabled = false;
    } catch (err) {
        console.error('Failed to access microphone:', err);
        alert('无法访问麦克风。请确保已授权麦克风权限。');
    }
}

function startRecording() {
    if (isRecording || isSimulating || !micPermissionGranted) return;
    isRecording = true;
    const simulateBtn = document.getElementById('simulateInput');
    if (simulateBtn) simulateBtn.disabled = true;
    recordAudioData();
}

function startSimulation() {
    if (isRecording || isSimulating) return;
    if (!dataArray) {
        dataArray = new Uint8Array(512);
    }
    isSimulating = true;
    const startBtn = document.getElementById('startRecording');
    const simulateBtn = document.getElementById('simulateInput');
    if (startBtn) startBtn.disabled = true;
    if (simulateBtn) {
        simulateBtn.textContent = "停止模拟";
        simulateBtn.style.background = "linear-gradient(135deg, #ff9966 0%, #ff5e62 100%)";
    }
    if (voiceprintData.rings.length === 0) {
        initializeVoiceprintRings();
    }
    voiceprintData.globalSampleIndex = 0;
    voiceprintData.rings.forEach(ring => {
        ring.sampleIndex = 0;
    });
    recordAudioData();
}

function stopRecording() {
    if (isRecording) isRecording = false;
    if (isSimulating) isSimulating = false;
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    const simulateBtn = document.getElementById('simulateInput');
    if (simulateBtn) {
        simulateBtn.textContent = "模拟输入";
        simulateBtn.style.background = "linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)";
        simulateBtn.disabled = false;
    }
}

function initializeVoiceprintRings() {
    const maxRadius = config.maxRadius * 0.5;
    const fourCircles = calculateFourCircles();
    const firstRingSampleCount = 540;
    fourCircles.forEach((circle, index) => {
        const samplesPerRing = 540;
        const startGlobalIndex = Math.floor(firstRingSampleCount * index * 0.25);
        voiceprintData.rings.push({
            type: 'circle',
            radius: circle.radius,
            centerX: circle.cx,
            centerY: circle.cy,
            samples: new Array(samplesPerRing).fill(0),
            sampleCount: samplesPerRing,
            sampleIndex: 0,
            startGlobalIndex: startGlobalIndex
        });
    });

    const r5 = config.maxRadius * params.outerCircle5.radius;
    const segmentCount5 = params.outerCircle5.segmentCount;
    const initialUnit5 = 1.0 / segmentCount5;
    const actualSegmentLength5 = initialUnit5 * (1 + params.outerCircle5.segmentLength);
    const segmentAngleSize5 = actualSegmentLength5 * Math.PI * 2;
    const gapSize5 = (Math.PI * 2 - segmentAngleSize5 * segmentCount5) / segmentCount5;
    const startGlobalIndex5 = Math.floor(firstRingSampleCount * 4 * 0.25);
    voiceprintData.rings.push({
        type: 'segmented',
        baseRadius: r5,
        centerX: config.centerX,
        centerY: config.centerY,
        segmentCount: segmentCount5,
        segmentAngleSize: segmentAngleSize5,
        gapSize: gapSize5,
        globalRotation: params.outerCircle5.globalRotation,
        selfRotation: params.outerCircle5.selfRotation,
        samples: new Array(720).fill(0),
        sampleCount: 720,
        sampleIndex: 0,
        startGlobalIndex: startGlobalIndex5
    });

    const r6 = config.maxRadius * params.outerCircle6.radius;
    const segmentCount6 = params.outerCircle6.segmentCount;
    const initialUnit6 = 1.0 / segmentCount6;
    const actualSegmentLength6 = initialUnit6 * (1 + params.outerCircle6.segmentLength);
    const segmentAngleSize6 = actualSegmentLength6 * Math.PI * 2;
    const gapSize6 = (Math.PI * 2 - segmentAngleSize6 * segmentCount6) / segmentCount6;
    const startGlobalIndex6 = Math.floor(firstRingSampleCount * 5 * 0.25);
    voiceprintData.rings.push({
        type: 'segmented',
        baseRadius: r6,
        centerX: config.centerX,
        centerY: config.centerY,
        segmentCount: segmentCount6,
        segmentAngleSize: segmentAngleSize6,
        gapSize: gapSize6,
        globalRotation: params.outerCircle6.globalRotation,
        selfRotation: params.outerCircle6.selfRotation,
        samples: new Array(720).fill(0),
        sampleCount: 720,
        sampleIndex: 0,
        startGlobalIndex: startGlobalIndex6
    });
}

function recordAudioData() {
    if (!isRecording && !isSimulating) return;

    if (isRecording) {
        analyser.getByteFrequencyData(dataArray);
    } else if (isSimulating) {
        const time = Date.now() / 1000;
        for (let i = 0; i < dataArray.length; i++) {
            const val = (Math.sin(time * 5 + i * 0.1) + 1) * 60 +
                (Math.sin(time * 10 + i * 0.5) + 1) * 40 +
                Math.random() * 30;
            dataArray[i] = Math.min(255, val);
        }
    }

    const sampleRate = audioContext ? audioContext.sampleRate : 44100;
    const nyquist = sampleRate / 2;
    const binWidth = nyquist / dataArray.length;

    let weightedSum = 0;
    let weightSum = 0;

    for (let i = 0; i < dataArray.length; i++) {
        const frequency = i * binWidth;
        const amplitude = dataArray[i] / 255;
        let weight = 1.0;
        if (frequency > 1000) {
            weight = 1.0 + (frequency - 1000) / 3000 * 1.5;
        }
        if (frequency > 4000) {
            weight = 2.5 + (frequency - 4000) / (nyquist - 4000) * 2.5;
        }
        weightedSum += amplitude * amplitude * weight;
        weightSum += weight;
    }

    const rmsAmplitude = Math.sqrt(weightedSum / weightSum);
    const normalizedAmplitude = Math.min(1.0, rmsAmplitude * 1.5);

    const samplesPerFrame = 3;

    for (let i = 0; i < samplesPerFrame; i++) {
        voiceprintData.rings.forEach((ring) => {
            if (voiceprintData.globalSampleIndex >= ring.startGlobalIndex) {
                if (ring.sampleIndex < ring.sampleCount) {
                    ring.samples[ring.sampleIndex] = normalizedAmplitude;
                    ring.sampleIndex++;
                }
            }
        });
        voiceprintData.globalSampleIndex++;
    }

    let allRingsComplete = true;
    for (let i = 0; i < voiceprintData.rings.length; i++) {
        const ring = voiceprintData.rings[i];
        if (voiceprintData.globalSampleIndex >= ring.startGlobalIndex) {
            if (ring.sampleIndex < ring.sampleCount) {
                allRingsComplete = false;
                break;
            }
        } else {
            allRingsComplete = false;
            break;
        }
    }

    updateThreeJS();

    if (!allRingsComplete && (isRecording || isSimulating)) {
        animationFrameId = requestAnimationFrame(recordAudioData);
    } else if (allRingsComplete) {
        if (isRecording) isRecording = false;
        if (isSimulating) isSimulating = false;
    }
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

