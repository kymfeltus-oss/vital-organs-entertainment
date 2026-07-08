import { PrismaClient } from "../app/enterprise/coleman/lib/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Purging legacy static data assets...");
  await prisma.theoryProgression.deleteMany({});
  await prisma.worshipLookup.deleteMany({});

  console.log("🎹 Seeding database-backed Harmonic Roadmaps...");
  await prisma.theoryProgression.createMany({
    data: [
      {
        name: "Standard Gospel Pass",
        numbers: "1-4-6-5",
        chords: "Db - Gb - Bbm - Ab",
        description:
          "The definitive dynamic foundation for worship music.",
      },
      {
        name: "Sentimental Worship Drive",
        numbers: "6-4-1-5",
        chords: "Bbm - Gb - Db - Ab",
        description:
          "Used for high-emotion altars and spoken accompaniment.",
      },
      {
        name: "Traditional 2-5-1 Transition",
        numbers: "2-5-1",
        chords: "Ebm7 - Ab7 - DbMaj7",
        description:
          "Passing chords commonly utilized during modulation adjustments.",
      },
    ],
  });

  console.log("🎵 Seeding dynamic Song Lookup Indexes...");
  await prisma.worshipLookup.createMany({
    data: [
      {
        songTitle: "Break Every Chain",
        artist: "Tasha Cobbs Leonard",
        targetKey: "Db Major",
        targetBpm: 74,
        roadmap: "1 - 4 - 6 - 5",
      },
      {
        songTitle: "Way Maker",
        artist: "Sinach",
        targetKey: "Bb Major",
        targetBpm: 68,
        roadmap: "4 - 1 - 5 - 6",
      },
      {
        songTitle: "Goodness Of God",
        artist: "Bethel Music",
        targetKey: "Ab Major",
        targetBpm: 110,
        roadmap: "1 - 4 - 1 - 5",
      },
    ],
  });

  console.log("✅ Database fully primed. Hardcoded objects safely eliminated.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
