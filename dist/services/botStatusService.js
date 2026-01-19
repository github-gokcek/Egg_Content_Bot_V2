"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.botStatusService = exports.BotStatusService = void 0;
const logger_1 = require("../utils/logger");
class BotStatusService {
    mode = 'live';
    setMode(mode) {
        this.mode = mode;
        logger_1.Logger.success(`Bot modu değiştirildi: ${mode.toUpperCase()}`, { mode });
    }
    getMode() {
        return this.mode;
    }
    isLiveMode() {
        return this.mode === 'live';
    }
    isDevMode() {
        return this.mode === 'dev';
    }
    // Test modu mesajları
    getTestMessage(action) {
        return `🧪 **TEST MODU** - ${action} yapılabilir durumda ancak test modunda gerçekleştirilmedi.`;
    }
    // Test kanalına mesaj gönder
    async sendToDevChannel(client, guildId, message) {
        try {
            const { configService } = await Promise.resolve().then(() => __importStar(require('./configService')));
            const devChannelId = await configService.getDevChannel(guildId);
            if (devChannelId) {
                const channel = await client.channels.fetch(devChannelId);
                if (channel?.isTextBased()) {
                    await channel.send(`🧪 **TEST MODU LOG:** ${message}`);
                }
            }
        }
        catch (error) {
            console.error('Test kanalına mesaj gönderilemedi:', error);
        }
    }
    // Simülasyon ID'leri oluştur
    generateTestId() {
        return `TEST_${Date.now()}`;
    }
}
exports.BotStatusService = BotStatusService;
exports.botStatusService = new BotStatusService();
