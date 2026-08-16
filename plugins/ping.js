const { cmd } = require('../arslan');
const { sleep } = require('../lib/functions');
const fs = require('fs');
const config = require('../config');

cmd({
  pattern: "ping",
  desc: "Live ping speed monitor",
  category: "main",
  react: "👑",
  filename: __filename
}, async (conn, mek, m, { from, reply }) => {

  try {

    // start reaction
    await conn.sendMessage(from, {
      react: { text: "👑", key: m.key }
    });

    // Use this number's own custom image/channel if they set one via the
    // pairing page's "Customize My Bot" section, otherwise the default.
    const brand = conn.brand || null;
    const imgTarget = (brand && brand.botImage) || config.IMAGE_PATH || "https://files.catbox.moe/6a48t4.png";
    const channelJid = (brand && brand.channelJid) || config.CHANNEL_JID;
    const channelName = (brand && brand.botName) || config.BOT_NAME;

    let imageSource;
    if (typeof imgTarget === 'string' && imgTarget.startsWith('data:')) {
      imageSource = Buffer.from(imgTarget.split(',')[1] || '', 'base64');
    } else if (typeof imgTarget === 'string' && fs.existsSync(imgTarget)) {
      imageSource = fs.readFileSync(imgTarget);
    } else {
      imageSource = { url: imgTarget };
    }

    // initial message (image + caption), forwarded from the right channel
    const msg = await conn.sendMessage(from, {
      image: imageSource,
      caption: "*TESTING....🤗*",
      contextInfo: {
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: channelJid,
          newsletterName: channelName
        }
      }
    }, { quoted: mek });

    await sleep(1000);

    // 🔁 live update loop (30 seconds) — edits the image caption
    for (let i = 0; i < 30; i++) {

      const start = Date.now();

      // tiny delay simulating ping check
      await sleep(50);

      const ping = Date.now() - start;

      await conn.relayMessage(from, {
        protocolMessage: {
          key: msg.key,
          type: 14,
          editedMessage: {
            imageMessage: {
              caption: `*👑 SPEED :❯ ${ping} 👑*`
            }
          }
        }
      }, {});

      await sleep(1000);
    }

    // end reaction
    await conn.sendMessage(from, {
      react: { text: "😍", key: m.key }
    });

  } catch (e) {

    console.error("Ping Error:", e);

    await conn.sendMessage(from, {
      react: { text: "❌", key: m.key }
    });

    reply("*Ping failed — try again.*");
  }
});
