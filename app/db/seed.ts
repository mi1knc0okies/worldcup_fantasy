import { db } from "./index";
import { friends, picks } from "./schema";

// Edit this with your own group's friends and their 5 team picks.
// Team names must match football-data.org names (e.g. "Korea Republic" not "South Korea").
const GROUPS: Record<string, string[]> = {
  Stew: ["England", "Switzerland", "Colombia", "Turkey", "Canada"],
  Alex: ["France", "Belgium", "Mexico", "Norway", "Uruguay"],
  Sam: ["Spain", "Netherlands", "United States", "Senegal", "Ivory Coast"],
  Jesse: ["Brazil", "Argentina", "Croatia", "South Korea", "Egypt"],
  Juke: ["Portugal", "Germany", "Morocco", "Japan", "Sweden"],
};

async function seed() {
  await db.delete(picks);
  await db.delete(friends);

  for (const [name, teams] of Object.entries(GROUPS)) {
    const [friend] = await db.insert(friends).values({ name }).returning();
    await db
      .insert(picks)
      .values(teams.map((teamName) => ({ friendId: friend.id, teamName })));
  }

  console.log("Seeded", Object.keys(GROUPS).length, "friends");
}

seed();
