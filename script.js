let canvas, ctx;
let width, height;

// Initial radius values (reference point for randomization)
const initialRadii = [0.14, 0.22, 0.32, 0.44]; // Circle 1, 2, 3, 4

// 默认状态参数
const defaultState = {
    innerCircles: [
        { radius: 0.14, offsetX: 0.025, offsetY: -0.005, waveHeight: 0.5 },   // Circle 1
        { radius: 0.22, offsetX: 0.045, offsetY: 0.025, waveHeight: 0.5 }, // Circle 2
        { radius: 0.32, offsetX: -0.01, offsetY: 0.025, waveHeight: 1.0 }, // Circle 3
    ],
    // Circle 4 - 现在也是分段花瓣形式
    innerCircle4: {
        radius: 0.22, // 22.0%
        offsetX: -0.005, // -0.50%
        offsetY: 0.0, // 0.00%
        segmentCount: 1, // 默认1（整圆）
        segmentLength: 0.0,
        selfRotation: 0.0,
        globalRotation: 0.0,
        waveHeight: 1.0
    },
    outerCircle5: {
        radius: 0.33,
        segmentCount: 3,
        segmentLength: 0.02,
        selfRotation: 0.190,
        globalRotation: 0,
        waveHeight: 2.0
    },
    outerCircle6: {
        radius: 0.46,
        segmentCount: 4,
        segmentLength: 0.0,
        selfRotation: 0.120,
        globalRotation: 0.393,
        waveHeight: 2.0
    }
};

// 盛开状态参数（从新截图提取）
const bloomState = {
    innerCircles: [
        { radius: 0.14, offsetX: 0.025, offsetY: -0.005, waveHeight: 1.0 },   // Circle 1: 半径14.0%, X偏移2.50%, Y偏移-0.50%, 声波高度1.0x
        { radius: 0.23, offsetX: 0.015, offsetY: 0.04, waveHeight: 1.0 }, // Circle 2: 半径23.0%, X偏移1.50%, Y偏移4.00%, 声波高度1.0x
        { radius: 0.33, offsetX: -0.005, offsetY: 0.025, waveHeight: 1.5 }, // Circle 3: 半径33.0%, X偏移-0.50%, Y偏移2.50%, 声波高度1.5x
    ],
    // Circle 4 - 现在也是分段花瓣形式
    innerCircle4: {
        radius: 0.23, // 23.0%
        offsetX: -0.01, // -1.00%
        offsetY: 0.01, // 1.00%
        segmentCount: 3, // 分段数量: 3
        segmentLength: 0.03, // 3.0% (实际: 34.3%)
        selfRotation: 0.160, // 0.160
        globalRotation: 2.380, // 2.380
        waveHeight: 2.0 // 2.0x
    },
    outerCircle5: {
        radius: 0.35, // 半径35.0%
        segmentCount: 4, // 分段数量: 4
        segmentLength: 0.02, // 每段长度变化比例: 2.0%
        selfRotation: 0.280, // 自旋角: 0.280弧度
        globalRotation: 0.280, // 整体旋转角: 0.280弧度
        waveHeight: 2.5 // 声波高度: 2.5x
    },
    outerCircle6: {
        radius: 0.55, // 半径55.0%
        segmentCount: 5, // 分段数量: 5
        segmentLength: 0.04, // 每段长度变化比例: 4.0%
        selfRotation: 0.170, // 自旋角: 0.170弧度
        globalRotation: 0.790, // 整体旋转角: 0.790弧度
        waveHeight: 2.5 // 声波高度: 2.5x
    }
};

// 绽放状态参数（从三个截图提取）
const blossomState = {
    innerCircles: [
        { radius: 0.14, offsetX: 0.025, offsetY: -0.005, waveHeight: 1.1 },   // Circle 1: 半径14.0%, X偏移2.50%, Y偏移-0.50%, 声波高度1.1x
        { radius: 0.23, offsetX: 0.015, offsetY: 0.04, waveHeight: 1.2 }, // Circle 2: 半径23.0%, X偏移1.50%, Y偏移4.00%, 声波高度1.2x
        { radius: 0.33, offsetX: -0.005, offsetY: 0.025, waveHeight: 1.9 }, // Circle 3: 半径33.0%, X偏移-0.50%, Y偏移2.50%, 声波高度1.9x
    ],
    // Circle 4 - 分段花瓣形式
    innerCircle4: {
        radius: 0.23, // 23.0%
        offsetX: -0.01, // -1.00%
        offsetY: 0.01, // 1.00%
        segmentCount: 3, // 分段数量: 3
        segmentLength: 0.03, // 3.0% (实际: 34.3%)
        selfRotation: 0.160, // 0.160
        globalRotation: 2.380, // 2.380
        waveHeight: 2.5 // 2.5x
    },
    outerCircle5: {
        radius: 0.36, // 半径36.0%
        segmentCount: 4, // 分段数量: 4
        segmentLength: 0.02, // 每段长度变化比例: 2.0%
        selfRotation: 0.300, // 自旋角: 0.300弧度
        globalRotation: 0.780, // 整体旋转角: 0.780弧度
        waveHeight: 2.5 // 声波高度: 2.5x
    },
    outerCircle6: {
        radius: 0.56, // 半径56.0%
        segmentCount: 5, // 分段数量: 5
        segmentLength: 0.04, // 每段长度变化比例: 4.0%
        selfRotation: 0.340, // 自旋角: 0.340弧度
        globalRotation: 0.790, // 整体旋转角: 0.790弧度
        waveHeight: 2.5 // 声波高度: 2.5x
    }
};

// Parameters configuration (当前使用的参数，会在过渡时插值)
const params = {
    // Inner 3 circles (Circle 1, 2, 3)
    innerCircles: [
        { radius: 0.14, offsetX: 0.025, offsetY: -0.005, color: null, waveHeight: 0.5 },   // Circle 1
        { radius: 0.22, offsetX: 0.045, offsetY: 0.025, color: null, waveHeight: 0.5 }, // Circle 2
        { radius: 0.32, offsetX: -0.01, offsetY: 0.025, color: null, waveHeight: 1.0 }, // Circle 3
    ],
    // Circle 4 - 现在也是分段花瓣形式
    innerCircle4: {
        radius: 0.22, // 22.0%
        offsetX: -0.005, // -0.50%
        offsetY: 0.0, // 0.00%
        segmentCount: 1, // 默认1（整圆）
        segmentLength: 0.0,
        selfRotation: 0.0,
        globalRotation: 0.0,
        segmentColors: [], // Array of colors for each segment
        waveHeight: 1.0
    },
    // Outer circle 5 (segmented petals)
    outerCircle5: {
        radius: 0.33,
        segmentCount: 3,
        segmentLength: 0.02,
        selfRotation: 0.190,
        globalRotation: 0,
        segmentColors: [], // Array of colors for each segment
        waveHeight: 2.0
    },
    // Outer circle 6 (segmented petals)
    outerCircle6: {
        radius: 0.46,
        segmentCount: 4,
        segmentLength: 0.0,
        selfRotation: 0.120,
        globalRotation: 0.393,
        segmentColors: [], // Array of colors for each segment
        waveHeight: 2.0
    }
};

// 过渡进度 (0 = 默认状态, 100 = 盛开状态, 200 = 绽放状态)
let transitionProgress = 0;

// 颜色过渡进度 (0-100，循环切换所有配色方案)
let colorTransitionProgress = 0;

// 分段花瓣边缘渐变比例 (0-0.5，表示渐变区域占分段长度的比例)
let segmentFadeRatio = 0.1; // 默认10%

// 所有配色方案的列表（按顺序）
const COLOR_PALETTE_ORDER = [
    'romantic-classic',
    'romantic-ocean',
    'romantic-forest',
    'romantic-sunset',
    'gradient-pinkgold',
    'gradient-fire',
    'gradient-cool',
    'gradient-neon',
    'monochrome-red',
    'monochrome-blue',
    'monochrome-gold',
    'monochrome-purple'
];

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
    // 单色渐变：以主色为主，搭配色相相近、明暗对比的颜色
    // 深色在中心(start)，明亮色在外围(end)
    'gradient-pinkgold': {
        type: 'gradient',
        start: { h: 330, s: 90, l: 35 },  // 深粉/玫瑰红 (中心，深色)
        end: { h: 340, s: 100, l: 85 }     // 浅粉/粉金 (外围，明亮)
    },
    'gradient-fire': {
        type: 'gradient',
        start: { h: 0, s: 100, l: 30 },   // 深红/暗红 (中心，深色)
        end: { h: 10, s: 100, l: 75 }     // 浅红/粉红 (外围，明亮)
    },
    'gradient-cool': {
        type: 'gradient',
        start: { h: 270, s: 90, l: 35 },  // 深紫/暗紫 (中心，深色)
        end: { h: 280, s: 100, l: 80 }    // 浅紫/粉紫 (外围，明亮)
    },
    'gradient-neon': {
        type: 'gradient',
        start: { h: 240, s: 90, l: 30 },  // 深蓝/暗蓝 (中心，深色)
        end: { h: 320, s: 100, l: 80 }     // 粉/粉紫 (外围，明亮) - 赛博霓虹经典配色
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
    // Inner 3 circles (Circle 1, 2, 3)
    params.innerCircles.forEach(circle => {
        circle.color = getRandomRainbowColor();
    });

    // Circle 4 segments
    params.innerCircle4.segmentColors = [];
    for (let i = 0; i < params.innerCircle4.segmentCount; i++) {
        params.innerCircle4.segmentColors.push(getRandomRainbowColor());
    }

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
    setupRecordingControls();
    setupStateControls(); // 设置状态控制
    updateStateButtons(); // 初始化按钮状态
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
            <input type="range" id="innerWaveHeight${index}" min="0.5" max="2.5" step="0.1" value="${circle.waveHeight || 1.0}">
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

    // Circle 4 controls (segmented petals)
    const innerCircle4Controls = document.getElementById('innerCircle4Controls');
    innerCircle4Controls.innerHTML = `
        <div class="control-group">
            <label>圆圈 4 - 半径 (相对于最大半径):</label>
            <input type="range" id="inner4Radius" min="0.05" max="0.5" step="0.01" value="${params.innerCircle4.radius}">
            <span class="value-display" id="inner4RadiusValue">${(params.innerCircle4.radius * 100).toFixed(1)}%</span>
        </div>
        <div class="control-group">
            <label>圆圈 4 - X偏移:</label>
            <input type="range" id="inner4X" min="-0.1" max="0.1" step="0.005" value="${params.innerCircle4.offsetX}">
            <span class="value-display" id="inner4XValue">${(params.innerCircle4.offsetX * 100).toFixed(2)}%</span>
        </div>
        <div class="control-group">
            <label>圆圈 4 - Y偏移:</label>
            <input type="range" id="inner4Y" min="-0.1" max="0.1" step="0.005" value="${params.innerCircle4.offsetY}">
            <span class="value-display" id="inner4YValue">${(params.innerCircle4.offsetY * 100).toFixed(2)}%</span>
        </div>
        <div class="control-group">
            <label>圆圈 4 - 分段数量:</label>
            <input type="range" id="inner4SegmentCount" min="1" max="4" step="1" value="${params.innerCircle4.segmentCount}">
            <span class="value-display" id="inner4SegmentCountValue">${params.innerCircle4.segmentCount}</span>
        </div>
        <div class="control-group">
            <label>圆圈 4 - 每段长度 (变化比例):</label>
            <input type="range" id="inner4Segment" min="0" max="0.2" step="0.01" value="${params.innerCircle4.segmentLength}">
            <span class="value-display" id="inner4SegmentValue">${(() => {
                const initialUnit = 1.0 / params.innerCircle4.segmentCount;
                const actualLength = initialUnit * (1 + params.innerCircle4.segmentLength);
                return (params.innerCircle4.segmentLength * 100).toFixed(1) + '% (实际: ' + (actualLength * 100).toFixed(1) + '%)';
            })()}</span>
        </div>
        <div class="control-group">
            <label>圆圈 4 - 自旋角 (弧度):</label>
            <input type="range" id="inner4SelfRot" min="-0.5" max="0.5" step="0.01" value="${params.innerCircle4.selfRotation}">
            <span class="value-display" id="inner4SelfRotValue">${params.innerCircle4.selfRotation.toFixed(3)}</span>
        </div>
        <div class="control-group">
            <label>圆圈 4 - 整体旋转角 (弧度):</label>
            <input type="range" id="inner4GlobalRot" min="0" max="6.28" step="0.01" value="${params.innerCircle4.globalRotation}">
            <span class="value-display" id="inner4GlobalRotValue">${params.innerCircle4.globalRotation.toFixed(3)}</span>
        </div>
        <div class="control-group">
            <label>圆圈 4 - 声波高度:</label>
            <input type="range" id="inner4WaveHeight" min="0.5" max="2.5" step="0.1" value="${params.innerCircle4.waveHeight || 1.0}">
            <span class="value-display" id="inner4WaveHeightValue">${(params.innerCircle4.waveHeight || 1.0).toFixed(1)}x</span>
        </div>
    `;

    // Add event listeners for Circle 4
    document.getElementById('inner4Radius').addEventListener('input', (e) => {
        params.innerCircle4.radius = parseFloat(e.target.value);
        document.getElementById('inner4RadiusValue').textContent = (params.innerCircle4.radius * 100).toFixed(1) + '%';
        draw();
    });
    document.getElementById('inner4X').addEventListener('input', (e) => {
        params.innerCircle4.offsetX = parseFloat(e.target.value);
        document.getElementById('inner4XValue').textContent = (params.innerCircle4.offsetX * 100).toFixed(2) + '%';
        draw();
    });
    document.getElementById('inner4Y').addEventListener('input', (e) => {
        params.innerCircle4.offsetY = parseFloat(e.target.value);
        document.getElementById('inner4YValue').textContent = (params.innerCircle4.offsetY * 100).toFixed(2) + '%';
        draw();
    });
    document.getElementById('inner4SegmentCount').addEventListener('input', (e) => {
        params.innerCircle4.segmentCount = parseInt(e.target.value);
        document.getElementById('inner4SegmentCountValue').textContent = params.innerCircle4.segmentCount;
        const initialUnit = 1.0 / params.innerCircle4.segmentCount;
        const actualLength = initialUnit * (1 + params.innerCircle4.segmentLength);
        document.getElementById('inner4SegmentValue').textContent = (params.innerCircle4.segmentLength * 100).toFixed(1) + '% (实际: ' + (actualLength * 100).toFixed(1) + '%)';
        // 重新初始化颜色和声纹数据
        initializeColors();
        if (voiceprintData.rings.length > 0) {
            // 清空并重新初始化声纹数据
            voiceprintData.rings = [];
            if (isRecording || isSimulating) {
                initializeVoiceprintRings();
            }
        }
        draw();
    });
    document.getElementById('inner4Segment').addEventListener('input', (e) => {
        params.innerCircle4.segmentLength = parseFloat(e.target.value);
        const initialUnit = 1.0 / params.innerCircle4.segmentCount;
        const actualLength = initialUnit * (1 + params.innerCircle4.segmentLength);
        document.getElementById('inner4SegmentValue').textContent = (params.innerCircle4.segmentLength * 100).toFixed(1) + '% (实际: ' + (actualLength * 100).toFixed(1) + '%)';
        draw();
    });
    document.getElementById('inner4SelfRot').addEventListener('input', (e) => {
        params.innerCircle4.selfRotation = parseFloat(e.target.value);
        document.getElementById('inner4SelfRotValue').textContent = params.innerCircle4.selfRotation.toFixed(3);
        draw();
    });
    document.getElementById('inner4GlobalRot').addEventListener('input', (e) => {
        params.innerCircle4.globalRotation = parseFloat(e.target.value);
        document.getElementById('inner4GlobalRotValue').textContent = params.innerCircle4.globalRotation.toFixed(3);
        draw();
    });
    document.getElementById('inner4WaveHeight').addEventListener('input', (e) => {
        params.innerCircle4.waveHeight = parseFloat(e.target.value);
        document.getElementById('inner4WaveHeightValue').textContent = params.innerCircle4.waveHeight.toFixed(1) + 'x';
        draw();
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
            <input type="range" id="outer5WaveHeight" min="0.5" max="3.0" step="0.1" value="${params.outerCircle5.waveHeight || 1.0}">
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
            <input type="range" id="outer6WaveHeight" min="0.5" max="3.0" step="0.1" value="${params.outerCircle6.waveHeight || 1.0}">
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

// Calculate positions for 3 nested circles using parameters (Circle 1, 2, 3)
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

// Draw segmented circle (for circles 4, 5 and 6)
function drawSegmentedCircle(circleNumber, circleParams) {
    const numSegments = circleParams.segmentCount;
    const baseRadius = config.maxRadius * circleParams.radius;
    
    // Get center position (circle 4 has offset, circles 5 and 6 are centered)
    const centerX = circleParams.offsetX !== undefined 
        ? config.centerX + config.maxRadius * circleParams.offsetX 
        : config.centerX;
    const centerY = circleParams.offsetY !== undefined 
        ? config.centerY + config.maxRadius * circleParams.offsetY 
        : config.centerY;

    // Calculate segment geometry
    const initialUnit = 1.0 / numSegments;
    const actualSegmentLength = initialUnit * (1 + circleParams.segmentLength);
    const segmentAngleSize = actualSegmentLength * Math.PI * 2;
    const gapSize = (Math.PI * 2 - segmentAngleSize * numSegments) / numSegments;

    let currentAngle = circleParams.globalRotation;

    for (let i = 0; i < numSegments; i++) {
        // Get color for this segment from palette
        // ringIndex: 3 for circle 4, 4 for circle 5, 5 for circle 6
        const ringIndex = circleNumber === 4 ? 3 : (4 + (circleNumber - 5));
        const segmentColor = getBaseLayerColor(ringIndex);
        ctx.strokeStyle = segmentColor;
        ctx.lineWidth = 2;

        // Calculate segment midpoint angle (the center point of this arc on the circle)
        const segmentMidAngle = currentAngle + segmentAngleSize * 0.5;

        // Calculate the center point of the arc on the circle (this is the rotation center for self-rotation)
        const segmentCenterX = centerX + Math.cos(segmentMidAngle) * baseRadius;
        const segmentCenterY = centerY + Math.sin(segmentMidAngle) * baseRadius;

        // Draw this segment as an independent arc with fade in/out at edges
        // 计算过渡区域：占分段长度的10%
        const fadeRatio = segmentFadeRatio; // 使用全局可调节参数
        const fadeAngleSize = segmentAngleSize * fadeRatio;
        
        // 分段绘制：开始渐变、中间实心、结束渐变
        const segments = 60;
        const fadeSegments = Math.max(1, Math.floor(segments * fadeRatio));
        const solidSegments = segments - 2 * fadeSegments;
        
        // 保存当前globalAlpha
        const savedAlpha = ctx.globalAlpha;
        
        // 1. 开始渐变区域（从透明到不透明）
        ctx.beginPath();
        for (let j = 0; j <= fadeSegments; j++) {
            const t = j / fadeSegments; // 0 到 1
            const alpha = t; // 透明度从0到1
            ctx.globalAlpha = savedAlpha * alpha;
            
            const angleT = t * fadeRatio; // 在整个分段中的位置（0到0.1）
            const originalAngle = currentAngle + angleT * segmentAngleSize;
            
            const originalX = centerX + Math.cos(originalAngle) * baseRadius;
            const originalY = centerY + Math.sin(originalAngle) * baseRadius;
            
            const dx = originalX - segmentCenterX;
            const dy = originalY - segmentCenterY;
            const cosRot = Math.cos(circleParams.selfRotation);
            const sinRot = Math.sin(circleParams.selfRotation);
            const rotatedX = dx * cosRot - dy * sinRot;
            const rotatedY = dx * sinRot + dy * cosRot;
            const x = segmentCenterX + rotatedX;
            const y = segmentCenterY + rotatedY;
            
            if (j === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
        
        // 2. 中间实心区域（完全不透明）
        ctx.globalAlpha = savedAlpha;
        ctx.beginPath();
        for (let j = 0; j <= solidSegments; j++) {
            const t = j / solidSegments; // 0 到 1
            const angleT = fadeRatio + t * (1 - 2 * fadeRatio); // 从0.1到0.9
            const originalAngle = currentAngle + angleT * segmentAngleSize;
            
            const originalX = centerX + Math.cos(originalAngle) * baseRadius;
            const originalY = centerY + Math.sin(originalAngle) * baseRadius;
            
            const dx = originalX - segmentCenterX;
            const dy = originalY - segmentCenterY;
            const cosRot = Math.cos(circleParams.selfRotation);
            const sinRot = Math.sin(circleParams.selfRotation);
            const rotatedX = dx * cosRot - dy * sinRot;
            const rotatedY = dx * sinRot + dy * cosRot;
            const x = segmentCenterX + rotatedX;
            const y = segmentCenterY + rotatedY;
            
            if (j === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
        
        // 3. 结束渐变区域（从不透明到透明）
        ctx.beginPath();
        for (let j = 0; j <= fadeSegments; j++) {
            const t = j / fadeSegments; // 0 到 1
            const alpha = 1 - t; // 透明度从1到0
            ctx.globalAlpha = savedAlpha * alpha;
            
            const angleT = (1 - fadeRatio) + t * fadeRatio; // 从0.9到1.0
            const originalAngle = currentAngle + angleT * segmentAngleSize;
            
            const originalX = centerX + Math.cos(originalAngle) * baseRadius;
            const originalY = centerY + Math.sin(originalAngle) * baseRadius;
            
            const dx = originalX - segmentCenterX;
            const dy = originalY - segmentCenterY;
            const cosRot = Math.cos(circleParams.selfRotation);
            const sinRot = Math.sin(circleParams.selfRotation);
            const rotatedX = dx * cosRot - dy * sinRot;
            const rotatedY = dx * sinRot + dy * cosRot;
            const x = segmentCenterX + rotatedX;
            const y = segmentCenterY + rotatedY;
            
            if (j === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
        
        // 恢复globalAlpha
        ctx.globalAlpha = savedAlpha;

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
        if (ringIndex < 3) {
            baseColor = params.innerCircles[ringIndex].color;
        } else if (ringIndex === 3) {
            // Circle 4 - segmented
            const colors = params.innerCircle4.segmentColors;
            baseColor = colors[0] || '#fff';
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
                if (ringIndex < 3) {
                    waveHeightScale = params.innerCircles[ringIndex].waveHeight || 1.0;
                } else if (ringIndex === 3) {
                    waveHeightScale = params.innerCircle4.waveHeight || 1.0;
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
        // Draw the 3 inner circles (Circle 1, 2, 3) with colors from palette
        const threeCircles = calculateFourCircles(); // 现在只返回3个圆
        threeCircles.forEach((circle, index) => {
            const color = getBaseLayerColor(index);
            drawCircleOutline(circle.cx, circle.cy, circle.radius, color);
        });

        // Draw Circle 4 as segmented circle (with offset support)
        drawSegmentedCircle(4, params.innerCircle4);

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

    // 分段边缘渐变比例控制
    const segmentFadeRatioSlider = document.getElementById('segmentFadeRatio');
    const segmentFadeRatioValue = document.getElementById('segmentFadeRatioValue');
    if (segmentFadeRatioSlider && segmentFadeRatioValue) {
        segmentFadeRatioSlider.addEventListener('input', (e) => {
            segmentFadeRatio = parseFloat(e.target.value);
            segmentFadeRatioValue.textContent = (segmentFadeRatio * 100).toFixed(0) + '%';
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

// 设置状态控制
function setupStateControls() {
    const defaultBtn = document.getElementById('defaultStateButton');
    const bloomBtn = document.getElementById('bloomStateButton');
    const blossomBtn = document.getElementById('blossomStateButton');
    const transitionSlider = document.getElementById('transitionSlider');
    const transitionValue = document.getElementById('transitionValue');

    // 默认状态按钮
    if (defaultBtn) {
        defaultBtn.addEventListener('click', () => {
            transitionProgress = 0;
            if (transitionSlider) transitionSlider.value = 0;
            if (transitionValue) transitionValue.textContent = '0%';
            applyTransition(0);
            updateStateButtons();
        });
    }

    // 盛开状态按钮
    if (bloomBtn) {
        bloomBtn.addEventListener('click', () => {
            transitionProgress = 100;
            if (transitionSlider) transitionSlider.value = 100;
            if (transitionValue) transitionValue.textContent = '100%';
            applyTransition(100);
            updateStateButtons();
        });
    }

    // 绽放状态按钮
    if (blossomBtn) {
        blossomBtn.addEventListener('click', () => {
            transitionProgress = 200;
            if (transitionSlider) transitionSlider.value = 200;
            if (transitionValue) transitionValue.textContent = '200%';
            applyTransition(200);
            updateStateButtons();
        });
    }
    
    // 注意：300%会循环回到默认状态（0%）

    // 过渡进度条
    if (transitionSlider) {
        transitionSlider.addEventListener('input', (e) => {
            transitionProgress = parseFloat(e.target.value);
            if (transitionValue) transitionValue.textContent = transitionProgress.toFixed(0) + '%';
            applyTransition(transitionProgress);
            updateStateButtons();
        });
    }

    // 颜色过渡进度条
    const colorTransitionSlider = document.getElementById('colorTransitionSlider');
    const colorTransitionValue = document.getElementById('colorTransitionValue');
    if (colorTransitionSlider) {
        colorTransitionSlider.addEventListener('input', (e) => {
            colorTransitionProgress = parseFloat(e.target.value);
            if (colorTransitionValue) colorTransitionValue.textContent = colorTransitionProgress.toFixed(0) + '%';
            draw(); // 重绘以应用新的颜色过渡
        });
    }
}

// 更新状态按钮的激活状态
function updateStateButtons() {
    const defaultBtn = document.getElementById('defaultStateButton');
    const bloomBtn = document.getElementById('bloomStateButton');
    const blossomBtn = document.getElementById('blossomStateButton');
    
    if (defaultBtn && bloomBtn && blossomBtn) {
        // 清除所有激活状态
        defaultBtn.classList.remove('active');
        bloomBtn.classList.remove('active');
        blossomBtn.classList.remove('active');
        
        // 处理循环：300回到0
        const normalizedProgress = transitionProgress % 300;
        
        // 根据进度设置激活状态
        if (normalizedProgress === 0 || normalizedProgress >= 250) {
            // 0 或接近300（250-300）时，显示默认状态
            defaultBtn.classList.add('active');
        } else if (normalizedProgress === 100) {
            bloomBtn.classList.add('active');
        } else if (normalizedProgress === 200) {
            blossomBtn.classList.add('active');
        } else {
            // 中间状态，根据更接近哪个来决定
            if (normalizedProgress < 50) {
                defaultBtn.classList.add('active');
            } else if (normalizedProgress < 150) {
                bloomBtn.classList.add('active');
            } else if (normalizedProgress < 250) {
                blossomBtn.classList.add('active');
            } else {
                defaultBtn.classList.add('active');
            }
        }
    }
}

// 应用过渡（根据进度在三个状态之间循环插值：0=默认，100=盛开，200=绽放，300=默认）
function applyTransition(progress) {
    let sourceState, targetState, t;
    
    // 处理循环：300回到0（默认状态）
    const normalizedProgress = progress % 300;
    
    // 确定源状态和目标状态
    if (normalizedProgress <= 100) {
        // 0-100: 默认状态 -> 盛开状态
        sourceState = defaultState;
        targetState = bloomState;
        t = normalizedProgress / 100; // 0 到 1
    } else if (normalizedProgress <= 200) {
        // 100-200: 盛开状态 -> 绽放状态
        sourceState = bloomState;
        targetState = blossomState;
        t = (normalizedProgress - 100) / 100; // 0 到 1
    } else {
        // 200-300: 绽放状态 -> 默认状态（循环）
        sourceState = blossomState;
        targetState = defaultState;
        t = (normalizedProgress - 200) / 100; // 0 到 1
    }

    // 插值内部圆圈参数（Circle 1, 2, 3）
    params.innerCircles.forEach((circle, index) => {
        const sourceCircle = sourceState.innerCircles[index];
        const targetCircle = targetState.innerCircles[index];
        
        circle.radius = lerp(sourceCircle.radius, targetCircle.radius, t);
        circle.offsetX = lerp(sourceCircle.offsetX, targetCircle.offsetX, t);
        circle.offsetY = lerp(sourceCircle.offsetY, targetCircle.offsetY, t);
        circle.waveHeight = lerp(sourceCircle.waveHeight, targetCircle.waveHeight, t);
    });

    // 插值圆4参数
    const source4 = sourceState.innerCircle4;
    const target4 = targetState.innerCircle4;
    params.innerCircle4.radius = lerp(source4.radius, target4.radius, t);
    params.innerCircle4.offsetX = lerp(source4.offsetX, target4.offsetX, t);
    params.innerCircle4.offsetY = lerp(source4.offsetY, target4.offsetY, t);
    params.innerCircle4.segmentCount = Math.round(lerp(source4.segmentCount, target4.segmentCount, t));
    params.innerCircle4.segmentLength = lerp(source4.segmentLength, target4.segmentLength, t);
    params.innerCircle4.selfRotation = lerp(source4.selfRotation, target4.selfRotation, t);
    params.innerCircle4.globalRotation = lerp(source4.globalRotation, target4.globalRotation, t);
    params.innerCircle4.waveHeight = lerp(source4.waveHeight, target4.waveHeight, t);

    // 插值圆5参数
    const source5 = sourceState.outerCircle5;
    const target5 = targetState.outerCircle5;
    params.outerCircle5.radius = lerp(source5.radius, target5.radius, t);
    params.outerCircle5.segmentCount = Math.round(lerp(source5.segmentCount, target5.segmentCount, t));
    params.outerCircle5.segmentLength = lerp(source5.segmentLength, target5.segmentLength, t);
    params.outerCircle5.selfRotation = lerp(source5.selfRotation, target5.selfRotation, t);
    params.outerCircle5.globalRotation = lerp(source5.globalRotation, target5.globalRotation, t);
    params.outerCircle5.waveHeight = lerp(source5.waveHeight, target5.waveHeight, t);

    // 插值圆6参数
    const source6 = sourceState.outerCircle6;
    const target6 = targetState.outerCircle6;
    params.outerCircle6.radius = lerp(source6.radius, target6.radius, t);
    params.outerCircle6.segmentCount = Math.round(lerp(source6.segmentCount, target6.segmentCount, t));
    params.outerCircle6.segmentLength = lerp(source6.segmentLength, target6.segmentLength, t);
    params.outerCircle6.selfRotation = lerp(source6.selfRotation, target6.selfRotation, t);
    params.outerCircle6.globalRotation = lerp(source6.globalRotation, target6.globalRotation, t);
    params.outerCircle6.waveHeight = lerp(source6.waveHeight, target6.waveHeight, t);

    // 更新UI控件以反映新值
    updateControlPanelUI();
    
    // 只更新颜色，不触碰声纹数据
    // 声纹数据在状态切换时应该保持不变
    initializeColors();
    
    // 重绘
    draw();
}

// 线性插值函数
function lerp(start, end, t) {
    return start + (end - start) * t;
}

// 更新控制面板UI以反映当前参数值
function updateControlPanelUI() {
    // 更新内部圆圈控件
    params.innerCircles.forEach((circle, index) => {
        const rSlider = document.getElementById(`innerR${index}`);
        const xSlider = document.getElementById(`innerX${index}`);
        const ySlider = document.getElementById(`innerY${index}`);
        const waveSlider = document.getElementById(`innerWaveHeight${index}`);

        if (rSlider) {
            rSlider.value = circle.radius;
            const valueDisplay = document.getElementById(`innerR${index}Value`);
            if (valueDisplay) valueDisplay.textContent = (circle.radius * 100).toFixed(1) + '%';
        }
        if (xSlider) {
            xSlider.value = circle.offsetX;
            const valueDisplay = document.getElementById(`innerX${index}Value`);
            if (valueDisplay) valueDisplay.textContent = (circle.offsetX * 100).toFixed(2) + '%';
        }
        if (ySlider) {
            ySlider.value = circle.offsetY;
            const valueDisplay = document.getElementById(`innerY${index}Value`);
            if (valueDisplay) valueDisplay.textContent = (circle.offsetY * 100).toFixed(2) + '%';
        }
        if (waveSlider) {
            waveSlider.value = circle.waveHeight;
            const valueDisplay = document.getElementById(`innerWaveHeight${index}Value`);
            if (valueDisplay) valueDisplay.textContent = circle.waveHeight.toFixed(1) + 'x';
        }
    });

    // 更新圆4控件
    const inner4Radius = document.getElementById('inner4Radius');
    const inner4X = document.getElementById('inner4X');
    const inner4Y = document.getElementById('inner4Y');
    const inner4SegmentCount = document.getElementById('inner4SegmentCount');
    const inner4Segment = document.getElementById('inner4Segment');
    const inner4SelfRot = document.getElementById('inner4SelfRot');
    const inner4GlobalRot = document.getElementById('inner4GlobalRot');
    const inner4WaveHeight = document.getElementById('inner4WaveHeight');

    if (inner4Radius) {
        inner4Radius.value = params.innerCircle4.radius;
        const valueDisplay = document.getElementById('inner4RadiusValue');
        if (valueDisplay) valueDisplay.textContent = (params.innerCircle4.radius * 100).toFixed(1) + '%';
    }
    if (inner4X) {
        inner4X.value = params.innerCircle4.offsetX;
        const valueDisplay = document.getElementById('inner4XValue');
        if (valueDisplay) valueDisplay.textContent = (params.innerCircle4.offsetX * 100).toFixed(2) + '%';
    }
    if (inner4Y) {
        inner4Y.value = params.innerCircle4.offsetY;
        const valueDisplay = document.getElementById('inner4YValue');
        if (valueDisplay) valueDisplay.textContent = (params.innerCircle4.offsetY * 100).toFixed(2) + '%';
    }
    if (inner4SegmentCount) {
        inner4SegmentCount.value = params.innerCircle4.segmentCount;
        const valueDisplay = document.getElementById('inner4SegmentCountValue');
        if (valueDisplay) valueDisplay.textContent = params.innerCircle4.segmentCount;
        const initialUnit = 1.0 / params.innerCircle4.segmentCount;
        const actualLength = initialUnit * (1 + params.innerCircle4.segmentLength);
        const segmentValue = document.getElementById('inner4SegmentValue');
        if (segmentValue) {
            segmentValue.textContent = (params.innerCircle4.segmentLength * 100).toFixed(1) + '% (实际: ' + (actualLength * 100).toFixed(1) + '%)';
        }
    }
    if (inner4Segment) {
        inner4Segment.value = params.innerCircle4.segmentLength;
        const initialUnit = 1.0 / params.innerCircle4.segmentCount;
        const actualLength = initialUnit * (1 + params.innerCircle4.segmentLength);
        const segmentValue = document.getElementById('inner4SegmentValue');
        if (segmentValue) {
            segmentValue.textContent = (params.innerCircle4.segmentLength * 100).toFixed(1) + '% (实际: ' + (actualLength * 100).toFixed(1) + '%)';
        }
    }
    if (inner4SelfRot) {
        inner4SelfRot.value = params.innerCircle4.selfRotation;
        const valueDisplay = document.getElementById('inner4SelfRotValue');
        if (valueDisplay) valueDisplay.textContent = params.innerCircle4.selfRotation.toFixed(3);
    }
    if (inner4GlobalRot) {
        inner4GlobalRot.value = params.innerCircle4.globalRotation;
        const valueDisplay = document.getElementById('inner4GlobalRotValue');
        if (valueDisplay) valueDisplay.textContent = params.innerCircle4.globalRotation.toFixed(3);
    }
    if (inner4WaveHeight) {
        inner4WaveHeight.value = params.innerCircle4.waveHeight;
        const valueDisplay = document.getElementById('inner4WaveHeightValue');
        if (valueDisplay) valueDisplay.textContent = params.innerCircle4.waveHeight.toFixed(1) + 'x';
    }

    // 更新圆5控件
    const outer5Radius = document.getElementById('outer5Radius');
    const outer5SegmentCount = document.getElementById('outer5SegmentCount');
    const outer5Segment = document.getElementById('outer5Segment');
    const outer5SelfRot = document.getElementById('outer5SelfRot');
    const outer5GlobalRot = document.getElementById('outer5GlobalRot');
    const outer5WaveHeight = document.getElementById('outer5WaveHeight');

    if (outer5Radius) {
        outer5Radius.value = params.outerCircle5.radius;
        const valueDisplay = document.getElementById('outer5RadiusValue');
        if (valueDisplay) valueDisplay.textContent = (params.outerCircle5.radius * 100).toFixed(1) + '%';
    }
    if (outer5SegmentCount) {
        outer5SegmentCount.value = params.outerCircle5.segmentCount;
        const valueDisplay = document.getElementById('outer5SegmentCountValue');
        if (valueDisplay) valueDisplay.textContent = params.outerCircle5.segmentCount;
        // 更新分段长度显示
        const initialUnit = 1.0 / params.outerCircle5.segmentCount;
        const actualLength = initialUnit * (1 + params.outerCircle5.segmentLength);
        const segmentValue = document.getElementById('outer5SegmentValue');
        if (segmentValue) {
            segmentValue.textContent = (params.outerCircle5.segmentLength * 100).toFixed(1) + '% (实际: ' + (actualLength * 100).toFixed(1) + '%)';
        }
    }
    if (outer5Segment) {
        outer5Segment.value = params.outerCircle5.segmentLength;
        const initialUnit = 1.0 / params.outerCircle5.segmentCount;
        const actualLength = initialUnit * (1 + params.outerCircle5.segmentLength);
        const segmentValue = document.getElementById('outer5SegmentValue');
        if (segmentValue) {
            segmentValue.textContent = (params.outerCircle5.segmentLength * 100).toFixed(1) + '% (实际: ' + (actualLength * 100).toFixed(1) + '%)';
        }
    }
    if (outer5SelfRot) {
        outer5SelfRot.value = params.outerCircle5.selfRotation;
        const valueDisplay = document.getElementById('outer5SelfRotValue');
        if (valueDisplay) valueDisplay.textContent = params.outerCircle5.selfRotation.toFixed(3);
    }
    if (outer5GlobalRot) {
        outer5GlobalRot.value = params.outerCircle5.globalRotation;
        const valueDisplay = document.getElementById('outer5GlobalRotValue');
        if (valueDisplay) valueDisplay.textContent = params.outerCircle5.globalRotation.toFixed(3);
    }
    if (outer5WaveHeight) {
        outer5WaveHeight.value = params.outerCircle5.waveHeight;
        const valueDisplay = document.getElementById('outer5WaveHeightValue');
        if (valueDisplay) valueDisplay.textContent = params.outerCircle5.waveHeight.toFixed(1) + 'x';
    }

    // 更新圆6控件
    const outer6Radius = document.getElementById('outer6Radius');
    const outer6SegmentCount = document.getElementById('outer6SegmentCount');
    const outer6Segment = document.getElementById('outer6Segment');
    const outer6SelfRot = document.getElementById('outer6SelfRot');
    const outer6GlobalRot = document.getElementById('outer6GlobalRot');
    const outer6WaveHeight = document.getElementById('outer6WaveHeight');

    if (outer6Radius) {
        outer6Radius.value = params.outerCircle6.radius;
        const valueDisplay = document.getElementById('outer6RadiusValue');
        if (valueDisplay) valueDisplay.textContent = (params.outerCircle6.radius * 100).toFixed(1) + '%';
    }
    if (outer6SegmentCount) {
        outer6SegmentCount.value = params.outerCircle6.segmentCount;
        const valueDisplay = document.getElementById('outer6SegmentCountValue');
        if (valueDisplay) valueDisplay.textContent = params.outerCircle6.segmentCount;
        // 更新分段长度显示
        const initialUnit = 1.0 / params.outerCircle6.segmentCount;
        const actualLength = initialUnit * (1 + params.outerCircle6.segmentLength);
        const segmentValue = document.getElementById('outer6SegmentValue');
        if (segmentValue) {
            segmentValue.textContent = (params.outerCircle6.segmentLength * 100).toFixed(1) + '% (实际: ' + (actualLength * 100).toFixed(1) + '%)';
        }
    }
    if (outer6Segment) {
        outer6Segment.value = params.outerCircle6.segmentLength;
        const initialUnit = 1.0 / params.outerCircle6.segmentCount;
        const actualLength = initialUnit * (1 + params.outerCircle6.segmentLength);
        const segmentValue = document.getElementById('outer6SegmentValue');
        if (segmentValue) {
            segmentValue.textContent = (params.outerCircle6.segmentLength * 100).toFixed(1) + '% (实际: ' + (actualLength * 100).toFixed(1) + '%)';
        }
    }
    if (outer6SelfRot) {
        outer6SelfRot.value = params.outerCircle6.selfRotation;
        const valueDisplay = document.getElementById('outer6SelfRotValue');
        if (valueDisplay) valueDisplay.textContent = params.outerCircle6.selfRotation.toFixed(3);
    }
    if (outer6GlobalRot) {
        outer6GlobalRot.value = params.outerCircle6.globalRotation;
        const valueDisplay = document.getElementById('outer6GlobalRotValue');
        if (valueDisplay) valueDisplay.textContent = params.outerCircle6.globalRotation.toFixed(3);
    }
    if (outer6WaveHeight) {
        outer6WaveHeight.value = params.outerCircle6.waveHeight;
        const valueDisplay = document.getElementById('outer6WaveHeightValue');
        if (valueDisplay) valueDisplay.textContent = params.outerCircle6.waveHeight.toFixed(1) + 'x';
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
    const threeCircles = calculateFourCircles(); // 现在只返回3个圆（Circle 1, 2, 3）

    // Add rings for inner 3 circles (standard circles)
    // 增加样本数到3倍（180 -> 540），让柱状图更细更密集
    const firstRingSampleCount = 540; // Number of samples for first ring
    threeCircles.forEach((circle, index) => {
        const samplesPerRing = 540; // Number of samples per ring
        // Calculate start global index: each ring starts at 25% of previous ring
        // Ring 0: starts at 0
        // Ring 1: starts at ring0.sampleCount * 0.25
        // Ring 2: starts at ring0.sampleCount * 0.5
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

    // Circle 4 - segmented path (now also segmented like circle 5 and 6)
    const r4 = config.maxRadius * params.innerCircle4.radius;
    const segmentCount4 = params.innerCircle4.segmentCount;
    const initialUnit4 = 1.0 / segmentCount4;
    const actualSegmentLength4 = initialUnit4 * (1 + params.innerCircle4.segmentLength);
    const segmentAngleSize4 = actualSegmentLength4 * Math.PI * 2;
    const gapSize4 = (Math.PI * 2 - segmentAngleSize4 * segmentCount4) / segmentCount4;

    // Circle 3 (index 2) starts at firstRingSampleCount * 0.5
    // Circle 4 (index 3) starts at firstRingSampleCount * 0.75
    const startGlobalIndex4 = Math.floor(firstRingSampleCount * 3 * 0.25);
    voiceprintData.rings.push({
        type: 'segmented', // Segmented circle
        baseRadius: r4,
        centerX: config.centerX + config.maxRadius * params.innerCircle4.offsetX,
        centerY: config.centerY + config.maxRadius * params.innerCircle4.offsetY,
        segmentCount: segmentCount4,
        segmentAngleSize: segmentAngleSize4,
        gapSize: gapSize4,
        globalRotation: params.innerCircle4.globalRotation,
        selfRotation: params.innerCircle4.selfRotation,
        samples: new Array(720).fill(0),
        sampleCount: 720,
        sampleIndex: 0, // Independent sample index for this ring
        startGlobalIndex: startGlobalIndex4 // Global index when this ring starts recording
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

// Helper: Get interpolated palette based on color transition progress
function getInterpolatedPalette() {
    if (colorTransitionProgress === 0) {
        // 如果颜色过渡为0，使用当前选择的配色方案
        return PALETTES[voiceprintSettings.colorMode] || PALETTES['romantic-classic'];
    }
    
    // 计算当前应该使用的两个配色方案
    const totalPalettes = COLOR_PALETTE_ORDER.length;
    const progress = (colorTransitionProgress / 100) * totalPalettes;
    const index1 = Math.floor(progress) % totalPalettes;
    const index2 = (index1 + 1) % totalPalettes; // 循环到第一个
    
    const palette1Key = COLOR_PALETTE_ORDER[index1];
    const palette2Key = COLOR_PALETTE_ORDER[index2];
    const palette1 = PALETTES[palette1Key];
    const palette2 = PALETTES[palette2Key];
    
    // 计算插值比例 (0-1)
    const t = progress - Math.floor(progress);
    
    // 如果两个配色方案类型相同，直接插值
    if (palette1.type === palette2.type) {
        return interpolatePalette(palette1, palette2, t);
    } else {
        // 如果类型不同，根据t选择更接近的
        return t < 0.5 ? palette1 : palette2;
    }
}

// Helper: Interpolate between two palettes of the same type
function interpolatePalette(palette1, palette2, t) {
    if (palette1.type === 'romantic' && palette2.type === 'romantic') {
        // 插值romantic类型的配色方案
        const rings = [];
        const maxRings = Math.max(palette1.rings.length, palette2.rings.length);
        for (let i = 0; i < maxRings; i++) {
            const color1 = hexToHsl(palette1.rings[i % palette1.rings.length]);
            const color2 = hexToHsl(palette2.rings[i % palette2.rings.length]);
            const h = lerpAngle(color1.h, color2.h, t);
            const s = lerp(color1.s, color2.s, t);
            const l = lerp(color1.l, color2.l, t);
            // 转换回hex格式以保持一致性
            rings.push(hslToHex(h, s, l));
        }
        return { type: 'romantic', rings: rings };
    } else if (palette1.type === 'gradient' && palette2.type === 'gradient') {
        // 插值gradient类型的配色方案
        const h1 = lerpAngle(palette1.start.h, palette2.start.h, t);
        const s1 = lerp(palette1.start.s, palette2.start.s, t);
        const l1 = lerp(palette1.start.l, palette2.start.l, t);
        const h2 = lerpAngle(palette1.end.h, palette2.end.h, t);
        const s2 = lerp(palette1.end.s, palette2.end.s, t);
        const l2 = lerp(palette1.end.l, palette2.end.l, t);
        return {
            type: 'gradient',
            start: { h: h1, s: s1, l: l1 },
            end: { h: h2, s: s2, l: l2 }
        };
    } else if (palette1.type === 'monochrome' && palette2.type === 'monochrome') {
        // 插值monochrome类型的配色方案
        const h = lerpAngle(palette1.h, palette2.h, t);
        const s = lerp(palette1.s, palette2.s, t);
        const l = lerp(palette1.l, palette2.l, t);
        return { type: 'monochrome', h: h, s: s, l: l };
    }
    
    // 如果类型不匹配，返回第一个
    return palette1;
}

// Helper: Convert hex color to HSL
function hexToHsl(hex) {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    
    if (max === min) {
        h = s = 0; // achromatic
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }
    
    return { h: h * 360, s: s * 100, l: l * 100 };
}

// Helper: Convert HSL to hex color
function hslToHex(h, s, l) {
    h = h / 360;
    s = s / 100;
    l = l / 100;
    
    let r, g, b;
    
    if (s === 0) {
        r = g = b = l; // achromatic
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };
        
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }
    
    const toHex = (c) => {
        const hex = Math.round(c * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Helper: Linear interpolation for angles (handles 360° wrap)
function lerpAngle(a1, a2, t) {
    const diff = ((a2 - a1 + 180) % 360) - 180;
    return (a1 + diff * t + 360) % 360;
}

// Helper: Get color based on amplitude (Neon Rose Palette)
let lastLoggedMode = null;
function getAmplitudeColor(amplitude, ringIndex = 0) {
    // 使用插值后的配色方案
    const palette = getInterpolatedPalette();
    const type = palette.type;

    // Debug: Log once per mode change
    const modeKey = voiceprintSettings.colorMode;
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
        // Gradient: Interpolate based on ringIndex (center to edge) and amplitude
        // Total rings: 6 (inner 4 circles + outer 2 circles)
        const maxRings = 6;
        const ringT = ringIndex / (maxRings - 1); // 0 (center) to 1 (edge) - position-based gradient
        
        const start = palette.start;
        const end = palette.end;
        
        // Base color based on ring position (center = dark, edge = light)
        const baseH = start.h + (end.h - start.h) * ringT;
        const baseS = start.s + (end.s - start.s) * ringT;
        const baseL = start.l + (end.l - start.l) * ringT;
        
        // Further brighten based on amplitude (0 = base color, 1 = brighter)
        // Amplitude adds extra brightness and saturation
        const amplitudeBoost = amplitude * 0.3; // 0-30% additional brightness
        const amplitudeSaturation = amplitude * 0.2; // 0-20% additional saturation
        
        const finalL = Math.min(100, baseL + amplitudeBoost * 100);
        const finalS = Math.min(100, baseS + amplitudeSaturation * 100);
        
        return `hsl(${baseH}, ${finalS}%, ${finalL}%)`;
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
    // 使用插值后的配色方案
    const palette = getInterpolatedPalette();
    const type = palette.type;

    if (type === 'romantic') {
        // Return the color for this ring
        const rings = palette.rings;
        return rings[ringIndex % rings.length];
    } else if (type === 'gradient') {
        // For gradient mode, interpolate from center (start) to edge (end) based on ringIndex
        // Total rings: 6 (inner 4 circles + outer 2 circles)
        const maxRings = 6;
        const t = ringIndex / (maxRings - 1); // 0 (center) to 1 (edge)
        
        const start = palette.start;
        const end = palette.end;
        
        // Interpolate HSL values: from dark (start) to light/bright (end)
        const h = start.h + (end.h - start.h) * t;
        const s = start.s + (end.s - start.s) * t;
        const l = start.l + (end.l - start.l) * t;
        
        return `hsl(${h}, ${s}%, ${l}%)`;
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
// Draw voiceprint on standard circle (for Circle 1, 2, 3)
function drawCircleVoiceprint(ring, ringIndex, maxSamples) {
    const style = voiceprintSettings.style;

    // Get LIVE geometry from params instead of cached ring values
    const threeCircles = calculateFourCircles(); // 现在只返回3个圆
    // Safety check: if ringIndex is out of bounds for inner circles (0-2)
    if (ringIndex >= threeCircles.length) return;

    const liveCircle = threeCircles[ringIndex];
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
    } else if (style === 'smooth-filled') {
        // Smooth filled waveform - filled area with smooth curves
        ctx.shadowBlur = 5;
        
        // 获取当前圆圈的声波高度缩放因子
        const waveHeightScale = params.innerCircles[ringIndex].waveHeight || 1.0;
        // 计算基础高度和用户声音高度的占比
        const baseHeightRatio = voiceprintSettings.baseHeightRatio;
        const voiceHeightRatio = 1.0 - baseHeightRatio;
        const baseVariation = 50 * baseHeightRatio;
        const voiceVariation = 50 * voiceHeightRatio;

        // Get base color
        const baseColor = getBaseLayerColor(ringIndex);
        
        // Create filled path
        ctx.beginPath();
        for (let i = 0; i <= maxSamples; i++) {
            const idx = i % maxSamples;
            const amplitude = ring.samples[idx] || 0;
            const angle = (idx / ring.sampleCount) * Math.PI * 2;
            const variation = (baseVariation + amplitude * voiceVariation) * waveHeightScale;
            const r = baseRadius + variation;
            const x = centerX + Math.cos(angle) * r;
            const y = centerY + Math.sin(angle) * r;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        
        // Create gradient fill
        const gradient = ctx.createRadialGradient(centerX, centerY, baseRadius * 0.5, centerX, centerY, baseRadius * 1.5);
        gradient.addColorStop(0, getGradientColor(baseColor, 0.3));
        gradient.addColorStop(0.5, getGradientColor(baseColor, 0.6));
        gradient.addColorStop(1, getGradientColor(baseColor, 1.0));
        
        ctx.fillStyle = gradient;
        ctx.shadowColor = baseColor;
        ctx.fill();
        
    } else if (style === 'neon-outline') {
        // Neon outline effect - glowing outline with neon colors
        ctx.shadowBlur = 15;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // 获取当前圆圈的声波高度缩放因子
        const waveHeightScale = params.innerCircles[ringIndex].waveHeight || 1.0;
        // 计算基础高度和用户声音高度的占比
        const baseHeightRatio = voiceprintSettings.baseHeightRatio;
        const voiceHeightRatio = 1.0 - baseHeightRatio;
        const baseVariation = 50 * baseHeightRatio;
        const voiceVariation = 50 * voiceHeightRatio;

        // Draw outline path
        ctx.beginPath();
        for (let i = 0; i <= maxSamples; i++) {
            const idx = i % maxSamples;
            const amplitude = ring.samples[idx] || 0;
            const angle = (idx / ring.sampleCount) * Math.PI * 2;
            const variation = (baseVariation + amplitude * voiceVariation) * waveHeightScale;
            const r = baseRadius + variation;
            const x = centerX + Math.cos(angle) * r;
            const y = centerY + Math.sin(angle) * r;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        
        // Use amplitude-based color with strong glow
        const avgAmplitude = ring.samples.slice(0, maxSamples).reduce((a, b) => a + (b || 0), 0) / maxSamples;
        const color = getAmplitudeColor(avgAmplitude, ringIndex);
        ctx.strokeStyle = color;
        ctx.shadowColor = color;
        ctx.stroke();
        
    } else if (style === 'classic-wave') {
        // Classic waveform - smooth connected lines
        ctx.shadowBlur = 3;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // 获取当前圆圈的声波高度缩放因子
        const waveHeightScale = params.innerCircles[ringIndex].waveHeight || 1.0;
        // 计算基础高度和用户声音高度的占比
        const baseHeightRatio = voiceprintSettings.baseHeightRatio;
        const voiceHeightRatio = 1.0 - baseHeightRatio;
        const baseVariation = 50 * baseHeightRatio;
        const voiceVariation = 50 * voiceHeightRatio;

        // Get base color
        const baseColor = getBaseLayerColor(ringIndex);
        
        // Draw smooth wave path
        ctx.beginPath();
        for (let i = 0; i < maxSamples; i++) {
            const amplitude = ring.samples[i] || 0;
            const angle = (i / ring.sampleCount) * Math.PI * 2;
            const variation = (baseVariation + amplitude * voiceVariation) * waveHeightScale;
            const r = baseRadius + variation;
            const x = centerX + Math.cos(angle) * r;
            const y = centerY + Math.sin(angle) * r;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                // Use smooth curve interpolation
                const prevIdx = (i - 1 + maxSamples) % maxSamples;
                const prevAmplitude = ring.samples[prevIdx] || 0;
                const prevAngle = (prevIdx / ring.sampleCount) * Math.PI * 2;
                const prevVariation = (baseVariation + prevAmplitude * voiceVariation) * waveHeightScale;
                const prevR = baseRadius + prevVariation;
                const prevX = centerX + Math.cos(prevAngle) * prevR;
                const prevY = centerY + Math.sin(prevAngle) * prevR;
                
                // Quadratic curve for smoothness
                const cpX = (prevX + x) / 2;
                const cpY = (prevY + y) / 2;
                ctx.quadraticCurveTo(cpX, cpY, x, y);
            }
        }
        
        // Close the path smoothly
        if (maxSamples > 0) {
            const firstAmplitude = ring.samples[0] || 0;
            const firstAngle = 0;
            const firstVariation = (baseVariation + firstAmplitude * voiceVariation) * waveHeightScale;
            const firstR = baseRadius + firstVariation;
            const firstX = centerX + Math.cos(firstAngle) * firstR;
            const firstY = centerY + Math.sin(firstAngle) * firstR;
            
            const lastIdx = maxSamples - 1;
            const lastAmplitude = ring.samples[lastIdx] || 0;
            const lastAngle = (lastIdx / ring.sampleCount) * Math.PI * 2;
            const lastVariation = (baseVariation + lastAmplitude * voiceVariation) * waveHeightScale;
            const lastR = baseRadius + lastVariation;
            const lastX = centerX + Math.cos(lastAngle) * lastR;
            const lastY = centerY + Math.sin(lastAngle) * lastR;
            
            const cpX = (lastX + firstX) / 2;
            const cpY = (lastY + firstY) / 2;
            ctx.quadraticCurveTo(cpX, cpY, firstX, firstY);
        }
        
        ctx.strokeStyle = baseColor;
        ctx.shadowColor = baseColor;
        ctx.stroke();
        
    } else {
        // Generic fallback for unknown styles
        ctx.shadowBlur = 5;

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

// Helper: Calculate fade alpha based on position in segment (0-1)
// fadeRatio: 渐变区域占分段长度的比例（使用全局变量 segmentFadeRatio）
function getSegmentFadeAlpha(t, fadeRatio = null) {
    // 如果没有传入 fadeRatio，使用全局变量
    if (fadeRatio === null) {
        fadeRatio = segmentFadeRatio;
    }
    if (t < fadeRatio) {
        // 开始渐变：从透明到不透明
        return t / fadeRatio;
    } else if (t > (1 - fadeRatio)) {
        // 结束渐变：从不透明到透明
        return (1 - t) / fadeRatio;
    } else {
        // 中间区域：完全不透明
        return 1.0;
    }
}

// Draw voiceprint on segmented path (Circle 4, 5 and 6)
// Draws samples in the SAME ORDER they were recorded (sequentially across all segments)
function drawSegmentedVoiceprint(ring, ringIndex, maxSamples) {
    const style = voiceprintSettings.style;

    // Get LIVE geometry from params
    let circleParams;
    if (ringIndex === 3) circleParams = params.innerCircle4;
    else if (ringIndex === 4) circleParams = params.outerCircle5;
    else if (ringIndex === 5) circleParams = params.outerCircle6;
    else return;

    const numSegments = circleParams.segmentCount;
    const baseRadius = config.maxRadius * circleParams.radius;
    
    // Get center position (circle 4 has offset, circles 5 and 6 are centered)
    const centerX = circleParams.offsetX !== undefined 
        ? config.centerX + config.maxRadius * circleParams.offsetX 
        : config.centerX;
    const centerY = circleParams.offsetY !== undefined 
        ? config.centerY + config.maxRadius * circleParams.offsetY 
        : config.centerY;

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

        // 计算渐变区域比例（10%）
        const fadeRatio = segmentFadeRatio;
        const savedAlpha = ctx.globalAlpha;
        
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

            // 内层循环：同时绘制所有segment（花瓣）
            for (let segmentIdx = 0; segmentIdx < numSegments; segmentIdx++) {
                // Calculate segment angles (pre-calculate for efficiency)
                const segmentStartAngle = circleParams.globalRotation + segmentIdx * (segmentAngleSize + gapSize);
                const segmentMidAngle = segmentStartAngle + segmentAngleSize * 0.5;
                const segmentCenterX = centerX + Math.cos(segmentMidAngle) * baseRadius;
                const segmentCenterY = centerY + Math.sin(segmentMidAngle) * baseRadius;

                // Calculate angles（每个segment从自己的起点开始绘制）
                // t基于固定的maxSamplesPerSegment计算，而不是基于动态的actualSamplesToDraw
                const t1 = posInSegment / maxSamplesPerSegment;
                const t2 = (posInSegment + 1) / maxSamplesPerSegment;
                
                // 计算透明度：在分段开始和结束处渐变
                let alpha1 = 1.0;
                let alpha2 = 1.0;
                if (t1 < fadeRatio) {
                    // 开始渐变：从透明到不透明
                    alpha1 = t1 / fadeRatio;
                } else if (t1 > (1 - fadeRatio)) {
                    // 结束渐变：从不透明到透明
                    alpha1 = (1 - t1) / fadeRatio;
                }
                if (t2 < fadeRatio) {
                    alpha2 = t2 / fadeRatio;
                } else if (t2 > (1 - fadeRatio)) {
                    alpha2 = (1 - t2) / fadeRatio;
                }
                
                // 使用平均透明度
                const alpha = (alpha1 + alpha2) / 2;
                ctx.globalAlpha = savedAlpha * alpha;
                
                const angle1 = segmentStartAngle + t1 * segmentAngleSize;
                const angle2 = segmentStartAngle + t2 * segmentAngleSize;

                // Calculate points (基础 + 用户声音)
                // 在渐变区域，声纹高度也要乘以透明度系数
                const variation1 = (baseVariation + amplitude1 * voiceVariation) * waveHeightScale * alpha1;
                const variation2 = (baseVariation + amplitude2 * voiceVariation) * waveHeightScale * alpha2;
                const r1 = baseRadius + variation1;
                const r2 = baseRadius + variation2;

                const ox1 = centerX + Math.cos(angle1) * r1;
                const oy1 = centerY + Math.sin(angle1) * r1;
                const ox2 = centerX + Math.cos(angle2) * r2;
                const oy2 = centerY + Math.sin(angle2) * r2;

                // Apply self-rotation
                const dx1 = ox1 - segmentCenterX;
                const dy1 = oy1 - segmentCenterY;
                const rx1 = dx1 * cosRot - dy1 * sinRot;
                const ry1 = dx1 * sinRot + dy1 * cosRot;
                const x1 = segmentCenterX + rx1;
                const y1 = segmentCenterY + ry1;

                const dx2 = ox2 - segmentCenterX;
                const dy2 = oy2 - segmentCenterY;
                const rx2 = dx2 * cosRot - dy2 * sinRot;
                const ry2 = dx2 * sinRot + dy2 * cosRot;
                const x2 = segmentCenterX + rx2;
                const y2 = segmentCenterY + ry2;

                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }
        }
        
        // 恢复globalAlpha
        ctx.globalAlpha = savedAlpha;
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
            const segmentCenterX = centerX + Math.cos(segmentMidAngle) * baseRadius;
            const segmentCenterY = centerY + Math.sin(segmentMidAngle) * baseRadius;
            const baseColorDark = getGradientColor(baseColor, 0);

            segmentCache.push({
                baseColor,
                baseColorDark,
                segmentStartAngle,
                centerX: segmentCenterX,
                centerY: segmentCenterY
            });
        }

        // 优化：所有花瓣同时绘制，每个花瓣从自己的起点持续绘制到终点
        // 所有segment同时开始，使用相同的样本数据，从0持续绘制到actualSamplesToDraw

        // 计算渐变区域比例（10%）
        const fadeRatio = segmentFadeRatio;
        const savedAlpha = ctx.globalAlpha;
        
        // 外层循环：遍历样本位置（所有segment共享相同的进度）
        for (let posInSegment = 0; posInSegment < actualSamplesToDraw; posInSegment++) {
            // 所有segment使用相同的样本索引（克隆体模式）
            const sampleIdx = posInSegment;
            const amplitude = ring.samples[sampleIdx] || 0;

            // 预计算t值（所有segment共享）
            const t = posInSegment / maxSamplesPerSegment;
            
            // 计算透明度
            const alpha = getSegmentFadeAlpha(t, fadeRatio);
            ctx.globalAlpha = savedAlpha * alpha;

            // 内层循环：同时绘制所有segment（花瓣）
            for (let segmentIdx = 0; segmentIdx < numSegments; segmentIdx++) {
                const cache = segmentCache[segmentIdx];

                // Calculate angle for this position（每个segment从自己的起点开始绘制）
                const angle = cache.segmentStartAngle + t * segmentAngleSize;

                // 预计算三角函数
                const cosA = Math.cos(angle);
                const sinA = Math.sin(angle);

                // Calculate base and tip points (using circle center, not canvas center)
                const ox1 = centerX + cosA * baseRadius;
                const oy1 = centerY + sinA * baseRadius;

                // 计算实际高度：基础高度 + 用户声音高度 * 振幅，然后乘以缩放因子和透明度
                // 在渐变区域，声纹高度也要乘以透明度系数
                const barLength = (baseHeight + amplitude * voiceHeight) * waveHeightScale * alpha;
                const ox2 = centerX + cosA * (baseRadius + barLength);
                const oy2 = centerY + sinA * (baseRadius + barLength);

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
        
        // 恢复globalAlpha
        ctx.globalAlpha = savedAlpha;
    } else if (style === 'smooth-filled') {
        // Smooth filled waveform for segmented petals
        ctx.shadowBlur = 5;
        const baseColor = getBaseLayerColor(ringIndex);
        const fadeRatio = segmentFadeRatio;
        const savedAlpha = ctx.globalAlpha;
        
        // Draw each segment as a filled path
        for (let segmentIdx = 0; segmentIdx < numSegments; segmentIdx++) {
            const segmentStartAngle = circleParams.globalRotation + segmentIdx * (segmentAngleSize + gapSize);
            const segmentMidAngle = segmentStartAngle + segmentAngleSize * 0.5;
            const segmentCenterX = centerX + Math.cos(segmentMidAngle) * baseRadius;
            const segmentCenterY = centerY + Math.sin(segmentMidAngle) * baseRadius;
            
            ctx.beginPath();
            for (let posInSegment = 0; posInSegment <= actualSamplesToDraw; posInSegment++) {
                const sampleIdx = posInSegment % actualSamplesToDraw;
                const amplitude = ring.samples[sampleIdx] || 0;
                const t = posInSegment / maxSamplesPerSegment;
                
                // 计算透明度
                const alpha = getSegmentFadeAlpha(t, fadeRatio);
                ctx.globalAlpha = savedAlpha * alpha;
                
                const angle = segmentStartAngle + t * segmentAngleSize;
                
                // 在渐变区域，声纹高度也要乘以透明度系数
                const variation = (baseVariation + amplitude * voiceVariation) * waveHeightScale * alpha;
                const r = baseRadius + variation;
                const ox = centerX + Math.cos(angle) * r;
                const oy = centerY + Math.sin(angle) * r;
                
                // Apply self-rotation
                const dx = ox - segmentCenterX;
                const dy = oy - segmentCenterY;
                const rx = dx * cosRot - dy * sinRot;
                const ry = dx * sinRot + dy * cosRot;
                const x = segmentCenterX + rx;
                const y = segmentCenterY + ry;
                
                if (posInSegment === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.closePath();
            
            // Create gradient fill for this segment
            const gradient = ctx.createRadialGradient(segmentCenterX, segmentCenterY, baseRadius * 0.3, segmentCenterX, segmentCenterY, baseRadius * 1.2);
            gradient.addColorStop(0, getGradientColor(baseColor, 0.3));
            gradient.addColorStop(0.5, getGradientColor(baseColor, 0.6));
            gradient.addColorStop(1, getGradientColor(baseColor, 1.0));
            
            ctx.fillStyle = gradient;
            ctx.shadowColor = baseColor;
            ctx.fill();
        }
        
        ctx.globalAlpha = savedAlpha;
        
    } else if (style === 'neon-outline') {
        // Neon outline effect for segmented petals
        ctx.shadowBlur = 15;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        const fadeRatio = segmentFadeRatio;
        const savedAlpha = ctx.globalAlpha;
        
        // Draw outline for each segment
        for (let segmentIdx = 0; segmentIdx < numSegments; segmentIdx++) {
            const segmentStartAngle = circleParams.globalRotation + segmentIdx * (segmentAngleSize + gapSize);
            const segmentMidAngle = segmentStartAngle + segmentAngleSize * 0.5;
            const segmentCenterX = centerX + Math.cos(segmentMidAngle) * baseRadius;
            const segmentCenterY = centerY + Math.sin(segmentMidAngle) * baseRadius;
            
            // 分段绘制以实现透明度渐变
            const fadeSegments = Math.max(1, Math.floor(actualSamplesToDraw * fadeRatio));
            const solidSegments = actualSamplesToDraw - 2 * fadeSegments;
            
            // 开始渐变区域
            ctx.beginPath();
            for (let posInSegment = 0; posInSegment <= fadeSegments; posInSegment++) {
                const sampleIdx = posInSegment % actualSamplesToDraw;
                const amplitude = ring.samples[sampleIdx] || 0;
                const t = posInSegment / maxSamplesPerSegment;
                const alpha = getSegmentFadeAlpha(t, fadeRatio);
                ctx.globalAlpha = savedAlpha * alpha;
                
                const angle = segmentStartAngle + t * segmentAngleSize;
                const variation = (baseVariation + amplitude * voiceVariation) * waveHeightScale;
                const r = baseRadius + variation;
                const ox = centerX + Math.cos(angle) * r;
                const oy = centerY + Math.sin(angle) * r;
                const dx = ox - segmentCenterX;
                const dy = oy - segmentCenterY;
                const rx = dx * cosRot - dy * sinRot;
                const ry = dx * sinRot + dy * cosRot;
                const x = segmentCenterX + rx;
                const y = segmentCenterY + ry;
                
                if (posInSegment === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            const avgAmplitude = ring.samples.slice(0, actualSamplesToDraw).reduce((a, b) => a + (b || 0), 0) / actualSamplesToDraw;
            const color = getAmplitudeColor(avgAmplitude, ringIndex);
            ctx.strokeStyle = color;
            ctx.shadowColor = color;
            ctx.stroke();
            
            // 中间实心区域（alpha = 1.0，但为了代码一致性也乘以alpha）
            ctx.globalAlpha = savedAlpha;
            ctx.beginPath();
            for (let posInSegment = fadeSegments; posInSegment <= fadeSegments + solidSegments; posInSegment++) {
                const sampleIdx = posInSegment % actualSamplesToDraw;
                const amplitude = ring.samples[sampleIdx] || 0;
                const t = posInSegment / maxSamplesPerSegment;
                const alpha = getSegmentFadeAlpha(t, fadeRatio); // 中间区域alpha=1.0
                const angle = segmentStartAngle + t * segmentAngleSize;
                // 在渐变区域，声纹高度也要乘以透明度系数（中间区域alpha=1.0，所以不影响）
                const variation = (baseVariation + amplitude * voiceVariation) * waveHeightScale * alpha;
                const r = baseRadius + variation;
                const ox = centerX + Math.cos(angle) * r;
                const oy = centerY + Math.sin(angle) * r;
                const dx = ox - segmentCenterX;
                const dy = oy - segmentCenterY;
                const rx = dx * cosRot - dy * sinRot;
                const ry = dx * sinRot + dy * cosRot;
                const x = segmentCenterX + rx;
                const y = segmentCenterY + ry;
                
                if (posInSegment === fadeSegments) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
            
            // 结束渐变区域
            ctx.beginPath();
            for (let posInSegment = fadeSegments + solidSegments; posInSegment <= actualSamplesToDraw; posInSegment++) {
                const sampleIdx = posInSegment % actualSamplesToDraw;
                const amplitude = ring.samples[sampleIdx] || 0;
                const t = posInSegment / maxSamplesPerSegment;
                const alpha = getSegmentFadeAlpha(t, fadeRatio);
                ctx.globalAlpha = savedAlpha * alpha;
                
                const angle = segmentStartAngle + t * segmentAngleSize;
                const variation = (baseVariation + amplitude * voiceVariation) * waveHeightScale;
                const r = baseRadius + variation;
                const ox = centerX + Math.cos(angle) * r;
                const oy = centerY + Math.sin(angle) * r;
                const dx = ox - segmentCenterX;
                const dy = oy - segmentCenterY;
                const rx = dx * cosRot - dy * sinRot;
                const ry = dx * sinRot + dy * cosRot;
                const x = segmentCenterX + rx;
                const y = segmentCenterY + ry;
                
                if (posInSegment === fadeSegments + solidSegments) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
        }
        
        ctx.globalAlpha = savedAlpha;
        
    } else if (style === 'classic-wave') {
        // Classic waveform for segmented petals
        ctx.shadowBlur = 3;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        const baseColor = getBaseLayerColor(ringIndex);
        const fadeRatio = segmentFadeRatio;
        const savedAlpha = ctx.globalAlpha;
        
        // Draw smooth wave for each segment
        for (let segmentIdx = 0; segmentIdx < numSegments; segmentIdx++) {
            const segmentStartAngle = circleParams.globalRotation + segmentIdx * (segmentAngleSize + gapSize);
            const segmentMidAngle = segmentStartAngle + segmentAngleSize * 0.5;
            const segmentCenterX = centerX + Math.cos(segmentMidAngle) * baseRadius;
            const segmentCenterY = centerY + Math.sin(segmentMidAngle) * baseRadius;
            
            // 分段绘制以实现透明度渐变
            const fadeSegments = Math.max(1, Math.floor(actualSamplesToDraw * fadeRatio));
            const solidSegments = actualSamplesToDraw - 2 * fadeSegments;
            
            // 开始渐变区域
            ctx.beginPath();
            for (let posInSegment = 0; posInSegment < fadeSegments; posInSegment++) {
                const amplitude = ring.samples[posInSegment] || 0;
                const t = posInSegment / maxSamplesPerSegment;
                const alpha = getSegmentFadeAlpha(t, fadeRatio);
                ctx.globalAlpha = savedAlpha * alpha;
                
                const angle = segmentStartAngle + t * segmentAngleSize;
                // 在渐变区域，声纹高度也要乘以透明度系数
                const variation = (baseVariation + amplitude * voiceVariation) * waveHeightScale * alpha;
                const r = baseRadius + variation;
                const ox = centerX + Math.cos(angle) * r;
                const oy = centerY + Math.sin(angle) * r;
                const dx = ox - segmentCenterX;
                const dy = oy - segmentCenterY;
                const rx = dx * cosRot - dy * sinRot;
                const ry = dx * sinRot + dy * cosRot;
                const x = segmentCenterX + rx;
                const y = segmentCenterY + ry;
                
                if (posInSegment === 0) {
                    ctx.moveTo(x, y);
                } else {
                    const prevIdx = posInSegment - 1;
                    const prevAmplitude = ring.samples[prevIdx] || 0;
                    const prevT = prevIdx / maxSamplesPerSegment;
                    const prevAlpha = getSegmentFadeAlpha(prevT, fadeRatio);
                    const prevAngle = segmentStartAngle + prevT * segmentAngleSize;
                    const prevVariation = (baseVariation + prevAmplitude * voiceVariation) * waveHeightScale * prevAlpha;
                    const prevR = baseRadius + prevVariation;
                    const prevOx = centerX + Math.cos(prevAngle) * prevR;
                    const prevOy = centerY + Math.sin(prevAngle) * prevR;
                    const prevDx = prevOx - segmentCenterX;
                    const prevDy = prevOy - segmentCenterY;
                    const prevRx = prevDx * cosRot - prevDy * sinRot;
                    const prevRy = prevDx * sinRot + prevDy * cosRot;
                    const prevX = segmentCenterX + prevRx;
                    const prevY = segmentCenterY + prevRy;
                    const cpX = (prevX + x) / 2;
                    const cpY = (prevY + y) / 2;
                    ctx.quadraticCurveTo(cpX, cpY, x, y);
                }
            }
            ctx.strokeStyle = baseColor;
            ctx.shadowColor = baseColor;
            ctx.stroke();
            
            // 中间实心区域（alpha = 1.0，但为了代码一致性也乘以alpha）
            ctx.globalAlpha = savedAlpha;
            ctx.beginPath();
            for (let posInSegment = fadeSegments; posInSegment < fadeSegments + solidSegments; posInSegment++) {
                const amplitude = ring.samples[posInSegment] || 0;
                const t = posInSegment / maxSamplesPerSegment;
                const alpha = getSegmentFadeAlpha(t, fadeRatio); // 中间区域alpha=1.0
                const angle = segmentStartAngle + t * segmentAngleSize;
                // 在渐变区域，声纹高度也要乘以透明度系数（中间区域alpha=1.0，所以不影响）
                const variation = (baseVariation + amplitude * voiceVariation) * waveHeightScale * alpha;
                const r = baseRadius + variation;
                const ox = centerX + Math.cos(angle) * r;
                const oy = centerY + Math.sin(angle) * r;
                const dx = ox - segmentCenterX;
                const dy = oy - segmentCenterY;
                const rx = dx * cosRot - dy * sinRot;
                const ry = dx * sinRot + dy * cosRot;
                const x = segmentCenterX + rx;
                const y = segmentCenterY + ry;
                
                if (posInSegment === fadeSegments) {
                    ctx.moveTo(x, y);
                } else {
                    const prevIdx = posInSegment - 1;
                    const prevAmplitude = ring.samples[prevIdx] || 0;
                    const prevT = prevIdx / maxSamplesPerSegment;
                    const prevAlpha = getSegmentFadeAlpha(prevT, fadeRatio); // 中间区域alpha=1.0
                    const prevAngle = segmentStartAngle + prevT * segmentAngleSize;
                    const prevVariation = (baseVariation + prevAmplitude * voiceVariation) * waveHeightScale * prevAlpha;
                    const prevR = baseRadius + prevVariation;
                    const prevOx = centerX + Math.cos(prevAngle) * prevR;
                    const prevOy = centerY + Math.sin(prevAngle) * prevR;
                    const prevDx = prevOx - segmentCenterX;
                    const prevDy = prevOy - segmentCenterY;
                    const prevRx = prevDx * cosRot - prevDy * sinRot;
                    const prevRy = prevDx * sinRot + prevDy * cosRot;
                    const prevX = segmentCenterX + prevRx;
                    const prevY = segmentCenterY + prevRy;
                    const cpX = (prevX + x) / 2;
                    const cpY = (prevY + y) / 2;
                    ctx.quadraticCurveTo(cpX, cpY, x, y);
                }
            }
            ctx.stroke();
            
            // 结束渐变区域
            ctx.beginPath();
            for (let posInSegment = fadeSegments + solidSegments; posInSegment < actualSamplesToDraw; posInSegment++) {
                const amplitude = ring.samples[posInSegment] || 0;
                const t = posInSegment / maxSamplesPerSegment;
                const alpha = getSegmentFadeAlpha(t, fadeRatio);
                ctx.globalAlpha = savedAlpha * alpha;
                
                const angle = segmentStartAngle + t * segmentAngleSize;
                const variation = (baseVariation + amplitude * voiceVariation) * waveHeightScale;
                const r = baseRadius + variation;
                const ox = centerX + Math.cos(angle) * r;
                const oy = centerY + Math.sin(angle) * r;
                const dx = ox - segmentCenterX;
                const dy = oy - segmentCenterY;
                const rx = dx * cosRot - dy * sinRot;
                const ry = dx * sinRot + dy * cosRot;
                const x = segmentCenterX + rx;
                const y = segmentCenterY + ry;
                
                if (posInSegment === fadeSegments + solidSegments) {
                    ctx.moveTo(x, y);
                } else {
                    const prevIdx = posInSegment - 1;
                    const prevAmplitude = ring.samples[prevIdx] || 0;
                    const prevT = prevIdx / maxSamplesPerSegment;
                    const prevAngle = segmentStartAngle + prevT * segmentAngleSize;
                    const prevVariation = (baseVariation + prevAmplitude * voiceVariation) * waveHeightScale;
                    const prevR = baseRadius + prevVariation;
                    const prevOx = centerX + Math.cos(prevAngle) * prevR;
                    const prevOy = centerY + Math.sin(prevAngle) * prevR;
                    const prevDx = prevOx - segmentCenterX;
                    const prevDy = prevOy - segmentCenterY;
                    const prevRx = prevDx * cosRot - prevDy * sinRot;
                    const prevRy = prevDx * sinRot + prevDy * cosRot;
                    const prevX = segmentCenterX + prevRx;
                    const prevY = segmentCenterY + prevRy;
                    const cpX = (prevX + x) / 2;
                    const cpY = (prevY + y) / 2;
                    ctx.quadraticCurveTo(cpX, cpY, x, y);
                }
            }
            ctx.stroke();
        }
        
        ctx.globalAlpha = savedAlpha;
        
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
                const segmentCenterX = centerX + Math.cos(segmentMidAngle) * baseRadius;
                const segmentCenterY = centerY + Math.sin(segmentMidAngle) * baseRadius;

                // Calculate angle（每个segment从自己的起点开始绘制）
                // t基于固定的maxSamplesPerSegment计算，而不是基于动态的actualSamplesToDraw
                const t = posInSegment / maxSamplesPerSegment;
                const angle = segmentStartAngle + t * segmentAngleSize;

                // Calculate point (基础 + 用户声音)
                const variation = (baseVar + amplitude * voiceVar) * waveHeightScale;
                const r = baseRadius + variation;
                const ox = centerX + Math.cos(angle) * r;
                const oy = centerY + Math.sin(angle) * r;

                // Apply self-rotation
                const dx = ox - segmentCenterX;
                const dy = oy - segmentCenterY;
                const rx = dx * cosRot - dy * sinRot;
                const ry = dx * sinRot + dy * cosRot;
                const x = segmentCenterX + rx;
                const y = segmentCenterY + ry;

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
