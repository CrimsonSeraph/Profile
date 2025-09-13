// 设置真实视口高度
function setRealVh() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--real-vh', `${vh}px`);
}

// 初始设置
setRealVh();

// 监听窗口大小变化
window.addEventListener('resize', setRealVh);