"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const config_1 = require("./config");
const fs_1 = require("fs");
const path_1 = require("path");
require("dotenv/config");
const logger_1 = require("./utils/logger");
const voiceActivityService_1 = require("./services/voiceActivityService");
const voiceCoinService_1 = require("./services/voiceCoinService");
const patchNotesService_1 = require("./services/patchNotesService");
const botSettings_1 = require("./services/botSettings");
const discord_js_2 = require("discord.js");
const path_2 = __importDefault(require("path"));
const { checkReminders } = require('./commands/hatirlat');
const client = new discord_js_1.Client({
    intents: config_1.config.intents,
    partials: [
        discord_js_1.Partials.Message, // Eski mesajlar için
        discord_js_1.Partials.Channel, // Kanal bilgisi için
        discord_js_1.Partials.Reaction, // Reaction bilgisi için
    ]
});
// Commands collection
client.commands = new discord_js_1.Collection();
// Load commands
const commandsPath = (0, path_1.join)(__dirname, 'commands');
const commandFiles = (0, fs_1.readdirSync)(commandsPath).filter(file => file.endsWith('.js') || file.endsWith('.ts'));
for (const file of commandFiles) {
    try {
        const command = require((0, path_1.join)(commandsPath, file));
        if (!command || !command.data || !command.data.name) {
            logger_1.Logger.warn(`Komut atlandı (geçersiz format): ${file}`);
            continue;
        }
        client.commands.set(command.data.name, command);
        logger_1.Logger.info(`Komut yüklendi: ${command.data.name}`);
    }
    catch (error) {
        logger_1.Logger.error(`Komut yüklenemedi: ${file}`, error);
    }
}
// Load events
const eventsPath = (0, path_1.join)(__dirname, 'events');
const eventFiles = (0, fs_1.readdirSync)(eventsPath).filter(file => file.endsWith('.js') || file.endsWith('.ts'));
for (const file of eventFiles) {
    const event = require((0, path_1.join)(eventsPath, file));
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    }
    else {
        client.on(event.name, (...args) => event.execute(...args));
    }
    logger_1.Logger.info(`Event yüklendi: ${event.name}`);
}
// Start voice activity tracking
voiceActivityService_1.voiceActivityService.start();
// Start voice coin tracking
voiceCoinService_1.voiceCoinService.start();
// Start patch notes checking when bot is ready
client.once('ready', (client) => {
    patchNotesService_1.patchNotesService.startChecking(client);
    // Hatırlatıcı kontrolü (her dakika)
    setInterval(async () => {
        await checkReminders(client);
    }, 60 * 1000);
    // Reklam mesajı (dinamik aralık)
    const startAdScheduler = async () => {
        const timerMinutes = await (0, botSettings_1.getAdTimer)();
        setInterval(async () => {
            const adChannelId = await (0, botSettings_1.getAdChannel)();
            if (adChannelId) {
                try {
                    const channel = await client.channels.fetch(adChannelId);
                    if (channel && channel.isTextBased()) {
                        const imagePath = path_2.default.join(process.cwd(), 'assetler', 'Ninja.png');
                        if (!(0, fs_1.existsSync)(imagePath)) {
                            logger_1.Logger.error('Reklam görseli bulunamadı: assetler/Ninja.png');
                            return;
                        }
                        const attachment = new discord_js_2.AttachmentBuilder(imagePath);
                        const embed = new discord_js_2.EmbedBuilder()
                            .setColor(0x9b59b6)
                            .setTitle('🎮 Botun Tüm Özelliklerini Keşfet!')
                            .setDescription('**Casino sistemini** denediniz mi? 🎰\n' +
                            '**RPG maceralarına** katıldınız mı? ⚔️\n' +
                            '**Günlük görevlerinizi** tamamladınız mı? 📋\n\n' +
                            '**Komutları keşfet:** `/yardim`')
                            .setImage('attachment://Ninja.png')
                            .setTimestamp();
                        await channel.send({ embeds: [embed], files: [attachment] });
                        logger_1.Logger.info('Reklam mesajı gönderildi');
                    }
                }
                catch (error) {
                    logger_1.Logger.error('Reklam mesajı gönderilemedi:', error);
                }
            }
        }, timerMinutes * 60 * 1000);
        logger_1.Logger.info(`Reklam sistemi ${timerMinutes} dakika aralıkla başlatıldı`);
    };
    startAdScheduler();
    // Günlük reset (her gece 00:00)
    const scheduleDailyReset = () => {
        const now = new Date();
        const night = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, // Yarın
        0, 0, 0 // 00:00:00
        );
        const msToMidnight = night.getTime() - now.getTime();
        setTimeout(async () => {
            logger_1.Logger.info('Günlük reset başlatılıyor...');
            await voiceActivityService_1.voiceActivityService.resetDailyVoice();
            logger_1.Logger.success('Günlük reset tamamlandı');
            // Bir sonraki gün için schedule et
            scheduleDailyReset();
        }, msToMidnight);
        logger_1.Logger.info(`Günlük reset ${Math.floor(msToMidnight / 1000 / 60)} dakika sonra çalışacak`);
    };
    scheduleDailyReset();
    logger_1.Logger.info('Hatırlatıcı sistemi başlatıldı');
});
client.login(config_1.config.token);
