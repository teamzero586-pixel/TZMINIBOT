const axios = require('axios');

/**
 * Small collection of one-off API helpers used by a couple of fun/utility
 * commands. Each function throws a clear error on failure — callers already
 * wrap calls in try/catch and show a friendly message.
 */

async function getMeme() {
    // meme-api.com — free, no key required
    const res = await axios.get('https://meme-api.com/gimme', { timeout: 15000 });
    if (!res.data || !res.data.url) throw new Error('No meme returned');
    return {
        url: res.data.url,
        title: res.data.title || 'Meme',
        subreddit: res.data.subreddit || ''
    };
}

async function screenshotWebsite(url) {
    // thum.io — free screenshot service, no key required
    const shotUrl = `https://image.thum.io/get/width/1200/${url}`;
    const res = await axios.get(shotUrl, { responseType: 'arraybuffer', timeout: 30000 });
    return Buffer.from(res.data);
}

module.exports = { getMeme, screenshotWebsite };
