// ------------------ 基础设置 ------------------

function setRealVh() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--real-vh', `${vh}px`);
}
setRealVh();
window.addEventListener('resize', setRealVh);

function resizeCanvas(canvas) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function getCssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function getGridAngles() {
    const angle1 = parseFloat(getCssVar('--grid-angle1')) || 100;
    const angle2 = parseFloat(getCssVar('--grid-angle2')) || 60;
    return [angle1 * Math.PI / 180, angle2 * Math.PI / 180];
}

function createAngleGradient(ctx, width, height, angle, colors) {
    const rad = (angle % 360) * Math.PI / 180;
    const dx = Math.cos(rad);
    const dy = Math.sin(rad);
    const half = Math.sqrt(width * width + height * height) / 2;
    const x0 = width / 2 - dx * half;
    const y0 = height / 2 - dy * half;
    const x1 = width / 2 + dx * half;
    const y1 = height / 2 + dy * half;

    const grad = ctx.createLinearGradient(x0, y0, x1, y1);
    colors.forEach(c => grad.addColorStop(c.offset, c.color));
    return grad;
}

// ------------------ 网格绘制 ------------------

function drawSkewGrid(canvas) {
    const ctx = canvas.getContext('2d');
    const gridSize = parseInt(getCssVar('--grid-size')) || 200;
    const lineWidth = parseInt(getCssVar('--grid-line-width')) || 2;
    const lineColor = getCssVar('--grid-line-color') || 'rgba(225,225,0,0.5)';
    const highlightColor = getCssVar('--grid-highlight-color') || 'rgba(255,255,255,0.2)';
    const shadowColor = getCssVar('--grid-shadow-color') || 'rgba(0,0,0,0.3)';
    const shadowBlur = parseInt(getCssVar('--grid-shadow-blur')) || 4;
    const [angle1, angle2] = getGridAngles();
    const dx1 = Math.cos(angle1), dy1 = Math.sin(angle1);
    const dx2 = Math.cos(angle2), dy2 = Math.sin(angle2);
    const diag = Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height) * 2;

    // 两组线
    [[dx1, dy1], [dx2, dy2]].forEach(([dx, dy]) => {
        let startOffset = -diag;
        for (let i = startOffset; i < diag; i += gridSize) {
            ctx.beginPath();
            ctx.moveTo(i * dx - dy * diag, i * dy + dx * diag);
            ctx.lineTo(i * dx + dy * diag, i * dy - dx * diag);
            ctx.strokeStyle = lineColor;
            ctx.lineWidth = lineWidth;
            ctx.shadowColor = shadowColor;
            ctx.shadowBlur = shadowBlur;
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(i * dx - dy * diag + 1, i * dy + dx * diag + 1);
            ctx.lineTo(i * dx + dy * diag + 1, i * dy - dx * diag + 1);
            ctx.strokeStyle = highlightColor;
            ctx.lineWidth = 1;
            ctx.shadowBlur = 0;
            ctx.stroke();
        }
    });
}

// ------------------ 动画 ------------------

let offCanvas, offCtx;
let lastTime = performance.now();
let fadeTime = 0;
let fading = true; // 控制淡入淡出

function animateGrid(mainCanvas) {
    const now = performance.now();
    const delta = (now - lastTime) / 1000; // 秒
    lastTime = now;

    // 清空离屏并绘制固定网格
    offCtx.clearRect(0, 0, offCanvas.width, offCanvas.height);
    drawSkewGrid(offCanvas);

    // 背景渐变
    const ctx = mainCanvas.getContext('2d');
    const BGColorFirst = getCssVar('--bg-color-first') || 'rgba(0,0,0)';
    const BGColorMid = getCssVar('--bg-color-mid') || 'rgba(20,20,90)';
    const BGColorEnd = getCssVar('--bg-color-end') || 'rgba(36,36,150)';

    const grad = createAngleGradient(ctx, mainCanvas.width, mainCanvas.height, 45, [
        { offset: 0, color: BGColorFirst },
        { offset: 0.5, color: BGColorMid },
        { offset: 1, color: BGColorEnd }
    ]);

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, mainCanvas.width, mainCanvas.height);

    // ------------------ 淡入淡出 ------------------
    const fadeDuration = parseFloat(getCssVar('--grid-fade-duration')) || 2; // 秒
    fadeTime += delta;
    if (fadeTime >= fadeDuration) {
        fadeTime = 0;
        fading = !fading;
    }
    const alpha = fading ? fadeTime / fadeDuration : 1 - fadeTime / fadeDuration;

    ctx.globalAlpha = alpha;
    ctx.drawImage(offCanvas, 0, 0);
    ctx.globalAlpha = 1.0;

    requestAnimationFrame(() => animateGrid(mainCanvas));
}

// ------------------ 初始化 ------------------

window.addEventListener('DOMContentLoaded', () => {
    const mainCanvas = document.getElementById('grid-bg') || (() => {
        const c = document.createElement('canvas');
        c.id = 'grid-bg';
        c.style.position = 'fixed';
        c.style.left = '0';
        c.style.top = '0';
        c.style.width = '100vw';
        c.style.height = '100vh';
        c.style.zIndex = '-1';
        c.style.pointerEvents = 'none';
        document.body.appendChild(c);
        return c;
    })();

    resizeCanvas(mainCanvas);

    offCanvas = document.createElement('canvas');
    offCanvas.width = mainCanvas.width;
    offCanvas.height = mainCanvas.height;
    offCtx = offCanvas.getContext('2d');

    animateGrid(mainCanvas);
});

window.addEventListener('resize', () => {
    const canvas = document.getElementById('grid-bg');
    resizeCanvas(canvas);
    offCanvas.width = canvas.width;
    offCanvas.height = canvas.height;
});
