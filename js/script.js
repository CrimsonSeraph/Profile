// ������ʵ�ӿڸ߶�
function setRealVh() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--real-vh', `${vh}px`);
}

// ��ʼ����
setRealVh();

// �������ڴ�С�仯
window.addEventListener('resize', setRealVh);