const HOST = 'cubeville.org'
const PORT = 25565

const mineflayer = require('mineflayer');
const fs = require('fs');

const bot = mineflayer.createBot({
  host: HOST,
  port: PORT,
  auth: 'microsoft'
});

const dataFilePath = './data/data.json';

let playersData = {};
try {
    playersData = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
    console.log('Loaded player data:', playersData); 
} catch (err) {
    console.error('Error reading players data file:', err);
    playersData = {};
}

function saveData() {
    try {
        fs.writeFileSync(dataFilePath, JSON.stringify(playersData, null, 2));
        console.log('Data saved successfully!');
    } catch (err) {
        console.error('Error saving players data file:', err);
    }
}

async function getUUID(username) {
    try {
        const response = await fetch(`https://api.mojang.com/users/profiles/minecraft/${username}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch UUID for ${username}: ${response.statusText}`);
        }
        const data = await response.json();
        return data.id;
    } catch (error) {
        console.error('Error fetching UUID:', error);
        return null;
    }
}

bot.on('chat', async (username, message) => {
    if (username === bot.username) return; 

    const args = message.trim().split(' ');

    if (args[0] === '#register') {
        const uuid = await getUUID(username); 
        if (playersData[uuid]) {
            bot.chat(`${username} is already registered.`);
        } else {
            playersData[uuid] = {
                username: username,
                money: 500,
                registeredAt: new Date().toISOString(),
            };
            saveData();
            bot.chat(`Player ${username} successfully registered!`);
        }
    }
});

bot.on('spawn', () => {
    console.log('Bot has spawned!');
});

bot.on('error', (err) => {
    console.error('Bot error:', err);
});
