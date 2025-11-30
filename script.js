let canvas, ctx;
let width, height;

// Initial radius values (reference point for randomization)
const initialRadii = [0.15, 0.22, 0.31, 0.43]; // Circle 1, 2, 3, 4

// Parameters configuration
const params = {
    // Inner 4 circles - 根据用户给定的默认值
    innerCircles: [
        { radius: 0.15, offsetX: 0.02, offsetY: -0.02, color: null, waveHeight: 0.5 },   // Circle 1
        { radius: 0.22, offsetX: 0.045, offsetY: 0.025, color: null, waveHeight: 0.5 }, // Circle 2
        { radius: 0.31, offsetX: -0.035, offsetY: 0.025, color: null, waveHeight: 1.0 }, // Circle 3
        { radius: 0.43, offsetX: 0.05, offsetY: 0.04, color: null, waveHeight: 1.0 }   // Circle 4
    ],
    // Outer circle 5 (segmented petals)
    outerCircle5: {
        radius: 0.33,
        segmentCount: 4,
        segmentLength: 0.0,
        selfRotation: 0.12,
        globalRotation: 0,
        segmentColors: [], // Array of colors for each segment
        waveHeight: 2.0 // 声波高度缩放因子
    },
    // Outer circle 6 (segmented petals)
    outerCircle6: {
        radius: 0.44,
        segmentCount: 4,
        segmentLength: 0.0,
        selfRotation: 0.12,
        globalRotation: 0.3927,
        segmentColors: [], // Array of colors for each segment
        waveHeight: 2.0 // 声波高度缩放因子
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
let mediaStream = null; // Keep stream alive
let isRecording = false;
let isSimulating = false;
let simulationId = 0;
let animationFrameId = null;
let micPermissionGranted = false; // Track permission status

// Voiceprint data storage (from inner to outer circles)
// Each ring stores audio data points along the circle path
const voiceprintData = {
    rings: [], // Array of rings, each ring contains audio samples
    globalSampleIndex: 0, // Global sample index (based on first ring)
    maxRings: 6 // Maximum number of rings to record
};

// Layer visibility controls
const layerVisibility = {
    showBaseLayer: true,
    showVoiceprintLayer: true
};

// Voiceprint style and settings
const voiceprintSettings = {
    style: 'spectrum-bars', // Default to spectrum bars
    showRawWaveforms: true, // Show raw waveforms on left side
    baseHeightRatio: 0.15, // 基础高度占比（静音时的基线），默认15%，用户声音占85%
    colorMode: 'romantic-classic' // Default color mode
};

// Color Palettes Configuration
const PALETTES = {
    // Category 1: Romantic Multi-color (Multi-ring)
    'romantic-classic': {
        type: 'romantic',
        rings: ['#8B0000', '#DC143C', '#FF1493', '#FF69B4', '#FFB6C1', '#FFD700'] // Red/Pink/Gold
    },
    'romantic-ocean': {
        type: 'romantic',
        rings: ['#00008B', '#0000CD', '#4169E1', '#00BFFF', '#87CEEB', '#E0FFFF'] // Deep Blue to Cyan
    },
    'romantic-forest': {
        type: 'romantic',
        rings: ['#006400', '#008000', '#228B22', '#32CD32', '#90EE90', '#FFD700'] // Green to Gold
    },
    'romantic-sunset': {
        type: 'romantic',
        rings: ['#4B0082', '#800080', '#8B008B', '#FF00FF', '#FF4500', '#FFD700'] // Purple to Orange/Gold
    },

    // Category 2: Gradient Mode (Uniform Gradient)
    'gradient-pinkgold': {
        type: 'gradient',
        start: { h: 330, s: 100, l: 80 }, // Pink
        end: { h: 50, s: 100, l: 60 }     // Gold
    },
    'gradient-fire': {
        type: 'gradient',
        start: { h: 0, s: 100, l: 50 },   // Red
        end: { h: 60, s: 100, l: 60 }     // Yellow
    },
    'gradient-cool': {
        type: 'gradient',
        start: { h: 270, s: 100, l: 60 }, // Purple
        end: { h: 180, s: 100, l: 60 }    // Cyan
    },
    'gradient-neon': {
        type: 'gradient',
        start: { h: 200, s: 100, l: 60 }, // Blue
        end: { h: 300, s: 100, l: 60 }    // Pink
    },

    // Category 3: Monochrome Mode (Single Color)
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

// Generate random rainbow color
function getRandomRainbowColor() {
    const hue = Math.random() * 360;
    return `hsl(${hue}, 85%, 60%)`;
}

// Get gradient color based on base color and position (0=base, 1=tip)
function getGradientColor(baseColor, position) {
    // Extract HSL values from baseColor
    const match = baseColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    if (!match) return baseColor;

    const h = parseInt(match[1]);
    const s = parseInt(match[2]);
    const l = parseInt(match[3]);

    // Bottom (position=0): darker, Top (position=1): lighter and more saturated
    const newL = Math.min(95, l * (0.7 + position * 0.6));
    const newS = Math.min(100, s * (1 + position * 0.2));

    return `hsl(${h}, ${newS}%, ${newL}%)`;
}

// Initialize random colors for all circles
function initializeColors() {
    // Inner 4 circles
    params.innerCircles.forEach(circle => {
        circle.color = getRandomRainbowColor();
    });

    // Outer circle 5 segments
    params.outerCircle5.segmentColors = [];
    for (let i = 0; i < params.outerCircle5.segmentCount; i++) {
        params.outerCircle5.segmentColors.push(getRandomRainbowColor());
    }

    // Outer circle 6 segments
    params.outerCircle6.segmentColors = [];
    for (let i = 0; i < params.outerCircle6.segmentCount; i++) {
        params.outerCircle6.segmentColors.push(getRandomRainbowColor());
    }
}

function drawFPS() {
    const now = performance.now();
    fps.frameCount++;

    if (now - fps.lastTime >= 1000) {
        fps.value = fps.frameCount;
        fps.frameCount = 0;
        fps.lastTime = now;
    }

    ctx.save();
    ctx.font = '14px monospace';
    ctx.fillStyle = '#00ff00';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`FPS: ${fps.value}`, 10, 10);

    // Debug: Show current color mode
    const palette = PALETTES[voiceprintSettings.colorMode];
    const paletteType = palette ? palette.type : 'unknown';
    ctx.fillStyle = '#ffff00';
    ctx.fillText(`Color: ${voiceprintSettings.colorMode} (${paletteType})`, 10, 30);

    ctx.restore();
}

function init() {
    canvas = document.getElementById('canvas');
    if (!canvas) {
        console.error('Canvas element not found!');
        return;
    }

    ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Could not get 2D context!');
        return;
    }

    initializeColors(); // Initialize random colors
    createControlPanel();
    setupRandomizeButton();
    setupRecordingControls();
    resize();
    draw();
    console.log('Rose layout initialized successfully!');
}

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    config.centerX = width / 2;
    config.centerY = height / 2;
    config.maxRadius = Math.min(width, height) * 0.4;
}

window.addEventListener('resize', resize);

// Create control panel UI
function createControlPanel() {
    // Inner circles controls
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

        // Add event listeners
        document.getElementById(`innerR${index}`).addEventListener('input', (e) => {
            params.innerCircles[index].radius = parseFloat(e.target.value);
            document.getElementById(`innerR${index}Value`).textContent = (params.innerCircles[index].radius * 100).toFixed(1) + '%';
            draw();
        });
        document.getElementById(`innerX${index}`).addEventListener('input', (e) => {
            params.innerCircles[index].offsetX = parseFloat(e.target.value);
            document.getElementById(`innerX${index}Value`).textContent = (params.innerCircles[index].offsetX * 100).toFixed(2) + '%';
            draw();
        });
        document.getElementById(`innerY${index}`).addEventListener('input', (e) => {
            params.innerCircles[index].offsetY = parseFloat(e.target.value);
            document.getElementById(`innerY${index}Value`).textContent = (params.innerCircles[index].offsetY * 100).toFixed(2) + '%';
            draw();
        });
        document.getElementById(`innerWaveHeight${index}`).addEventListener('input', (e) => {
            params.innerCircles[index].waveHeight = parseFloat(e.target.value);
            document.getElementById(`innerWaveHeight${index}Value`).textContent = params.innerCircles[index].waveHeight.toFixed(1) + 'x';
            draw();
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
        draw();
    });
    document.getElementById('outer5SegmentCount').addEventListener('input', (e) => {
        params.outerCircle5.segmentCount = parseInt(e.target.value);
        document.getElementById('outer5SegmentCountValue').textContent = params.outerCircle5.segmentCount;
        // Update segment length display when count changes
        const initialUnit = 1.0 / params.outerCircle5.segmentCount;
        const actualLength = initialUnit * (1 + params.outerCircle5.segmentLength);
        document.getElementById('outer5SegmentValue').textContent = (params.outerCircle5.segmentLength * 100).toFixed(1) + '% (实际: ' + (actualLength * 100).toFixed(1) + '%)';
        draw();
    });
    document.getElementById('outer5Segment').addEventListener('input', (e) => {
        params.outerCircle5.segmentLength = parseFloat(e.target.value);
        const initialUnit = 1.0 / params.outerCircle5.segmentCount;
        const actualLength = initialUnit * (1 + params.outerCircle5.segmentLength);
        document.getElementById('outer5SegmentValue').textContent = (params.outerCircle5.segmentLength * 100).toFixed(1) + '% (实际: ' + (actualLength * 100).toFixed(1) + '%)';
        draw();
    });
    document.getElementById('outer5SelfRot').addEventListener('input', (e) => {
        params.outerCircle5.selfRotation = parseFloat(e.target.value);
        document.getElementById('outer5SelfRotValue').textContent = params.outerCircle5.selfRotation.toFixed(3);
        draw();
    });
    document.getElementById('outer5GlobalRot').addEventListener('input', (e) => {
        params.outerCircle5.globalRotation = parseFloat(e.target.value);
        document.getElementById('outer5GlobalRotValue').textContent = params.outerCircle5.globalRotation.toFixed(3);
        draw();
    });
    document.getElementById('outer5WaveHeight').addEventListener('input', (e) => {
        params.outerCircle5.waveHeight = parseFloat(e.target.value);
        document.getElementById('outer5WaveHeightValue').textContent = params.outerCircle5.waveHeight.toFixed(1) + 'x';
        draw();
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
        draw();
    });
    document.getElementById('outer6SegmentCount').addEventListener('input', (e) => {
        params.outerCircle6.segmentCount = parseInt(e.target.value);
        document.getElementById('outer6SegmentCountValue').textContent = params.outerCircle6.segmentCount;
        // Update segment length display when count changes
        const initialUnit = 1.0 / params.outerCircle6.segmentCount;
        const actualLength = initialUnit * (1 + params.outerCircle6.segmentLength);
        document.getElementById('outer6SegmentValue').textContent = (params.outerCircle6.segmentLength * 100).toFixed(1) + '% (实际: ' + (actualLength * 100).toFixed(1) + '%)';
        draw();
    });
    document.getElementById('outer6Segment').addEventListener('input', (e) => {
        params.outerCircle6.segmentLength = parseFloat(e.target.value);
        const initialUnit = 1.0 / params.outerCircle6.segmentCount;
        const actualLength = initialUnit * (1 + params.outerCircle6.segmentLength);
        document.getElementById('outer6SegmentValue').textContent = (params.outerCircle6.segmentLength * 100).toFixed(1) + '% (实际: ' + (actualLength * 100).toFixed(1) + '%)';
        draw();
    });
    document.getElementById('outer6SelfRot').addEventListener('input', (e) => {
        params.outerCircle6.selfRotation = parseFloat(e.target.value);
        document.getElementById('outer6SelfRotValue').textContent = params.outerCircle6.selfRotation.toFixed(3);
        draw();
    });
    document.getElementById('outer6GlobalRot').addEventListener('input', (e) => {
        params.outerCircle6.globalRotation = parseFloat(e.target.value);
        document.getElementById('outer6GlobalRotValue').textContent = params.outerCircle6.globalRotation.toFixed(3);
        draw();
    });
    document.getElementById('outer6WaveHeight').addEventListener('input', (e) => {
        params.outerCircle6.waveHeight = parseFloat(e.target.value);
        document.getElementById('outer6WaveHeightValue').textContent = params.outerCircle6.waveHeight.toFixed(1) + 'x';
        draw();
    });
}

// Setup randomize button
function setupRandomizeButton() {
    const btn = document.getElementById('randomizeButton');
    if (btn) {
        btn.addEventListener('click', () => {
            initializeColors(); // Regenerate rainbow colors
            randomizeInnerCircles();
            randomizeOuterCircles();
            draw();
        });
    }

    // Setup keyboard shortcuts
    setupShortcuts();
}

// Setup keyboard shortcuts
function setupShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Number keys 1-6 for styles
        if (e.key >= '1' && e.key <= '6') {
            const select = document.getElementById('voiceprintStyle');
            if (select && select.options.length >= parseInt(e.key)) {
                select.selectedIndex = parseInt(e.key) - 1;
                // Trigger change event manually
                const event = new Event('change');
                select.dispatchEvent(event);
            }
        }
    });
}
// First randomize sizes (±20% from initial values), then calculate positions
function randomizeInnerCircles() {
    const maxRadius = config.maxRadius * 0.5;

    // Step 1: Randomize circle sizes first
    // Circle 4: ±10%, Circles 1-3: ±15%
    params.innerCircles.forEach((circle, index) => {
        const initialRadius = initialRadii[index];
        // Circle 4 (index 3) uses 10% variation, others use 15%
        const variationRange = index === 3 ? 0.1 : 0.15; // 10% for circle 4, 15% for others
        const variation = (Math.random() - 0.5) * (variationRange * 2); // -range to +range
        const newRadius = initialRadius * (1 + variation);
        // Clamp to reasonable bounds (5% to 50% of maxRadius)
        params.innerCircles[index].radius = Math.max(0.05, Math.min(0.5, newRadius));
    });

    // Step 2: Calculate positions based on new radii
    // Circle 4: Fixed at center, radius is now randomized
    const r4 = maxRadius * params.innerCircles[3].radius;
    params.innerCircles[3].offsetX = 0;
    params.innerCircles[3].offsetY = 0;

    // Circle 3: Rolls inside Circle 4, tangent to Circle 4
    // Distance from center = r4 - r3
    const r3 = maxRadius * params.innerCircles[2].radius;
    // Ensure r3 is smaller than r4 for proper nesting
    const actualR3 = Math.min(r3, r4 * 0.99);
    const dist3 = Math.max(0, r4 - actualR3); // Ensure non-negative
    const angle3 = Math.random() * Math.PI * 2;
    params.innerCircles[2].offsetX = (dist3 * Math.cos(angle3)) / maxRadius;
    params.innerCircles[2].offsetY = (dist3 * Math.sin(angle3)) / maxRadius;

    // Circle 2: Rolls inside Circle 3, tangent to Circle 3
    // Distance from Circle 3's center = r3 - r2
    const r2 = maxRadius * params.innerCircles[1].radius;
    const actualR2 = Math.min(r2, actualR3 * 0.99);
    const dist2 = Math.max(0, actualR3 - actualR2);
    const angle2 = Math.random() * Math.PI * 2;
    // Calculate Circle 3's center position
    const c3X = maxRadius * params.innerCircles[2].offsetX;
    const c3Y = maxRadius * params.innerCircles[2].offsetY;
    // Circle 2's center relative to Circle 3's center
    params.innerCircles[1].offsetX = (c3X + dist2 * Math.cos(angle2)) / maxRadius;
    params.innerCircles[1].offsetY = (c3Y + dist2 * Math.sin(angle2)) / maxRadius;

    // Circle 1: Rolls inside Circle 2, tangent to Circle 2
    // Distance from Circle 2's center = r2 - r1
    const r1 = maxRadius * params.innerCircles[0].radius;
    const actualR1 = Math.min(r1, actualR2 * 0.99);
    const dist1 = Math.max(0, actualR2 - actualR1);
    const angle1 = Math.random() * Math.PI * 2;
    // Calculate Circle 2's center position
    const c2X = maxRadius * params.innerCircles[1].offsetX;
    const c2Y = maxRadius * params.innerCircles[1].offsetY;
    // Circle 1's center relative to Circle 2's center
    params.innerCircles[0].offsetX = (c2X + dist1 * Math.cos(angle1)) / maxRadius;
    params.innerCircles[0].offsetY = (c2Y + dist1 * Math.sin(angle1)) / maxRadius;

    // Update UI sliders to reflect new values
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

    // Step 3: Randomize outer circles (5 and 6)
    randomizeOuterCircles();

    // Redraw
    draw();
}

// Randomize outer circles 5 and 6
function randomizeOuterCircles() {
    // Step 1: Randomize segment counts
    // Circle 5: random between 3-5
    const segmentCount5 = 3 + Math.floor(Math.random() * 3); // 3, 4, or 5
    params.outerCircle5.segmentCount = segmentCount5;

    // Circle 6: random between a (Circle 5's count) to 6
    const segmentCount6 = segmentCount5 + Math.floor(Math.random() * (7 - segmentCount5)); // a to 6 (inclusive)
    params.outerCircle6.segmentCount = segmentCount6;

    // Step 2: Randomize Circle 5 parameters
    // 1. Segment length variation: 4% to 10%
    params.outerCircle5.segmentLength = 0.04 + Math.random() * 0.06; // 0.04 to 0.10
    // 2. Self-rotation: 0.1 to 0.13
    params.outerCircle5.selfRotation = 0.1 + Math.random() * 0.03; // 0.1 to 0.13
    // 3. Global rotation: 0 to 2π (any angle)
    params.outerCircle5.globalRotation = Math.random() * Math.PI * 2;

    // Step 3: Randomize Circle 6 parameters
    // 1. Segment length variation: 4% to 10%
    params.outerCircle6.segmentLength = 0.04 + Math.random() * 0.06; // 0.04 to 0.10
    // 2. Self-rotation: 0.1 to 0.13
    params.outerCircle6.selfRotation = 0.1 + Math.random() * 0.03; // 0.1 to 0.13
    // 3. Global rotation: 0 to 2π (any angle)
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

// Calculate positions for 4 nested circles using parameters
function calculateFourCircles() {
    const maxRadius = config.maxRadius * 0.5;
    const circles = [];

    params.innerCircles.forEach((circleParams, index) => {
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

// Draw a circle as line segments
function drawCircleOutline(cx, cy, radius, color = 'white') {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();

    const segments = 120;
    for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;

        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }

    ctx.stroke();
}

// Draw segmented circle (for circles 5 and 6)
function drawSegmentedCircle(circleNumber, circleParams) {
    const numSegments = circleParams.segmentCount;
    const baseRadius = config.maxRadius * circleParams.radius;

    // Calculate segment geometry
    const initialUnit = 1.0 / numSegments;
    const actualSegmentLength = initialUnit * (1 + circleParams.segmentLength);
    const segmentAngleSize = actualSegmentLength * Math.PI * 2;
    const gapSize = (Math.PI * 2 - segmentAngleSize * numSegments) / numSegments;

    let currentAngle = circleParams.globalRotation;

    for (let i = 0; i < numSegments; i++) {
        // Get color for this segment from palette
        const segmentColor = getBaseLayerColor(4 + (circleNumber - 5)); // ringIndex 4 for circle 5, 5 for circle 6
        ctx.strokeStyle = segmentColor;
        ctx.lineWidth = 2;

        // Calculate segment midpoint angle (the center point of this arc on the circle)
        const segmentMidAngle = currentAngle + segmentAngleSize * 0.5;

        // Calculate the center point of the arc on the circle (this is the rotation center for self-rotation)
        const centerX = config.centerX + Math.cos(segmentMidAngle) * baseRadius;
        const centerY = config.centerY + Math.sin(segmentMidAngle) * baseRadius;

        // Draw this segment as an independent arc
        ctx.beginPath();
        const segments = 60;
        for (let j = 0; j <= segments; j++) {
            const t = j / segments;
            // Original angle of the point on the circle
            const originalAngle = currentAngle + t * segmentAngleSize;

            // Original point on the circle
            const originalX = config.centerX + Math.cos(originalAngle) * baseRadius;
            const originalY = config.centerY + Math.sin(originalAngle) * baseRadius;

            // Apply self-rotation: rotate around the arc's center point (not the circle center)
            // Translate to center point, rotate, then translate back
            const dx = originalX - centerX;
            const dy = originalY - centerY;

            // Apply rotation matrix around the arc center point
            const cosRot = Math.cos(circleParams.selfRotation);
            const sinRot = Math.sin(circleParams.selfRotation);
            const rotatedX = dx * cosRot - dy * sinRot;
            const rotatedY = dx * sinRot + dy * cosRot;

            // Translate back
            const x = centerX + rotatedX;
            const y = centerY + rotatedY;

            if (j === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();

        // Move to next segment position (with gap)
        currentAngle += segmentAngleSize + gapSize;
    }
}

// Draw raw waveforms on the left side for debugging
function drawRawWaveforms() {
    if (!voiceprintSettings.showRawWaveforms || voiceprintData.rings.length === 0) return;

    const leftMargin = 20;
    const waveformWidth = width * 0.12; // 12% of canvas width
    const waveformHeight = 40;
    const waveformGap = 15;
    const startY = 50;

    ctx.save();
    ctx.font = '11px Arial';

    voiceprintData.rings.forEach((ring, ringIndex) => {
        const y = startY + ringIndex * (waveformHeight + waveformGap);

        // Get color for this ring
        let baseColor;
        if (ringIndex < 4) {
            baseColor = params.innerCircles[ringIndex].color;
        } else if (ringIndex === 4) {
            const colors = params.outerCircle5.segmentColors;
            baseColor = colors[0] || '#fff';
        } else {
            const colors = params.outerCircle6.segmentColors;
            baseColor = colors[0] || '#fff';
        }

        // Draw label
        ctx.fillStyle = baseColor;
        ctx.fillText(`圈${ringIndex + 1}`, leftMargin, y - 5);

        // Draw waveform background
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(leftMargin, y, waveformWidth, waveformHeight);

        // Draw center line
        ctx.beginPath();
        ctx.moveTo(leftMargin, y + waveformHeight / 2);
        ctx.lineTo(leftMargin + waveformWidth, y + waveformHeight / 2);
        ctx.stroke();

        // Draw spectrum bars
        if (ring.samples && ring.samples.length > 0) {
            // Use each ring's independent sampleIndex
            const maxSamples = ring.sampleIndex || 0;

            if (maxSamples > 0) {
                // 计算基础高度和用户声音高度的占比
                const baseHeightRatio = voiceprintSettings.baseHeightRatio;
                const voiceHeightRatio = 1.0 - baseHeightRatio;
                const baseHeight = waveformHeight * 0.1 * baseHeightRatio; // 基础高度
                const voiceHeight = waveformHeight * 0.8 * voiceHeightRatio; // 用户声音高度

                // 获取当前圆圈的声波高度缩放因子
                let waveHeightScale = 1.0;
                if (ringIndex < 4) {
                    waveHeightScale = params.innerCircles[ringIndex].waveHeight || 1.0;
                } else if (ringIndex === 4) {
                    waveHeightScale = params.outerCircle5.waveHeight || 1.0;
                } else {
                    waveHeightScale = params.outerCircle6.waveHeight || 1.0;
                }

                // Draw bars for ALL recorded samples (no step/skip)
                for (let i = 0; i < maxSamples; i++) {
                    const amplitude = ring.samples[i] || 0;

                    const barX = leftMargin + (i / ring.sampleCount) * waveformWidth;
                    // Fixed width for high density
                    const barWidth = Math.max(1, waveformWidth / ring.sampleCount);
                    const barHeight = (baseHeight + amplitude * voiceHeight) * waveHeightScale;

                    // Draw bar from center line
                    const barY = y + waveformHeight / 2 - barHeight / 2;

                    // Create gradient for bar
                    const gradient = ctx.createLinearGradient(barX, barY + barHeight, barX, barY);
                    gradient.addColorStop(0, getGradientColor(baseColor, 0)); // Dark at bottom
                    gradient.addColorStop(1, getGradientColor(baseColor, amplitude)); // Light at top

                    ctx.fillStyle = gradient;
                    ctx.fillRect(barX, barY, barWidth, barHeight);
                }
            }
        }
    });

    ctx.restore();
}

function draw() {
    // Clear canvas
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);

    // Draw base layer (circles and segments)
    if (layerVisibility.showBaseLayer) {
        // Draw the 4 nested circles with colors from palette
        const fourCircles = calculateFourCircles();
        fourCircles.forEach((circle, index) => {
            const color = getBaseLayerColor(index);
            drawCircleOutline(circle.cx, circle.cy, circle.radius, color);
        });

        // Draw outer segmented circles
        drawSegmentedCircle(5, params.outerCircle5);
        drawSegmentedCircle(6, params.outerCircle6);

        // Draw center point for reference
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(config.centerX, config.centerY, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw voiceprint layer
    if (layerVisibility.showVoiceprintLayer) {
        drawVoiceprint();
    }

    // Raw waveforms removed - no longer one-to-one mapping with rings
}

// Setup recording controls
function setupRecordingControls() {
    const permissionBtn = document.getElementById('requestPermission');
    const startBtn = document.getElementById('startRecording');
    const simulateBtn = document.getElementById('simulateInput');
    const styleSelect = document.getElementById('voiceprintStyle');

    // Permission request button
    if (permissionBtn) {
        permissionBtn.addEventListener('click', requestMicrophonePermission);
    }

    // Press and hold recording
    if (startBtn) {
        startBtn.addEventListener('mousedown', () => {
            if (!isRecording && !isSimulating && micPermissionGranted) {
                startRecording();
            }
        });

        startBtn.addEventListener('mouseup', () => {
            if (isRecording) {
                stopRecording();
            }
        });

        // Also stop if mouse leaves the button while pressed
        startBtn.addEventListener('mouseleave', () => {
            if (isRecording) {
                stopRecording();
            }
        });

        // Touch support
        startBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (!isRecording && !isSimulating && micPermissionGranted) {
                startRecording();
            }
        });

        startBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (isRecording) {
                stopRecording();
            }
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
            draw();
        });
    }

    // Base height ratio control
    const baseHeightRatioSlider = document.getElementById('baseHeightRatio');
    const baseHeightRatioValue = document.getElementById('baseHeightRatioValue');
    if (baseHeightRatioSlider && baseHeightRatioValue) {
        baseHeightRatioSlider.addEventListener('input', (e) => {
            voiceprintSettings.baseHeightRatio = parseFloat(e.target.value);
            baseHeightRatioValue.textContent = (voiceprintSettings.baseHeightRatio * 100).toFixed(0) + '%';
            draw();
        });
    }

    // Layer visibility controls
    const baseCheck = document.getElementById('showBaseLayer');
    const voiceCheck = document.getElementById('showVoiceprintLayer');
    const rawWaveCheck = document.getElementById('showRawWaveforms');

    if (baseCheck) {
        baseCheck.addEventListener('change', (e) => {
            layerVisibility.showBaseLayer = e.target.checked;
            draw();
        });
    }

    if (voiceCheck) {
        voiceCheck.addEventListener('change', (e) => {
            layerVisibility.showVoiceprintLayer = e.target.checked;
            draw();
        });
    }

    if (rawWaveCheck) {
        rawWaveCheck.addEventListener('change', (e) => {
            voiceprintSettings.showRawWaveforms = e.target.checked;
            draw();
        });
    }

    // Color Mode Selector
    const colorModeSelect = document.getElementById('colorMode');
    if (colorModeSelect) {
        colorModeSelect.addEventListener('change', (e) => {
            voiceprintSettings.colorMode = e.target.value;
            console.log('🎨 Color mode changed to:', e.target.value);
            console.log('🎨 Palette:', PALETTES[e.target.value]);
            // Force redraw immediately
            draw();
        });
    }
}

// Request microphone permission
async function requestMicrophonePermission() {
    const permissionBtn = document.getElementById('requestPermission');
    const startBtn = document.getElementById('startRecording');

    try {
        // Request microphone access
        mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });

        // Create audio context
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        // 增加 fftSize 以提高频率分辨率，更好地捕获高频信号
        // 1024 提供 512 个频率bin，频率分辨率约为 43Hz (44100/1024)
        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0.3; // 降低平滑度，提高响应速度
        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);

        // Connect microphone
        microphone = audioContext.createMediaStreamSource(mediaStream);
        microphone.connect(analyser);

        // Initialize rings if empty
        if (voiceprintData.rings.length === 0) {
            initializeVoiceprintRings();
        }

        micPermissionGranted = true;

        // Update UI
        if (permissionBtn) {
            permissionBtn.disabled = true;
            permissionBtn.textContent = '✓ 麦克风已就绪';
            permissionBtn.style.background = 'linear-gradient(135deg, #00c896 0%, #00a878 100%)';
        }
        if (startBtn) {
            startBtn.disabled = false;
        }

        console.log('Microphone permission granted');
    } catch (err) {
        console.error('Failed to access microphone:', err);
        alert('无法访问麦克风。请确保已授权麦克风权限。');
    }
}

// Start recording
function startRecording() {
    if (isRecording || isSimulating || !micPermissionGranted) return;

    isRecording = true;
    const simulateBtn = document.getElementById('simulateInput');
    if (simulateBtn) simulateBtn.disabled = true;

    // Start recording loop
    recordAudioData();

    console.log('Recording started (press and hold)');
}

// Start simulation
function startSimulation() {
    if (isRecording || isSimulating) return;

    // Initialize if needed
    if (!dataArray) {
        // Create dummy data array if audio context not started
        // 匹配新的 fftSize = 1024 (512 bins)
        dataArray = new Uint8Array(512);
    }

    isSimulating = true;

    // Update UI
    const startBtn = document.getElementById('startRecording');
    const simulateBtn = document.getElementById('simulateInput');

    if (startBtn) startBtn.disabled = true;
    if (simulateBtn) {
        simulateBtn.textContent = "停止模拟";
        simulateBtn.style.background = "linear-gradient(135deg, #ff9966 0%, #ff5e62 100%)";
    }

    // Initialize rings if empty
    if (voiceprintData.rings.length === 0) {
        initializeVoiceprintRings();
    }

    // Reset recording state for overlapping recording
    voiceprintData.globalSampleIndex = 0;
    voiceprintData.rings.forEach(ring => {
        ring.sampleIndex = 0;
    });

    // Start loop
    recordAudioData();
}

// Stop recording
function stopRecording() {
    if (isRecording) {
        isRecording = false;
        // Don't close the audio context or disconnect mic - keep them ready for next recording
        console.log('Recording stopped');
    }

    if (isSimulating) {
        isSimulating = false;
        console.log('Simulation stopped');
    }

    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }

    // Update UI
    const simulateBtn = document.getElementById('simulateInput');
    if (simulateBtn) {
        simulateBtn.textContent = "模拟输入";
        simulateBtn.style.background = "linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)";
        simulateBtn.disabled = false;
    }
}

// Initialize voiceprint rings based on current circle configuration
function initializeVoiceprintRings() {
    const maxRadius = config.maxRadius * 0.5;
    const fourCircles = calculateFourCircles();

    // Add rings for inner 4 circles (standard circles)
    // 增加样本数到3倍（180 -> 540），让柱状图更细更密集
    const firstRingSampleCount = 540; // Number of samples for first ring
    fourCircles.forEach((circle, index) => {
        const samplesPerRing = 540; // Number of samples per ring
        // Calculate start global index: each ring starts at 25% of previous ring
        // Ring 0: starts at 0
        // Ring 1: starts at ring0.sampleCount * 0.25
        // Ring 2: starts at ring0.sampleCount * 0.5
        // Ring 3: starts at ring0.sampleCount * 0.75
        const startGlobalIndex = Math.floor(firstRingSampleCount * index * 0.25);
        voiceprintData.rings.push({
            type: 'circle', // Standard circle
            radius: circle.radius,
            centerX: circle.cx,
            centerY: circle.cy,
            samples: new Array(samplesPerRing).fill(0),
            sampleCount: samplesPerRing,
            sampleIndex: 0, // Independent sample index for this ring
            startGlobalIndex: startGlobalIndex // Global index when this ring starts recording
        });
    });

    // Add rings for outer circles (segmented paths)
    // Circle 5 - segmented path
    const r5 = config.maxRadius * params.outerCircle5.radius;
    const segmentCount5 = params.outerCircle5.segmentCount;
    const initialUnit5 = 1.0 / segmentCount5;
    const actualSegmentLength5 = initialUnit5 * (1 + params.outerCircle5.segmentLength);
    const segmentAngleSize5 = actualSegmentLength5 * Math.PI * 2;
    const gapSize5 = (Math.PI * 2 - segmentAngleSize5 * segmentCount5) / segmentCount5;

    // Circle 4 (index 3) starts at firstRingSampleCount * 0.75
    // Circle 5 (index 4) starts at firstRingSampleCount * 1.0 (or at 25% of circle 4)
    const startGlobalIndex5 = Math.floor(firstRingSampleCount * 4 * 0.25);
    voiceprintData.rings.push({
        type: 'segmented', // Segmented circle
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
        sampleIndex: 0, // Independent sample index for this ring
        startGlobalIndex: startGlobalIndex5 // Global index when this ring starts recording
    });

    // Circle 6 - segmented path
    const r6 = config.maxRadius * params.outerCircle6.radius;
    const segmentCount6 = params.outerCircle6.segmentCount;
    const initialUnit6 = 1.0 / segmentCount6;
    const actualSegmentLength6 = initialUnit6 * (1 + params.outerCircle6.segmentLength);
    const segmentAngleSize6 = actualSegmentLength6 * Math.PI * 2;
    const gapSize6 = (Math.PI * 2 - segmentAngleSize6 * segmentCount6) / segmentCount6;

    // Circle 6 (index 5) starts at firstRingSampleCount * 1.25 (or at 25% of circle 5)
    const startGlobalIndex6 = Math.floor(firstRingSampleCount * 5 * 0.25);
    voiceprintData.rings.push({
        type: 'segmented', // Segmented circle
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
        sampleIndex: 0, // Independent sample index for this ring
        startGlobalIndex: startGlobalIndex6 // Global index when this ring starts recording
    });
}

// Record audio data and map to rings
function recordAudioData() {
    if (!isRecording && !isSimulating) return;

    if (isRecording) {
        analyser.getByteFrequencyData(dataArray);
    } else if (isSimulating) {
        // Generate fake data
        const time = Date.now() / 1000;
        for (let i = 0; i < dataArray.length; i++) {
            // Mix of sine waves and noise
            const val = (Math.sin(time * 5 + i * 0.1) + 1) * 60 +
                (Math.sin(time * 10 + i * 0.5) + 1) * 40 +
                Math.random() * 30;
            dataArray[i] = Math.min(255, val);
        }
    }

    // 计算加权振幅，增强高频响应
    // 人声频率分布：
    // - 低频 (0-1000Hz): 元音，能量大
    // - 中频 (1000-4000Hz): 部分辅音
    // - 高频 (4000-22050Hz): 清音、辅音，能量小但重要
    // 使用加权平均，给高频更高的权重，避免被低频淹没

    const sampleRate = audioContext ? audioContext.sampleRate : 44100;
    const nyquist = sampleRate / 2; // 奈奎斯特频率
    const binWidth = nyquist / dataArray.length; // 每个bin的频率宽度

    let weightedSum = 0;
    let weightSum = 0;

    for (let i = 0; i < dataArray.length; i++) {
        const frequency = i * binWidth; // 当前bin对应的频率
        const amplitude = dataArray[i] / 255; // 归一化到 0-1

        // 计算权重：频率越高，权重越大（指数增长）
        // 低频(0-1000Hz): 权重 1.0
        // 中频(1000-4000Hz): 权重 1.0-2.5
        // 高频(4000Hz+): 权重 2.5-5.0
        let weight = 1.0;
        if (frequency > 1000) {
            // 中频：线性增长
            weight = 1.0 + (frequency - 1000) / 3000 * 1.5;
        }
        if (frequency > 4000) {
            // 高频：继续增长
            weight = 2.5 + (frequency - 4000) / (nyquist - 4000) * 2.5;
        }

        // 使用 RMS (均方根) 而不是简单平均，更好地反映能量
        weightedSum += amplitude * amplitude * weight;
        weightSum += weight;
    }

    // RMS 计算：sqrt(加权平均)
    const rmsAmplitude = Math.sqrt(weightedSum / weightSum);
    const normalizedAmplitude = Math.min(1.0, rmsAmplitude * 1.5); // 稍微放大，增强响应

    // 重叠录制逻辑：同时向所有应该录制的圈写入数据
    // 每个圈从前一圈的25%时开始，但都画完整的100%
    // 为了加快录制速度，每帧录制3个样本（速度快1.5倍，平衡性能和效果）
    const samplesPerFrame = 3; // 每帧录制的样本数（3倍速度）

    for (let i = 0; i < samplesPerFrame; i++) {
        voiceprintData.rings.forEach((ring, ringIndex) => {
            // 检查当前全局索引是否达到该圈的起始索引
            if (voiceprintData.globalSampleIndex >= ring.startGlobalIndex) {
                // 检查该圈是否已经录制完成
                if (ring.sampleIndex < ring.sampleCount) {
                    // 将当前音频数据写入该圈
                    ring.samples[ring.sampleIndex] = normalizedAmplitude;
                    ring.sampleIndex++;
                }
            }
        });

        // 增加全局样本索引
        voiceprintData.globalSampleIndex++;
    }

    // 检查是否所有圈都录制完成
    // 需要检查所有圈是否都完成了，而不是只检查第一圈
    let allRingsComplete = true;
    for (let i = 0; i < voiceprintData.rings.length; i++) {
        const ring = voiceprintData.rings[i];
        // 如果该圈已经开始录制（globalSampleIndex >= startGlobalIndex），但还没完成
        if (voiceprintData.globalSampleIndex >= ring.startGlobalIndex) {
            if (ring.sampleIndex < ring.sampleCount) {
                allRingsComplete = false;
                break;
            }
        } else {
            // 如果该圈还没开始录制，说明还没完成
            allRingsComplete = false;
            break;
        }
    }

    // Redraw
    draw();

    // Continue recording if not all rings are complete and user is still holding the button
    if (!allRingsComplete && (isRecording || isSimulating)) {
        animationFrameId = requestAnimationFrame(recordAudioData);
    } else if (allRingsComplete) {
        // All rings complete, stop recording
        if (isRecording) {
            isRecording = false;
        }
        if (isSimulating) {
            isSimulating = false;
        }
    }
}

// Draw voiceprint on canvas with different styles
function drawVoiceprint() {
    if (voiceprintData.rings.length === 0) return;

    voiceprintData.rings.forEach((ring, ringIndex) => {
        // 使用每个圈独立的 sampleIndex 来绘制
        const maxSamples = ring.sampleIndex;

        // 只绘制已经开始录制的圈（sampleIndex > 0）
        if (maxSamples > 0) {
            if (ring.type === 'circle') {
                drawCircleVoiceprint(ring, ringIndex, maxSamples);
            } else if (ring.type === 'segmented') {
                drawSegmentedVoiceprint(ring, ringIndex, maxSamples);
            }
        }
    });
}

// Helper: Get color based on amplitude (Neon Rose Palette)
let lastLoggedMode = null;
function getAmplitudeColor(amplitude, ringIndex = 0) {
    const modeKey = voiceprintSettings.colorMode;
    const palette = PALETTES[modeKey] || PALETTES['romantic-classic']; // Fallback
    const type = palette.type;

    // Debug: Log once per mode change
    if (lastLoggedMode !== modeKey) {
        console.log(`🎨 getAmplitudeColor called with mode: ${modeKey}, type: ${type}, ringIndex: ${ringIndex}`);
        lastLoggedMode = modeKey;
    }

    if (type === 'romantic') {
        // Romantic Multi-color: Base color from palette + amplitude modulation
        const rings = palette.rings;
        // Use ringIndex to pick color, cycle if needed
        const baseColorHex = rings[ringIndex % rings.length];

        // Simple lightening for high amplitude
        // Note: For true "romantic" feel, we might want to keep colors stable or just brighten slightly.
        return baseColorHex;
    } else if (type === 'gradient') {
        // Gradient: Interpolate based on amplitude
        const start = palette.start;
        const end = palette.end;

        const t = amplitude;
        const h = start.h + (end.h - start.h) * t;
        const s = start.s + (end.s - start.s) * t;
        const l = start.l + (end.l - start.l) * t;

        return `hsl(${h}, ${s}%, ${l}%)`;
    } else if (type === 'monochrome') {
        // Monochrome: Fixed Hue, modulate Lightness
        const base = palette;
        // Higher amplitude -> Lighter/Brighter
        const l = base.l + amplitude * 30;
        return `hsl(${base.h}, ${base.s}%, ${Math.min(100, l)}%)`;
    }

    return 'white'; // Should not happen
}

// Helper: Get base layer color (for outline circles)
function getBaseLayerColor(ringIndex) {
    const modeKey = voiceprintSettings.colorMode;
    const palette = PALETTES[modeKey] || PALETTES['romantic-classic'];
    const type = palette.type;

    if (type === 'romantic') {
        // Return the color for this ring
        const rings = palette.rings;
        return rings[ringIndex % rings.length];
    } else if (type === 'gradient') {
        // For gradient mode, use the start color for all base layers
        const start = palette.start;
        return `hsl(${start.h}, ${start.s}%, ${start.l}%)`;
    } else if (type === 'monochrome') {
        // For monochrome, use the base color
        return `hsl(${palette.h}, ${palette.s}%, ${palette.l}%)`;
    }
    return 'white';
}

// Helper: Smooth interpolation between points
function smoothPoint(ring, index, maxSamples) {
    const prev = ring.samples[(index - 1 + maxSamples) % maxSamples] || 0;
    const curr = ring.samples[index] || 0;
    const next = ring.samples[(index + 1) % maxSamples] || 0;
    return (prev + curr * 2 + next) / 4; // Weighted average
}

// Draw voiceprint on standard circle
// Draw voiceprint on standard circle
function drawCircleVoiceprint(ring, ringIndex, maxSamples) {
    const style = voiceprintSettings.style;

    // Get LIVE geometry from params instead of cached ring values
    const fourCircles = calculateFourCircles();
    // Safety check: if ringIndex is out of bounds for inner circles (0-3)
    if (ringIndex >= fourCircles.length) return;

    const liveCircle = fourCircles[ringIndex];
    const centerX = liveCircle.cx;
    const centerY = liveCircle.cy;
    const baseRadius = liveCircle.radius;

    if (style === 'gradient-wave') {
        // Professional gradient waveform with color based on amplitude
        ctx.lineWidth = 3;
        ctx.shadowBlur = 5; // 降低阴影模糊度以提升性能（从15降到5）
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Draw with gradient colors
        // We use a loop to draw segments, but we want them smooth.
        // For gradient color per segment, we can't use a single path.
        // But for "Rose" look, we want connected smooth curves.

        // 获取当前圆圈的声波高度缩放因子
        const waveHeightScale = params.innerCircles[ringIndex].waveHeight || 1.0;
        // 计算基础高度和用户声音高度的占比
        const baseHeightRatio = voiceprintSettings.baseHeightRatio;
        const voiceHeightRatio = 1.0 - baseHeightRatio;
        const baseVariation = 50 * baseHeightRatio; // 基础变化
        const voiceVariation = 50 * voiceHeightRatio; // 用户声音变化

        for (let i = 0; i < maxSamples - 1; i++) {
            const amplitude = ring.samples[i];
            const nextAmplitude = ring.samples[(i + 1) % ring.sampleCount];

            // Calculate angles
            const angle = (i / ring.sampleCount) * Math.PI * 2;
            const nextAngle = ((i + 1) / ring.sampleCount) * Math.PI * 2;

            // Calculate radii with variation (基础 + 用户声音)
            const variation = (baseVariation + amplitude * voiceVariation) * waveHeightScale;
            const nextVariation = (baseVariation + nextAmplitude * voiceVariation) * waveHeightScale;
            const r1 = baseRadius + variation;
            const r2 = baseRadius + nextVariation;

            // Points
            const x1 = centerX + Math.cos(angle) * r1;
            const y1 = centerY + Math.sin(angle) * r1;
            const x2 = centerX + Math.cos(nextAngle) * r2;
            const y2 = centerY + Math.sin(nextAngle) * r2;

            // Simple smoothing: Control points? 
            // For short segments, straight lines with high sample count look okay, 
            // but let's try to be smoother if possible. 
            // Given the structure, drawing small segments is necessary for color gradients.

            ctx.strokeStyle = getAmplitudeColor(amplitude, ringIndex);
            ctx.shadowColor = getAmplitudeColor(amplitude, ringIndex);
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }

        // Connect last to first if full circle
        if (maxSamples === ring.sampleCount) {
            const i = ring.sampleCount - 1;
            const amplitude = ring.samples[i];
            const nextAmplitude = ring.samples[0];
            const angle = (i / ring.sampleCount) * Math.PI * 2;
            const nextAngle = 0;

            const r1 = baseRadius + (baseVariation + amplitude * voiceVariation) * waveHeightScale;
            const r2 = baseRadius + (baseVariation + nextAmplitude * voiceVariation) * waveHeightScale;

            const x1 = centerX + Math.cos(angle) * r1;
            const y1 = centerY + Math.sin(angle) * r1;
            const x2 = centerX + Math.cos(nextAngle) * r2;
            const y2 = centerY + Math.sin(nextAngle) * r2;

            ctx.strokeStyle = getAmplitudeColor(amplitude, ringIndex);
            ctx.shadowColor = getAmplitudeColor(amplitude, ringIndex);
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }

    } else if (style === 'spectrum-bars') {
        // Spectrum bars for standard circles with gradient colors
        ctx.shadowBlur = 3; // 降低阴影模糊度以提升性能（从8降到3）

        // Get base color for this circle from palette
        const baseColor = getBaseLayerColor(ringIndex);

        // Calculate dynamic bar width based on circumference to ensure consistent density
        // Outer circles (larger radius) will have wider bars
        const circumference = 2 * Math.PI * baseRadius;
        const unitWidth = circumference / maxSamples;
        // Use 30% of unit width for bar (更细的柱子), leaving 70% for gap. Min 0.5px.
        const barWidth = Math.max(0.5, unitWidth * 0.3);

        // 计算基础高度和用户声音高度的占比
        const baseHeightRatio = voiceprintSettings.baseHeightRatio; // 基础高度占比（默认0.4）
        const voiceHeightRatio = 1.0 - baseHeightRatio; // 用户声音高度占比（默认0.6）

        // 总高度基准值（相当于原来的60）
        const totalHeightBase = 60;
        const baseHeight = totalHeightBase * baseHeightRatio; // 基础高度（静音时）
        const voiceHeight = totalHeightBase * voiceHeightRatio; // 用户声音高度（最大）

        // 获取当前圆圈的声波高度缩放因子
        const waveHeightScale = params.innerCircles[ringIndex].waveHeight || 1.0;

        // 性能优化：预计算固定值，避免在循环中重复计算
        const baseColorDark = getGradientColor(baseColor, 0);
        ctx.shadowColor = baseColor;

        // Draw bars for ALL recorded samples (no step/skip)
        for (let i = 0; i < maxSamples; i++) {
            const amplitude = ring.samples[i] || 0;
            // Removed amplitude threshold to show silence baseline

            const angle = (i / ring.sampleCount) * Math.PI * 2;
            // 计算实际高度：基础高度 + 用户声音高度 * 振幅，然后乘以缩放因子
            const barLength = (baseHeight + amplitude * voiceHeight) * waveHeightScale;

            // 预计算三角函数（只计算一次）
            const cosA = Math.cos(angle);
            const sinA = Math.sin(angle);

            // Base point on the circle
            const x1 = centerX + cosA * baseRadius;
            const y1 = centerY + sinA * baseRadius;

            // Tip point (radial outward)
            const x2 = centerX + cosA * (baseRadius + barLength);
            const y2 = centerY + sinA * (baseRadius + barLength);

            // Calculate bar width direction (perpendicular to radial)
            const perpAngle = angle + Math.PI / 2;
            const dx = Math.cos(perpAngle) * barWidth * 0.5;
            const dy = Math.sin(perpAngle) * barWidth * 0.5;

            // 性能优化：使用简化的gradient（只在有声音时创建，否则使用纯色）
            if (amplitude > 0.05) {
                const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
                gradient.addColorStop(0, baseColorDark); // Dark at base
                gradient.addColorStop(1, getGradientColor(baseColor, amplitude)); // Light at tip
                ctx.fillStyle = gradient;
            } else {
                // 静音时使用纯色，避免创建gradient
                ctx.fillStyle = baseColorDark;
            }

            ctx.beginPath();
            ctx.moveTo(x1 - dx, y1 - dy);
            ctx.lineTo(x1 + dx, y1 + dy);
            ctx.lineTo(x2 + dx, y2 + dy);
            ctx.lineTo(x2 - dx, y2 - dy);
            ctx.closePath();
            ctx.fill();
        }
    } else if (style === 'glow-particles') {
        // Glowing particle effect
        ctx.shadowBlur = 5; // 降低阴影模糊度以提升性能（从10降到5） // 降低阴影模糊度以提升性能（从20降到10）
        const particleCount = Math.min(80, maxSamples);
        const step = Math.floor(maxSamples / particleCount);

        // 获取当前圆圈的声波高度缩放因子
        const waveHeightScale = params.innerCircles[ringIndex].waveHeight || 1.0;
        // 计算基础高度和用户声音高度的占比
        const baseHeightRatio = voiceprintSettings.baseHeightRatio;
        const voiceHeightRatio = 1.0 - baseHeightRatio;
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
            const y = centerY + Math.sin(angle) * r;

            const color = getAmplitudeColor(amplitude, ringIndex);
            ctx.fillStyle = color;
            ctx.shadowColor = color;

            const size = 2 + amplitude * 4;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
    } else {
        // Generic fallback for other styles
        ctx.shadowBlur = 5; // 降低阴影模糊度以提升性能（从10降到5）

        // 获取当前圆圈的声波高度缩放因子
        const waveHeightScale = params.innerCircles[ringIndex].waveHeight || 1.0;
        // 计算基础高度和用户声音高度的占比
        const baseHeightRatio = voiceprintSettings.baseHeightRatio;
        const voiceHeightRatio = 1.0 - baseHeightRatio;
        const baseVar = 40 * baseHeightRatio;
        const voiceVar = 40 * voiceHeightRatio;

        for (let i = 0; i < maxSamples; i++) {
            const amplitude = ring.samples[i];
            if (amplitude < 0.05) continue;

            const angle = (i / ring.sampleCount) * Math.PI * 2;
            const variation = (baseVar + amplitude * voiceVar) * waveHeightScale;
            const r = baseRadius + variation;
            const x = centerX + Math.cos(angle) * r;
            const y = centerY + Math.sin(angle) * r;

            ctx.fillStyle = getAmplitudeColor(amplitude, ringIndex);
            ctx.shadowColor = ctx.fillStyle;

            const size = 2 + amplitude * 3;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// Draw voiceprint on segmented path (Circle 5 and 6)
// Draws samples in the SAME ORDER they were recorded (sequentially across all segments)
function drawSegmentedVoiceprint(ring, ringIndex, maxSamples) {
    const style = voiceprintSettings.style;

    // Get LIVE geometry from params
    let circleParams;
    if (ringIndex === 4) circleParams = params.outerCircle5;
    else if (ringIndex === 5) circleParams = params.outerCircle6;
    else return;

    const numSegments = circleParams.segmentCount;
    const baseRadius = config.maxRadius * circleParams.radius;

    // Calculate segment geometry
    const initialUnit = 1.0 / numSegments;
    const actualSegmentLength = initialUnit * (1 + circleParams.segmentLength);
    const segmentAngleSize = actualSegmentLength * Math.PI * 2;
    const gapSize = (Math.PI * 2 - segmentAngleSize * numSegments) / numSegments;

    // 在克隆体模式下，每个segment的最大样本数（固定值）
    const maxSamplesPerSegment = Math.floor(ring.sampleCount / numSegments);
    // 当前实际应该绘制的样本数（不能超过已录制的样本数）
    const actualSamplesToDraw = Math.min(maxSamples, maxSamplesPerSegment);

    const cosRot = Math.cos(circleParams.selfRotation);
    const sinRot = Math.sin(circleParams.selfRotation);

    // 获取当前圆圈的声波高度缩放因子
    const waveHeightScale = circleParams.waveHeight || 1.0;
    // 计算基础高度和用户声音高度的占比
    const baseHeightRatio = voiceprintSettings.baseHeightRatio;
    const voiceHeightRatio = 1.0 - baseHeightRatio;
    const baseVariation = 50 * baseHeightRatio; // 基础变化
    const voiceVariation = 50 * voiceHeightRatio; // 用户声音变化

    if (style === 'gradient-wave') {
        ctx.lineWidth = 3;
        ctx.shadowBlur = 5; // 降低阴影模糊度以提升性能（从15降到5）
        ctx.lineCap = 'round';

        // 优化：所有花瓣同时绘制，每个花瓣从自己的起点持续绘制到终点
        // 所有segment同时开始，使用相同的样本数据，从0持续绘制到actualSamplesToDraw

        // 外层循环：遍历样本位置（所有segment共享相同的进度）
        for (let posInSegment = 0; posInSegment < actualSamplesToDraw - 1; posInSegment++) {
            // 所有segment使用相同的样本索引（克隆体模式）
            const sampleIdx = posInSegment;
            const amplitude1 = ring.samples[sampleIdx] || 0;
            const amplitude2 = ring.samples[sampleIdx + 1] || 0;
            const avgAmplitude = (amplitude1 + amplitude2) / 2;

            // 优化：在此处设置样式，因为同一时刻所有花瓣颜色相同
            ctx.strokeStyle = getAmplitudeColor(avgAmplitude, ringIndex);
            ctx.shadowColor = getAmplitudeColor(avgAmplitude, ringIndex);
            ctx.beginPath();

            // 内层循环：同时绘制所有segment（花瓣）
            for (let segmentIdx = 0; segmentIdx < numSegments; segmentIdx++) {
                // Calculate segment angles (pre-calculate for efficiency)
                const segmentStartAngle = circleParams.globalRotation + segmentIdx * (segmentAngleSize + gapSize);
                const segmentMidAngle = segmentStartAngle + segmentAngleSize * 0.5;
                const centerX = config.centerX + Math.cos(segmentMidAngle) * baseRadius;
                const centerY = config.centerY + Math.sin(segmentMidAngle) * baseRadius;

                // Calculate angles（每个segment从自己的起点开始绘制）
                // t基于固定的maxSamplesPerSegment计算，而不是基于动态的actualSamplesToDraw
                const t1 = posInSegment / maxSamplesPerSegment;
                const t2 = (posInSegment + 1) / maxSamplesPerSegment;
                const angle1 = segmentStartAngle + t1 * segmentAngleSize;
                const angle2 = segmentStartAngle + t2 * segmentAngleSize;

                // Calculate points (基础 + 用户声音)
                const variation1 = (baseVariation + amplitude1 * voiceVariation) * waveHeightScale;
                const variation2 = (baseVariation + amplitude2 * voiceVariation) * waveHeightScale;
                const r1 = baseRadius + variation1;
                const r2 = baseRadius + variation2;

                const ox1 = config.centerX + Math.cos(angle1) * r1;
                const oy1 = config.centerY + Math.sin(angle1) * r1;
                const ox2 = config.centerX + Math.cos(angle2) * r2;
                const oy2 = config.centerY + Math.sin(angle2) * r2;

                // Apply self-rotation
                const dx1 = ox1 - centerX;
                const dy1 = oy1 - centerY;
                const rx1 = dx1 * cosRot - dy1 * sinRot;
                const ry1 = dx1 * sinRot + dy1 * cosRot;
                const x1 = centerX + rx1;
                const y1 = centerY + ry1;

                const dx2 = ox2 - centerX;
                const dy2 = oy2 - centerY;
                const rx2 = dx2 * cosRot - dy2 * sinRot;
                const ry2 = dx2 * sinRot + dy2 * cosRot;
                const x2 = centerX + rx2;
                const y2 = centerY + ry2;

                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
            }
            ctx.stroke();
        }
    } else if (style === 'spectrum-bars') {
        ctx.shadowBlur = 3; // 降低阴影模糊度以提升性能（从8降到3）

        // Calculate dynamic bar width based on effective circumference
        // Effective circumference = total length of all segments
        const totalArcAngle = segmentAngleSize * numSegments;
        const effectiveCircumference = totalArcAngle * baseRadius;
        const unitWidth = effectiveCircumference / maxSamples;
        // Use 30% of unit width for bar (更细的柱子), leaving 70% for gap. Min 0.5px.
        const barWidth = Math.max(0.5, unitWidth * 0.3);

        // 计算基础高度和用户声音高度的占比
        const baseHeightRatio = voiceprintSettings.baseHeightRatio; // 基础高度占比（默认0.15）
        const voiceHeightRatio = 1.0 - baseHeightRatio; // 用户声音高度占比（默认0.85）

        // 总高度基准值（相当于原来的60）
        const totalHeightBase = 60;
        const baseHeight = totalHeightBase * baseHeightRatio; // 基础高度（静音时）
        const voiceHeight = totalHeightBase * voiceHeightRatio; // 用户声音高度（最大）

        // 获取当前圆圈的声波高度缩放因子
        const waveHeightScale = circleParams.waveHeight || 1.0;

        // 性能优化：预计算所有segment的固定值
        const segmentCache = [];
        for (let segmentIdx = 0; segmentIdx < numSegments; segmentIdx++) {
            const baseColor = getBaseLayerColor(ringIndex);
            const segmentStartAngle = circleParams.globalRotation + segmentIdx * (segmentAngleSize + gapSize);
            const segmentMidAngle = segmentStartAngle + segmentAngleSize * 0.5;
            const centerX = config.centerX + Math.cos(segmentMidAngle) * baseRadius;
            const centerY = config.centerY + Math.sin(segmentMidAngle) * baseRadius;
            const baseColorDark = getGradientColor(baseColor, 0);

            segmentCache.push({
                baseColor,
                baseColorDark,
                segmentStartAngle,
                centerX,
                centerY
            });
        }

        // 优化：所有花瓣同时绘制，每个花瓣从自己的起点持续绘制到终点
        // 所有segment同时开始，使用相同的样本数据，从0持续绘制到actualSamplesToDraw

        // 外层循环：遍历样本位置（所有segment共享相同的进度）
        for (let posInSegment = 0; posInSegment < actualSamplesToDraw; posInSegment++) {
            // 所有segment使用相同的样本索引（克隆体模式）
            const sampleIdx = posInSegment;
            const amplitude = ring.samples[sampleIdx] || 0;

            // 预计算t值（所有segment共享）
            const t = posInSegment / maxSamplesPerSegment;

            // 内层循环：同时绘制所有segment（花瓣）
            for (let segmentIdx = 0; segmentIdx < numSegments; segmentIdx++) {
                const cache = segmentCache[segmentIdx];

                // Calculate angle for this position（每个segment从自己的起点开始绘制）
                const angle = cache.segmentStartAngle + t * segmentAngleSize;

                // 预计算三角函数
                const cosA = Math.cos(angle);
                const sinA = Math.sin(angle);

                // Calculate base and tip points
                const ox1 = config.centerX + cosA * baseRadius;
                const oy1 = config.centerY + sinA * baseRadius;

                // 计算实际高度：基础高度 + 用户声音高度 * 振幅，然后乘以缩放因子
                const barLength = (baseHeight + amplitude * voiceHeight) * waveHeightScale;
                const ox2 = config.centerX + cosA * (baseRadius + barLength);
                const oy2 = config.centerY + sinA * (baseRadius + barLength);

                // Apply self-rotation
                const dx1 = ox1 - cache.centerX;
                const dy1 = oy1 - cache.centerY;
                const rx1 = dx1 * cosRot - dy1 * sinRot;
                const ry1 = dx1 * sinRot + dy1 * cosRot;
                const x1 = cache.centerX + rx1;
                const y1 = cache.centerY + ry1;

                const dx2 = ox2 - cache.centerX;
                const dy2 = oy2 - cache.centerY;
                const rx2 = dx2 * cosRot - dy2 * sinRot;
                const ry2 = dx2 * sinRot + dy2 * cosRot;
                const x2 = cache.centerX + rx2;
                const y2 = cache.centerY + ry2;

                // Calculate bar width direction
                const barAngle = Math.atan2(y2 - y1, x2 - x1);
                const perpAngle = barAngle + Math.PI / 2;
                const cosPerpA = Math.cos(perpAngle);
                const sinPerpA = Math.sin(perpAngle);
                const dxBar = cosPerpA * barWidth * 0.5;
                const dyBar = sinPerpA * barWidth * 0.5;

                // 性能优化：使用简化的gradient（只在有声音时创建，否则使用纯色）
                if (amplitude > 0.05) {
                    const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
                    gradient.addColorStop(0, cache.baseColorDark);
                    gradient.addColorStop(1, getGradientColor(cache.baseColor, amplitude));
                    ctx.fillStyle = gradient;
                } else {
                    ctx.fillStyle = cache.baseColorDark;
                }

                ctx.shadowColor = cache.baseColor;

                ctx.beginPath();
                ctx.moveTo(x1 - dxBar, y1 - dyBar);
                ctx.lineTo(x1 + dxBar, y1 + dyBar);
                ctx.lineTo(x2 + dxBar, y2 + dyBar);
                ctx.lineTo(x2 - dxBar, y2 - dyBar);
                ctx.closePath();
                ctx.fill();
            }
        }
    } else {
        // Generic fallback - draw dots for all recorded samples
        // 优化：所有花瓣同时绘制，每个花瓣从自己的起点持续绘制到终点
        // 所有segment同时开始，使用相同的样本数据，从0持续绘制到actualSamplesToDraw
        const baseVar = 40 * baseHeightRatio;
        const voiceVar = 40 * voiceHeightRatio;

        // 外层循环：遍历样本位置（所有segment共享相同的进度）
        for (let posInSegment = 0; posInSegment < actualSamplesToDraw; posInSegment++) {
            // 所有segment使用相同的样本索引（克隆体模式）
            const sampleIdx = posInSegment;
            const amplitude = ring.samples[sampleIdx] || 0;
            if (amplitude < 0.05) continue;

            // 内层循环：同时绘制所有segment（花瓣）
            for (let segmentIdx = 0; segmentIdx < numSegments; segmentIdx++) {
                // Calculate segment angles (pre-calculate for efficiency)
                const segmentStartAngle = circleParams.globalRotation + segmentIdx * (segmentAngleSize + gapSize);
                const segmentMidAngle = segmentStartAngle + segmentAngleSize * 0.5;
                const centerX = config.centerX + Math.cos(segmentMidAngle) * baseRadius;
                const centerY = config.centerY + Math.sin(segmentMidAngle) * baseRadius;

                // Calculate angle（每个segment从自己的起点开始绘制）
                // t基于固定的maxSamplesPerSegment计算，而不是基于动态的actualSamplesToDraw
                const t = posInSegment / maxSamplesPerSegment;
                const angle = segmentStartAngle + t * segmentAngleSize;

                // Calculate point (基础 + 用户声音)
                const variation = (baseVar + amplitude * voiceVar) * waveHeightScale;
                const r = baseRadius + variation;
                const ox = config.centerX + Math.cos(angle) * r;
                const oy = config.centerY + Math.sin(angle) * r;

                // Apply self-rotation
                const dx = ox - centerX;
                const dy = oy - centerY;
                const rx = dx * cosRot - dy * sinRot;
                const ry = dx * sinRot + dy * cosRot;
                const x = centerX + rx;
                const y = centerY + ry;

                ctx.fillStyle = getAmplitudeColor(amplitude);
                ctx.shadowColor = ctx.fillStyle;
                ctx.shadowBlur = 5; // 降低阴影模糊度以提升性能（从10降到5）

                ctx.beginPath();
                ctx.arc(x, y, 2 + amplitude * 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    ctx.shadowBlur = 0;
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
