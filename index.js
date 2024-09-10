const express = require('express');
const ytdl = require('ytdl-core');
const ytsr = require('ytsr');
const { Client, GatewayIntentBits } = require('discord.js');
const app = express();
const port = 3000;
const path = require("path")

app.use(express.json());

function initBot(token) {
    const client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildVoiceStates,
            GatewayIntentBits.GuildMessages
        ]
    });

    return new Promise((resolve, reject) => {
        client.login(token)
            .then(() => resolve(client))
            .catch((error) => reject(error));
    });
}

function checkToken(req, res, next) {
    const token = req.headers['x-api-token'];
    if (!token) {
        return res.status(401).json({ error: 'Token manquant' });
    }
    next();
}

app.use(express.static(path.join(__dirname, "public")))
app.get("/", async(req, res) => {
    res.redirect("/documentation")
})

app.get("/documentation", async(req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
})

app.use(checkToken);
app.post('/api/join', async (req, res) => {
    const { guildId, voiceChannelId } = req.body;
    const token = req.headers['x-api-token'];

    try {
        const bot = await initBot(token);
        const guild = bot.guilds.cache.get(guildId);
        if (!guild) return res.status(404).json({ error: "Serveur introuvable, si besoin d'aide, une documentation est mis a votre disposition : https://addams-song.vercel.app/documentation" });

        const channel = guild.channels.cache.get(voiceChannelId);
        if (!channel || channel.type !== 2) { 
            return res.status(400).json({ error: "Salon vocal introuvable, si besoin d'aide, une documentation est mis a votre disposition : https://addams-song.vercel.app/documentation" });
        }

        await channel.join();
        res.json({ message: 'Bot rejoint le salon vocal avec succès.' });
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la tentative de rejoindre le salon vocal, si besoin d'aide, une documentation est mis a votre disposition : https://addams-song.vercel.app/documentation" });
    }
});

app.post('/api/play', async (req, res) => {
    const { guildId, voiceChannelId, songUrl } = req.body;
    const token = req.headers['x-api-token'];

    try {
        const bot = await initBot(token);
        const guild = bot.guilds.cache.get(guildId);
        if (!guild) return res.status(404).json({ error: "Serveur introuvable, si besoin d'aide, une documentation est mis a votre disposition : https://addams-song.vercel.app/documentation" });

        const channel = guild.channels.cache.get(voiceChannelId);
        if (!channel || channel.type !== 2) {
            return res.status(400).json({ error: "Salon vocal introuvable, si besoin d'aide, une documentation est mis a votre disposition : https://addams-song.vercel.app/documentation" });
        }

        const connection = await channel.join();
        const stream = ytdl(songUrl, { filter: 'audioonly' });
        const dispatcher = connection.play(stream);

        res.json({ message: "Lecture de la chanson en cours, si besoin d'aide, une documentation est mis a votre disposition : https://addams-song.vercel.app/documentation" });
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la lecture de la chanson, , si besoin d'aide, une documentation est mis a votre disposition : https://addams-song.vercel.app/documentation" });
    }
});

app.post('/api/stop', async (req, res) => {
    const { guildId } = req.body;
    const token = req.headers['x-api-token'];

    try {
        const bot = await initBot(token);
        const guild = bot.guilds.cache.get(guildId);
        if (!guild) return res.status(404).json({ error: "Serveur introuvable, si besoin d'aide, une documentation est mis a votre disposition : https://addams-song.vercel.app/documentation" });

        const connection = guild.voice?.connection;
        if (!connection) return res.status(400).json({ error: "Bot non connecté à un salon vocal, si besoin d'aide, une documentation est mis a votre disposition : https://addams-song.vercel.app/documentation" });

        connection.dispatcher.end();
        res.json({ message: 'Lecture arrêtée.' });
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de l'arrêt de la lecture, si besoin d'aide, une documentation est mis a votre disposition : https://addams-song.vercel.app/documentation" });
    }
});

app.post('/api/continue', async (req, res) => {
    const { guildId } = req.body;
    const token = req.headers['x-api-token'];

    try {
        const bot = await initBot(token);
        const guild = bot.guilds.cache.get(guildId);
        if (!guild) return res.status(404).json({ error: "Serveur introuvable, si besoin d'aide, une documentation est mis a votre disposition : https://addams-song.vercel.app/documentation" });

        const connection = guild.voice?.connection;
        if (!connection || !connection.dispatcher) return res.status(400).json({ error: "Aucune chanson à reprendre, si besoin d'aide, une documentation est mis a votre disposition : https://addams-song.vercel.app/documentation" });

        connection.dispatcher.resume();
        res.json({ message: 'Lecture reprise.' });
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la reprise de la lecture, si besoin d'aide, une documentation est mis a votre disposition : https://addams-song.vercel.app/documentation" });
    }
});

app.listen(port, () => {
    console.log(`API musicale en écoute sur le port ${port}`);
});
