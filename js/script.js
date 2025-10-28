// =============================
// 全局初始化入口
// =============================
document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM 加载完成，开始初始化");
    initializeApp();
});

// =============================
// 主入口函数
// =============================
function initializeApp() {
    try {
        console.log("[App] 初始化开始");

        // 设置视口
        setRealVh();
        window.addEventListener("resize", setRealVh);

        // 初始化加载动画
        initLoader();

        // 初始化网格背景系统
        initGridSystem();

        // 初始化图片系统
        initImages();
        initImageModal();

        // 初始化滚动系统
        initGlobalSmoothScroll();

        // 初始化页面交互逻辑
        initHeaderScroll();
        initPageNavigation();

        console.log("初始化完成");
    } catch (e) {
        console.error("初始化出错:", e);
    }
}

// =============================
// 视口修正
// =============================
function setRealVh() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--real-vh", `${vh}px`);
}

// =============================
// 页面加载动画
// =============================
function initLoader() {
    disableScroll();

    setTimeout(() => {
        const wrapper = document.querySelector(".loader-wrapper");
        const loader = document.querySelector(".loader");
        wrapper?.classList.add("loaded");
        loader?.classList.add("loaded");

        setTimeout(enableScroll, 1500);
    }, 2000);

    window.addEventListener("beforeunload", () => {
        window.scrollTo(0, 0);
    });
}

// =============================
// Header 滚动控制
// =============================
let isHidden = false;
let headerScrollLocked = false;
const hideThreshold = 250;
const showThreshold = 250;

function getScrollY() {
    return window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
}

function updateHeader() {
    if (headerScrollLocked) return;
    const heroTexts = document.querySelector(".hero_texts");
    const scrollY = getScrollY();

    if (!isHidden && scrollY > hideThreshold) {
        heroTexts?.classList.add("hero-texts-hidden");
        isHidden = true;
    } else if (isHidden && scrollY <= showThreshold) {
        heroTexts?.classList.remove("hero-texts-hidden");
        isHidden = false;
    }
}

function initHeaderScroll() {
    let ticking = false;
    updateHeader();

    window.addEventListener("scroll", () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                updateHeader();
                ticking = false;
            });
            ticking = true;
        }
    });
}

// =============================
// 禁用/启用滚动
// =============================
let scrollY = 0;

function preventTouchMove(e) {
    e.preventDefault();
}

function disableScroll() {
    scrollY = getScrollY();
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    document.addEventListener("touchmove", preventTouchMove, { passive: false });
    headerScrollLocked = true;
}

function enableScroll() {
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.width = "";
    window.scrollTo(0, scrollY);
    document.removeEventListener("touchmove", preventTouchMove);
    headerScrollLocked = false;
    updateHeader();
}

// =============================
// 网格背景绘制与动画
// =============================
let offCanvas, offCtx, lastTime = performance.now(), fadeTime = 0, fading = true;

function initGridSystem() {
    const mainCanvas = document.getElementById("grid-bg") || (() => {
        const c = document.createElement("canvas");
        c.id = "grid-bg";
        Object.assign(c.style, {
            position: "fixed", left: "0", top: "0", width: "100vw", height: "100vh",
            zIndex: "-1", pointerEvents: "none"
        });
        document.body.appendChild(c);
        return c;
    })();

    resizeCanvas(mainCanvas);

    offCanvas = document.createElement("canvas");
    offCanvas.width = mainCanvas.width;
    offCanvas.height = mainCanvas.height;
    offCtx = offCanvas.getContext("2d");
    offCtx.imageSmoothingEnabled = false;

    drawSkewGrid(offCanvas);
    animateGrid(mainCanvas);

    window.addEventListener("resize", () => {
        resizeCanvas(mainCanvas);
        offCanvas.width = mainCanvas.width;
        offCanvas.height = mainCanvas.height;
        drawSkewGrid(offCanvas);
    });
}

function resizeCanvas(canvas) {
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.scale(dpr, dpr);
}

function getCssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function drawSkewGrid(canvas) {
    const ctx = canvas.getContext("2d");
    const gridSize = parseInt(getCssVar("--grid-size")) || 200;
    const lineColor = getCssVar("--grid-line-color") || "rgba(255, 192, 203,0.5)";
    const highlightColor = getCssVar("--grid-highlight-color") || "rgba(255,255,255,0.2)";
    const shadowColor = getCssVar("--grid-shadow-color") || "rgba(0,0,0,0.3)";
    const lineWidth = parseInt(getCssVar("--grid-line-width")) || 2;
    const [angle1, angle2] = [100, 60].map(a => a * Math.PI / 180);
    const dx1 = Math.cos(angle1), dy1 = Math.sin(angle1);
    const dx2 = Math.cos(angle2), dy2 = Math.sin(angle2);
    const diag = Math.sqrt(canvas.width ** 2 + canvas.height ** 2) * 2;

    [[dx1, dy1], [dx2, dy2]].forEach(([dx, dy]) => {
        for (let i = -diag; i < diag; i += gridSize) {
            ctx.beginPath();
            ctx.moveTo(i * dx - dy * diag, i * dy + dx * diag);
            ctx.lineTo(i * dx + dy * diag, i * dy - dx * diag);
            ctx.strokeStyle = lineColor;
            ctx.lineWidth = lineWidth;
            ctx.shadowColor = shadowColor;
            ctx.shadowBlur = 4;
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

function animateGrid(mainCanvas) {
    const ctx = mainCanvas.getContext("2d");
    const draw = () => {
        const now = performance.now();
        const delta = (now - lastTime) / 1000;
        lastTime = now;

        const grad = ctx.createLinearGradient(0, 0, mainCanvas.width, mainCanvas.height);
        grad.addColorStop(0, "rgba(0,0,0)");
        grad.addColorStop(0.5, "rgba(20,20,90)");
        grad.addColorStop(1, "rgba(36,36,150)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, mainCanvas.width, mainCanvas.height);

        const fadeDuration = 2;
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

        requestAnimationFrame(draw);
    };
    draw();
}

// =============================
// 图片渐进加载与弹窗
// =============================
function initImages() {
    const imgs = document.querySelectorAll("img[data-src]");
    imgs.forEach(img => {
        const originalSrc = img.getAttribute("data-src");
        progressiveLoad(img, originalSrc);
    });
}

function progressiveLoad(imgEl, originalSrc) {
    const thumbSrc = originalSrc.replace(/(\.\w+)$/, "-thumb$1");
    imgEl.classList.add("progressive");

    const thumb = new Image();
    thumb.src = thumbSrc;
    thumb.onload = () => imgEl.src = thumbSrc;
    thumb.onerror = () => imgEl.src = originalSrc;

    const full = new Image();
    full.src = originalSrc;
    full.onload = () => {
        imgEl.src = originalSrc;
        imgEl.classList.add("loaded");
    };
}

function initImageModal() {
    const modal = document.getElementById("imgModal");
    const modalImg = document.getElementById("modalImg");

    document.querySelectorAll("img[data-src]").forEach(img => {
        img.addEventListener("click", () => {
            modal.style.display = "flex";
            modalImg.src = img.src;
            disableScroll();
        });
    });

    modal.addEventListener("click", () => {
        modal.style.display = "none";
        modalImg.src = "";
        enableScroll();
    });
}

// =============================
// 页面跳转系统
// =============================
const PagePath = {
    home: "../index.html",
    group: "../html/others/group.html",
    DeltaForce: "../html/others/DeltaForce.html",
    ACLOS: "../html/others/ACLOS.html",
    BlueArchive: "../html/others/BlueArchive.html",
};

function initPageNavigation() {
    document.querySelectorAll("[data-page]").forEach(btn => {
        btn.addEventListener("click", () => {
            const key = btn.getAttribute("data-page");
            if (PagePath[key]) {
                document.querySelector(".loader-wrapper")?.classList.remove("loaded");
                document.querySelector(".loader")?.classList.remove("loaded");
                disableScroll();
                setTimeout(() => (window.location.href = PagePath[key]), 1500);
            } else {
                console.warn("PagePath 未定义或键不存在:", key);
            }
        });
    });
}

// =============================
// 平滑滚动系统
// =============================
const scrollManager = {
    frame: null,// 当前 requestAnimationFrame
    active: false,// 是否有动画在进行
    targetY: 0,// 当前目标滚动位置
    wheelActive: false,// 是否滚轮在主导
    stop() {
        if (this.frame) cancelAnimationFrame(this.frame);
        this.frame = null;
        this.active = false;
        this.wheelActive = false;
    },
    scrollTo(targetY, duration = 600) {
        this.stop();// 停掉当前动画
        this.wheelActive = false;
        const startY = window.scrollY || document.documentElement.scrollTop;
        const distance = targetY - startY;
        if (Math.abs(distance) < 1) return;

        const startTime = performance.now();
        const ease = t => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2;

        const step = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const newY = startY + distance * ease(progress);
            window.scrollTo(0, newY);

            if (progress < 1) {
                this.active = true;
                this.frame = requestAnimationFrame(step);
            } else {
                this.active = false;
                this.frame = null;
            }
        };
        this.frame = requestAnimationFrame(step);
    },
    wheelScrollStep() {
        const currentY = window.scrollY || document.documentElement.scrollTop;
        const distance = this.targetY - currentY;

        if (Math.abs(distance) < 0.5) {
            this.active = false;
            return;
        }

        const step = distance * 0.15;// 惯性速度
        window.scrollTo(0, currentY + step);
        this.frame = requestAnimationFrame(() => this.wheelScrollStep());
    }
};

function initGlobalSmoothScroll() {
    function waitForLoaderDone(timeout = 3000) {
        return new Promise((resolve) => {
            const wrapper = document.querySelector('.loader-wrapper');
            if (!wrapper) {
                if (document.readyState === 'complete') {
                    setTimeout(resolve, 200);
                } else {
                    window.addEventListener('load', () => setTimeout(resolve, 200), { once: true });
                }
                return;
            }
            if (wrapper.classList.contains('loaded')) {
                resolve();
                return;
            }
            const obs = new MutationObserver(() => {
                if (wrapper.classList.contains('loaded')) {
                    obs.disconnect();
                    resolve();
                }
            });
            obs.observe(wrapper, { attributes: true, attributeFilter: ['class'] });
            setTimeout(() => {
                obs.disconnect();
                resolve();
            }, timeout);
        });
    }

    waitForLoaderDone(4000).then(() => {
        // --------- 统一管理器 ---------
        const scrollManager = {
            frame: null,
            active: false,
            wheelActive: false,
            targetY: window.scrollY || 0,
            stop() {
                if (this.frame) cancelAnimationFrame(this.frame);
                this.frame = null;
                this.active = false;
                this.wheelActive = false;
            },
            scrollTo(targetY, duration = 600) {
                this.stop();
                const startY = window.scrollY || document.documentElement.scrollTop;
                const distance = targetY - startY;
                if (Math.abs(distance) < 1) return;

                const startTime = performance.now();
                const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

                const step = (now) => {
                    const elapsed = now - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    const newY = startY + distance * ease(progress);
                    window.scrollTo(0, newY);

                    if (progress < 1) {
                        this.active = true;
                        this.frame = requestAnimationFrame(step);
                    } else {
                        this.active = false;
                        this.frame = null;
                    }
                };
                this.frame = requestAnimationFrame(step);
            },
            wheelScrollStep() {
                const currentY = window.scrollY || document.documentElement.scrollTop;
                const distance = this.targetY - currentY;
                if (Math.abs(distance) < 0.5) {
                    this.active = false;
                    return;
                }
                const step = distance * 0.15;// 惯性速度
                window.scrollTo(0, currentY + step);
                this.frame = requestAnimationFrame(() => this.wheelScrollStep());
            }
        };

        // --------- 滚轮事件 ---------
        window.addEventListener('wheel', (e) => {
            e.preventDefault();
            scrollManager.wheelActive = true;

            const delta = e.deltaY;
            const maxScroll = document.body.scrollHeight - window.innerHeight;

            // 累加目标滚动距离
            scrollManager.targetY = Math.max(0, Math.min(maxScroll, scrollManager.targetY + delta * 2));

            if (!scrollManager.active) {
                scrollManager.active = true;
                scrollManager.wheelScrollStep();
            }
        }, { passive: false });

        // --------- 键盘滚动 ---------
        let isKeyHeld = false;
        let wasLongPress = false;
        let keyHoldTimer = null;
        let scrollAnimationId = null;
        let holdDirection = null;

        window.addEventListener('keydown', (e) => {
            if (isKeyHeld) return;
            isKeyHeld = true;
            wasLongPress = false;

            if (['ArrowDown', 'PageDown', ' '].includes(e.key)) holdDirection = 'down';
            else if (['ArrowUp', 'PageUp'].includes(e.key)) holdDirection = 'up';
            else if (e.key === 'Home') holdDirection = 'home';
            else if (e.key === 'End') holdDirection = 'end';
            else return;

            e.preventDefault();

            keyHoldTimer = setTimeout(() => {
                if (!isKeyHeld) return;
                wasLongPress = true;
                startContinuousScroll(holdDirection);
            }, 200);
        });

        window.addEventListener('keyup', () => {
            clearTimeout(keyHoldTimer);
            isKeyHeld = false;
            cancelAnimationFrame(scrollAnimationId);
            if (!wasLongPress && holdDirection)
                smoothSingleScroll(holdDirection);
            holdDirection = null;
        });

        function smoothSingleScroll(direction) {
            scrollManager.stop();// 停掉滚轮动画
            const distance = window.innerHeight;
            if (direction === 'down') scrollManager.scrollTo(window.scrollY + distance, 400);
            else if (direction === 'up') scrollManager.scrollTo(window.scrollY - distance, 400);
            else if (direction === 'home') scrollManager.scrollTo(0, 400);
            else if (direction === 'end') scrollManager.scrollTo(document.body.scrollHeight, 400);
        }

        function startContinuousScroll(direction) {
            scrollManager.stop();// 停掉滚轮动画
            const step = 10;
            function stepScroll() {
                if (!isKeyHeld) return;
                const currentY = window.scrollY || document.documentElement.scrollTop;
                if (direction === 'down') window.scrollTo(0, currentY + step);
                else if (direction === 'up') window.scrollTo(0, currentY - step);
                scrollAnimationId = requestAnimationFrame(stepScroll);
            }
            scrollAnimationId = requestAnimationFrame(stepScroll);
        }

        // --------- 锚点/按钮跳转 ---------
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                const href = this.getAttribute('href');
                if (href === '#' || href.includes('.html')) return;
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    const topbar = document.querySelector('.topbar');
                    const offset = topbar ? topbar.offsetHeight : 0;
                    const targetY = target.getBoundingClientRect().top + (window.scrollY || 0) - offset;
                    scrollManager.stop();// 停掉滚轮动画
                    scrollManager.scrollTo(targetY, 400);
                }
            });
        });
    });
}


function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#' || href.includes('.html')) return; e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                const topbar = document.querySelector('.topbar');
                const offset = topbar ? topbar.offsetHeight : 0;
                const targetY = target.getBoundingClientRect().top + getScrollY() - offset;
                smoothScrollTo(targetY, 400);
            }
        });
    });
}