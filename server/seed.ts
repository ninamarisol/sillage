import { db } from "./db";
import { accessCodes, fragrances } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function seedDatabase() {
  const [existingCode] = await db.select().from(accessCodes).limit(1);
  if (existingCode) {
    console.log("[seed] Database already seeded");
    return;
  }

  console.log("[seed] Seeding database...");

  await db.insert(accessCodes).values([
    { code: "SILLAGE_LAYLA", creatorName: "Layla Montague" },
    { code: "VAULT_BYRD", creatorName: "Byrd Fragrances" },
    { code: "SCENT_MAYA", creatorName: "Maya Chen" },
    { code: "SILLAGE_DEMO", creatorName: "Demo Access" },
    { code: "BRANDSTORM", creatorName: "L'Oréal Brandstorm" },
  ]);

  await db.insert(fragrances).values([
    {
      name: "Terre d'Hermès",
      house: "Hermès",
      concentration: "EDT",
      topNotes: ["grapefruit", "orange"],
      heartNotes: ["pepper", "geranium"],
      baseNotes: ["vetiver", "cedar", "benzoin"],
      family: "woody",
      description: "A metaphor in fragrance — a journey from earth to sky, raw matter to refined spirit.",
    },
    {
      name: "Santal 33",
      house: "Le Labo",
      concentration: "EDP",
      topNotes: ["violet", "cardamom"],
      heartNotes: ["iris", "ambrox"],
      baseNotes: ["sandalwood", "cedar", "leather"],
      family: "woody",
      description: "The smell of the American West — open spaces, rugged leather, and smoky campfire.",
    },
    {
      name: "Baccarat Rouge 540",
      house: "Maison Francis Kurkdjian",
      concentration: "EDP",
      topNotes: ["saffron", "jasmine"],
      heartNotes: ["ambergris", "cedar"],
      baseNotes: ["fir resin", "musk"],
      family: "oriental",
      description: "An alchemical blend that creates an aura of luminous warmth.",
    },
    {
      name: "Bleu de Chanel",
      house: "Chanel",
      concentration: "EDP",
      topNotes: ["citrus", "mint"],
      heartNotes: ["grapefruit", "ginger"],
      baseNotes: ["sandalwood", "cedar", "incense"],
      family: "woody",
      description: "Freedom contained in an intense, deep blue that explores every facet of masculinity.",
    },
    {
      name: "Black Orchid",
      house: "Tom Ford",
      concentration: "EDP",
      topNotes: ["truffle", "bergamot", "ylang-ylang"],
      heartNotes: ["orchid", "lotus", "fruit notes"],
      baseNotes: ["patchouli", "sandalwood", "vanilla", "incense"],
      family: "oriental",
      description: "A luxurious and sensual fragrance of rich dark accords and an alluring potion of black orchids.",
    },
    {
      name: "La Vie Est Belle",
      house: "Lancôme",
      concentration: "EDP",
      topNotes: ["black currant", "pear"],
      heartNotes: ["iris", "jasmine", "orange blossom"],
      baseNotes: ["praline", "vanilla", "patchouli", "tonka bean"],
      family: "gourmand",
      description: "A declaration of happiness and beauty. The first ever iris gourmand fragrance.",
    },
    {
      name: "Aventus",
      house: "Creed",
      concentration: "EDP",
      topNotes: ["pineapple", "bergamot", "apple", "blackcurrant"],
      heartNotes: ["birch", "jasmine", "patchouli"],
      baseNotes: ["musk", "oakmoss", "ambergris", "vanilla"],
      family: "woody",
      description: "Inspired by the dramatic life of a historic emperor. A scent of strength, power, and success.",
    },
    {
      name: "Acqua di Gio",
      house: "Giorgio Armani",
      concentration: "EDT",
      topNotes: ["lime", "lemon", "bergamot", "neroli", "jasmine"],
      heartNotes: ["calone", "peach", "freesia", "rosemary"],
      baseNotes: ["cedar", "musk", "oakmoss", "amber", "patchouli"],
      family: "aquatic",
      description: "Inspired by the beauty of Pantelleria — where the sun, sea, and earth merge into one.",
    },
    {
      name: "Miss Dior",
      house: "Dior",
      concentration: "EDP",
      topNotes: ["lily-of-the-valley", "peony"],
      heartNotes: ["rose", "iris"],
      baseNotes: ["musk", "rosewood"],
      family: "floral",
      description: "A couture bow bottle containing the essence of love — fresh, floral, and radiant.",
    },
    {
      name: "Oud Wood",
      house: "Tom Ford",
      concentration: "EDP",
      topNotes: ["oud", "rosewood"],
      heartNotes: ["cardamom", "sandalwood"],
      baseNotes: ["tonka bean", "vetiver", "amber"],
      family: "oriental",
      description: "Rare and exotic. Oud Wood envelops you in rare oud, sandalwood, and cashmere warmth.",
    },
    {
      name: "Light Blue",
      house: "Dolce & Gabbana",
      concentration: "EDT",
      topNotes: ["sicilian lemon", "apple", "cedar", "bluebell"],
      heartNotes: ["bamboo", "jasmine", "white rose"],
      baseNotes: ["cedar", "musk", "amber"],
      family: "citrus",
      description: "The Mediterranean captured in a bottle — sun-kissed, breezy, and eternally fresh.",
    },
    {
      name: "Flowerbomb",
      house: "Viktor & Rolf",
      concentration: "EDP",
      topNotes: ["bergamot", "tea"],
      heartNotes: ["sambac jasmine", "orchid", "freesia", "rose"],
      baseNotes: ["patchouli", "musk"],
      family: "floral",
      description: "An explosive bouquet of fresh and sweet flowers. An addictive floral explosion.",
    },
    {
      name: "Noir de Noir",
      house: "Tom Ford",
      concentration: "EDP",
      topNotes: ["saffron", "rose"],
      heartNotes: ["black truffle", "vanilla"],
      baseNotes: ["patchouli", "oud", "tree moss"],
      family: "oriental",
      description: "Dark and decadent. A sensuous fragrance rooted in the sultry beauty of black rose and truffle.",
    },
    {
      name: "Chanel No. 5",
      house: "Chanel",
      concentration: "EDP",
      topNotes: ["aldehydes", "neroli", "ylang-ylang"],
      heartNotes: ["rose", "jasmine", "iris"],
      baseNotes: ["sandalwood", "vanilla", "vetiver", "musk"],
      family: "floral",
      description: "The world's most legendary fragrance. An eternal homage to femininity and timeless elegance.",
    },
    {
      name: "Sauvage",
      house: "Dior",
      concentration: "EDP",
      topNotes: ["bergamot", "pepper"],
      heartNotes: ["lavender", "sichuan pepper", "star anise"],
      baseNotes: ["ambroxan", "cedar", "labdanum"],
      family: "woody",
      description: "Raw and noble. Inspired by wide-open landscapes under a burning desert sky.",
    },
  ]);

  console.log("[seed] Seeded 5 access codes and 15 fragrances");
}
