addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
    const country = request.headers.get('cf-ipcountry') || 'XX';

    const countryPageMap = {
        'CN': 'CN.html',
        'XX': 'CN.html',
    };

    const targetPage = countryPageMap[country] || 'Global.html';
    const baseURL = 'https://profile-9or.pages.dev/';

    console.log("Detected country:", country);

    try {
        const pageResponse = await fetch(baseURL + targetPage);
        const html = await pageResponse.text();

        return new Response(html, {
            status: 200,
            headers: {
                'Content-Type': 'text/html',
                'Cache-Control': 'no-store',
            },
        });
    } catch (err) {
        return new Response("页面加载失败", { status: 500 });
    }
}