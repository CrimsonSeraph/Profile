// ------------------ 基础设置 ------------------

// 设置真实的视口高度单位，解决移动浏览器视口高度问题
function setRealVh() {
    // 计算视口高度的1%作为自定义CSS变量值
    const vh = window.innerHeight * 0.01;
    // 将计算值设置为CSS自定义属性
    document.documentElement.style.setProperty('--real-vh', `${vh}px`);
}

// 初始化设置真实视口高度
setRealVh();
// 监听窗口大小变化事件，动态调整视口高度
window.addEventListener('resize', setRealVh);

// 调整Canvas尺寸以匹配窗口大小
function resizeCanvas(canvas) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

// 获取CSS自定义属性值
function getCssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

// 获取网格角度配置并转换为弧度
function getGridAngles() {
    // 从CSS变量获取角度值，若无则使用默认值
    const angle1 = parseFloat(getCssVar('--grid-angle1')) || 100;
    const angle2 = parseFloat(getCssVar('--grid-angle2')) || 60;
    // 将角度转换为弧度并返回
    return [angle1 * Math.PI / 180, angle2 * Math.PI / 180];
}

// 创建角度渐变
function createAngleGradient(ctx, width, height, angle, colors) {
    // 将角度转换为弧度
    const rad = (angle % 360) * Math.PI / 180;
    // 计算渐变方向的单位向量
    const dx = Math.cos(rad);
    const dy = Math.sin(rad);
    // 计算对角线长度的一半作为渐变范围
    const half = Math.sqrt(width * width + height * height) / 2;
    // 计算渐变起点坐标
    const x0 = width / 2 - dx * half;
    const y0 = height / 2 - dy * half;
    // 计算渐变终点坐标
    const x1 = width / 2 + dx * half;
    const y1 = height / 2 + dy * half;

    // 创建线性渐变对象
    const grad = ctx.createLinearGradient(x0, y0, x1, y1);
    // 添加渐变色标
    colors.forEach(c => grad.addColorStop(c.offset, c.color));
    return grad;
}

// ------------------ 网格绘制 ------------------

// 绘制倾斜网格
function drawSkewGrid(canvas) {
    const ctx = canvas.getContext('2d');
    // 获取网格大小配置
    const gridSize = parseInt(getCssVar('--grid-size')) || 200;
    // 获取线条宽度配置
    const lineWidth = parseInt(getCssVar('--grid-line-width')) || 2;
    // 获取线条颜色配置
    const lineColor = getCssVar('--grid-line-color') || 'rgba(255, 192, 203,0.5)';
    // 获取高亮颜色配置
    const highlightColor = getCssVar('--grid-highlight-color') || 'rgba(255,255,255,0.2)';
    // 获取阴影颜色配置
    const shadowColor = getCssVar('--grid-shadow-color') || 'rgba(0,0,0,0.3)';
    // 获取阴影模糊程度配置
    const shadowBlur = parseInt(getCssVar('--grid-shadow-blur')) || 4;
    // 获取网格角度
    const [angle1, angle2] = getGridAngles();
    // 计算两个角度的方向向量
    const dx1 = Math.cos(angle1), dy1 = Math.sin(angle1);
    const dx2 = Math.cos(angle2), dy2 = Math.sin(angle2);
    // 计算对角线长度的两倍作为绘制范围
    const diag = Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height) * 2;

    // 绘制两组网格线
    [[dx1, dy1], [dx2, dy2]].forEach(([dx, dy]) => {
        let startOffset = -diag;
        // 按网格间距循环绘制线条
        for (let i = startOffset; i < diag; i += gridSize) {
            // 绘制主线条
            ctx.beginPath();
            // 计算线条起点
            ctx.moveTo(i * dx - dy * diag, i * dy + dx * diag);
            // 计算线条终点
            ctx.lineTo(i * dx + dy * diag, i * dy - dx * diag);
            // 设置线条样式
            ctx.strokeStyle = lineColor;
            ctx.lineWidth = lineWidth;
            // 设置阴影效果
            ctx.shadowColor = shadowColor;
            ctx.shadowBlur = shadowBlur;
            ctx.stroke();

            // 绘制高光线
            ctx.beginPath();
            // 计算高光线起点（偏移1像素）
            ctx.moveTo(i * dx - dy * diag + 1, i * dy + dx * diag + 1);
            // 计算高光线终点（偏移1像素）
            ctx.lineTo(i * dx + dy * diag + 1, i * dy - dx * diag + 1);
            // 设置高光线样式
            ctx.strokeStyle = highlightColor;
            ctx.lineWidth = 1;
            // 取消阴影效果
            ctx.shadowBlur = 0;
            ctx.stroke();
        }
    });
}

// ------------------ 动画 ------------------

// 离屏Canvas及相关变量声明
let offCanvas, offCtx;
// 记录上一帧的时间
let lastTime = performance.now();
// 淡入淡出计时器
let fadeTime = 0;
// 淡入淡出状态标志
let fading = true;

// 网格动画函数
function animateGrid(mainCanvas) {
    const now = performance.now();
    // 计算时间增量（秒）
    const delta = (now - lastTime) / 1000;
    lastTime = now;

    // 清空离屏Canvas
    offCtx.clearRect(0, 0, offCanvas.width, offCanvas.height);
    // 在离屏Canvas上绘制网格
    drawSkewGrid(offCanvas);

    const ctx = mainCanvas.getContext('2d');
    // 获取背景渐变色配置
    const BGColorFirst = getCssVar('--bg-color-first') || 'rgba(0,0,0)';
    const BGColorMid = getCssVar('--bg-color-mid') || 'rgba(20,20,90)';
    const BGColorEnd = getCssVar('--bg-color-end') || 'rgba(36,36,150)';

    // 创建背景渐变
    const grad = createAngleGradient(ctx, mainCanvas.width, mainCanvas.height, 45, [
        { offset: 0, color: BGColorFirst },
        { offset: 0.5, color: BGColorMid },
        { offset: 1, color: BGColorEnd }
    ]);

    // 填充背景
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, mainCanvas.width, mainCanvas.height);

    // ------------------ 淡入淡出效果 ------------------
    // 获取淡入淡出持续时间配置
    const fadeDuration = parseFloat(getCssVar('--grid-fade-duration')) || 2;
    // 更新淡入淡出计时器
    fadeTime += delta;
    // 当计时器超过持续时间时，切换淡入淡出状态
    if (fadeTime >= fadeDuration) {
        fadeTime = 0;
        fading = !fading;
    }
    // 计算当前透明度
    const alpha = fading ? fadeTime / fadeDuration : 1 - fadeTime / fadeDuration;

    // 应用透明度并绘制离屏Canvas内容
    ctx.globalAlpha = alpha;
    ctx.drawImage(offCanvas, 0, 0);
    // 恢复全局透明度
    ctx.globalAlpha = 1.0;

    // 请求下一帧动画
    requestAnimationFrame(() => animateGrid(mainCanvas));
}

// ------------------ 初始化 ------------------

// DOM内容加载完成后执行初始化
window.addEventListener('DOMContentLoaded', () => {
    // 获取或创建主Canvas元素
    const mainCanvas = document.getElementById('grid-bg') || (() => {
        const c = document.createElement('canvas');
        c.id = 'grid-bg';
        // 设置Canvas样式
        c.style.position = 'fixed';
        c.style.left = '0';
        c.style.top = '0';
        c.style.width = '100vw';
        c.style.height = '100vh';
        c.style.zIndex = '-1';
        c.style.pointerEvents = 'none';
        // 将Canvas添加到文档中
        document.body.appendChild(c);
        return c;
    })();

    // 调整Canvas尺寸
    resizeCanvas(mainCanvas);

    // 创建离屏Canvas
    offCanvas = document.createElement('canvas');
    offCanvas.width = mainCanvas.width;
    offCanvas.height = mainCanvas.height;
    offCtx = offCanvas.getContext('2d');

    // 启动动画
    animateGrid(mainCanvas);
});

// 监听窗口大小变化事件，重新调整Canvas尺寸
window.addEventListener('resize', () => {
    const canvas = document.getElementById('grid-bg');
    resizeCanvas(canvas);
    // 同步调整离屏Canvas尺寸
    offCanvas.width = canvas.width;
    offCanvas.height = canvas.height;
});

// ========== 内容切换系统 ==========
const contentSystem = {
    // 初始化内容系统
    init: function () {
        // 获取DOM元素引用
        this.elements = {
            contentText: document.getElementById('content-text'), // 内容显示区域
            categoryBtns: document.querySelectorAll('.toggle')    // 所有切换按钮
        };

        // 为每个按钮添加点击事件
        this.elements.categoryBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.dataset.target) {
                    // 有目标内容的按钮：切换内容
                    this.switchContent(btn.dataset.target);
                } else {
                    // 功能按钮：执行功能
                    this.handleFunctionality(btn);
                }
            });
        });

        // 默认显示首页内容
        let defaultContent = null;
        for (const source of this.contentSources) {
            if (source && source.Homepage) {
                defaultContent = source.Homepage;
                break;
            }
        }

        if (defaultContent) {
            this.switchContent('Homepage');
        } else {
            console.error("首页内容在所有数据源中都未定义");
            this.elements.contentText.innerHTML = `<p class="error">首页内容未找到</p>`;
        }

        // 可展开菜单处理
        const expandBtns = document.querySelectorAll('.expand-btn');
        expandBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const menu = e.currentTarget.closest('.expandable-menu');
                menu.classList.toggle('expanded');
            });
        });

        // 子菜单按钮点击后收起菜单
        document.querySelectorAll('.sub-buttons .toggle').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                btn.closest('.expandable-menu').classList.remove('expanded');
            });
        });

        // 点击页面其他区域时收起所有菜单
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.expandable-menu')) {
                document.querySelectorAll('.expandable-menu').forEach(menu => {
                    menu.classList.remove('expanded');
                });
            }
        });
    },

    // 定义数据源
    contentSources: [CONTENT_DATA, CONTENT_DATA_NORMAL],

    // 切换内容显示
    switchContent: function (targetId) {
        // 更新按钮激活状态
        this.elements.categoryBtns.forEach(btn => {
            if (btn.dataset.target) {
                // 当前按钮匹配目标时添加active类，否则移除
                btn.classList.toggle('active', btn.dataset.target === targetId);
            }
        });

        // 获取并显示内容
        let foundContent = null;
        // 依次检查数据源
        for (const source of this.contentSources) {
            if (source && source[targetId]) {
                foundContent = source[targetId];
                break;
            }
        }

        if (foundContent) {
            // 检查标题是否存在且非空
            const titleHtml = foundContent.title ? `<h1>${foundContent.title}</h1>` : '';

            // 构建内容HTML结构
            this.elements.contentText.innerHTML = `
                     ${titleHtml}
                     <div class="content-body">${foundContent.content}</div>
                `;
        } else {
            // 内容不存在时显示错误信息
            this.elements.contentText.innerHTML = `<p>内容不存在。</p>`;
        }
    },

    // 处理内容中的长文本（当前为空实现，预留扩展点）
    processContent: function (content) {
        return content;
    },

    // 处理功能按钮
    handleFunctionality: function (btn) {
        // 主题切换按钮的特殊处理
        if (btn.id === 'theme-toggle') {
            theme.toggle(); // 调用主题切换
        }
    }
};