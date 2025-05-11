import { TelegramClient, Api } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import { NewMessage } from 'telegram/events/index.js';
import axios from 'axios';
import readline from 'readline';
import dotenv from 'dotenv';
dotenv.config();

function reverseHebrew(text) {
    return text.split('').reverse().join('');
}

const apiId = parseInt(process.env.TELEGRAM_API_ID, 10);
const apiHash = process.env.TELEGRAM_API_HASH;
const phoneNumber = process.env.TELEGRAM_PHONE_NUMBER;
const password = process.env.TELEGRAM_PASSWORD;
const sessionStr = process.env.TELEGRAM_SESSION || '';
const googleApiKey = process.env.OPENCAGE_API_KEY;
const channelUsername = process.env.TELEGRAM_CHANNEL || 'CumtaAlertsChannel';
const serverUrl = process.env.SERVER_URL || 'http://localhost:3001';

if (!apiId || !apiHash) {
    console.error("TELEGRAM_API_ID or TELEGRAM_API_HASH missing.");
    process.exit(1);
}
if (!googleApiKey) {
    console.error("GOOGLE_MAPS_API_KEY missing.");
    process.exit(1);
}

const client = new TelegramClient(new StringSession(sessionStr), apiId, apiHash, {
    connectionRetries: 5
});

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const askQuestion = (q) => new Promise(res => rl.question(q, ans => res(ans.trim())));

function parseAlertMessage(text) {
    const cityNames = [];
    const prefixList = new Set(["כפר", "קיבוץ", "מושב", "קריית", "קרית", "מצפה", "בית", "נווה", "גבעת", "הר", "מעלה", "מבוא", "תל", "עין", "שדה", "נחל"]);
    const lines = text.split('\n');
    for (let line of lines) {
        line = line.trim();
        if (!line) continue;
        if (line.startsWith('•') || line.startsWith('-')) line = line.slice(1).trim();
        let inSentenceForm = false;
        if (line.startsWith("צבע אדום")) {
            line = line.slice("צבע אדום".length).trim();
            if (line.startsWith(':') || line.startsWith('-')) line = line.slice(1).trim();
            if (line.startsWith('ב') && line.length > 1 && line[1] !== ' ') {
                inSentenceForm = true;
                line = line.slice(1).trim();
            }
        }
// FIX: For Hebrew RTL alerts, take *ALL* parts after the *first* dash
if (line.includes(' - ')) {
    const parts = line.split(' - ');
    parts.shift(); // remove the region prefix like "המפרץ"
    line = parts.join(', ').trim(); // join the actual city names
}

        
        if (line.includes(' ו')) {
            const countAnd = (line.match(/ ו/g) || []).length;
            if (countAnd > 1) {
                const idx = line.lastIndexOf(' ו');
                if (idx !== -1) line = line.slice(0, idx) + ', ' + line.slice(idx + 2);
            } else if (countAnd === 1) {
                const firstWord = line.split(' ')[0];
                const afterAnd = line.split(' ו', 2)[1]?.trim().split(' ')[0] || '';
                let secondPrefix = afterAnd.startsWith('ב') ? afterAnd.slice(1) : afterAnd;
                if (!(prefixList.has(firstWord) && !prefixList.has(secondPrefix))) {
                    line = line.replace(' ו', ', ');
                }
            }
        }
        const parts = line.split(',').map(p => p.trim()).filter(Boolean);
        for (let part of parts) {
            if (part.startsWith('ו') && part.length > 1) part = part.slice(1).trim();
            if (inSentenceForm && part.startsWith('ב') && part.length > 1 && part[1] !== ' ') part = part.slice(1).trim();
            if (part) cityNames.push(part);
        }
    }
    return cityNames;
}

async function geocodeLocation(name) {
    try {
        const key = process.env.OPENCAGE_API_KEY;
        const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(name)}&key=${key}&language=he&countrycode=IL&pretty=1`;

        console.log('[GEOCODE URL]', url);
        const res = await axios.get(url);

        if (res.data.results && res.data.results.length > 0) {
            const loc = res.data.results[0].geometry;
            return { lat: loc.lat, lon: loc.lng };
        }

        console.warn('[GEOCODE] No result for:', name);
        return null;
    } catch (err) {
        console.error(`Geocode fail for "${name}":`, err.message);
        return null;
    }
}

let targetChannelId = null;

(async () => {
    try {
        await client.start({
            phoneNumber: async () => phoneNumber || await askQuestion('Enter phone: '),
            phoneCode: async () => await askQuestion('Enter code: '),
            password: async () => await askQuestion('Enter password: '),
            onError: (err) => console.error('[Login error]', err)
        });
        rl.close();

        const session = client.session.save();
        if (!process.env.TELEGRAM_SESSION && session) {
            console.log('[INFO] Telegram session string:\n' + session);
        }

        try {
            await client.invoke(new Api.channels.JoinChannel({ channel: channelUsername }));
            console.log(`[INFO] Joined channel @${channelUsername}`);
        } catch (err) {
            if (String(err).includes('USER_ALREADY_PARTICIPANT')) {
                console.log(`[INFO] Already in channel @${channelUsername}`);
            } else {
                console.warn(`[WARN] Could not join @${channelUsername}:`, err.message);
            }
        }

        try {
            const result = await client.invoke(new Api.contacts.ResolveUsername({ username: channelUsername }));
            if (result.chats?.length > 0 && result.chats[0].id) {
                targetChannelId = result.chats[0].id.value || result.chats[0].id;
                console.log('[INFO] Listening only to chatId:', targetChannelId);
            }
        } catch (err) {
            console.error(`[ERROR] Could not resolve channel "${channelUsername}"`, err.message);
        }

        client.addEventHandler(async (event) => {
            try {
                const peerId = event.message?.peerId;
                if (!peerId?.channelId || (targetChannelId && peerId.channelId.value !== targetChannelId)) return;
                const msg = event.message;
                const text = msg?.message || msg?.text || '';
                if (!text) return;

                console.log('[DEBUG] Received message:', text);

                const locations = parseAlertMessage(text);
                if (!locations.length) return;

                console.log('[DEBUG] Parsed locations:', locations);

                for (const city of locations) {
                    const geo = await geocodeLocation(city);
                    if (!geo) {
                        console.warn(`[WARN] Failed to geocode: ${city}`);
                        continue;
                    }

                    const alertData = { city, lat: geo.lat, lon: geo.lon };
                    console.log(`[EMIT] Alert: "${city}" at [${geo.lat}, ${geo.lon}]`);
                    await sendAlertToServer(alertData);
                }

            } catch (err) {
                console.error('[ERROR] Handler failed:', err);
            }
        }, new NewMessage({}));

        console.log('✅ Telegram alert worker running.');

    } catch (err) {
        console.error('❌ Telegram client failed to start:', err);
        process.exit(1);
    }
})();

//function to send alert to server
async function sendAlertToServer(alert) {
    try {
        console.log('[API] Sending alert to server:', alert);
        const response = await axios.post(`${serverUrl}/api/alerts`, alert, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            timeout: 5000 // 5 second timeout
        });
        console.log('[API] Server response:', response.data);
        return response.data;
    } catch (error) {
        if (error.response) {
            //the request was made and the server responded with a status code
            //that falls out of the range of 2xx
            console.error('[API] Server error response:', {
                status: error.response.status,
                data: error.response.data,
                headers: error.response.headers
            });
        } else if (error.request) {
            //the request was made but no response was received
            console.error('[API] No response received:', error.request);
        } else {
            //something happened in setting up the request that triggered an Error
            console.error('[API] Request setup error:', error.message);
        }
        return null;
    }
}
