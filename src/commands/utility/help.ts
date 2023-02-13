import {
  ApplicationCommandOptionType,
  Collection,
  EmbedBuilder,
  EmbedField
} from "discord.js";
import { Command } from "fero-dc";
import { toPascalCase } from "../../util/strings";

export default new Command()
  .setName("help")
  .setDescription("Shows a help embed")
  .setCategory("Utility")
  .setOptions({
    name: "command",
    description: "The command to receive help for",
    type: ApplicationCommandOptionType.String,
    required: false
  })
  .setRun(async (client, interaction) => {
    await interaction.deferReply({
      ephemeral: true,
      fetchReply: false
    });

    const commandName = interaction.options.getString("command");
    const command =
      commandName === null ? null : client.commands.get(commandName) ?? null;

    const author = interaction.user;
    const embed = new EmbedBuilder()
      .setTitle("Delta: Help")
      .setColor("Random")
      .setAuthor({
        name: author.username,
        iconURL: author.avatarURL() ?? ""
      })
      .setThumbnail(client.user.avatarURL() ?? "")
      .setTimestamp()
      .setFooter({
        text: "Delta, The Wings of Fire Moderation Bot",
        iconURL: client.user.avatarURL() ?? ""
      });

    if (command !== null) {
      embed
        .setDescription(
          `Here are all the properties for the ${command.data.name} command!`
        )
        .addFields(
          {
            name: "Command Name",
            value: command.data.name,
            inline: true
          },
          {
            name: "Command Description",
            value: command.data.description,
            inline: true
          },
          {
            name: "Command Category",
            value: toPascalCase(command.data.category),
            inline: true
          }
        );

      const usage = command.getUsage();
      const args = command.getArguments();
      if (usage && args) {
        embed.addFields(
          {
            name: "Command Usage",
            value: usage
          },
          {
            name: "Command Arguments",
            value: args
          }
        );
      }
    } else {
      const commandsByCategory = new Collection<string, Command[]>();
      for (const category of client.categories) {
        const commands = client.getCommandsByCategory(category).values();
        commandsByCategory.set(toPascalCase(category, " "), [...commands]);
      }

      const commandFields: EmbedField[] = commandsByCategory.map(
        (commands, category) => {
          const name = `${category}${
            category.endsWith("Commands") ? "" : " Commands"
          }`;
          const value = commands.map((command) => command.data.name).join("\n");
          return { name, value, inline: true };
        }
      );

      embed
        .setDescription("The following are all the commands I have!")
        .addFields(commandFields);
    }

    await interaction.followUp({
      embeds: [embed]
    });
  });