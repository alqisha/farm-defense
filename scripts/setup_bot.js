import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read Config
const configPath = path.resolve(__dirname, '../bot_config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

const TOKEN = config.bot_token;
const WEB_APP_URL = config.web_app_url;

if (TOKEN === "YOUR_TELEGRAM_BOT_TOKEN_HERE" || !TOKEN) {
    console.error("❌ Setup Error: Please put your Bot Token in bot_config.json");
    process.exit(1);
}

if (WEB_APP_URL === "YOUR_VERCEL_APP_URL_HERE" || !WEB_APP_URL) {
    console.warn("⚠️  Warning: Web App URL is not set. Menu button might not work.");
}

const API_URL = `https://api.telegram.org/bot${TOKEN}`;

async function setMenuButton() {
    console.log(`Configuring Bot...`);

    const response = await fetch(`${API_URL}/setChatMenuButton`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            menu_button: {
                type: 'web_app',
                text: 'Play Farm Defense',
                web_app: { url: WEB_APP_URL }
            }
        })
    });

    const data = await response.json();

    if (data.ok) {
        console.log("✅ Success! The 'Play' button has been set on your bot.");
        console.log("Open your bot in Telegram to test it.");
    } else {
        console.error("❌ Error setting menu button:", data);
    }
}

setMenuButton();
