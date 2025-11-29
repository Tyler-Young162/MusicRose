let canvas, ctx;
let width, height;

// Initial radius values (reference point for randomization)
const initialRadii = [0.15, 0.22, 0.31, 0.43]; // Circle 1, 2, 3, 4

// Parameters configuration
const params = {
    // Inner 4 circles - 根据用户给定的默认值
    innerCircles: [
        { radius: 0.15, offsetX: 0.02, offsetY: -0.02 },   // Circle 1: 15.0%, 2.00%, -2.00%
        { radius: 0.22, offsetX: 0.045, offsetY: 0.025 }, // Circle 2: 22.0%, 4.50%, 2.50%
        { radius: 0.31, offsetX: -0.035, offsetY: 0.025 }, // Circle 3: 31.0%, -3.50%, 2.50%
        { radius: 0.43, offsetX: 0.05, offsetY: 0.04 }   // Circle 4: 43.0%, 5.00%, 4.00%
    ],
    // Outer circle 5 (segmented petals)
    outerCircle5: {
        radius: 0.33,              // 33% as default
        segmentCount: 4,          // Number of segments (3-6)
        segmentLength: 0.0,       // Variation ratio (0-20%) relative to initial length
        selfRotation: 0.12,        // Self-rotation angle (radians)
        globalRotation: 0,         // Global rotation angle (radians)
    },
    // Outer circle 6 (segmented petals)
    outerCircle6: {
        radius: 0.44,              // 44% as default
        segmentCount: 4,           // Number of segments (3-6)
        segmentLength: 0.0,        // Variation ratio (0-20%) relative to initial length
        selfRotation: 0.12,        // Self-rotation angle (radians)
        globalRotation: 0.3927,    // ~22.5 degrees (Math.PI / 8)
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
let isRecording = false;
let animationFrameId = null;

// Voiceprint data storage (from inner to outer circles)
// Each ring stores audio data points along the circle path
const voiceprintData = {
    rings: [], // Array of rings, each ring contains audio samples
    currentRingIndex: 0, // Current ring being recorded (0 = innermost)
    sampleIndex: 0, // Current sample index in current ring
    maxRings: 6 // Maximum number of rings to record
};

// Layer visibility controls
const layerVisibility = {
    showBaseLayer: true,
    showVoiceprintLayer: true
};

// Voiceprint style and settings
const voiceprintSettings = {
    style: 'gradient-wave', // Professional styles
    volumeThreshold: 0.2, // Normalized volume threshold (0-1)
    isPaused: false // Paused when volume is too low
};

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
}

// Setup randomize button
function setupRandomizeButton() {
    const button = document.getElementById('randomizeButton');
    button.addEventListener('click', randomizeInnerCircles);
}

// Randomize inner circles with tangent constraint
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

// Draw segmented circle with parameters
function drawSegmentedCircle(circleIndex, circleParams) {
    const numSegments = circleParams.segmentCount; // Use dynamic segment count
    const baseRadius = config.maxRadius * circleParams.radius;
    
    // Calculate actual segment length based on variation ratio
    // Initial unit = 100% / segmentCount (e.g., 4 segments = 25%, 5 segments = 20%)
    const initialUnit = 1.0 / numSegments; // As a ratio (0.25 for 4 segments, 0.2 for 5 segments)
    // Actual segment length = initial unit * (1 + variation ratio)
    // segmentLength is now a variation ratio (0-0.2, i.e., 0-20%)
    const actualSegmentLength = initialUnit * (1 + circleParams.segmentLength);
    const segmentAngleSize = actualSegmentLength * Math.PI * 2; // Convert to radians
    const gapSize = (Math.PI * 2 - segmentAngleSize * numSegments) / numSegments; // Calculate gap
    
    ctx.strokeStyle = circleIndex === 5 ? 'cyan' : 'yellow';
    ctx.lineWidth = 2;
    
    // Start from global rotation angle
    let currentAngle = circleParams.globalRotation;
    
    for (let i = 0; i < numSegments; i++) {
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

function draw() {
    // Clear canvas
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);
    
    // Draw base layer (circles and segments)
    if (layerVisibility.showBaseLayer) {
        // Draw the 4 nested circles
        const fourCircles = calculateFourCircles();
        const colors = ['magenta', 'white', 'cyan', 'green'];
        fourCircles.forEach((circle, index) => {
            drawCircleOutline(circle.cx, circle.cy, circle.radius, colors[index] || 'white');
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
    
    // Draw voiceprint layer (on top)
    if (layerVisibility.showVoiceprintLayer) {
        drawVoiceprint();
    }
}

// Setup recording controls
function setupRecordingControls() {
    const startBtn = document.getElementById('startRecording');
    const stopBtn = document.getElementById('stopRecording');
    const showBaseCheckbox = document.getElementById('showBaseLayer');
    const showVoiceprintCheckbox = document.getElementById('showVoiceprintLayer');
    const styleSelect = document.getElementById('voiceprintStyle');
    const volumeThreshold = document.getElementById('volumeThreshold');
    
    startBtn.addEventListener('click', startRecording);
    stopBtn.addEventListener('click', stopRecording);
    
    showBaseCheckbox.addEventListener('change', (e) => {
        layerVisibility.showBaseLayer = e.target.checked;
        draw();
    });
    
    showVoiceprintCheckbox.addEventListener('change', (e) => {
        layerVisibility.showVoiceprintLayer = e.target.checked;
        draw();
    });
    
    styleSelect.addEventListener('change', (e) => {
        voiceprintSettings.style = e.target.value;
        draw();
    });
    
    volumeThreshold.addEventListener('input', (e) => {
        voiceprintSettings.volumeThreshold = parseFloat(e.target.value) / 100;
        document.getElementById('volumeThresholdValue').textContent = e.target.value;
    });
}

// Start recording
async function startRecording() {
    try {
        // Request microphone access
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Initialize audio context
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256; // Frequency resolution
        analyser.smoothingTimeConstant = 0.8;
        
        microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(analyser);
        
        dataArray = new Uint8Array(analyser.frequencyBinCount);
        
        // Initialize voiceprint data
        voiceprintData.rings = [];
        voiceprintData.currentRingIndex = 0;
        voiceprintData.sampleIndex = 0;
        
        // Initialize rings based on current configuration
        initializeVoiceprintRings();
        
        isRecording = true;
        document.getElementById('startRecording').disabled = true;
        document.getElementById('stopRecording').disabled = false;
        
        // Start recording loop
        recordAudioData();
        
        console.log('Recording started');
    } catch (error) {
        console.error('Error accessing microphone:', error);
        alert('无法访问麦克风，请检查权限设置');
    }
}

// Stop recording
function stopRecording() {
    isRecording = false;
    
    if (microphone) {
        microphone.disconnect();
        microphone = null;
    }
    
    if (audioContext) {
        audioContext.close();
        audioContext = null;
    }
    
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    
    document.getElementById('startRecording').disabled = false;
    document.getElementById('stopRecording').disabled = true;
    
    console.log('Recording stopped');
}

// Initialize voiceprint rings based on current circle configuration
function initializeVoiceprintRings() {
    const maxRadius = config.maxRadius * 0.5;
    const fourCircles = calculateFourCircles();
    
    // Add rings for inner 4 circles (standard circles)
    fourCircles.forEach((circle, index) => {
        const samplesPerRing = 180; // Number of samples per ring
        voiceprintData.rings.push({
            type: 'circle', // Standard circle
            radius: circle.radius,
            centerX: circle.cx,
            centerY: circle.cy,
            samples: new Array(samplesPerRing).fill(0),
            sampleCount: samplesPerRing
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
        samples: new Array(240).fill(0),
        sampleCount: 240
    });
    
    // Circle 6 - segmented path
    const r6 = config.maxRadius * params.outerCircle6.radius;
    const segmentCount6 = params.outerCircle6.segmentCount;
    const initialUnit6 = 1.0 / segmentCount6;
    const actualSegmentLength6 = initialUnit6 * (1 + params.outerCircle6.segmentLength);
    const segmentAngleSize6 = actualSegmentLength6 * Math.PI * 2;
    const gapSize6 = (Math.PI * 2 - segmentAngleSize6 * segmentCount6) / segmentCount6;
    
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
        samples: new Array(240).fill(0),
        sampleCount: 240
    });
}

// Record audio data and map to rings
function recordAudioData() {
    if (!isRecording) return;
    
    analyser.getByteFrequencyData(dataArray);
    
    // Calculate average amplitude
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
    }
    const averageAmplitude = sum / dataArray.length;
    const normalizedAmplitude = averageAmplitude / 255; // Normalize to 0-1
    
    // Check volume threshold - pause if too low
    if (normalizedAmplitude < voiceprintSettings.volumeThreshold) {
        voiceprintSettings.isPaused = true;
    } else {
        voiceprintSettings.isPaused = false;
        
        // Record to current ring only when not paused
        if (voiceprintData.currentRingIndex < voiceprintData.rings.length) {
            const currentRing = voiceprintData.rings[voiceprintData.currentRingIndex];
            
            if (voiceprintData.sampleIndex < currentRing.sampleCount) {
                currentRing.samples[voiceprintData.sampleIndex] = normalizedAmplitude;
                voiceprintData.sampleIndex++;
            } else {
                // Move to next ring
                voiceprintData.currentRingIndex++;
                voiceprintData.sampleIndex = 0;
            }
        }
    }
    
    // Redraw
    draw();
    
    // Continue recording
    animationFrameId = requestAnimationFrame(recordAudioData);
}

// Draw voiceprint on canvas with different styles
function drawVoiceprint() {
    if (voiceprintData.rings.length === 0) return;
    
    voiceprintData.rings.forEach((ring, ringIndex) => {
        if (ringIndex > voiceprintData.currentRingIndex) return; // Don't draw future rings
        
        const maxSamples = ringIndex === voiceprintData.currentRingIndex 
            ? voiceprintData.sampleIndex 
            : ring.sampleCount;
        
        if (ring.type === 'circle') {
            drawCircleVoiceprint(ring, maxSamples);
        } else if (ring.type === 'segmented') {
            drawSegmentedVoiceprint(ring, maxSamples);
        }
    });
}

// Helper: Get color based on amplitude (gradient from blue to red)
function getAmplitudeColor(amplitude) {
    // Color gradient: blue (low) -> cyan -> green -> yellow -> orange -> red (high)
    const hue = 240 - (amplitude * 180); // 240 (blue) to 60 (yellow-red)
    const saturation = 80 + amplitude * 20;
    const lightness = 50 + amplitude * 20;
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

// Helper: Smooth interpolation between points
function smoothPoint(ring, index, maxSamples) {
    const prev = ring.samples[(index - 1 + maxSamples) % maxSamples] || 0;
    const curr = ring.samples[index] || 0;
    const next = ring.samples[(index + 1) % maxSamples] || 0;
    return (prev + curr * 2 + next) / 4; // Weighted average
}

// Draw voiceprint on standard circle
function drawCircleVoiceprint(ring, maxSamples) {
    const style = voiceprintSettings.style;
    
    if (style === 'gradient-wave') {
        // Professional gradient waveform with color based on amplitude
        ctx.lineWidth = 3;
        ctx.shadowBlur = 15;
        
        // Draw with gradient colors
        for (let i = 0; i < maxSamples; i++) {
            const amplitude = ring.samples[i];
            const nextAmplitude = ring.samples[(i + 1) % maxSamples] || 0;
            const angle = (i / ring.sampleCount) * Math.PI * 2;
            const nextAngle = ((i + 1) / ring.sampleCount) * Math.PI * 2;
            
            const variation = amplitude * 50;
            const nextVariation = nextAmplitude * 50;
            const radius = ring.radius + variation;
            const nextRadius = ring.radius + nextVariation;
            
            const x = ring.centerX + Math.cos(angle) * radius;
            const y = ring.centerY + Math.sin(angle) * radius;
            const nextX = ring.centerX + Math.cos(nextAngle) * nextRadius;
            const nextY = ring.centerY + Math.sin(nextAngle) * nextRadius;
            
            ctx.strokeStyle = getAmplitudeColor(amplitude);
            ctx.shadowColor = getAmplitudeColor(amplitude);
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(nextX, nextY);
            ctx.stroke();
        }
    } else if (style === 'spectrum-bars') {
        // Professional spectrum analyzer style
        ctx.shadowBlur = 8;
        const barCount = Math.min(60, maxSamples); // Limit bars for clarity
        const step = Math.floor(maxSamples / barCount);
        
        for (let i = 0; i < barCount; i++) {
            const idx = i * step;
            const amplitude = ring.samples[idx] || 0;
            if (amplitude < 0.05) continue;
            
            const angle = (idx / ring.sampleCount) * Math.PI * 2;
            const barLength = amplitude * 60;
            const barWidth = 3;
            
            // Color based on amplitude
            const color = getAmplitudeColor(amplitude);
            ctx.fillStyle = color;
            ctx.strokeStyle = color;
            ctx.shadowColor = color;
            
            // Draw bar
            const x1 = ring.centerX + Math.cos(angle) * ring.radius;
            const y1 = ring.centerY + Math.sin(angle) * ring.radius;
            const x2 = ring.centerX + Math.cos(angle) * (ring.radius + barLength);
            const y2 = ring.centerY + Math.sin(angle) * (ring.radius + barLength);
            
            const perpAngle = angle + Math.PI / 2;
            const dx = Math.cos(perpAngle) * barWidth * 0.5;
            const dy = Math.sin(perpAngle) * barWidth * 0.5;
            
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
        ctx.shadowBlur = 20;
        const particleCount = Math.min(80, maxSamples);
        const step = Math.floor(maxSamples / particleCount);
        
        for (let i = 0; i < particleCount; i++) {
            const idx = i * step;
            const amplitude = ring.samples[idx] || 0;
            if (amplitude < 0.1) continue;
            
            const angle = (idx / ring.sampleCount) * Math.PI * 2;
            const variation = amplitude * 45;
            const radius = ring.radius + variation;
            const x = ring.centerX + Math.cos(angle) * radius;
            const y = ring.centerY + Math.sin(angle) * radius;
            
            const color = getAmplitudeColor(amplitude);
            ctx.fillStyle = color;
            ctx.shadowColor = color;
            
            const size = 2 + amplitude * 4;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
    } else if (style === 'smooth-filled') {
        // Smooth filled waveform (like audio software)
        ctx.lineWidth = 2;
        ctx.shadowBlur = 12;
        
        // Create gradient
        const gradient = ctx.createLinearGradient(
            ring.centerX - ring.radius, ring.centerY - ring.radius,
            ring.centerX + ring.radius, ring.centerY + ring.radius
        );
        gradient.addColorStop(0, 'rgba(100, 200, 255, 0.8)');
        gradient.addColorStop(0.5, 'rgba(255, 100, 255, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 200, 100, 0.8)');
        
        ctx.fillStyle = gradient;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.shadowColor = 'rgba(255, 100, 255, 0.8)';
        
        // Draw filled waveform
        ctx.beginPath();
        for (let i = 0; i <= maxSamples; i++) {
            const idx = i % maxSamples;
            const amplitude = smoothPoint(ring, idx, maxSamples);
            const angle = (idx / ring.sampleCount) * Math.PI * 2;
            const variation = amplitude * 40;
            const radius = ring.radius + variation;
            const x = ring.centerX + Math.cos(angle) * radius;
            const y = ring.centerY + Math.sin(angle) * radius;
            
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    } else if (style === 'neon-outline') {
        // Neon outline effect
        ctx.lineWidth = 4;
        ctx.shadowBlur = 25;
        
        // Outer glow
        ctx.strokeStyle = 'rgba(255, 100, 255, 0.6)';
        ctx.shadowColor = 'rgba(255, 100, 255, 1)';
        ctx.beginPath();
        for (let i = 0; i < maxSamples; i++) {
            const amplitude = ring.samples[i];
            const angle = (i / ring.sampleCount) * Math.PI * 2;
            const variation = amplitude * 45;
            const radius = ring.radius + variation;
            const x = ring.centerX + Math.cos(angle) * radius;
            const y = ring.centerY + Math.sin(angle) * radius;
            
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        
        // Inner bright line
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.shadowBlur = 10;
        ctx.stroke();
    } else if (style === 'classic-wave') {
        // Classic oscilloscope-style waveform
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.9)';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(0, 255, 255, 0.6)';
        
        ctx.beginPath();
        for (let i = 0; i < maxSamples; i++) {
            const amplitude = ring.samples[i];
            const angle = (i / ring.sampleCount) * Math.PI * 2;
            const variation = amplitude * 35;
            const radius = ring.radius + variation;
            const x = ring.centerX + Math.cos(angle) * radius;
            const y = ring.centerY + Math.sin(angle) * radius;
            
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
    } else if (style === 'wave') {
        // Wave: Continuous smooth waveform with radius variation
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < maxSamples; i++) {
            const amplitude = ring.samples[i];
            const angle = (i / ring.sampleCount) * Math.PI * 2;
            const variation = amplitude * 40; // Larger variation for wave
            const radius = ring.radius + variation;
            const x = ring.centerX + Math.cos(angle) * radius;
            const y = ring.centerY + Math.sin(angle) * radius;
            
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
    } else if (style === 'smooth') {
        // Smooth: Closed smooth curve
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < maxSamples; i++) {
            const amplitude = ring.samples[i];
            const angle = (i / ring.sampleCount) * Math.PI * 2;
            const variation = amplitude * 30;
            const radius = ring.radius + variation;
            const x = ring.centerX + Math.cos(angle) * radius;
            const y = ring.centerY + Math.sin(angle) * radius;
            
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        if (maxSamples > 0) {
            ctx.closePath();
        }
        ctx.stroke();
    } else if (style === 'spike') {
        // Spike: Thin, sharp lines radiating outward
        ctx.lineWidth = 1; // Thinner for spikes
        for (let i = 0; i < maxSamples; i += 2) { // Sample every other point for cleaner spikes
            const amplitude = ring.samples[i];
            if (amplitude < 0.1) continue; // Skip very low amplitudes
            
            const angle = (i / ring.sampleCount) * Math.PI * 2;
            const baseX = ring.centerX + Math.cos(angle) * ring.radius;
            const baseY = ring.centerY + Math.sin(angle) * ring.radius;
            const spikeLength = amplitude * 60; // Longer spikes
            const spikeX = baseX + Math.cos(angle) * spikeLength;
            const spikeY = baseY + Math.sin(angle) * spikeLength;
            
            ctx.beginPath();
            ctx.moveTo(baseX, baseY);
            ctx.lineTo(spikeX, spikeY);
            ctx.stroke();
        }
    } else if (style === 'bar') {
        // Bar: Thick rectangular bars
        ctx.lineWidth = 4; // Thicker for bars
        for (let i = 0; i < maxSamples; i += 3) { // Sample every 3rd point for cleaner bars
            const amplitude = ring.samples[i];
            if (amplitude < 0.05) continue; // Skip very low amplitudes
            
            const angle = (i / ring.sampleCount) * Math.PI * 2;
            const barLength = amplitude * 50;
            const barWidth = 2; // Width of the bar
            
            // Calculate perpendicular direction for bar width
            const perpAngle = angle + Math.PI / 2;
            const dx = Math.cos(perpAngle) * barWidth * 0.5;
            const dy = Math.sin(perpAngle) * barWidth * 0.5;
            
            const x1 = ring.centerX + Math.cos(angle) * ring.radius;
            const y1 = ring.centerY + Math.sin(angle) * ring.radius;
            const x2 = ring.centerX + Math.cos(angle) * (ring.radius + barLength);
            const y2 = ring.centerY + Math.sin(angle) * (ring.radius + barLength);
            
            // Draw bar as a rectangle
            ctx.beginPath();
            ctx.moveTo(x1 - dx, y1 - dy);
            ctx.lineTo(x1 + dx, y1 + dy);
            ctx.lineTo(x2 + dx, y2 + dy);
            ctx.lineTo(x2 - dx, y2 - dy);
            ctx.closePath();
            ctx.fill();
        }
    } else if (style === 'spiral') {
        // Spiral: Waveform with spiral modulation
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < maxSamples; i++) {
            const amplitude = ring.samples[i];
            const angle = (i / ring.sampleCount) * Math.PI * 2;
            // Add spiral effect: amplitude affects both radius and angle
            const spiralRadius = amplitude * 30;
            const spiralAngle = angle + amplitude * 0.5; // Spiral twist
            const radius = ring.radius + spiralRadius;
            const x = ring.centerX + Math.cos(spiralAngle) * radius;
            const y = ring.centerY + Math.sin(spiralAngle) * radius;
            
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
    }
    
    ctx.shadowBlur = 0;
}

// Draw voiceprint on segmented path (Circle 5 and 6)
// Uses the same path calculation as drawSegmentedCircle
function drawSegmentedVoiceprint(ring, maxSamples) {
    const style = voiceprintSettings.style;
    const numSegments = ring.segmentCount;
    // Calculate samples per segment based on ACTUAL recorded samples, not total sample count
    const samplesPerSegment = Math.floor(maxSamples / numSegments);
    
    // Use same logic as drawSegmentedCircle
    let currentAngle = ring.globalRotation;
    const cosRot = Math.cos(ring.selfRotation);
    const sinRot = Math.sin(ring.selfRotation);
    
    for (let seg = 0; seg < numSegments; seg++) {
        // Calculate segment midpoint angle (same as drawSegmentedCircle)
        const segmentMidAngle = currentAngle + ring.segmentAngleSize * 0.5;
        
        // Calculate the center point of the arc on the circle (rotation center for self-rotation)
        const centerX = ring.centerX + Math.cos(segmentMidAngle) * ring.baseRadius;
        const centerY = ring.centerY + Math.sin(segmentMidAngle) * ring.baseRadius;
        
        // Calculate which samples belong to this segment
        // Use actual recorded samples (maxSamples), not total sampleCount
        const segmentStartSample = seg * samplesPerSegment;
        const segmentEndSample = Math.min((seg + 1) * samplesPerSegment, maxSamples);
        
        // Only draw if this segment has recorded samples
        if (segmentStartSample >= maxSamples) {
            // Move to next segment angle for proper positioning
            currentAngle += ring.segmentAngleSize + ring.gapSize;
            continue;
        }
        
        const segmentSampleCount = segmentEndSample - segmentStartSample;
        
        if (style === 'gradient-wave') {
            // Gradient waveform for segmented path - draw continuous path with gradient colors
            ctx.lineWidth = 3;
            ctx.shadowBlur = 15;
            
            // Draw continuous path, but only up to recorded samples
            if (segmentSampleCount > 0) {
                // Draw line segments with gradient colors
                for (let i = segmentStartSample; i < segmentEndSample - 1; i++) {
                    const amplitude1 = ring.samples[i] || 0;
                    const amplitude2 = ring.samples[i + 1] || 0;
                    
                    const t1 = (i - segmentStartSample) / segmentSampleCount;
                    const t2 = ((i + 1) - segmentStartSample) / segmentSampleCount;
                    const clampedT1 = Math.min(t1, 1.0);
                    const clampedT2 = Math.min(t2, 1.0);
                    
                    const originalAngle1 = currentAngle + clampedT1 * ring.segmentAngleSize;
                    const originalAngle2 = currentAngle + clampedT2 * ring.segmentAngleSize;
                    
                    const variation1 = amplitude1 * 50;
                    const variation2 = amplitude2 * 50;
                    const originalRadius1 = ring.baseRadius + variation1;
                    const originalRadius2 = ring.baseRadius + variation2;
                    
                    const originalX1 = ring.centerX + Math.cos(originalAngle1) * originalRadius1;
                    const originalY1 = ring.centerY + Math.sin(originalAngle1) * originalRadius1;
                    const originalX2 = ring.centerX + Math.cos(originalAngle2) * originalRadius2;
                    const originalY2 = ring.centerY + Math.sin(originalAngle2) * originalRadius2;
                    
                    // Apply self-rotation
                    const dx1 = originalX1 - centerX;
                    const dy1 = originalY1 - centerY;
                    const rotatedX1 = dx1 * cosRot - dy1 * sinRot;
                    const rotatedY1 = dx1 * sinRot + dy1 * cosRot;
                    const x1 = centerX + rotatedX1;
                    const y1 = centerY + rotatedY1;
                    
                    const dx2 = originalX2 - centerX;
                    const dy2 = originalY2 - centerY;
                    const rotatedX2 = dx2 * cosRot - dy2 * sinRot;
                    const rotatedY2 = dx2 * sinRot + dy2 * cosRot;
                    const x2 = centerX + rotatedX2;
                    const y2 = centerY + rotatedY2;
                    
                    // Draw line segment with color based on average amplitude
                    const avgAmplitude = (amplitude1 + amplitude2) / 2;
                    ctx.strokeStyle = getAmplitudeColor(avgAmplitude);
                    ctx.shadowColor = getAmplitudeColor(avgAmplitude);
                    
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.stroke();
                }
            }
        } else if (style === 'spectrum-bars') {
            // Spectrum bars for segmented path
            ctx.shadowBlur = 8;
            const barCount = Math.min(15, segmentSampleCount);
            const step = Math.floor(segmentSampleCount / barCount);
            
            for (let j = 0; j < barCount; j++) {
                const idx = segmentStartSample + j * step;
                if (idx >= segmentEndSample) break;
                
                const amplitude = ring.samples[idx] || 0;
                if (amplitude < 0.05) continue;
                
                const t = (idx - segmentStartSample) / segmentSampleCount;
                const clampedT = Math.min(t, 1.0);
                const originalAngle = currentAngle + clampedT * ring.segmentAngleSize;
                const originalX = ring.centerX + Math.cos(originalAngle) * ring.baseRadius;
                const originalY = ring.centerY + Math.sin(originalAngle) * ring.baseRadius;
                
                const dx = originalX - centerX;
                const dy = originalY - centerY;
                const rotatedX = dx * cosRot - dy * sinRot;
                const rotatedY = dx * sinRot + dy * cosRot;
                const x1 = centerX + rotatedX;
                const y1 = centerY + rotatedY;
                
                const barLength = amplitude * 60;
                const barAngle = Math.atan2(y1 - ring.centerY, x1 - ring.centerX);
                const x2 = x1 + Math.cos(barAngle) * barLength;
                const y2 = y1 + Math.sin(barAngle) * barLength;
                
                const color = getAmplitudeColor(amplitude);
                ctx.fillStyle = color;
                ctx.shadowColor = color;
                
                const barWidth = 3;
                const perpAngle = barAngle + Math.PI / 2;
                const dxBar = Math.cos(perpAngle) * barWidth * 0.5;
                const dyBar = Math.sin(perpAngle) * barWidth * 0.5;
                
                ctx.beginPath();
                ctx.moveTo(x1 - dxBar, y1 - dyBar);
                ctx.lineTo(x1 + dxBar, y1 + dyBar);
                ctx.lineTo(x2 + dxBar, y2 + dyBar);
                ctx.lineTo(x2 - dxBar, y2 - dyBar);
                ctx.closePath();
                ctx.fill();
            }
        } else if (style === 'glow-particles') {
            // Glow particles for segmented path
            ctx.shadowBlur = 20;
            const particleCount = Math.min(20, segmentSampleCount);
            const step = Math.floor(segmentSampleCount / particleCount);
            
            for (let j = 0; j < particleCount; j++) {
                const idx = segmentStartSample + j * step;
                if (idx >= segmentEndSample) break;
                
                const amplitude = ring.samples[idx] || 0;
                if (amplitude < 0.1) continue;
                
                const t = (idx - segmentStartSample) / segmentSampleCount;
                const clampedT = Math.min(t, 1.0);
                const originalAngle = currentAngle + clampedT * ring.segmentAngleSize;
                const variation = amplitude * 45;
                const originalRadius = ring.baseRadius + variation;
                const originalX = ring.centerX + Math.cos(originalAngle) * originalRadius;
                const originalY = ring.centerY + Math.sin(originalAngle) * originalRadius;
                
                const dx = originalX - centerX;
                const dy = originalY - centerY;
                const rotatedX = dx * cosRot - dy * sinRot;
                const rotatedY = dx * sinRot + dy * cosRot;
                const x = centerX + rotatedX;
                const y = centerY + rotatedY;
                
                const color = getAmplitudeColor(amplitude);
                ctx.fillStyle = color;
                ctx.shadowColor = color;
                
                const size = 2 + amplitude * 4;
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (style === 'smooth-filled') {
            // Smooth filled for segmented path
            ctx.lineWidth = 2;
            ctx.shadowBlur = 12;
            
            const gradient = ctx.createLinearGradient(
                ring.centerX - ring.baseRadius, ring.centerY - ring.baseRadius,
                ring.centerX + ring.baseRadius, ring.centerY + ring.baseRadius
            );
            gradient.addColorStop(0, 'rgba(100, 200, 255, 0.8)');
            gradient.addColorStop(0.5, 'rgba(255, 100, 255, 0.8)');
            gradient.addColorStop(1, 'rgba(255, 200, 100, 0.8)');
            
            ctx.fillStyle = gradient;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.shadowColor = 'rgba(255, 100, 255, 0.8)';
            
            ctx.beginPath();
            for (let i = segmentStartSample; i < segmentEndSample; i++) {
                // Use local smoothing within segment
                const prevIdx = i > segmentStartSample ? i - 1 : segmentStartSample;
                const nextIdx = i < segmentEndSample - 1 ? i + 1 : segmentEndSample - 1;
                const prev = ring.samples[prevIdx] || 0;
                const curr = ring.samples[i] || 0;
                const next = ring.samples[nextIdx] || 0;
                const amplitude = (prev + curr * 2 + next) / 4; // Local smoothing
                
                const t = (i - segmentStartSample) / segmentSampleCount;
                const clampedT = Math.min(t, 1.0);
                const originalAngle = currentAngle + clampedT * ring.segmentAngleSize;
                const variation = amplitude * 40;
                const originalRadius = ring.baseRadius + variation;
                const originalX = ring.centerX + Math.cos(originalAngle) * originalRadius;
                const originalY = ring.centerY + Math.sin(originalAngle) * originalRadius;
                
                const dx = originalX - centerX;
                const dy = originalY - centerY;
                const rotatedX = dx * cosRot - dy * sinRot;
                const rotatedY = dx * sinRot + dy * cosRot;
                const x = centerX + rotatedX;
                const y = centerY + rotatedY;
                
                if (i === segmentStartSample) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
            ctx.fill();
        } else if (style === 'neon-outline') {
            // Neon outline for segmented path
            ctx.lineWidth = 4;
            ctx.shadowBlur = 25;
            ctx.strokeStyle = 'rgba(255, 100, 255, 0.6)';
            ctx.shadowColor = 'rgba(255, 100, 255, 1)';
            
            ctx.beginPath();
            for (let i = segmentStartSample; i < segmentEndSample; i++) {
                const amplitude = ring.samples[i];
                const t = (i - segmentStartSample) / segmentSampleCount;
                const clampedT = Math.min(t, 1.0);
                const originalAngle = currentAngle + clampedT * ring.segmentAngleSize;
                const variation = amplitude * 45;
                const originalRadius = ring.baseRadius + variation;
                const originalX = ring.centerX + Math.cos(originalAngle) * originalRadius;
                const originalY = ring.centerY + Math.sin(originalAngle) * originalRadius;
                
                const dx = originalX - centerX;
                const dy = originalY - centerY;
                const rotatedX = dx * cosRot - dy * sinRot;
                const rotatedY = dx * sinRot + dy * cosRot;
                const x = centerX + rotatedX;
                const y = centerY + rotatedY;
                
                if (i === segmentStartSample) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
            
            ctx.lineWidth = 2;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.shadowBlur = 10;
            ctx.stroke();
        } else if (style === 'classic-wave') {
            // Classic wave for segmented path
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.9)';
            ctx.lineWidth = 2;
            ctx.shadowBlur = 8;
            ctx.shadowColor = 'rgba(0, 255, 255, 0.6)';
            
            ctx.beginPath();
            for (let i = segmentStartSample; i < segmentEndSample; i++) {
                const amplitude = ring.samples[i];
                const t = (i - segmentStartSample) / segmentSampleCount;
                const clampedT = Math.min(t, 1.0);
                const originalAngle = currentAngle + clampedT * ring.segmentAngleSize;
                const variation = amplitude * 35;
                const originalRadius = ring.baseRadius + variation;
                const originalX = ring.centerX + Math.cos(originalAngle) * originalRadius;
                const originalY = ring.centerY + Math.sin(originalAngle) * originalRadius;
                
                const dx = originalX - centerX;
                const dy = originalY - centerY;
                const rotatedX = dx * cosRot - dy * sinRot;
                const rotatedY = dx * sinRot + dy * cosRot;
                const x = centerX + rotatedX;
                const y = centerY + rotatedY;
                
                if (i === segmentStartSample) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        } else if (style === 'wave') {
            // Smooth: Closed smooth curve
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let i = segmentStartSample; i < segmentEndSample; i++) {
                const amplitude = ring.samples[i];
                const t = (i - segmentStartSample) / segmentSampleCount;
                const clampedT = Math.min(t, 1.0);
                const originalAngle = currentAngle + clampedT * ring.segmentAngleSize;
                const variation = amplitude * 30;
                const originalRadius = ring.baseRadius + variation;
                const originalX = ring.centerX + Math.cos(originalAngle) * originalRadius;
                const originalY = ring.centerY + Math.sin(originalAngle) * originalRadius;
                
                const dx = originalX - centerX;
                const dy = originalY - centerY;
                const rotatedX = dx * cosRot - dy * sinRot;
                const rotatedY = dx * sinRot + dy * cosRot;
                const x = centerX + rotatedX;
                const y = centerY + rotatedY;
                
                if (i === segmentStartSample) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        } else if (style === 'spike') {
            // Spike: Thin, sharp lines
            ctx.lineWidth = 1; // Thinner for spikes
            for (let i = segmentStartSample; i < segmentEndSample; i += 2) { // Sample every other point
                const amplitude = ring.samples[i];
                if (amplitude < 0.1) continue;
                
                const t = (i - segmentStartSample) / segmentSampleCount;
                const clampedT = Math.min(t, 1.0);
                const originalAngle = currentAngle + clampedT * ring.segmentAngleSize;
                const originalX = ring.centerX + Math.cos(originalAngle) * ring.baseRadius;
                const originalY = ring.centerY + Math.sin(originalAngle) * ring.baseRadius;
                
                const dx = originalX - centerX;
                const dy = originalY - centerY;
                const rotatedX = dx * cosRot - dy * sinRot;
                const rotatedY = dx * sinRot + dy * cosRot;
                const baseX = centerX + rotatedX;
                const baseY = centerY + rotatedY;
                
                // Spike direction (radial from center)
                const spikeLength = amplitude * 60; // Longer spikes
                const spikeAngle = Math.atan2(baseY - ring.centerY, baseX - ring.centerX);
                const spikeX = baseX + Math.cos(spikeAngle) * spikeLength;
                const spikeY = baseY + Math.sin(spikeAngle) * spikeLength;
                
                ctx.beginPath();
                ctx.moveTo(baseX, baseY);
                ctx.lineTo(spikeX, spikeY);
                ctx.stroke();
            }
        } else if (style === 'bar') {
            // Bar: Thick rectangular bars
            ctx.lineWidth = 4; // Thicker for bars
            for (let i = segmentStartSample; i < segmentEndSample; i += 3) { // Sample every 3rd point
                const amplitude = ring.samples[i];
                if (amplitude < 0.05) continue;
                
                const t = (i - segmentStartSample) / segmentSampleCount;
                const clampedT = Math.min(t, 1.0);
                const originalAngle = currentAngle + clampedT * ring.segmentAngleSize;
                const originalX = ring.centerX + Math.cos(originalAngle) * ring.baseRadius;
                const originalY = ring.centerY + Math.sin(originalAngle) * ring.baseRadius;
                
                const dx = originalX - centerX;
                const dy = originalY - centerY;
                const rotatedX = dx * cosRot - dy * sinRot;
                const rotatedY = dx * sinRot + dy * cosRot;
                const x1 = centerX + rotatedX;
                const y1 = centerY + rotatedY;
                
                // Bar direction and width
                const barLength = amplitude * 50;
                const barAngle = Math.atan2(y1 - ring.centerY, x1 - ring.centerX);
                const barWidth = 2;
                const perpAngle = barAngle + Math.PI / 2;
                const dxBar = Math.cos(perpAngle) * barWidth * 0.5;
                const dyBar = Math.sin(perpAngle) * barWidth * 0.5;
                
                const x2 = x1 + Math.cos(barAngle) * barLength;
                const y2 = y1 + Math.sin(barAngle) * barLength;
                
                // Draw bar as rectangle
                ctx.beginPath();
                ctx.moveTo(x1 - dxBar, y1 - dyBar);
                ctx.lineTo(x1 + dxBar, y1 + dyBar);
                ctx.lineTo(x2 + dxBar, y2 + dyBar);
                ctx.lineTo(x2 - dxBar, y2 - dyBar);
                ctx.closePath();
                ctx.fill();
            }
        } else if (style === 'spiral') {
            // Spiral: Waveform with spiral modulation
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let i = segmentStartSample; i < segmentEndSample; i++) {
                const amplitude = ring.samples[i];
                const t = (i - segmentStartSample) / segmentSampleCount;
                const clampedT = Math.min(t, 1.0);
                const originalAngle = currentAngle + clampedT * ring.segmentAngleSize;
                
                // Add spiral effect
                const spiralRadius = amplitude * 30;
                const spiralAngle = originalAngle + amplitude * 0.5; // Spiral twist
                const originalRadius = ring.baseRadius + spiralRadius;
                const originalX = ring.centerX + Math.cos(spiralAngle) * originalRadius;
                const originalY = ring.centerY + Math.sin(spiralAngle) * originalRadius;
                
                const dx = originalX - centerX;
                const dy = originalY - centerY;
                const rotatedX = dx * cosRot - dy * sinRot;
                const rotatedY = dx * sinRot + dy * cosRot;
                const x = centerX + rotatedX;
                const y = centerY + rotatedY;
                
                if (i === segmentStartSample) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
        
        // Move to next segment position (with gap)
        currentAngle += ring.segmentAngleSize + ring.gapSize;
    }
    
    ctx.shadowBlur = 0;
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
