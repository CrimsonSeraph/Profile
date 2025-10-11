document.addEventListener('DOMContentLoaded', async function () {
    //设置 --real-vh 变量，解决移动端 vh 单位问题
    function setRealVh() {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--real-vh', `${vh}px`);
    }
    setRealVh();
    window.addEventListener('resize', setRealVh);

    const hero_texts = document.querySelector('.hero_texts');
    const hideThreshold = 250;
    const showThreshold = 250;
    let isHidden = false;

    let headerScrollLocked = false;

    function getScrollY() {
        return window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
    }

    function updateHeader() {
        if (headerScrollLocked) return; // 弹窗期间不更新
        const scrollY = getScrollY();
        if (!isHidden && scrollY > hideThreshold) {
            hero_texts.classList.add('hero-texts-hidden');
            isHidden = true;
        } else if (isHidden && scrollY <= showThreshold) {
            hero_texts.classList.remove('hero-texts-hidden');
            isHidden = false;
        }
    }

    window.addEventListener('beforeunload', () => {
        window.scrollTo(0, 0);
    });

    updateHeader();

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

    disableScroll();
    setTimeout(function () {
        document.querySelector('.loader-wrapper').classList.add('loaded');
        document.querySelector('.loader').classList.add('loaded');
        setTimeout(function () {
            enableScroll();
        }, 1500);
    }, 2000);

    // ------------------ 网格绘制 ------------------
    function resizeCanvas(canvas) {
        if (!canvas) return;
        const dpr = window.devicePixelRatio || 1;
        canvas.style.width = window.innerWidth + 'px';
        canvas.style.height = window.innerHeight + 'px';
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.scale(dpr, dpr);
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

    function drawSkewGrid(canvas) {
        const ctx = canvas.getContext('2d');
        const gridSize = parseInt(getCssVar('--grid-size')) || 200;
        const lineWidth = parseInt(getCssVar('--grid-line-width')) || 2;
        const lineColor = getCssVar('--grid-line-color') || 'rgba(255, 192, 203,0.5)';
        const highlightColor = getCssVar('--grid-highlight-color') || 'rgba(255,255,255,0.2)';
        const shadowColor = getCssVar('--grid-shadow-color') || 'rgba(0,0,0,0.3)';
        const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
        const shadowBlur = isMobile ? 0 : (parseInt(getCssVar('--grid-shadow-blur')) || 4);
        const [angle1, angle2] = getGridAngles();
        const dx1 = Math.cos(angle1), dy1 = Math.sin(angle1);
        const dx2 = Math.cos(angle2), dy2 = Math.sin(angle2);
        const diag = Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height) * 2;

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
    let fading = true;

    function animateGrid(mainCanvas) {
        const now = performance.now();
        const delta = (now - lastTime) / 1000;
        lastTime = now;

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

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.drawImage(offCanvas, 0, 0);
        ctx.restore();

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

        offCtx.imageSmoothingEnabled = false;

        drawSkewGrid(offCanvas);

        animateGrid(mainCanvas);

        window.addEventListener('resize', () => {
            resizeCanvas(mainCanvas);
            offCanvas.width = mainCanvas.width;
            offCanvas.height = mainCanvas.height;
            drawSkewGrid(offCanvas);
        });
    }

    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            drawSkewGrid(offCanvas);
        }
    });

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

        const testImg = new Image();
        testImg.src = thumbSrc;
        testImg.onload = () => imgEl.src = thumbSrc;
        testImg.onerror = () => imgEl.src = originalSrc;

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

    const preloader = {
        getAllImagePaths: function () {
            const paths = new Set();
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

    function initImages() {
        setTimeout(async () => {
            await preloader.preloadAll();
            document.querySelectorAll('img[data-src]').forEach(img => {
                progressiveLoad(img, img.getAttribute('data-src'));
            });
        }, 500);
    }

    // ========== 禁用滚动 ==========
    function preventTouchMove(e) {
        e.preventDefault();
    }

    function disableScroll() {
        scrollY = getScrollY();
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.width = '100%';
        document.addEventListener('touchmove', preventTouchMove, { passive: false });
        headerScrollLocked = true; // 禁用 header 滑动
    }

    function enableScroll() {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
        document.removeEventListener('touchmove', preventTouchMove);
        headerScrollLocked = false; // 恢复 header 滑动
        updateHeader(); // 弹窗关闭后立即刷新 header 状态
    }

    // ========== 图片点击显示 ==========
    function initImageModal() {
        const modal = document.getElementById('imgModal');
        const modalImg = document.getElementById('modalImg');

        let scrollY = 0; // 用于保存滚动位置

        // 点击图片显示弹窗
        document.querySelectorAll('img[data-src]').forEach(img => {
            img.addEventListener('click', () => {
                modal.style.display = 'flex';
                modalImg.src = img.src;
                disableScroll();
            });
        });

        // 点击弹窗任意位置关闭
        modal.addEventListener('click', () => {
            modal.style.display = 'none';
            modalImg.src = '';
            enableScroll();
        });
    }

    // ========== 平滑滚动 ==========
    function initGlobalSmoothScroll() {
        let isScrolling = false;
        let scrollTarget = 0;
        let scrollStart = 0;
        let scrollStartTime = 0;

        // 鼠标滚轮平滑滚动
        window.addEventListener('wheel', function (e) {
            e.preventDefault();

            const delta = e.deltaY;
            scrollStart = getScrollY();
            scrollTarget = scrollStart + delta * 6; // 调整滚动速度
            scrollStartTime = performance.now();

            if (!isScrolling) {
                smoothScrollToPosition();
            }
        }, { passive: false });

        // 键盘平滑滚动
        let isKeyHeld = false;
        let wasLongPress = false;
        let keyHoldTimer = null;
        let scrollAnimationId = null;
        let holdDirection = null;

        window.addEventListener('keydown', (e) => {
            // 如果键已经按住，直接返回
            if (isKeyHeld) return;
            isKeyHeld = true;
            wasLongPress = false;

            // 判断方向
            if (['ArrowDown', 'PageDown', ' '].includes(e.key)) holdDirection = 'down';
            else if (['ArrowUp', 'PageUp'].includes(e.key)) holdDirection = 'up';
            else if (e.key === 'Home') holdDirection = 'home';
            else if (e.key === 'End') holdDirection = 'end';
            else return;

            e.preventDefault();

            // 200ms 内判断是否长按
            keyHoldTimer = setTimeout(() => {
                if (!isKeyHeld) return;
                wasLongPress = true; // 标记为长按
                startContinuousScroll(holdDirection);
            }, 200);
        });

        window.addEventListener('keyup', (e) => {
            clearTimeout(keyHoldTimer);
            isKeyHeld = false;
            cancelAnimationFrame(scrollAnimationId);

            // 非长按执行
            if (!wasLongPress && holdDirection) {
                smoothSingleScroll(holdDirection);
            }

            holdDirection = null;
        });

        // 单次平滑滚动
        function smoothSingleScroll(direction) {
            const distance = window.innerHeight * 1;

            if (direction === 'down') smoothScrollTo(getScrollY() + distance, 400);
            else if (direction === 'up') smoothScrollTo(getScrollY() - distance, 400);
            else if (direction === 'home') smoothScrollTo(0, 600);
            else if (direction === 'end') smoothScrollTo(document.body.scrollHeight, 600);
        }

        // 长按持续滚动
        function startContinuousScroll(direction) {
            const step = 10; // 每帧滚动像素

            function stepScroll() {
                if (!isKeyHeld) return; // 松开时立即停止
                const currentY = getScrollY();

                if (direction === 'down')
                    window.scrollTo(0, currentY + step);
                else if (direction === 'up')
                    window.scrollTo(0, currentY - step);

                scrollAnimationId = requestAnimationFrame(stepScroll);
            }

            scrollAnimationId = requestAnimationFrame(stepScroll);
        }
        function smoothScrollToPosition() {
            if (isScrolling) return;

            isScrolling = true;
            const duration = 800;

            function animate(currentTime) {
                if (!scrollStartTime) scrollStartTime = currentTime;
                const elapsed = currentTime - scrollStartTime;
                const progress = Math.min(elapsed / duration, 1);

                // 缓动函数
                const easeOutQuart = t => 1 - Math.pow(1 - t, 3);
                const currentY = scrollStart + (scrollTarget - scrollStart) * easeOutQuart(progress);

                window.scrollTo(0, currentY);

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    isScrolling = false;
                    scrollStartTime = 0;
                }
            }

            requestAnimationFrame(animate);
        }

        initSmoothScroll();
    }

    function smoothScrollTo(targetPosition, duration = 1000) {
        const startPosition = getScrollY();
        const distance = targetPosition - startPosition;

        // 如果距离很小，直接滚动，不需要动画
        if (Math.abs(distance) < 5) {
            window.scrollTo(0, targetPosition);
            return;
        }

        let startTime = null;

        function animation(currentTime) {
            if (startTime === null) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            const progress = Math.min(timeElapsed / duration, 1);

            // 缓动函数
            const easeInOutCubic = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
            const run = easeInOutCubic(progress);

            window.scrollTo(0, startPosition + distance * run);

            if (timeElapsed < duration) {
                requestAnimationFrame(animation);
            }
        }

        requestAnimationFrame(animation);
    }

    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                const href = this.getAttribute('href');

                if (href === '#' || href.includes('.html')) return;

                e.preventDefault();
                const target = document.querySelector(href);

                if (target) {
                    const topbarHeight = document.querySelector('.topbar').offsetHeight;
                    const targetPosition = target.getBoundingClientRect().top + getScrollY() - topbarHeight;

                    smoothScrollTo(targetPosition, 800); // 800ms 持续时间
                }
            });
        });
    }

    // ========== 按键跳转页面 ==========
    document.querySelectorAll('[data-page]').forEach(btn => {
        btn.addEventListener('click', () => {
            const key = btn.getAttribute('data-page');
            if (typeof PagePath !== 'undefined' && PagePath[key]) {
                document.querySelector('.loader-wrapper').classList.remove('loaded');
                setTimeout(function () {
                    window.location.href = PagePath[key];
                }, 1500);
            } else {
                console.warn('PagePath 未定义或键不存在:', key);
                document.querySelector('.loader-wrapper').classList.add('loaded');
                document.querySelector('.loader').classList.add('loaded');
                setTimeout(function () {
                    enableScroll();
                }, 2000);
            }
        });
    });

    // ========== 主初始化流程 ==========
    try {
        disableScroll();
        initGridSystem();
        initGlobalSmoothScroll();
        initImages();
        initImageModal();

        console.log('系统初始化完成');
    } catch (error) {
        console.error('初始化出错:', error);
    }
});

//使用格式< button data-page="page_name" > text</button >
const PagePath = {
    group: '../html/others/group.html',
    DeltaForce: '../html/others/DeltaForce.html',
    ACLOS: '../html/others/ACLOS.html',
    BlueArchive: '../html/others/BlueArchive.html',
};