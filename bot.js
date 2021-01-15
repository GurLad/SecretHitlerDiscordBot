const Discord = require('discord.js');
const client = new Discord.Client();
const say = require('say');
require('dotenv').config();

GameState = {
	INIT: 1,
	NOMINATE_CHANCELLOR: 2,
	PLAYER_VOTE: 3,
	PRESIDENT_DISCARD: 4,
	CHANCELLOR_DISCARD: 5,
	KILL: 6
}

const MAX_FACIST = 6;
const MAX_LIBERAL = 5;

var channelVoice;
var channelText;
var guild;
var connection;

var voice = null;
var voicePrefix = "Microsoft ";
var voiceSuffix = " Desktop";
var prefix = "!";

var voices = ["David", "Hazel", "Zira"];

var players = [];
var hitlerID = -1;
var facistsIDs = [];
var currentPresidentID = -1;
var currentChancellorID = -1;
var numLiberal = 3;
var numFacist = 2;
var currentState = GameState.INIT;

var currentVoteBalance = 0;
var currentVoters = [];



client.once('ready', () => {
	console.log('Ready!');
});

client.on('message', gotMessage);

client.on('messageReactionAdd', gotReaction);

client.login(process.env.DISCORD_KEY);

async function gotMessage(message) {
	if (message.author.id === client.user.id) {
		return;
	}
	if (channelVoice == null) {
		// Checking if the message author is in a voice channel.
		if (!message.member.voice.channel) return message.reply("You must be in a voice channel.");
		// Checking if the bot is in a voice channel.
		if (!message.guild.me.voice.channel) {
			// Joining the channel and creating a VoiceConnection.
			await message.member.voice.channel.join();
		}
		channelVoice = message.guild.me.voice.channel;
		connection = await channelVoice.join();
		guild = message.guild;
		channelText = message.channel;
	}
	var member = guild.member(message.author);
	// Commands
	if (message.content.startsWith(prefix)) {
		const args = message.content.slice(prefix.length).trim().split(/ +/);
		const command = args.shift().toLowerCase();
		switch (command) {
			case 'say':
				saySomething(member.displayName + " said " + args.join(' '));
				break;
			case 'setVoice':
				var input = args[0];
				if (voices.includes(input)) {
					voice = voicePrefix + input + voiceSuffix;
					saySomething("Hello there! I'm your new narrator!");
				} else {
					message.reply('Invalid voice!');
				}
				break;
			case 'listVoices':
				message.reply(voices.join());
				break;
			case 'start':
				if (currentState = GameState.INIT) {
					playersWithoutRoles = players.slice();
					hitlerID = getRandomInt(players.length);
					playersWithoutRoles.splice(hitlerID, 1);
					var numFacists = (players.length - 1) / 2 - 1;
					for (var i = 0; i < numFacists; i++) {
						var newID = getRandomInt(playersWithoutRoles.length);
						facistsIDs.push(players.indexOf(playersWithoutRoles[newID]));
						playersWithoutRoles.splice(newID, 1);
					}
					// console.log("Hitler is " + players[hitlerID].displayName + ", facists IDs are " + facistsIDs.join(', '));
					if (facistsIDs.length != 1) {
						players[hitlerID].send("You are Hitler, " + players[hitlerID].displayName + "!");
					} else {
						players[hitlerID].send("You are Hitler, " + players[hitlerID].displayName + "!\n The facist is " + players[facistsIDs[0]].displayName);
					}
					for (var i = 0; i < facistsIDs.length; i++) {
						var current = players[facistsIDs[i]];
						var toSend = "You are a Facist, " + current.displayName + "!\n Hitler is " + players[hitlerID].displayName;
						if (facistsIDs.length > 1) {
							toSend += ", and the other facists are ";
							var others = players.filter((a, b) => facistsIDs.indexOf(b) >= 0).splice(i, 1);
							for (var j = 0; j < others.length; j++) {
								toSend += others[j].displayName + ", ";
							}
						}
						current.send(toSend);
					}
					for (var i = 0; i < playersWithoutRoles.length; i++) {
						playersWithoutRoles[i].send("You are a Liberal, " + playersWithoutRoles[i].displayName);
					}
					currentPresidentID = getRandomInt(players.length);
					gameLogic(GameState.NOMINATE_CHANCELLOR);
				} else {
					message.reply('Game in progress!');
				}
				break;
			case "end":
				gameLogic(GameState.INIT)
				break;
			default:
				break;
		}
	} else // Game actions
	{
		switch (currentState) {
			case GameState.INIT:
				if (!players.includes(member)) {
					players.push(member);
					message.reply('Hi 😀\nThere are ' + players.length + ' players.');
					saySomething(member.displayName + " joined the game!");
				} else {
					message.reply("You are already in the game!")
				}
				break;
			case GameState.NOMINATE_CHANCELLOR:
				if (member == players[currentPresidentID]) {
					for (var i = 0; i < players.length; i++) {
						if (players[i].displayName.toLowerCase() === message.content.toLowerCase()) {
							currentChancellorID = i;
							message.react('👍');
							message.react('👎');
							gameLogic(GameState.PLAYER_VOTE);
							saySomething(players[i].displayName + ' is Chancellor')
							return;
						}
					}
					message.reply("Please choose a valid player (use their display name).");
				} else {
					sayAndPrint("Nice try, " + member.displayName);
				}
				break;
			default:

		}
	}
}

function gotReaction(reaction, user) {
	if (user.id == client.user.id) {
		return;
	}
	switch (currentState) {
		case GameState.PLAYER_VOTE:
			content = reaction.emoji.name;
			if (content !== '👎' && content !== '👍') {
				return;
			}
			for (var i = 0; i < players.length; i++) {
				if (players[i].id == user.id) {
					if (currentVoters.indexOf(players[i]) < 0) {
						currentVoters.push(players[i]);
						if (content === '👍') {
							currentVoteBalance++;
						} else {
							currentVoteBalance--;
						}
					}
				}
			}
			console.log("Voters: " + currentVoters.length);
			if (currentVoters.length == players.length) {
				if (currentVoteBalance > 0) {
					gameLogic(GameState.PRESIDENT_DISCARD);
				} else {
					gameLogic(GameState.NOMINATE_CHANCELLOR);
				}
			}
			break;
		default:
			break;
	}
}

function gameLogic(nextState) {
	currentState = nextState;
	switch (nextState) {
		case GameState.INIT:
			var toSend = 'The players were: \n'
			for (var i = 0; i < players.length; i++) {
				toSend += players[i].displayName + ", ";
				if (i == hitlerID) {
					toSend += "was Hitler\n";
				} else if (facistsIDs.indexOf(i) >= 0) {
					toSend += "a Facist\n";
				} else {
					toSend += "a Liberal\n";
				}
			}
			sayAndPrint(toSend + "Thank you for playing Secret Hitler, Goodbye!");
			hitlerID = -1;
			facistsIDs = [];
			players = [];
			break;
		case GameState.NOMINATE_CHANCELLOR:
			currentPresidentID++;
			currentPresidentID %= players.length;
			printGameState();
			sayAndPrint(players[currentPresidentID].displayName + ", nominate a chancellor.");
			break;
		case GameState.PLAYER_VOTE:
			currentVoters = [];
			currentVoteBalance = 0;
			saySomething('Everyone, vote YA or NIEN for the ' + players[currentPresidentID].displayName + ' and ' + players[currentChancellorID].displayName + ' goverment.');
			break;
		case GameState.PRESIDENT_DISCARD:
			saySomething(players[currentPresidentID].displayName + ', choose a card to discard.');
		default:
			break;
	}
}

function printGameState() {
	var empty = '◻';
	var liberal = '🕊️';
	var facist = '💀';
	var toSend = 'Game state:\n';
	for (var i = 0; i < MAX_LIBERAL; i++) {
		toSend += (numLiberal > i ? liberal : empty) + ' ';
	}
	toSend += '\n';
	for (var i = 0; i < MAX_FACIST; i++) {
		toSend += (numFacist > i ? facist : empty) + ' ';
	}
	channelText.send(toSend);
}

function saySomething(text) {
	const timestamp = new Date().getTime();
	const soundPath = `./temp/${timestamp}.wav`;
	say.export(text, voice, 1, soundPath, (err) => {
		if (err) {
			console.error(err);
			return;
		} else {
			// channel.join().then((connection) => {
			//     connection.play(soundPath);
			// }).catch((err) => {
			//     console.error(err);
			// });
			connection.play(soundPath);
		}
	});
}

function sayAndPrint(text) {
	channelText.send(text);
	saySomething(text);
}

function getRandomInt(max) {
	return Math.floor(Math.random() * Math.floor(max));
}
