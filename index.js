const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, PermissionFlagsBits } = require(‘discord.js’);

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

const client = new Client({
intents: [GatewayIntentBits.Guilds]
});

let incidents = [];
let nextId = 1;

const commands = [
new SlashCommandBuilder()
.setName(‘tk’)
.setDescription(‘Record a teamkill’)
.addUserOption(option =>
option.setName(‘killer’)
.setDescription(‘Killer’)
.setRequired(true))
.addUserOption(option =>
option.setName(‘victim’)
.setDescription(‘Victim’)
.setRequired(true)),

new SlashCommandBuilder()
    .setName('tkstats')
    .setDescription('Show player stats')
    .addUserOption(option =>
        option.setName('user')
            .setDescription('User')
            .setRequired(true)),
new SlashCommandBuilder()
    .setName('tkleaderboard')
    .setDescription('Show leaderboard'),
new SlashCommandBuilder()
    .setName('tkdelete')
    .setDescription('Delete a teamkill record')
    .addIntegerOption(option =>
        option.setName('id')
            .setDescription('Incident ID')
            .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

].map(command => command.toJSON());

(async () => {
const rest = new REST({ version: ‘10’ }).setToken(TOKEN);

await rest.put(
    Routes.applicationCommands(CLIENT_ID),
    { body: commands }
);
console.log('Commands registered');

})();

client.on(‘interactionCreate’, async interaction => {
if (!interaction.isChatInputCommand()) return;

if (interaction.commandName === 'tk') {
    const killer = interaction.options.getUser('killer');
    const victim = interaction.options.getUser('victim');
    incidents.push({
        id: nextId++,
        killer: killer.id,
        victim: victim.id
    });
    await interaction.reply(
        `✅ Teamkill Recorded\n\nID: ${nextId - 1}\n${killer.username} → ${victim.username}`
    );
}
if (interaction.commandName === 'tkstats') {
    const user = interaction.options.getUser('user');
    const kills = incidents.filter(i => i.killer === user.id).length;
    const deaths = incidents.filter(i => i.victim === user.id).length;
    await interaction.reply(
        `📊 ${user.username}\n\nTeamkills Given: ${kills}\nTeamkills Received: ${deaths}`
    );
}
if (interaction.commandName === 'tkleaderboard') {
    const totals = {};
    incidents.forEach(i => {
        totals[i.killer] = (totals[i.killer] || 0) + 1;
    });
    const sorted = Object.entries(totals)
        .sort((a, b) => b[1] - a[1]);
    if (sorted.length === 0) {
        return interaction.reply('No teamkills recorded.');
    }
    let message = '🏆 Teamkill Leaderboard\n\n';
    for (let i = 0; i < sorted.length; i++) {
        const user = await client.users.fetch(sorted[i][0]);
        message += `${i + 1}. ${user.username} - ${sorted[i][1]}\n`;
    }
    await interaction.reply(message);
}
if (interaction.commandName === 'tkdelete') {
    if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({
            content: 'Admins only.',
            ephemeral: true
        });
    }
    const id = interaction.options.getInteger('id');
    const index = incidents.findIndex(i => i.id === id);
    if (index === -1) {
        return interaction.reply('Incident not found.');
    }
    incidents.splice(index, 1);
    await interaction.reply(`🗑️ Incident #${id} deleted.`);
}

});

client.once(‘ready’, () => {
console.log(Logged in as ${client.user.tag});
});

client.login(TOKEN);
