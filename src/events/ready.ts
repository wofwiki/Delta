/** @format */

import { Event } from "fero-dc";

export default {
  event: "ready",
  run: async client => {
    // const result = await client.commands
    //   .find(cmd => cmd.name === "lookup")
    //   ?.delete(client);
    // console.log(result);
  }
} as Event<"ready">;