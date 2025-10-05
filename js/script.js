document.addEventListener('DOMContentLoaded', async function () {
    // ------------------ 基础设置 ------------------

    // 设置真实的视口高度单位
    function setRealVh() {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--real-vh', `${vh}px`);
    }

    // 初始化设置真实视口高度
    setRealVh();
    window.addEventListener('resize', setRealVh);

    // 滚动时添加消失效果
    const hero_texts = document.querySelector('.hero_texts');
    const hideThreshold = 100;
    const showThreshold = 100;
    let isHidden = false;

    function updateHeader() {
        const scrollY = window.scrollY;

        if (!isHidden && scrollY > hideThreshold) {
            hero_texts.classList.add('hero-texts-hidden');
            isHidden = true;
        }
        else if (isHidden && scrollY <= showThreshold) {
            hero_texts.classList.remove('hero-texts-hidden');
            isHidden = false;
        }
    }

    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                updateHeader();
                ticking = false;
            });
            ticking = true;
        }
    });

    // 调整Canvas尺寸以匹配窗口大小
    function resizeCanvas(canvas) {
        if (!canvas) return;

        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();

        // 设置显示尺寸（CSS像素）
        canvas.style.width = window.innerWidth + 'px';
        canvas.style.height = window.innerHeight + 'px';

        // 设置实际绘制尺寸（考虑设备像素比）
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;

        // 缩放Canvas上下文以匹配高DPI
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.scale(dpr, dpr);
        }

        console.log(`Canvas尺寸: ${canvas.width} x ${canvas.height}, DPR: ${dpr}`);
    }

    // 获取CSS自定义属性值
    function getCssVar(name) {
        return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    }

    // 获取网格角度配置并转换为弧度
    function getGridAngles() {
        const angle1 = parseFloat(getCssVar('--grid-angle1')) || 100;
        const angle2 = parseFloat(getCssVar('--grid-angle2')) || 60;
        return [angle1 * Math.PI / 180, angle2 * Math.PI / 180];
    }

    // 创建角度渐变
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
        const lineColor = getCssVar('--grid-line-color') || 'rgba(255, 192, 203,0.5)';
        const highlightColor = getCssVar('--grid-highlight-color') || 'rgba(255,255,255,0.2)';
        const shadowColor = getCssVar('--grid-shadow-color') || 'rgba(0,0,0,0.3)';
        const shadowBlur = parseInt(getCssVar('--grid-shadow-blur')) || 4;
        const [angle1, angle2] = getGridAngles();
        const dx1 = Math.cos(angle1), dy1 = Math.sin(angle1);
        const dx2 = Math.cos(angle2), dy2 = Math.sin(angle2);
        const diag = Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height) * 2;

        [[dx1, dy1], [dx2, dy2]].forEach(([dx, dy]) => {
            let startOffset = -diag;
            for (let i = startOffset; i < diag; i += gridSize) {
                // 绘制主线条
                ctx.beginPath();
                ctx.moveTo(i * dx - dy * diag, i * dy + dx * diag);
                ctx.lineTo(i * dx + dy * diag, i * dy - dx * diag);
                ctx.strokeStyle = lineColor;
                ctx.lineWidth = lineWidth;
                ctx.shadowColor = shadowColor;
                ctx.shadowBlur = shadowBlur;
                ctx.stroke();

                // 绘制高光线
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
    let fading = true;

    function animateGrid(mainCanvas) {
        const now = performance.now();
        const delta = (now - lastTime) / 1000;
        lastTime = now;

        offCtx.clearRect(0, 0, offCanvas.width, offCanvas.height);
        drawSkewGrid(offCanvas);

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

        const fadeDuration = parseFloat(getCssVar('--grid-fade-duration')) || 2;
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

    function initGridSystem() {
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

        window.addEventListener('resize', () => {
            resizeCanvas(mainCanvas);
            offCanvas.width = mainCanvas.width;
            offCanvas.height = mainCanvas.height;
        });
    }

    // ========== 图片渐进式加载 ==========
    function progressiveLoad(imgEl, originalSrc) {
        const THUMB_SUFFIX = '-thumb';
        function getThumbPath(original) {
            const extPos = original.lastIndexOf('.');
            if (extPos === -1) return original + THUMB_SUFFIX;
            return original.slice(0, extPos) + THUMB_SUFFIX + original.slice(extPos);
        }
        const thumbSrc = getThumbPath(originalSrc);
        imgEl.classList.add('progressive');
        imgEl.src = thumbSrc;

        const fullImg = new Image();
        fullImg.src = originalSrc;
        fullImg.onload = () => {
            imgEl.src = originalSrc;
            imgEl.classList.add('loaded');
        };
        fullImg.onerror = () => {
            console.warn('图片加载失败:', originalSrc);
        };
    }

    // ========== 图片预加载系统 ==========
    const preloader = {
        getAllImagePaths: function () {
            const paths = new Set();
            // 从页面中或全局对象中提取图片路径
            document.querySelectorAll('img[data-src]').forEach(img => {
                const src = img.getAttribute('data-src');
                if (src) {
                    paths.add(src);
                    paths.add(src.replace(/(\.\w+)$/, '-thumb$1'));
                }
            });
            return Array.from(paths);
        },

        loadImage: function (src) {
            return new Promise((resolve, reject) => {
                const img = new Image();
                if (src.includes('thumb')) img.fetchPriority = 'high';
                img.src = src;
                img.onload = () => resolve(src);
                img.onerror = () => reject(new Error(`Failed to load: ${src}`));
            });
        },

        preloadAll: async function () {
            try {
                const images = this.getAllImagePaths();
                if (images.length === 0) return;
                const loadPromises = images.map(src => this.loadImage(src).catch(e => null));
                await Promise.all(loadPromises);
            } catch (error) {
                console.warn('图片预加载出错:', error);
            }
        }
    };

    // ========== 平滑滚动 ==========
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                const href = this.getAttribute('href');
                if (href === '#' || href.includes('.html')) return;
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) window.scrollTo({ top: target.offsetTop - 80, behavior: 'smooth' });
            });
        });
    }

    // ========== 按键跳转页面 ==========
    // 例：PagePath 对象在另一个 JS 中定义
    // const PagePath = { home: 'index.html', about: 'about.html', contact: 'contact.html' };
    document.querySelectorAll('[data-page]').forEach(btn => {
        btn.addEventListener('click', () => {
            const key = btn.getAttribute('data-page');
            if (typeof PagePath !== 'undefined' && PagePath[key]) {
                window.location.href = PagePath[key];
            } else {
                console.warn('PagePath 未定义或键不存在:', key);
            }
        });
    });

    // ========== 主初始化流程 ==========
    try {
        initGridSystem();
        initSmoothScroll();
        setTimeout(() => { preloader.preloadAll(); }, 500);
        console.log('系统初始化完成');
    } catch (error) {
        console.error('初始化出错:', error);
    }
});