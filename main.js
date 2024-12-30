// const HOST = 'cubeville.org'
// const PORT = 25565

const HOST = "localhost";
const PORT = 11111;

const ADMINS = ["blurry16"];

function isAdmin(username) {
    return ADMINS.includes(username.toLowerCase());
}

const mineflayer = require("mineflayer");
const fs = require("fs");

const bot = mineflayer.createBot({
    host: HOST,
    port: PORT,
    auth: "microsoft",
});

const dataFilePath = "./data/data.json";
const jobsFilePath = "./data/jobs.json";

function saveData(path, data) {
    try {
        fs.writeFileSync(path, JSON.stringify(data, null, 2));
        console.log("Data saved successfully!");
    } catch (err) {
        console.error("Error saving data file:", err);
    }
}

function loadData(path) {
    return JSON.parse(fs.readFileSync(path, "utf8"));
}

let playersData = {};
try {
    playersData = loadData(dataFilePath);
    console.log("Loaded players data:", playersData);
    jobsData = loadData(jobsFilePath);
    console.log("Loaded jobs data:", jobsData);
} catch (err) {
    console.error("Error reading data file:", err);
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
            console.log(`${username} executed #register; ${args}`);

            uuid = await getUUID(username);
            if (playersData[uuid]) {
                bot.chat(`${username} is already registered.`);
            } else {
                playersData[uuid] = {
                    username: username,
                    balance: 500,
                    job: null,
                    registeredAt: new Date().toISOString(),
                };
                saveData(dataFilePath, playersData);
                bot.chat(`Player ${username} successfully registered!`);
            }
            break;

        case "#balance":
            console.log(`${username} executed #balance; ${args}`);

            username = args.length == 1 ? username : args[1];
            uuid = await getUUID(username);
            if (uuid === null) {
                bot.chat(`Error fetching ${args[1]}'s UUID.`);
                break;
            }
            if (playersData[uuid]) {
                balance = playersData[uuid]["balance"];
                bot.chat(`Balance of player ${username} is ${balance}.`);
            } else {
                bot.chat(`Player ${username} hasn't registered yet.`);
            }

            break;

        case "#pay":
            console.log(`${username} executed #pay; ${args}`);

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
                saveData(dataFilePath, playersData);
                bot.chat(
                    `Player ${username} successfully paid ${amount} to ${playersData[payuuid]["username"]}.`
                );
            } else {
                bot.chat(`Player ${username} hasn't registered yet.`);
            }

            break;

        case "#newjob":
            console.log(`${username} executed #newjob; ${args}`);

            if (!isAdmin(username)) break;

            if (args.length == 1) {
                bot.chat("Not enough arguments!");
                break;
            }
            jobName = args[1].toLowerCase();
            wage = Number(args[2]);
            if (isNaN(wage)) {
                bot.chat("Wage is NaN.");
                break;
            }
            if (jobsData[jobName]) {
                bot.chat(`Job ${jobName} already exists.`);
                break;
            }
            jobsData[jobName] = wage;
            saveData(jobsFilePath, jobsData)
            console.log(`Created job ${jobName} with wage ${wage}.`);
            bot.chat(`Created job ${jobName} with wage ${wage}.`);
            
            break;

        case "#setjob":
            console.log(`${username} executed #setjob; ${args}`);

            if (!isAdmin(username)) break;

            if (args.length < 3) {
                bot.chat("Not enough arguments!");
                break;
            }

            toSetJob = args[2].toLowerCase()
            if (!jobsData[toSetJob]) {
                bot.chat(`Job ${toSetJob} doesn't exist.`)
                break;
            }

            toSetUuid = await getUUID(args[1]);
            
            if (toSetUuid === null) {
                bot.chat(`Error fetching ${args[1]}'s UUID.`);
                break;
            }
            if (!playersData[toSetUuid]) {
                bot.chat(`Player ${args[1]} hasn't registered yet.`)
                break;
            }
            playersData[toSetUuid]["job"] = toSetJob
            saveData(dataFilePath, playersData)
            bot.chat(`Congrats player ${args[1]} on their new job of ${toSetJob}!`)
        

            break;
                        
    }
});

bot.on("spawn", () => {
    console.log("Bot has spawned!");
});

bot.on("error", (err) => {
    console.error("Bot error:", err);
});
