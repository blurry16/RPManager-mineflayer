// const HOST = 'cubeville.org'
// const PORT = 25565

const HOST = "localhost";
const PORT = 11111;

const mineflayer = require("mineflayer");
const fs = require("fs");

const bot = mineflayer.createBot({
    host: HOST,
    port: PORT,
    auth: "microsoft",
});

const dataFilePath = "./data/data.json";

function saveData() {
    try {
        fs.writeFileSync(dataFilePath, JSON.stringify(playersData, null, 2));
        console.log("Data saved successfully!");
    } catch (err) {
        console.error("Error saving players data file:", err);
    }
}

function loadData() {
    return JSON.parse(fs.readFileSync(dataFilePath, "utf8"));
}

let playersData = {};
try {
    playersData = loadData();
    console.log("Loaded players data:", playersData);
} catch (err) {
    console.error("Error reading players data file:", err);
    playersData = {};
}

async function getUUID(username) {
    try {
        const response = await fetch(
            `https://api.mojang.com/users/profiles/minecraft/${username}`
        );
        if (!response.ok) {
            throw new Error(
                `Failed to fetch UUID for ${username}: ${response.statusText}`
            );
        }
        const data = await response.json();
        return data.id;
    } catch (error) {
        console.error("Error fetching UUID:", error);
        return null;
    }
}

bot.on("chat", async (username, message) => {
    if (username === bot.username) return;

    const args = message.trim().split(" ");

    switch (args[0].toLowerCase()) {
        case "#register":
            uuid = await getUUID(username);
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
            break;

        case "#balance":
            username = args.length == 1 ? username : args[1];
            uuid = await getUUID(username);
            if (uuid === null) {
                bot.chat(`Error fetching ${args[1]}'s UUID.`);
                break;
            }
            if (playersData[uuid]) {
                balance = loadData()[uuid]["balance"];
                bot.chat(`Balance of player ${username} is ${balance}.`);
            } else {
                bot.chat(`Player ${username} hasn't registered yet.`);
            }

            break;

        case "#pay":
            if (username.toLowerCase() == args[1].toLowerCase) {
                bot.chat("You can't pay yourself.");
                break;
            }
            
            amount = Number(args[2]);
            if (isNaN(amount)) {
                bot.chat("Amount is NaN.");
                break;
            }

            uuid = await getUUID(username);
            if (playersData[uuid]) {
                payuuid = await getUUID(args[1]);
                if (payuuid === null) {
                    bot.chat(`Error fetching ${args[1]}'s UUID.`);
                    break;
                }
                if (amount < 1) {
                    bot.chat("Amount must be more or equal to 1.");
                    break;
                }
                if (!playersData[payuuid]) {
                    bot.chat(`Player ${args[1]} hasn't registered yet.`);
                    break;
                }
                if (playersData[uuid]["balance"] < amount) {
                    bot.chat(`Player ${username} has not enough of money.`);
                    break;
                }
                playersData[uuid]["balance"] -= amount;
                playersData[payuuid]["balance"] += amount;
                saveData()
                bot.chat(`Player ${username} successfully paid ${amount} to ${playersData[payuuid]["username"]}.`)
            } else {
                bot.chat(`Player ${username} hasn't registered yet.`);
            }
    }
});

bot.on("spawn", () => {
    console.log("Bot has spawned!");
});

bot.on("error", (err) => {
    console.error("Bot error:", err);
});
