import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configPath = path.resolve(__dirname, '../bot_config.json');

async function sync() {
    try {
        console.log("🔍 Looking for Ngrok tunnel...");
        // 1. Get Ngrok URL
        // Fetch with a short timeout to fail fast if ngrok isn't running
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        let res;
        try {
            res = await fetch('http://localhost:4040/api/tunnels', { signal: controller.signal });
        } catch (err) {
            throw new Error('Could not connect to Ngrok. Is it running? (Run "npm run tunnel")');
        } finally {
            clearTimeout(timeoutId);
        }

        if (!res.ok) throw new Error('Ngrok API returned error.');

        const data = await res.json();
        // Find the https tunnel
        const tunnel = data.tunnels.find(t => t.proto === 'https');

        if (!tunnel) throw new Error('No HTTPS tunnel found. Tunnel might be starting...');

        const url = tunnel.public_url;
        console.log(`📡 Found Tunnel URL: ${url}`);

        // 2. Update Config
        let config = {};
        try {
            config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        } catch (e) {
            console.log("⚠️ Could not read bot_config.json, creating new one.");
        }

        // Preserve token if exists
        config.bot_token = config.bot_token || "YOUR_TOKEN_HERE";
        config.web_app_url = url;

        fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
        console.log('✅ Updated bot_config.json');

        // 3. Run Setup
        console.log('🔄 Sending new URL to Telegram Bot...');
        const setupScript = path.resolve(__dirname, 'setup_bot.js');

        // Spawn the setup script
        const proc = spawn('node', [setupScript], { stdio: 'inherit' });

        proc.on('close', (code) => {
            if (code === 0) {
                console.log('\n🎉 SUCCESS! You can play now.');
            } else {
                console.error('\n❌ Failed to update bot button.');
            }
        });

    } catch (e) {
        console.error('\n❌ Error:', e.message);
        console.log('💡 Tip: Run "npm run tunnel" in a separate terminal window first.');
    }
}

sync();
