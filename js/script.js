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

    // 调整Canvas尺寸以匹配窗口大小
    function resizeCanvas(canvas) {
        if (canvas) {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
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

    // ------------------ 初始化网格系统 ------------------

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

    // ========== 内容切换系统 ==========
    const contentSystem = {
        init: function () {
            // 检查内容数据是否可用
            if (typeof CONTENT_DATA === 'undefined' && typeof CONTENT_DATA_NORMAL === 'undefined') {
                console.warn('内容数据未定义，使用默认内容');
                this.contentSources = [this.getDefaultContent()];
            } else {
                this.contentSources = [];
                if (typeof CONTENT_DATA !== 'undefined') this.contentSources.push(CONTENT_DATA);
                if (typeof CONTENT_DATA_NORMAL !== 'undefined') this.contentSources.push(CONTENT_DATA_NORMAL);
            }

            this.elements = {
                contentText: document.getElementById('content-text'),
                categoryBtns: document.querySelectorAll('.toggle')
            };

            if (!this.elements.contentText) {
                console.error('内容容器 #content-text 未找到');
                return;
            }

            this.elements.categoryBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    if (btn.dataset.target) {
                        this.switchContent(btn.dataset.target);
                    } else {
                        this.handleFunctionality(btn);
                    }
                });
            });

            // 默认显示首页内容
            let defaultContent = this.findContent('Homepage') || this.findContent('homepage') || this.findContent('首页');
            if (defaultContent) {
                this.switchContent(Object.keys(defaultContent)[0]);
            } else if (this.contentSources.length > 0 && this.contentSources[0]) {
                const firstKey = Object.keys(this.contentSources[0])[0];
                this.switchContent(firstKey);
            } else {
                this.elements.contentText.innerHTML = '<p class="error">暂无可用内容</p>';
            }

            this.initExpandableMenus();
        },

        // 查找内容
        findContent: function (targetId) {
            for (const source of this.contentSources) {
                if (source && source[targetId]) {
                    return { [targetId]: source[targetId] };
                }
            }
            return null;
        },

        // 默认内容
        getDefaultContent: function () {
            return {
                "Homepage": {
                    "title": "欢迎",
                    "content": "<p>这是默认首页内容。请定义 CONTENT_DATA 变量来提供实际内容。</p>"
                },
            };
        },

        switchContent: function (targetId) {
            this.elements.categoryBtns.forEach(btn => {
                if (btn.dataset.target) {
                    btn.classList.toggle('active', btn.dataset.target === targetId);
                }
            });

            let foundContent = null;
            for (const source of this.contentSources) {
                if (source && source[targetId]) {
                    foundContent = source[targetId];
                    break;
                }
            }

            if (foundContent) {
                const titleHtml = foundContent.title ? `<h1>${foundContent.title}</h1>` : '';
                this.elements.contentText.innerHTML = `
                    ${titleHtml}
                    <div class="content-body">${foundContent.content}</div>
                `;

                // 处理新内容中的图片
                this.processImagesInContent();
            } else {
                this.elements.contentText.innerHTML = `<p class="error">"${targetId}" 内容不存在。</p>`;
            }
        },

        initExpandableMenus: function () {
            const expandBtns = document.querySelectorAll('.expand-btn');
            expandBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const menu = e.currentTarget.closest('.expandable-menu');
                    menu.classList.toggle('expanded');
                });
            });

            document.querySelectorAll('.sub-buttons .toggle').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    btn.closest('.expandable-menu').classList.remove('expanded');
                });
            });

            document.addEventListener('click', (e) => {
                if (!e.target.closest('.expandable-menu')) {
                    document.querySelectorAll('.expandable-menu').forEach(menu => {
                        menu.classList.remove('expanded');
                    });
                }
            });
        },

        processImagesInContent: function () {
            const images = this.elements.contentText.querySelectorAll('img[data-src]');
            images.forEach(img => {
                const src = img.getAttribute('data-src');
                if (src) {
                    progressiveLoad(img, src);
                }
            });
        },

        handleFunctionality: function (btn) {
            console.log('功能按钮点击:', btn.textContent);
            // 这里可以添加特殊功能按钮的处理逻辑
        }
    };

    // ========== 平滑滚动功能 ==========
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                const href = this.getAttribute('href');
                if (href === '#' || href.includes('.html')) return;

                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    window.scrollTo({
                        top: target.offsetTop - 80,
                        behavior: 'smooth'
                    });
                }
            });
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

            // 从内容数据中提取图片路径
            contentSystem.contentSources.forEach(source => {
                if (source) {
                    Object.values(source).forEach(content => {
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = content.content;
                        const images = tempDiv.querySelectorAll('img[data-src]');
                        images.forEach(img => {
                            const src = img.getAttribute('data-src');
                            if (src) {
                                paths.add(src);
                                // 同时添加缩略图路径
                                const thumbSrc = src.replace(/(\.\w+)$/, '-thumb$1');
                                paths.add(thumbSrc);
                            }
                        });
                    });
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
                if (images.length === 0) {
                    console.log('没有需要预加载的图片');
                    return;
                }

                console.log('开始预加载图片:', images);
                const loadPromises = images.map(src =>
                    this.loadImage(src).catch(error => {
                        console.warn('图片预加载失败:', error.message);
                        return null;
                    })
                );

                const results = await Promise.all(loadPromises);
                const successful = results.filter(r => r !== null).length;
                console.log(`图片预加载完成: ${successful}/${images.length} 成功`);
            } catch (error) {
                console.warn('预加载过程出错:', error);
            }
        }
    };

    // ========== 主初始化流程 ==========
    try {
        // 1. 初始化网格背景
        initGridSystem();

        // 2. 初始化内容系统
        contentSystem.init();

        // 3. 初始化平滑滚动
        initSmoothScroll();

        // 4. 开始图片预加载（不阻塞主流程）
        setTimeout(() => {
            preloader.preloadAll().catch(console.error);
        }, 1000);

        console.log('系统初始化完成');
    } catch (error) {
        console.error('初始化过程中出错:', error);
    }
});