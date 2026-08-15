const { cmd } = require("../arslan");
const moment = require("moment");
const fs = require("fs");
const path = require("path");
const { fakevCard } = require('../lib/fakevCard');
const config = require("../config");

let botStartTime = Date.now(); // Recording the start time of the bot
const ALIVE_IMG = config.IMAGE_PATH; // TZ MINI BOT branding image

cmd({
    pattern: "alive",
    desc: "Check if the bot is active.",
    category: "owner",
    react: "💡",
    filename: __filename
}, async (conn, mek, m, { reply, from }) => {
    try {
        const pushname = m.pushName || "User"; // Username or default value
        const currentTime = moment().format("HH:mm:ss");
        const currentDate = moment().format("dddd, MMMM Do YYYY");

        const runtimeMilliseconds = Date.now() - botStartTime;
        const runtimeSeconds = Math.floor((runtimeMilliseconds / 1000) % 60);
        const runtimeMinutes = Math.floor((runtimeMilliseconds / (1000 * 60)) % 60);
        const runtimeHours = Math.floor(runtimeMilliseconds / (1000 * 60 * 60));

        const formattedInfo = `
╭┄┄┄┄[ *TZ MINI BOT sᴛᴀᴛᴜs* ]┄┄┄┄
┊
┊     Hi 🫵🏽 ${pushname}
┊
┊🕒 *ᴛɪᴍᴇ*: ${currentTime}
┊📅 *ᴅᴀᴛᴇ*: ${currentDate}
┊⏳ *ᴜᴘᴛɪᴍᴇ*: ${runtimeHours} hours, ${runtimeMinutes} minutes, ${runtimeSeconds} seconds
╰───────────────

> 🤖 *Status*: *TZ MINI BOT is Alive and Ready!*

🎉 *Enjoy the Service!*
        `.trim();

        // Check if the image is defined (local file or remote URL both supported)
        if (!ALIVE_IMG) {
            throw new Error("ALIVE_IMG not set. Please set config.IMAGE_PATH.");
        }
        const imageSource = (typeof ALIVE_IMG === 'string' && fs.existsSync(ALIVE_IMG))
            ? fs.readFileSync(ALIVE_IMG)
            : { url: ALIVE_IMG };

        // Send the message with image and caption
        await conn.sendMessage(from, {
            image: imageSource,
            caption: formattedInfo,
            contextInfo: { 
                mentionedJid: [m.sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363406203875411@newsletter',
                    newsletterName: 'TZ MINI BOT',
                    serverMessageId: 143
                }
            }
        }, { quoted: fakevCard });

    } catch (error) {
        console.error("Error in alive command: ", error);
        
        // Respond with error details 
        const errorMessage = `
❌ An error occurred while processing the alive command.
🛠 *Error Details*:
${error.message}

Please report this issue or try again later.
        `.trim();
        return reply(errorMessage);
    }
});
