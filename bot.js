const Discord = require('discord.js');
const client = new Discord.Client();
const say = require('say');
require('dotenv').config();

var channel;
var guild;
var connection;

var players = [];
var voice = null;
var voicePrefix = "Microsoft ";
var voiceSuffix = " Desktop";
var prefix = "!";

var voices = [ "David", "Hazel", "Zira" ];

var hitlerID = -1;
var facistsIDs = [];



client.once('ready', () => {
	console.log('Ready!');
});

client.on('message', gotMessage);

client.on('messageReactionAdd', gotReaction);

client.login(process.env.DISCORD_KEY);

async function gotMessage(message)
{
	if (message.author.id === client.user.id)
	{
		return;
	}
	if (channel == null)
	{
		// Checking if the message author is in a voice channel.
		if (!message.member.voice.channel) return message.reply("You must be in a voice channel.");
		// Checking if the bot is in a voice channel.
		if (!message.guild.me.voice.channel)
		{
			// Joining the channel and creating a VoiceConnection.
			await message.member.voice.channel.join();
		}
		channel = message.guild.me.voice.channel;
		connection = await channel.join();
		guild = message.guild;
	}
	var member = guild.member(message.author);
	// Commands
	if (message.content.startsWith(prefix))
	{
		const args = message.content.slice(prefix.length).trim().split(/ +/);
		const command = args.shift().toLowerCase();
		switch (command) {
			case 'say':
				saySomething(member.displayName + " said " + args.join(' '));
				break;
			case 'setVoice':
				var input = args[0];
				if (voices.includes(input))
				{
					voice = voicePrefix + input + voiceSuffix;
					saySomething("Hello there! I'm your new narrator!");
				}
				else
				{
					message.reply('Invalid voice!');
				}
				break;
			case 'listVoices':
				message.reply(voices.join());
				break;
			case 'start':
				playersWithoutRoles = players.slice();
				hitlerID = getRandomInt(players.length);
				playersWithoutRoles.splice(hitlerID, 1);
				var numFacists = (players.length - 1) / 2 - 1;
				for (var i = 0; i < numFacists; i++)
				{
					var newID = getRandomInt(playersWithoutRoles.length);
					facistsIDs.push(players.indexOf(playersWithoutRoles[newID]));
					playersWithoutRoles.splice(newID, 1);
				}
				console.log("Hitler is " + players[hitlerID].displayName + ", facists IDs are " + facistsIDs.join(', '));
				if (facistsIDs.length != 1)
				{
					players[hitlerID].send("You're Hitler, " + players[hitlerID].displayName + "!");
				}
				else
				{
					players[hitlerID].send("You're Hitler, " + players[hitlerID].displayName + "! The facist is " + players[facistsIDs[0]].displayName);
				}
				for (var i = 0; i < facistsIDs.length; i++)
				{
					var current = players[facistsIDs[i]];
					var toSend = "You're a Facist, " + current.displayName + "! Hitler is " + players[hitlerID].displayName;
					if (facistsIDs.length > 1)
					{
						toSend += ", and the other facists are ";
						var others = players.filter((a, b) => facistsIDs.indexOf(b) >= 0).splice(i, 1);
						for (var j = 0; j < others.length; j++) {
							toSend += others[j].displayName + ", ";
						}
					}
					current.send(toSend);
				}
				for (var i = 0; i < playersWithoutRoles.length; i++) {
					playersWithoutRoles[i].send("You're a Liberal, " + playersWithoutRoles[i].displayName);
				}
			default:
				break;
		}
	}
	else // Game actions
	{
		if (!players.includes(member))
		{
			players.push(member);
			message.reply('Hi 😀\nThere are ' + players.length + ' players.');
			saySomething(member.displayName + " joined the game!");
		}
		else
		{
			message.reply("You're already in the game!")
		}
	}
}

function gotReaction(reaction, user)
{
	reaction.message.reply('You reacted!');
}

function saySomething(text)
{
    const timestamp = new Date().getTime();
    const soundPath = `./temp/${timestamp}.wav`;
    say.export(text, voice, 1, soundPath, (err) => {
        if (err) {
            console.error(err);
            return;
        }else{
            // channel.join().then((connection) => {
            //     connection.play(soundPath);
            // }).catch((err) => {
            //     console.error(err);
            // });
			connection.play(soundPath);
        }
    });
}

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}
