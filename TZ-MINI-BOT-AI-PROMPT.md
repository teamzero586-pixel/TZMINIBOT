# TZ MINI BOT — AI Command-Writing Prompt

Copy everything below this line and send it to any AI (ChatGPT, Claude, Gemini, etc.)
along with what command you want. The AI will write a command file that works
directly in this bot — just paste the file into the right folder, no other
file needs to be touched.

---

## PROMPT (copy from here)

You are writing a command (plugin) for a WhatsApp bot called **TZ MINI BOT**
(powered by Team Zero), built on Node.js + Baileys. Follow this EXACT contract —
do not invent a different structure.

### File location
Save the command inside:
```
plugins/ported-commands/<category>/<commandname>.js
```
Pick `<category>` from: `ai`, `anime`, `dev`, `fun`, `general`, `group`, `media`,
`textmaker`, `utility` (use an existing one that fits — only create a new
category folder if none fit).

### Required structure

```js
module.exports = {
    name: 'commandname',          // the word after the prefix, lowercase, no spaces
    aliases: ['alias1'],          // optional
    category: 'fun',
    description: 'What this command does',
    usage: '.commandname <args>',

    // optional guards — only include the ones you need
    ownerOnly: false,
    groupOnly: false,
    privateOnly: false,
    adminOnly: false,

    async execute(sock, msg, args, extra) {
        try {
            await extra.reply('Hello!');
        } catch (error) {
            await extra.reply(`❌ ${error.message}`);
        }
    }
};
```

### The `extra` object (4th argument) — fields you can use

| Field | Type | Meaning |
|---|---|---|
| `extra.from` | string | Chat JID to reply in |
| `extra.sender` | string | Sender's JID |
| `extra.isGroup` | boolean | True if message is from a group |
| `extra.groupMetadata` | object | Group info (if in a group) |
| `extra.isOwner` | boolean | True if sender is the bot owner |
| `extra.isAdmin` | boolean | True if sender is a group admin |
| `extra.isBotAdmin` | boolean | True if the bot itself is a group admin |
| `extra.config` | object | Bot config (`prefix`, `botName`, `ownerName`, `ownerNumber`, `newsletterJid`, `social.*`) |
| `extra.reply(text)` | function | Send a text reply — **the bot's branding image is attached automatically**, don't add your own image for plain replies |
| `extra.react(emoji)` | function | React to the triggering message with an emoji |

### Other function arguments
- `sock` — the live Baileys socket. Use `sock.sendMessage(extra.from, {...})`
  directly only when you need to send your OWN media (a downloaded video,
  a generated sticker, etc.) — for plain text, always prefer `extra.reply()`.
- `msg` — the raw incoming message object (`msg.key`, `msg.message`).
- `args` — array of words typed after the command.

### Sending your own media (example)
```js
await sock.sendMessage(extra.from, {
    video: { url: downloadedVideoUrl },
    caption: "Here you go!"
}, { quoted: msg });
```

### Rules the AI must follow
1. Always wrap the command logic in `try/catch` and reply with a friendly
   error message on failure — never let it crash silently.
2. Never hardcode the bot owner's name/number/prefix — read from `extra.config`.
3. Keep `name` short, lowercase, no spaces, and **different from any command
   that might already exist** (don't reuse a common name like `menu`, `ping`,
   `alive`, `owner`, `pair`, `kick`, `promote`, `demote`, `warn`, `tagall`,
   `hidetag`, `welcome`, `mode`, `setprefix`, `unblock`, `antilink`,
   `antidelete`, `anticall`, `apk`, `attp`, `song`, `add`, `online` — those
   already exist natively).
4. Pick the most fitting existing category folder.
5. If the command needs a paid/external API key that isn't something a free
   public API already covers, say so clearly instead of pretending it will work.
6. Return ONLY the finished `.js` file content, ready to paste directly, with
   no explanation mixed into the code.
7. Never write anything sexual/adult, or content aimed at minors.

### My request
Now write a command that does the following:

> _(describe here exactly what you want the command to do — e.g. "a `.quote`
> command that sends a random motivational quote", or "a `.sticker` command
> that converts a replied image into a sticker")_

---

## PROMPT (copy up to here)

### How to add the finished command to your bot
1. The AI will give you back a full `.js` file.
2. Save it as `plugins/ported-commands/<category>/<commandname>.js`.
3. Upload/paste that file into the repo at that exact path.
4. Restart the bot (or redeploy) — it loads automatically on boot via
   `plugins/zzz-ported-commands-loader.js`. Nothing else needs to change.

### Branding image
Every command reply (`extra.reply()` for ported commands, `ctx.reply()` for
native ones) now automatically goes out with the TZ MINI BOT image attached —
this is handled centrally in `main.js` and `config.js` (`IMAGE_PATH`). You
don't need to attach it yourself unless the command sends its own custom
media (video/sticker/etc.), in which case just leave it as-is.

### Advanced: the native `cmd()` format
A smaller set of core commands (`.menu`, `.ping`, `.alive`, `.pair`, group
admin tools, etc.) live directly in `plugins/*.js` using a different, lower-level
contract built on `require("../arslan")`'s `cmd()` function. You generally
don't need this for new commands — the ported format above is simpler and is
now the default for anything new. Only ask for the native format if you're
modifying one of those existing core files.
