/**
 * Video Downloader - Download video from YouTube
 */

const axios = require('axios');
const yts = require('yt-search');
const APIs = require('../../utils/api');

module.exports = {
  name: 'video',
  aliases: ['ytmp4', 'ytvideo'],
  category: 'media',
  description: 'Download video from YouTube',
  usage: '.video <name or link>',

  async execute(sock, msg, args, extra) {
    const chatId = msg.key.remoteJid;
    try {
      const query = args.join(' ').trim();

      if (!query) {
        return await sock.sendMessage(chatId, { text: 'Usage: .video <name or link>' }, { quoted: msg });
      }

      let videoUrl = '';
      let videoTitle = '';
      let videoThumbnail = '';

      if (query.includes('youtube.com') || query.includes('youtu.be')) {
        videoUrl = query;
        videoTitle = 'YouTube Video';
      } else {
        const { videos } = await yts(query);
        if (!videos || videos.length === 0) {
          return await sock.sendMessage(chatId, { text: 'No videos found!' }, { quoted: msg });
        }
        videoUrl = videos[0].url;
        videoTitle = videos[0].title;
        videoThumbnail = videos[0].thumbnail;
      }

      await sock.sendMessage(chatId, {
        image: { url: videoThumbnail || 'https://i.ibb.co/k24FR52h/file-0000000069b48207b92f6537b3730c44.png' },
        caption: `🎥 Downloading: *${videoTitle}*`
      }, { quoted: msg });

      let videoData;
      let downloadSuccess = false;
      const apiMethods = [
        { name: 'EliteProTech', method: () => APIs.getEliteProTechVideoByUrl(videoUrl) },
        { name: 'Yupra', method: () => APIs.getYupraVideoByUrl(videoUrl) },
        { name: 'Okatsu', method: () => APIs.getOkatsuVideoByUrl(videoUrl) }
      ];

      for (const apiMethod of apiMethods) {
        try {
          videoData = await apiMethod.method();
          if (videoData.download) {
            downloadSuccess = true;
            break;
          }
        } catch (err) {
          console.log(`${apiMethod.name} failed:`, err.message);
        }
      }

      if (!downloadSuccess) throw new Error('All download sources failed. The video may be unavailable or blocked.');

      // Download as a Buffer instead of a raw {url} — more reliable, since
      // some of these download hosts block hotlinking from WhatsApp itself.
      const resp = await axios.get(videoData.download, { responseType: 'arraybuffer', timeout: 120000, maxContentLength: Infinity, maxBodyLength: Infinity });
      const videoBuffer = Buffer.from(resp.data);

      await sock.sendMessage(chatId, {
        video: videoBuffer,
        mimetype: 'video/mp4',
        fileName: `${(videoData.title || videoTitle || 'video').replace(/[^\w\s-]/g, '')}.mp4`,
        caption: `*${videoData.title || videoTitle}*\n\n> © TZ MINI BOT`
      }, { quoted: msg });

    } catch (error) {
      console.error('Video command error:', error);
      await sock.sendMessage(chatId, { text: `❌ Error: ${error.message}` }, { quoted: msg });
    }
  }
};
