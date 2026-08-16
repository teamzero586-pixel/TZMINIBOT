const mongoose = require('mongoose');
const config = require('../config');

const connectdb = async () => {
    try {
        mongoose.set('strictQuery', false);
        await mongoose.connect(config.MONGODB_URI, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log("✅ Database Connected Successfully");
    } catch (e) {
        console.error("❌ Database Connection Failed:", e.message);
    }
};

// ====================================
// MODÈLES
// ====================================

const sessionSchema = new mongoose.Schema({
    number: { 
        type: String, 
        required: true, 
        unique: true,
        index: true 
    },
    credentials: {
        type: Object,
        required: true
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const userConfigSchema = new mongoose.Schema({
    number: { 
        type: String, 
        required: true, 
        unique: true,
        index: true 
    },
    config: {
        AUTO_RECORDING: { type: String, default: 'false' },
        AUTO_TYPING: { type: String, default: 'false' },
        ANTI_CALL: { type: String, default: 'false' },
        REJECT_MSG: { type: String, default: '*🔕 ʏᴏᴜʀ ᴄᴀʟʟ ᴡᴀs ᴀᴜᴛᴏᴍᴀᴛɪᴄᴀʟʟʏ ʀᴇᴊᴇᴄᴛᴇᴅ..!*' },
        READ_MESSAGE: { type: String, default: 'false' },
        AUTO_VIEW_STATUS: { type: String, default: 'false' },
        AUTO_LIKE_STATUS: { type: String, default: 'false' },
        AUTO_STATUS_REPLY: { type: String, default: 'false' },
        AUTO_STATUS_MSG: { type: String, default: 'Hello from black popkid!' },
        AUTO_LIKE_EMOJI: { type: Array, default: ['❤️', '👍', '😮', '😎'] },
        
        // ========== NEW ANTIDELETE FIELD ==========
        ANTIDELETE: { type: String, default: 'true' }  // true = enabled, false = disabled
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const otpSchema = new mongoose.Schema({
    number: { 
        type: String, 
        required: true,
        index: true 
    },
    otp: { type: String, required: true },
    config: { type: Object, required: true },
    expiresAt: { 
        type: Date, 
        default: () => new Date(Date.now() + 5 * 60000), // 5 minutes
        index: { expires: '5m' }
    },
    createdAt: { type: Date, default: Date.now }
});

// 4. Numéros actifs (pour reconnexion)
const activeNumberSchema = new mongoose.Schema({
    number: { 
        type: String, 
        required: true, 
        unique: true,
        index: true 
    },
    lastConnected: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
    connectionInfo: {
        ip: String,
        userAgent: String,
        timestamp: Date
    }
});

const statsSchema = new mongoose.Schema({
    number: { type: String, required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    commandsUsed: { type: Number, default: 0 },
    messagesReceived: { type: Number, default: 0 },
    messagesSent: { type: Number, default: 0 },
    groupsInteracted: { type: Number, default: 0 }
});

// 6. Per-number custom branding (white-label): bot name, image, channel, owner
const brandSchema = new mongoose.Schema({
    number: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    botName: { type: String, default: '' },
    botImage: { type: String, default: '' },     // URL or base64 data URI
    channelJid: { type: String, default: '' },   // e.g. 1203xxxxxxxxx@newsletter
    ownerNumber: { type: String, default: '' },
    updatedAt: { type: Date, default: Date.now }
});

// ===============================
// DÉFINITION DES MODÈLES
// ===============================

const Session = mongoose.model('Session', sessionSchema);
const UserConfig = mongoose.model('UserConfig', userConfigSchema);
const OTP = mongoose.model('OTP', otpSchema);
const ActiveNumber = mongoose.model('ActiveNumber', activeNumberSchema);
const Stats = mongoose.model('Stats', statsSchema);
const BotBrand = mongoose.model('BotBrand', brandSchema);

// ====================================
// FONCTIONS
// ==================================

// Sauvegarde session
async function saveSessionToMongoDB(number, credentials) {
    try {
        const cleanNumber = number.replace(/[^0-9]/g, '');
        await Session.findOneAndUpdate(
            { number: cleanNumber },
            { 
                credentials: credentials,
                updatedAt: new Date()
            },
            { upsert: true, new: true }
        );
        console.log(`📁 Session saved to MongoDB for ${cleanNumber}`);
        return true;
    } catch (error) {
        console.error('❌ Error saving session to MongoDB:', error);
        return false;
    }
}

// Récupération session
async function getSessionFromMongoDB(number) {
    try {
        const cleanNumber = number.replace(/[^0-9]/g, '');
        const session = await Session.findOne({ number: cleanNumber });
        return session ? session.credentials : null;
    } catch (error) {
        console.error('❌ Error getting session from MongoDB:', error);
        return null;
    }
}

// Suppression session
async function deleteSessionFromMongoDB(number) {
    try {
        const cleanNumber = number.replace(/[^0-9]/g, '');
        await Session.deleteOne({ number: cleanNumber });
        await ActiveNumber.deleteOne({ number: cleanNumber });
        
        console.log(`🗑️ Session deleted from MongoDB for ${cleanNumber}`);
        return true;
    } catch (error) {
        console.error('❌ Error deleting session from MongoDB:', error);
        return false;
    }
}

// Configuration utilisateur
async function getUserConfigFromMongoDB(number) {
    try {
        const cleanNumber = number.replace(/[^0-9]/g, '');
        const config = await UserConfig.findOne({ number: cleanNumber });
        
        if (config) {
            return config.config;
        } else {
            // Configuration par défaut avec ANTIDELETE
            const defaultConfig = {
                AUTO_RECORDING: 'false',
                AUTO_TYPING: 'false',
                ANTI_CALL: 'false',
                REJECT_MSG: '*🔕 ʏᴏᴜʀ ᴄᴀʟʟ ᴡᴀs ᴀᴜᴛᴏᴍᴀᴛɪᴄᴀʟʟʏ ʀᴇᴊᴇᴄᴛᴇᴅ..!*',
                READ_MESSAGE: 'false',
                AUTO_VIEW_STATUS: 'true',
                AUTO_LIKE_STATUS: 'true',
                AUTO_STATUS_REPLY: 'false',
                AUTO_STATUS_MSG: 'Hello from black popkid!',
                AUTO_LIKE_EMOJI: ['❤️', '👍', '😮', '😎'],
                ANTIDELETE: 'true'  // Default enabled
            };
            
            // Sauvegarde configuration par défaut
            await UserConfig.create({
                number: cleanNumber,
                config: defaultConfig
            });
            
            return defaultConfig;
        }
    } catch (error) {
        console.error('❌ Error getting user config from MongoDB:', error);
        return { ANTIDELETE: 'true' };
    }
}

// Mise à jour configuration
async function updateUserConfigInMongoDB(number, newConfig) {
    try {
        const cleanNumber = number.replace(/[^0-9]/g, '');
        
        // Get existing config first
        const existing = await UserConfig.findOne({ number: cleanNumber });
        let updatedConfig = {};
        
        if (existing) {
            updatedConfig = { ...existing.config, ...newConfig };
        } else {
            // Default config with ANTIDELETE
            updatedConfig = {
                AUTO_RECORDING: 'false',
                AUTO_TYPING: 'false',
                ANTI_CALL: 'false',
                REJECT_MSG: '*🔕 ʏᴏᴜʀ ᴄᴀʟʟ ᴡᴀs ᴀᴜᴛᴏᴍᴀᴛɪᴄᴀʟʟʏ ʀᴇᴊᴇᴄᴛᴇᴅ..!*',
                READ_MESSAGE: 'false',
                AUTO_VIEW_STATUS: 'true',
                AUTO_LIKE_STATUS: 'true',
                AUTO_STATUS_REPLY: 'false',
                AUTO_STATUS_MSG: 'Hello from black popkid!',
                AUTO_LIKE_EMOJI: ['❤️', '👍', '😮', '😎'],
                ANTIDELETE: 'true',
                ...newConfig
            };
        }
        
        await UserConfig.findOneAndUpdate(
            { number: cleanNumber },
            { 
                config: updatedConfig,
                updatedAt: new Date()
            },
            { upsert: true, new: true }
        );
        console.log(`⚙️ Config updated for ${cleanNumber}`);
        return true;
    } catch (error) {
        console.error('❌ Error updating user config in MongoDB:', error);
        return false;
    }
}

// Gestion OTP
async function saveOTPToMongoDB(number, otp, config) {
    try {
        const cleanNumber = number.replace(/[^0-9]/g, '');
        await OTP.create({
            number: cleanNumber,
            otp: otp,
            config: config
        });
        console.log(`🔐 OTP saved for ${cleanNumber}`);
        return true;
    } catch (error) {
        console.error('❌ Error saving OTP to MongoDB:', error);
        return false;
    }
}

async function verifyOTPFromMongoDB(number, otp) {
    try {
        const cleanNumber = number.replace(/[^0-9]/g, '');
        const otpRecord = await OTP.findOne({ 
            number: cleanNumber, 
            otp: otp,
            expiresAt: { $gt: new Date() }
        });
        
        if (!otpRecord) {
            return { valid: false, error: 'Invalid or expired OTP' };
        }
        
        // Supprime OTP après vérification
        await OTP.deleteOne({ _id: otpRecord._id });
        
        return {
            valid: true,
            config: otpRecord.config
        };
    } catch (error) {
        console.error('❌ Error verifying OTP from MongoDB:', error);
        return { valid: false, error: 'Verification error' };
    }
}

// Gestion numéros actifs
async function addNumberToMongoDB(number) {
    try {
        const cleanNumber = number.replace(/[^0-9]/g, '');
        await ActiveNumber.findOneAndUpdate(
            { number: cleanNumber },
            { 
                lastConnected: new Date(),
                isActive: true
            },
            { upsert: true, new: true }
        );
        return true;
    } catch (error) {
        console.error('❌ Error adding number to MongoDB:', error);
        return false;
    }
}

async function removeNumberFromMongoDB(number) {
    try {
        const cleanNumber = number.replace(/[^0-9]/g, '');
        await ActiveNumber.deleteOne({ number: cleanNumber });
        return true;
    } catch (error) {
        console.error('❌ Error removing number from MongoDB:', error);
        return false;
    }
}

async function getAllNumbersFromMongoDB() {
    try {
        const activeNumbers = await ActiveNumber.find({ isActive: true });
        return activeNumbers.map(num => num.number);
    } catch (error) {
        console.error('❌ Error getting numbers from MongoDB:', error);
        return [];
    }
}

// Statistiques
async function incrementStats(number, field) {
    try {
        const cleanNumber = number.replace(/[^0-9]/g, '');
        const today = new Date().toISOString().split('T')[0];
        
        await Stats.findOneAndUpdate(
            { number: cleanNumber, date: today },
            { $inc: { [field]: 1 } },
            { upsert: true, new: true }
        );
    } catch (error) {
        console.error('❌ Error updating stats:', error);
    }
}

async function getStatsForNumber(number) {
    try {
        const cleanNumber = number.replace(/[^0-9]/g, '');
        const stats = await Stats.find({ number: cleanNumber })
            .sort({ date: -1 })
            .limit(30);
        return stats;
    } catch (error) {
        console.error('❌ Error getting stats:', error);
        return [];
    }
}

// ── Per-number custom branding (white-label) ──
async function saveBotBrand(number, data) {
    try {
        const cleanNumber = number.replace(/[^0-9]/g, '');
        const update = { updatedAt: new Date() };
        if (data.botName !== undefined) update.botName = String(data.botName).slice(0, 100);
        if (data.botImage !== undefined) {
            const img = String(data.botImage);
            if (img.length > 5_000_000) throw new Error('Image too large — please use a smaller image or an image URL instead.');
            update.botImage = img;
        }
        if (data.channelJid !== undefined) update.channelJid = String(data.channelJid).slice(0, 100);
        if (data.ownerNumber !== undefined) update.ownerNumber = String(data.ownerNumber).replace(/[^0-9]/g, '').slice(0, 20);

        await BotBrand.findOneAndUpdate(
            { number: cleanNumber },
            update,
            { upsert: true, new: true }
        );
        console.log(`🎨 Brand settings saved for ${cleanNumber}`);
        return true;
    } catch (error) {
        console.error('❌ Error saving brand settings:', error.message);
        return false;
    }
}

async function getBotBrand(number) {
    try {
        const cleanNumber = number.replace(/[^0-9]/g, '');
        const brand = await BotBrand.findOne({ number: cleanNumber });
        if (!brand) return null;
        return {
            botName: brand.botName || '',
            botImage: brand.botImage || '',
            channelJid: brand.channelJid || '',
            ownerNumber: brand.ownerNumber || ''
        };
    } catch (error) {
        console.error('❌ Error getting brand settings:', error);
        return null;
    }
}

// =================================
// EXPORTS 
// =================================

module.exports = {
    connectdb,

    Session,
    UserConfig,
    OTP,
    ActiveNumber,
    Stats,
    
    // Fonctions session
    saveSessionToMongoDB,
    getSessionFromMongoDB,
    deleteSessionFromMongoDB,
    
    // Fonctions configuration
    getUserConfigFromMongoDB,
    updateUserConfigInMongoDB,
    
    // Fonctions OTP
    saveOTPToMongoDB,
    verifyOTPFromMongoDB,
    
    // Fonctions numéros
    addNumberToMongoDB,
    removeNumberFromMongoDB,
    getAllNumbersFromMongoDB,
    
    // Fonctions statistiques
    incrementStats,
    getStatsForNumber,

    // Fonctions branding (white-label)
    BotBrand,
    saveBotBrand,
    getBotBrand,
    
    // Anciennes fonctions (pour compatibilité)
    getUserConfig: async (number) => {
        const config = await getUserConfigFromMongoDB(number);
        return config || {};
    },
    updateUserConfig: updateUserConfigInMongoDB
};
