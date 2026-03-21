"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.championCounterData = exports.championBuilds = void 0;
// Tüm şampiyonlar için meta verileri
exports.championBuilds = {
    // TOP LANE FIGHTERS
    'Aatrox': { items: [6630, 3047, 3071, 6333, 3053, 3065], core: ['Goredrinker', 'Plated Steelcaps', 'Black Cleaver', 'Death\'s Dance'], rune: 'Conqueror' },
    'Renekton': { items: [6630, 3047, 3071, 6333, 3053, 3065], core: ['Goredrinker', 'Plated Steelcaps', 'Black Cleaver', 'Death\'s Dance'], rune: 'Conqueror' },
    'Darius': { items: [6631, 3047, 3071, 3053, 3065, 3143], core: ['Stridebreaker', 'Plated Steelcaps', 'Black Cleaver', 'Sterak\'s'], rune: 'Conqueror' },
    'Garen': { items: [6631, 3006, 3071, 3053, 3065, 3143], core: ['Stridebreaker', 'Berserker\'s', 'Black Cleaver', 'Sterak\'s'], rune: 'Conqueror' },
    'Fiora': { items: [6632, 3158, 3074, 6333, 3053, 3065], core: ['Divine Sunderer', 'Ionian Boots', 'Ravenous Hydra', 'Death\'s Dance'], rune: 'Conqueror' },
    'Jax': { items: [6632, 3047, 3153, 3053, 6333, 3065], core: ['Divine Sunderer', 'Plated Steelcaps', 'BOTRK', 'Sterak\'s'], rune: 'Conqueror' },
    'Riven': { items: [6630, 3158, 3071, 6333, 3053, 3156], core: ['Goredrinker', 'Ionian Boots', 'Black Cleaver', 'Death\'s Dance'], rune: 'Conqueror' },
    'Camille': { items: [6632, 3047, 3074, 6333, 3053, 3065], core: ['Divine Sunderer', 'Plated Steelcaps', 'Ravenous Hydra', 'Death\'s Dance'], rune: 'Conqueror' },
    'Irelia': { items: [6632, 3047, 3153, 6333, 3053, 3065], core: ['Divine Sunderer', 'Plated Steelcaps', 'BOTRK', 'Death\'s Dance'], rune: 'Conqueror' },
    'Sett': { items: [6631, 3047, 3071, 3053, 6333, 3065], core: ['Stridebreaker', 'Plated Steelcaps', 'Black Cleaver', 'Sterak\'s'], rune: 'Conqueror' },
    'Mordekaiser': { items: [6653, 3047, 3152, 6333, 3065, 3143], core: ['Liandry\'s', 'Plated Steelcaps', 'Demonic Embrace', 'Death\'s Dance'], rune: 'Conqueror' },
    'Nasus': { items: [6632, 3047, 3071, 3053, 3065, 3143], core: ['Divine Sunderer', 'Plated Steelcaps', 'Black Cleaver', 'Sterak\'s'], rune: 'Conqueror' },
    'Illaoi': { items: [6630, 3047, 3071, 3053, 3065, 3143], core: ['Goredrinker', 'Plated Steelcaps', 'Black Cleaver', 'Sterak\'s'], rune: 'Conqueror' },
    'Volibear': { items: [6631, 3047, 3053, 6333, 3065, 3143], core: ['Stridebreaker', 'Plated Steelcaps', 'Sterak\'s', 'Death\'s Dance'], rune: 'Conqueror' },
    'Trundle': { items: [6632, 3047, 3153, 3053, 6333, 3065], core: ['Divine Sunderer', 'Plated Steelcaps', 'BOTRK', 'Sterak\'s'], rune: 'Conqueror' },
    // TOP LANE TANKS
    'Malphite': { items: [6653, 3047, 3143, 3065, 3075, 3110], core: ['Liandry\'s', 'Plated Steelcaps', 'Randuin\'s', 'Spirit Visage'], rune: 'Grasp of the Undying' },
    'Ornn': { items: [6662, 3047, 3143, 3065, 3075, 3110], core: ['Sunfire Aegis', 'Plated Steelcaps', 'Randuin\'s', 'Spirit Visage'], rune: 'Grasp of the Undying' },
    'Shen': { items: [6662, 3047, 3053, 3065, 3143, 3110], core: ['Sunfire Aegis', 'Plated Steelcaps', 'Sterak\'s', 'Spirit Visage'], rune: 'Grasp of the Undying' },
    'Sion': { items: [6662, 3047, 3143, 3065, 3075, 3110], core: ['Sunfire Aegis', 'Plated Steelcaps', 'Randuin\'s', 'Spirit Visage'], rune: 'Grasp of the Undying' },
    'Chogath': { items: [6653, 3047, 3143, 3065, 3075, 3110], core: ['Liandry\'s', 'Plated Steelcaps', 'Randuin\'s', 'Spirit Visage'], rune: 'Grasp of the Undying' },
    'Maokai': { items: [6662, 3047, 3143, 3065, 3075, 3110], core: ['Sunfire Aegis', 'Plated Steelcaps', 'Randuin\'s', 'Spirit Visage'], rune: 'Grasp of the Undying' },
    // MID LANE ASSASSINS
    'Akali': { items: [6653, 3020, 3152, 3135, 3089, 3165], core: ['Liandry\'s', 'Sorcerer\'s Shoes', 'Shadowflame', 'Void Staff'], rune: 'Electrocute' },
    'Zed': { items: [6691, 3158, 3179, 3814, 3142, 6333], core: ['Eclipse', 'Ionian Boots', 'Serylda\'s', 'Edge of Night'], rune: 'Electrocute' },
    'Katarina': { items: [6653, 3020, 3152, 3135, 3089, 3165], core: ['Liandry\'s', 'Sorcerer\'s Shoes', 'Shadowflame', 'Void Staff'], rune: 'Electrocute' },
    'Talon': { items: [6691, 3158, 3179, 3814, 3142, 6333], core: ['Eclipse', 'Ionian Boots', 'Serylda\'s', 'Edge of Night'], rune: 'Electrocute' },
    'Fizz': { items: [6653, 3020, 3152, 3135, 3089, 3165], core: ['Liandry\'s', 'Sorcerer\'s Shoes', 'Shadowflame', 'Void Staff'], rune: 'Electrocute' },
    'Leblanc': { items: [6655, 3020, 3152, 3135, 3089, 3165], core: ['Luden\'s', 'Sorcerer\'s Shoes', 'Shadowflame', 'Void Staff'], rune: 'Electrocute' },
    'Qiyana': { items: [6691, 3158, 3179, 3814, 3142, 6333], core: ['Eclipse', 'Ionian Boots', 'Serylda\'s', 'Edge of Night'], rune: 'Electrocute' },
    // MID LANE MAGES
    'Ahri': { items: [6656, 3020, 3152, 3135, 3089, 3165], core: ['Everfrost', 'Sorcerer\'s Shoes', 'Shadowflame', 'Void Staff'], rune: 'Electrocute' },
    'Lux': { items: [6655, 3020, 3152, 3135, 3089, 3165], core: ['Luden\'s', 'Sorcerer\'s Shoes', 'Shadowflame', 'Void Staff'], rune: 'Arcane Comet' },
    'Syndra': { items: [6655, 3020, 3152, 3135, 3089, 3165], core: ['Luden\'s', 'Sorcerer\'s Shoes', 'Shadowflame', 'Void Staff'], rune: 'Arcane Comet' },
    'Orianna': { items: [6655, 3020, 3152, 3135, 3089, 3165], core: ['Luden\'s', 'Sorcerer\'s Shoes', 'Shadowflame', 'Void Staff'], rune: 'Arcane Comet' },
    'Viktor': { items: [6655, 3020, 3152, 3135, 3089, 3165], core: ['Luden\'s', 'Sorcerer\'s Shoes', 'Shadowflame', 'Void Staff'], rune: 'Arcane Comet' },
    'Veigar': { items: [6655, 3020, 3152, 3135, 3089, 3165], core: ['Luden\'s', 'Sorcerer\'s Shoes', 'Shadowflame', 'Void Staff'], rune: 'Arcane Comet' },
    'Xerath': { items: [6655, 3020, 3152, 3135, 3089, 3165], core: ['Luden\'s', 'Sorcerer\'s Shoes', 'Shadowflame', 'Void Staff'], rune: 'Arcane Comet' },
    'Ziggs': { items: [6655, 3020, 3152, 3135, 3089, 3165], core: ['Luden\'s', 'Sorcerer\'s Shoes', 'Shadowflame', 'Void Staff'], rune: 'Arcane Comet' },
    'Anivia': { items: [6655, 3020, 3152, 3135, 3089, 3165], core: ['Luden\'s', 'Sorcerer\'s Shoes', 'Shadowflame', 'Void Staff'], rune: 'Arcane Comet' },
    'Cassiopeia': { items: [6653, 3020, 3152, 3135, 3089, 3165], core: ['Liandry\'s', 'Sorcerer\'s Shoes', 'Shadowflame', 'Void Staff'], rune: 'Conqueror' },
    // ADC
    'Jinx': { items: [6672, 3006, 3031, 3072, 3026, 3156], core: ['Kraken Slayer', 'Berserker\'s', 'Infinity Edge', 'Bloodthirster'], rune: 'Lethal Tempo' },
    'Vayne': { items: [6672, 3006, 3153, 3031, 3072, 3026], core: ['Kraken Slayer', 'Berserker\'s', 'BOTRK', 'Infinity Edge'], rune: 'Lethal Tempo' },
    'Caitlyn': { items: [6671, 3006, 3031, 3072, 3026, 3156], core: ['Galeforce', 'Berserker\'s', 'Infinity Edge', 'Bloodthirster'], rune: 'Lethal Tempo' },
    'Ashe': { items: [6672, 3006, 3031, 3072, 3026, 3156], core: ['Kraken Slayer', 'Berserker\'s', 'Infinity Edge', 'Bloodthirster'], rune: 'Lethal Tempo' },
    'Jhin': { items: [6671, 3006, 3031, 3072, 3026, 3156], core: ['Galeforce', 'Berserker\'s', 'Infinity Edge', 'Bloodthirster'], rune: 'Fleet Footwork' },
    'Ezreal': { items: [6632, 3158, 3153, 3142, 3156, 3026], core: ['Divine Sunderer', 'Ionian Boots', 'BOTRK', 'Serylda\'s'], rune: 'Conqueror' },
    'Lucian': { items: [6672, 3006, 3031, 3072, 3026, 3156], core: ['Kraken Slayer', 'Berserker\'s', 'Infinity Edge', 'Bloodthirster'], rune: 'Press the Attack' },
    'Draven': { items: [6672, 3006, 3031, 3072, 3026, 3156], core: ['Kraken Slayer', 'Berserker\'s', 'Infinity Edge', 'Bloodthirster'], rune: 'Conqueror' },
    'Twitch': { items: [6672, 3006, 3031, 3072, 3026, 3156], core: ['Kraken Slayer', 'Berserker\'s', 'Infinity Edge', 'Bloodthirster'], rune: 'Lethal Tempo' },
    'Tristana': { items: [6672, 3006, 3031, 3072, 3026, 3156], core: ['Kraken Slayer', 'Berserker\'s', 'Infinity Edge', 'Bloodthirster'], rune: 'Lethal Tempo' },
    'Kaisa': { items: [6672, 3006, 3031, 3072, 3026, 3156], core: ['Kraken Slayer', 'Berserker\'s', 'Infinity Edge', 'Bloodthirster'], rune: 'Lethal Tempo' },
    'Xayah': { items: [6672, 3006, 3031, 3072, 3026, 3156], core: ['Kraken Slayer', 'Berserker\'s', 'Infinity Edge', 'Bloodthirster'], rune: 'Lethal Tempo' },
    'Sivir': { items: [6672, 3006, 3031, 3072, 3026, 3156], core: ['Kraken Slayer', 'Berserker\'s', 'Infinity Edge', 'Bloodthirster'], rune: 'Lethal Tempo' },
    'MissFortune': { items: [6671, 3006, 3031, 3072, 3026, 3156], core: ['Galeforce', 'Berserker\'s', 'Infinity Edge', 'Bloodthirster'], rune: 'Arcane Comet' },
    // FIGHTERS (MELEE)
    'Yasuo': { items: [6673, 3006, 3031, 3072, 3026, 3156], core: ['Immortal Shieldbow', 'Berserker\'s', 'Infinity Edge', 'Bloodthirster'], rune: 'Conqueror' },
    'Yone': { items: [6673, 3006, 3031, 3072, 3026, 3156], core: ['Immortal Shieldbow', 'Berserker\'s', 'Infinity Edge', 'Bloodthirster'], rune: 'Conqueror' },
    'MasterYi': { items: [6672, 3006, 3153, 3031, 3072, 3026], core: ['Kraken Slayer', 'Berserker\'s', 'BOTRK', 'Infinity Edge'], rune: 'Conqueror' },
    'Tryndamere': { items: [6672, 3006, 3031, 3072, 3026, 3156], core: ['Kraken Slayer', 'Berserker\'s', 'Infinity Edge', 'Bloodthirster'], rune: 'Lethal Tempo' },
    'Viego': { items: [6672, 3006, 3153, 3031, 3072, 3026], core: ['Kraken Slayer', 'Berserker\'s', 'BOTRK', 'Infinity Edge'], rune: 'Conqueror' },
    // JUNGLE
    'LeeSin': { items: [6630, 3047, 3071, 6333, 3053, 3065], core: ['Goredrinker', 'Plated Steelcaps', 'Black Cleaver', 'Death\'s Dance'], rune: 'Conqueror' },
    'Khazix': { items: [6691, 3158, 3179, 3814, 3142, 6333], core: ['Eclipse', 'Ionian Boots', 'Serylda\'s', 'Edge of Night'], rune: 'Electrocute' },
    'Elise': { items: [6653, 3020, 3152, 3135, 3089, 3165], core: ['Liandry\'s', 'Sorcerer\'s Shoes', 'Shadowflame', 'Void Staff'], rune: 'Electrocute' },
    'Graves': { items: [6691, 3006, 3031, 3072, 3026, 3156], core: ['Eclipse', 'Berserker\'s', 'Infinity Edge', 'Bloodthirster'], rune: 'Fleet Footwork' },
    'Hecarim': { items: [6632, 3047, 3071, 3053, 6333, 3065], core: ['Divine Sunderer', 'Plated Steelcaps', 'Black Cleaver', 'Sterak\'s'], rune: 'Conqueror' },
    'Kayn': { items: [6630, 3047, 3071, 6333, 3053, 3065], core: ['Goredrinker', 'Plated Steelcaps', 'Black Cleaver', 'Death\'s Dance'], rune: 'Conqueror' },
    'Ekko': { items: [6653, 3020, 3152, 3135, 3089, 3165], core: ['Liandry\'s', 'Sorcerer\'s Shoes', 'Shadowflame', 'Void Staff'], rune: 'Electrocute' },
    'Evelynn': { items: [6653, 3020, 3152, 3135, 3089, 3165], core: ['Liandry\'s', 'Sorcerer\'s Shoes', 'Shadowflame', 'Void Staff'], rune: 'Electrocute' },
    'Nidalee': { items: [6653, 3020, 3152, 3135, 3089, 3165], core: ['Liandry\'s', 'Sorcerer\'s Shoes', 'Shadowflame', 'Void Staff'], rune: 'Electrocute' },
    'Rengar': { items: [6691, 3158, 3179, 3814, 3142, 6333], core: ['Eclipse', 'Ionian Boots', 'Serylda\'s', 'Edge of Night'], rune: 'Electrocute' },
    'Shaco': { items: [6691, 3158, 3179, 3814, 3142, 6333], core: ['Eclipse', 'Ionian Boots', 'Serylda\'s', 'Edge of Night'], rune: 'Hail of Blades' },
    'Nocturne': { items: [6631, 3047, 3071, 6333, 3053, 3065], core: ['Stridebreaker', 'Plated Steelcaps', 'Black Cleaver', 'Death\'s Dance'], rune: 'Lethal Tempo' },
    'Diana': { items: [6653, 3020, 3152, 3135, 3089, 3165], core: ['Liandry\'s', 'Sorcerer\'s Shoes', 'Shadowflame', 'Void Staff'], rune: 'Electrocute' },
    'Warwick': { items: [6632, 3047, 3153, 3053, 6333, 3065], core: ['Divine Sunderer', 'Plated Steelcaps', 'BOTRK', 'Sterak\'s'], rune: 'Lethal Tempo' },
    'Amumu': { items: [6662, 3047, 3143, 3065, 3075, 3110], core: ['Sunfire Aegis', 'Plated Steelcaps', 'Randuin\'s', 'Spirit Visage'], rune: 'Aftershock' },
    'Rammus': { items: [6662, 3047, 3143, 3065, 3075, 3110], core: ['Sunfire Aegis', 'Plated Steelcaps', 'Randuin\'s', 'Spirit Visage'], rune: 'Aftershock' },
    'Zac': { items: [6662, 3047, 3143, 3065, 3075, 3110], core: ['Sunfire Aegis', 'Plated Steelcaps', 'Randuin\'s', 'Spirit Visage'], rune: 'Aftershock' },
    'Sejuani': { items: [6662, 3047, 3143, 3065, 3075, 3110], core: ['Sunfire Aegis', 'Plated Steelcaps', 'Randuin\'s', 'Spirit Visage'], rune: 'Aftershock' },
    // SUPPORT
    'Thresh': { items: [3190, 3158, 3107, 3109, 3050, 3110], core: ['Locket', 'Ionian Boots', 'Redemption', 'Knight\'s Vow'], rune: 'Aftershock' },
    'Leona': { items: [3190, 3047, 3107, 3109, 3050, 3110], core: ['Locket', 'Plated Steelcaps', 'Redemption', 'Knight\'s Vow'], rune: 'Aftershock' },
    'Nautilus': { items: [3190, 3047, 3107, 3109, 3050, 3110], core: ['Locket', 'Plated Steelcaps', 'Redemption', 'Knight\'s Vow'], rune: 'Aftershock' },
    'Blitzcrank': { items: [3190, 3047, 3107, 3109, 3050, 3110], core: ['Locket', 'Plated Steelcaps', 'Redemption', 'Knight\'s Vow'], rune: 'Aftershock' },
    'Lulu': { items: [3504, 3158, 3107, 3109, 3050, 3110], core: ['Ardent Censer', 'Ionian Boots', 'Redemption', 'Staff of Flowing Water'], rune: 'Summon Aery' },
    'Janna': { items: [3504, 3158, 3107, 3109, 3050, 3110], core: ['Ardent Censer', 'Ionian Boots', 'Redemption', 'Staff of Flowing Water'], rune: 'Summon Aery' },
    'Nami': { items: [3504, 3158, 3107, 3109, 3050, 3110], core: ['Ardent Censer', 'Ionian Boots', 'Redemption', 'Staff of Flowing Water'], rune: 'Summon Aery' },
    'Soraka': { items: [3504, 3158, 3107, 3109, 3050, 3110], core: ['Ardent Censer', 'Ionian Boots', 'Redemption', 'Staff of Flowing Water'], rune: 'Summon Aery' },
    'Yuumi': { items: [3504, 3158, 3107, 3109, 3050, 3110], core: ['Ardent Censer', 'Ionian Boots', 'Redemption', 'Staff of Flowing Water'], rune: 'Summon Aery' },
    'Sona': { items: [3504, 3158, 3107, 3109, 3050, 3110], core: ['Ardent Censer', 'Ionian Boots', 'Redemption', 'Staff of Flowing Water'], rune: 'Summon Aery' },
    'Pyke': { items: [6691, 3158, 3179, 3814, 3142, 6333], core: ['Eclipse', 'Ionian Boots', 'Serylda\'s', 'Edge of Night'], rune: 'Hail of Blades' },
    'Brand': { items: [6653, 3020, 3152, 3135, 3089, 3165], core: ['Liandry\'s', 'Sorcerer\'s Shoes', 'Shadowflame', 'Void Staff'], rune: 'Arcane Comet' },
    'Zyra': { items: [6653, 3020, 3152, 3135, 3089, 3165], core: ['Liandry\'s', 'Sorcerer\'s Shoes', 'Shadowflame', 'Void Staff'], rune: 'Arcane Comet' },
    'Velkoz': { items: [6655, 3020, 3152, 3135, 3089, 3165], core: ['Luden\'s', 'Sorcerer\'s Shoes', 'Shadowflame', 'Void Staff'], rune: 'Arcane Comet' },
};
// Şampiyon counter verileri (meta bazlı)
exports.championCounterData = {
    // TOP LANE
    'Aatrox': [
        { name: 'Fiora', winRate: 0.54, games: 4200 },
        { name: 'Jax', winRate: 0.53, games: 3800 },
        { name: 'Irelia', winRate: 0.52, games: 3500 },
        { name: 'Tryndamere', winRate: 0.52, games: 3200 },
        { name: 'Camille', winRate: 0.51, games: 3000 }
    ],
    'Darius': [
        { name: 'Vayne', winRate: 0.56, games: 2800 },
        { name: 'Quinn', winRate: 0.55, games: 2500 },
        { name: 'Teemo', winRate: 0.54, games: 4500 },
        { name: 'Kayle', winRate: 0.53, games: 3200 },
        { name: 'Kennen', winRate: 0.52, games: 2100 }
    ],
    'Fiora': [
        { name: 'Malphite', winRate: 0.54, games: 3800 },
        { name: 'Pantheon', winRate: 0.53, games: 3200 },
        { name: 'Teemo', winRate: 0.52, games: 2900 },
        { name: 'Quinn', winRate: 0.52, games: 2400 },
        { name: 'Kennen', winRate: 0.51, games: 1800 }
    ],
    'Garen': [
        { name: 'Teemo', winRate: 0.56, games: 5200 },
        { name: 'Vayne', winRate: 0.55, games: 3100 },
        { name: 'Quinn', winRate: 0.54, games: 2800 },
        { name: 'Kayle', winRate: 0.53, games: 3400 },
        { name: 'Darius', winRate: 0.52, games: 4800 }
    ],
    'Jax': [
        { name: 'Malphite', winRate: 0.55, games: 4200 },
        { name: 'Teemo', winRate: 0.54, games: 3600 },
        { name: 'Quinn', winRate: 0.53, games: 2400 },
        { name: 'Kennen', winRate: 0.52, games: 2100 },
        { name: 'Pantheon', winRate: 0.52, games: 3200 }
    ],
    'Renekton': [
        { name: 'Jax', winRate: 0.54, games: 5000 },
        { name: 'Malphite', winRate: 0.53, games: 4500 },
        { name: 'Illaoi', winRate: 0.52, games: 3800 },
        { name: 'Darius', winRate: 0.51, games: 4200 },
        { name: 'Fiora', winRate: 0.51, games: 3900 }
    ],
    'Riven': [
        { name: 'Malphite', winRate: 0.56, games: 4800 },
        { name: 'Renekton', winRate: 0.54, games: 4200 },
        { name: 'Poppy', winRate: 0.53, games: 3100 },
        { name: 'Pantheon', winRate: 0.52, games: 3600 },
        { name: 'Quinn', winRate: 0.52, games: 2400 }
    ],
    'Malphite': [
        { name: 'Mordekaiser', winRate: 0.55, games: 3800 },
        { name: 'Cho\'Gath', winRate: 0.53, games: 3200 },
        { name: 'Shen', winRate: 0.52, games: 2900 },
        { name: 'Ornn', winRate: 0.51, games: 2600 },
        { name: 'Maokai', winRate: 0.51, games: 2400 }
    ],
    // MID LANE
    'Akali': [
        { name: 'Malzahar', winRate: 0.55, games: 4200 },
        { name: 'Lissandra', winRate: 0.53, games: 3900 },
        { name: 'Swain', winRate: 0.52, games: 3500 },
        { name: 'Ahri', winRate: 0.51, games: 4800 },
        { name: 'Lux', winRate: 0.51, games: 3700 }
    ],
    'Ahri': [
        { name: 'Fizz', winRate: 0.54, games: 3800 },
        { name: 'Zed', winRate: 0.52, games: 4500 },
        { name: 'Yasuo', winRate: 0.52, games: 4200 },
        { name: 'Katarina', winRate: 0.51, games: 3600 },
        { name: 'Kassadin', winRate: 0.51, games: 3200 }
    ],
    'Zed': [
        { name: 'Malzahar', winRate: 0.57, games: 4500 },
        { name: 'Lissandra', winRate: 0.54, games: 3800 },
        { name: 'Ahri', winRate: 0.52, games: 5100 },
        { name: 'Lux', winRate: 0.51, games: 3900 },
        { name: 'Fizz', winRate: 0.51, games: 3400 }
    ],
    'Yasuo': [
        { name: 'Malphite', winRate: 0.56, games: 5200 },
        { name: 'Darius', winRate: 0.54, games: 4100 },
        { name: 'Garen', winRate: 0.53, games: 4500 },
        { name: 'Renekton', winRate: 0.52, games: 3800 },
        { name: 'Pantheon', winRate: 0.52, games: 3600 }
    ],
    'Yone': [
        { name: 'Malphite', winRate: 0.55, games: 4800 },
        { name: 'Pantheon', winRate: 0.53, games: 3900 },
        { name: 'Renekton', winRate: 0.52, games: 3600 },
        { name: 'Akali', winRate: 0.51, games: 4200 },
        { name: 'Fizz', winRate: 0.51, games: 3400 }
    ],
    'Katarina': [
        { name: 'Malzahar', winRate: 0.56, games: 4100 },
        { name: 'Lissandra', winRate: 0.54, games: 3600 },
        { name: 'Galio', winRate: 0.53, games: 3200 },
        { name: 'Diana', winRate: 0.52, games: 3800 },
        { name: 'Kassadin', winRate: 0.51, games: 3400 }
    ],
    'Syndra': [
        { name: 'Fizz', winRate: 0.55, games: 3800 },
        { name: 'Zed', winRate: 0.53, games: 4200 },
        { name: 'Yasuo', winRate: 0.52, games: 4000 },
        { name: 'Kassadin', winRate: 0.52, games: 3400 },
        { name: 'Katarina', winRate: 0.51, games: 3200 }
    ],
    'Lux': [
        { name: 'Fizz', winRate: 0.56, games: 3600 },
        { name: 'Zed', winRate: 0.54, games: 4100 },
        { name: 'Yasuo', winRate: 0.53, games: 3900 },
        { name: 'Xerath', winRate: 0.52, games: 3200 },
        { name: 'Vel\'Koz', winRate: 0.51, games: 2800 }
    ],
    // ADC
    'Jinx': [
        { name: 'Draven', winRate: 0.54, games: 4200 },
        { name: 'Lucian', winRate: 0.53, games: 4800 },
        { name: 'Caitlyn', winRate: 0.52, games: 5100 },
        { name: 'Jhin', winRate: 0.51, games: 4600 },
        { name: 'Ashe', winRate: 0.51, games: 4200 }
    ],
    'Vayne': [
        { name: 'Caitlyn', winRate: 0.55, games: 5200 },
        { name: 'Ashe', winRate: 0.53, games: 4600 },
        { name: 'Jhin', winRate: 0.52, games: 4400 },
        { name: 'Varus', winRate: 0.52, games: 3800 },
        { name: 'Sivir', winRate: 0.51, games: 3400 }
    ],
    'Caitlyn': [
        { name: 'Vayne', winRate: 0.53, games: 4800 },
        { name: 'Twitch', winRate: 0.52, games: 3600 },
        { name: 'Tristana', winRate: 0.52, games: 4200 },
        { name: 'Ezreal', winRate: 0.51, games: 4600 },
        { name: 'Lucian', winRate: 0.51, games: 4400 }
    ],
    'Ezreal': [
        { name: 'Draven', winRate: 0.54, games: 3800 },
        { name: 'Lucian', winRate: 0.53, games: 4200 },
        { name: 'Tristana', winRate: 0.52, games: 3600 },
        { name: 'Caitlyn', winRate: 0.51, games: 4800 },
        { name: 'Jhin', winRate: 0.51, games: 4200 }
    ]
};
