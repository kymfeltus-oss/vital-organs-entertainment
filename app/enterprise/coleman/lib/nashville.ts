export type NashvilleEnrichment = {
  numbers: string;
  progressionLabel: string;
  churchMovement: string;
};

export async function enrichWithNashville(
  title: string,
  artist: string,
): Promise<NashvilleEnrichment> {
  const hooktheoryKey = process.env.HOOKTHEORY_API_KEY;

  if (hooktheoryKey) {
    void hooktheoryKey;
    throw new Error(
      "Hooktheory enrichment is not yet configured for this deployment.",
    );
  }

  const { prisma } = await import("./prisma");

  const lookup = await prisma.worshipLookup.findFirst({
    where: {
      songTitle: { equals: title, mode: "insensitive" },
      artist: { equals: artist, mode: "insensitive" },
    },
  });

  if (!lookup) {
    throw new Error(
      "No Nashville Number enrichment found for this song in the production catalog.",
    );
  }

  return {
    numbers: lookup.roadmap.replace(/\s*-\s*/g, "  -  "),
    progressionLabel: lookup.roadmap,
    churchMovement: `${lookup.targetKey} · ${lookup.targetBpm} BPM`,
  };
}
