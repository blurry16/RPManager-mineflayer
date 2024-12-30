// const HOST = 'cubeville.org'
// const PORT = 25565

const HOST = 'localhost'
const PORT = 11111

const mineflayer = require('mineflayer');
const fs = require('fs');

const bot = mineflayer.createBot({
    host: HOST,
    port: PORT,
    auth: 'microsoft'
});

const dataFilePath = './data/data.json';


function saveData() {
    try {
        fs.writeFileSync(dataFilePath, JSON.stringify(playersData, null, 2));
        console.log('Data saved successfully!');
    } catch (err) {
        console.error('Error saving players data file:', err);
    }
}

function loadData() {
    return JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
}

let playersData = {};
try {
    playersData = loadData();
    console.log('Loaded players data:', playersData);
} catch (err) {
    console.error('Error reading players data file:', err);
    playersData = {};
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

    if (args[0].toLowerCase() === '#register') {
        const uuid = await getUUID(username);
        if (playersData[uuid]) {
            bot.chat(`${username} is already registered.`);
        } else {
            playersData[uuid] = {
                username: username,
                balance: 500,
                registeredAt: new Date().toISOString(),
            };
            saveData();
            bot.chat(`Player ${username} successfully registered!`);
        }
    }
    if (args[0].toLowerCase() === "#balance") {
        const uuid = await getUUID(args.length == 1 ? username : args[1]);
        if (uuid === null) {
            bot.chat(`Error fetching ${args[1]}'s UUID.`)
        } else {
            if (playersData[uuid]) {
                balance = loadData()[uuid]["balance"]
                bot.chat(`Balance of player ${args.length == 1 ? username : args[1]} is ${balance}.`)
            } else {
                bot.chat(`Player ${username} hasn't registered yet.`)
            }
        }
    }
});

bot.on('spawn', () => {
    console.log('Bot has spawned!');
});

bot.on('error', (err) => {
    console.error('Bot error:', err);
});
