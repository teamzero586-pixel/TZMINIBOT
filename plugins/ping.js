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

    const imageSource = (config.IMAGE_PATH && fs.existsSync(config.IMAGE_PATH))
      ? fs.readFileSync(config.IMAGE_PATH)
      : { url: config.IMAGE_PATH || "https://files.catbox.moe/6a48t4.png" };

    // initial message (image + caption)
    const msg = await conn.sendMessage(from, {
      image: imageSource,
      caption: "*TESTING....🤗*"
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
