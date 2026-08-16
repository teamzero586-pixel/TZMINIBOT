const { cmd } = require("../arslan");
const yts = require("yt-search");
const axios = require("axios");
const { fakevCard } = require('../lib/fakevCard');

cmd({
    pattern: "song",
    alias: ["ytmp3", "play", "mp3", "gana", "music", "audio"],
    react: "🎵",
    desc: "YouTube search & MP3 play",
    category: "download",
    use: ".play <song name>",
    filename: __filename
},
async (conn, mek, m, { from, args, reply }) => {
    try {
        const query = args.join(" ");
        if (!query) return reply("❌ Please provide a song name or YouTube link\n\nExample: .play Pasoori");

        await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });

        // 1. YouTube se gana search karna
        let videoUrl = query;
        let title = "Song";
        let thumb = "";

        // Agar user ne link nahi diya, toh pehle search karega
        if (!query.includes("youtu")) {
            const search = await yts(query);
            if (!search.videos || !search.videos.length) {
                await conn.sendMessage(from, { react: { text: "❌", key: m.key } });
                return reply("❌ No results found");
            }
            videoUrl = search.videos[0].url;
            title = search.videos[0].title;
            thumb = search.videos[0].thumbnail;
        } else {
            // Agar link diya hai, toh uski detail nikalega
            const search = await yts(query);
            if (search.videos && search.videos.length) {
                title = search.videos[0].title;
                thumb = search.videos[0].thumbnail;
            }
        }

        // 2. ytdl-core ki jagah direct API use kar rahe hain (YouTube restrictions bypass)
        const apiUrl = `https://api.siputzx.my.id/api/d/ytmp3?url=${encodeURIComponent(videoUrl)}`;
        const response = await axios.get(apiUrl);

        if (!response.data || !response.data.status) {
            throw new Error("API Server error. Could not bypass YouTube.");
        }

        const downloadLink = response.data.data.dl;

        // 3. Audio ko buffer me download karna
        const audioResponse = await axios.get(downloadLink, {
            responseType: 'arraybuffer',
            timeout: 30000 // 30 seconds wait time
        });

        const buffer = Buffer.from(audioResponse.data);

        // 4. Audio send karna externalAdReply ke sath
        await conn.sendMessage(from, {
            audio: buffer,
            mimetype: "audio/mpeg",
            ptt: false,
            fileName: `${title}.mp3`,
            contextInfo: {
                externalAdReply: {
                    title: title.substring(0, 40),
                    body: "▶︎ •၊၊||၊|။||||။‌‌‌‌‌၊|• ★彡TZ MINI BOT-ʙᴇᴀᴛꜱ彡★",
                    thumbnailUrl: thumb || "https://telegra.ph/file/default.jpg",
                    sourceUrl: videoUrl,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: fakevCard });

        await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

    } catch (err) {
        console.error("SONG ERROR:", err.message);
        await conn.sendMessage(from, { react: { text: "❌", key: m.key } });
        reply(`❌ Download Error: ${err.message}\n\nYeh error YouTube ki strict policies ya API issue ki waja se aaya hai. Koi aur gana try karein.`);
    }
});
