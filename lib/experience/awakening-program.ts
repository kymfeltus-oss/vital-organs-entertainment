import {
  Cross,
  Gift,
  HeartHandshake,
  Mic2,
  Music2,
  Sparkles,
  Star,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type AwakeningProgramSectionKind =
  | "speaker"
  | "music"
  | "offering"
  | "benediction"
  | "tribute"
  | "intermission";

export type AwakeningProgramPerson = {
  name: string;
  role: string;
  bio: string;
  image?: string;
  socials?: Array<{
    platform: "facebook" | "instagram" | "website";
    label: string;
    href: string;
  }>;
};

export type AwakeningProgramSection = {
  id: string;
  time: string;
  number: string;
  title: string;
  subtitle?: string;
  kind: AwakeningProgramSectionKind;
  accent: "pink" | "blue" | "purple";
  icon: LucideIcon;
  people?: AwakeningProgramPerson[];
  songs?: string[];
  songStart?: number;
  lovedOnes?: Array<{
    name: string;
    message?: string;
    photo?: string;
  }>;
  tributeImage?: string;
  modalTitle?: string;
  modalMessage?: string;
};

export const awakeningProgramLinks = {
  givingUrl: process.env.NEXT_PUBLIC_AWAKENING_GIVING_URL ?? "/giving?guest=1",
  prayerRequestUrl: process.env.NEXT_PUBLIC_AWAKENING_PRAYER_REQUEST_URL ?? "/prayer",
  artistUrl: process.env.NEXT_PUBLIC_AWAKENING_ARTIST_URL ?? "/experience/music",
  programShareUrl: process.env.NEXT_PUBLIC_AWAKENING_PROGRAM_URL ?? "/program",
};

function socialProfiles(facebook: string, instagram: string) {
  return [
    {
      platform: "facebook" as const,
      label: facebook,
      href: `https://www.facebook.com/${facebook}`,
    },
    {
      platform: "instagram" as const,
      label: `@${instagram}`,
      href: `https://www.instagram.com/${instagram}`,
    },
  ];
}

export const awakeningProgramSections: AwakeningProgramSection[] = [
  {
    id: "worship",
    time: "7:30 PM",
    number: "01",
    title: "Worship",
    subtitle: "Pastor Billy Mitchell",
    kind: "speaker",
    accent: "pink",
    icon: Music2,
    people: [
      {
        name: "Pastor Billy Mitchell",
        role: "Worship",
        bio: "Worship Pastor at Connect Church in Plano, Texas.",
        image: "/awakening/speakers/billy-mitchell.webp",
        socials: [
          ...socialProfiles("billy.d.mitchell", "billymitchellmusic"),
          {
            platform: "website",
            label: "Connect Church",
            href: "https://connectchurchplano.com",
          },
        ],
      },
    ],
  },
  {
    id: "hosts",
    time: "7:45 PM",
    number: "02",
    title: "Hosts & Introduction of 300",
    subtitle: "Pastor Chris Wesley @ Carmina Barnett",
    kind: "speaker",
    accent: "pink",
    icon: UserRound,
    modalTitle: "Hosts & Introduction of 300",
    modalMessage: "Hosting the evening and introducing the sound, the people, and the purpose behind 300.",
    people: [
      {
        name: "Pastor Chris Wesley",
        role: "Host",
        bio: "Senior Pastor of Antioch Fellowship Church of Dallas.",
        image: "/awakening/speakers/chris-wesley.webp",
        socials: [
          ...socialProfiles("chris.wesley.251689", "chrisdotwesley"),
          {
            platform: "website",
            label: "Antioch Fellowship Church",
            href: "https://www.afmbc.org/",
          },
        ],
      },
      {
        name: "Carmina Barnett",
        role: "Media Personality and Legend",
        bio: "A celebrated media personality and legend welcoming guests into the 300 Awakening experience.",
        image: "/awakening/speakers/carmina-barnett.webp",
        socials: socialProfiles("carmina.barnett", "carmina.barnett"),
      },
    ],
  },
  {
    id: "prayer",
    time: "8:00 PM",
    number: "03",
    title: "Prayer of Consecration",
    subtitle: "Cynthia Diggs",
    kind: "speaker",
    accent: "blue",
    icon: HeartHandshake,
    people: [
      {
        name: "Cynthia Diggs",
        role: "Co-Pastor, The Altar Exchange Church",
        bio: "Co-pastor of The Altar Exchange Church in Lancaster, TX, covering the gathering in prayer and consecrating the night.",
        image: "/awakening/speakers/cindy-diggs.webp",
        socials: [
          ...socialProfiles("cynthia.diggs.1238", "cyndidiggs_"),
          {
            platform: "facebook",
            label: "The Altar Exchange",
            href: "https://www.facebook.com/TheAltarExchange/",
          },
        ],
      },
    ],
  },
  {
    id: "first-set",
    time: "8:15 PM",
    number: "04",
    title: "First Set: Ian Craig @ 300",
    subtitle: "Song Order",
    kind: "music",
    accent: "pink",
    icon: Mic2,
    songs: [
      "More",
      "Yahweh You Are - Lasunda Joe",
      "All Day - Pastor Joseph Anthony",
      "Watch Him Work - Aaron Gordon",
    ],
    people: [
      {
        name: "Ian Craig",
        role: "Ian Craig @ 300",
        bio: "Leading the first and second sets with 300.",
        image: "/awakening/speakers/ian-craig.webp",
        socials: socialProfiles("ian.c.craig1", "craigboi_vitalboi"),
      },
      {
        name: "Pastor Joseph Anthony",
        role: "All Day",
        bio: "Senior Pastor at Ignite Church in The Colony, Texas, and featured on All Day.",
        image: "/awakening/speakers/joseph-anthony.webp",
        socials: [
          ...socialProfiles("josephanthony4", "josephanthony4"),
          {
            platform: "website",
            label: "Ignite Church",
            href: "https://www.thisisignite.org/",
          },
        ],
      },
      {
        name: "Aaron Gordon",
        role: "Gospel Artist, DFW, TX",
        bio: "A gospel artist from the DFW area featured on Watch Him Work.",
        image: "/awakening/speakers/aaron-gordon.webp",
        socials: socialProfiles("aaron.gordon.1029", "aarongordonjr"),
      },
    ],
    modalTitle: "Ian Craig @ 300",
    modalMessage: "Live. Empower. Transform.",
  },
  {
    id: "offering",
    time: "8:55 PM",
    number: "05",
    title: "Offering",
    subtitle: "Bishop Clinton Smith",
    kind: "offering",
    accent: "blue",
    icon: Gift,
    modalTitle: "Every Gift Has A Frequency.",
    modalMessage: "Sow into the sound and help carry the movement forward.",
  },
  {
    id: "intermission",
    time: "9:10 PM",
    number: "06",
    title: "Intermission Guest",
    subtitle: "Cardell Booker",
    kind: "intermission",
    accent: "purple",
    icon: Star,
    people: [
      {
        name: "Cardell Booker",
        role: "Gospel Artist, DFW, TX",
        bio: "A gospel artist from the DFW area featured during intermission.",
        image: "/awakening/speakers/cardell-booker.webp",
        socials: socialProfiles("cardell.booker", "cardellbookermusic"),
      },
    ],
  },
  {
    id: "second-set",
    time: "9:30 PM",
    number: "07",
    title: "Second Set: Ian Craig @ 300",
    subtitle: "Song Order",
    kind: "music",
    accent: "pink",
    icon: Mic2,
    songs: ["Good Room", "Grace", "Turning Around - Jasmine Harris"],
    songStart: 5,
    people: [
      {
        name: "Ian Craig",
        role: "Ian Craig @ 300",
        bio: "Leading the first and second sets with 300.",
        image: "/awakening/speakers/ian-craig.webp",
        socials: socialProfiles("ian.c.craig1", "craigboi_vitalboi"),
      },
    ],
    modalTitle: "Ian Craig @ 300",
    modalMessage: "One sound. One purpose. One awakening.",
  },
  {
    id: "tribute",
    time: "10:10 PM",
    number: "08",
    title: "Tribute To Our New Angels",
    subtitle: "Passed away loved ones",
    kind: "tribute",
    accent: "blue",
    icon: Sparkles,
    lovedOnes: [
      { name: "Milton Leblanc" },
      { name: "Lady Ruth Trotter-Eiland" },
      { name: "Jimmy Wyatt" },
      { name: "Lady Marye Mitchell-Bell" },
    ],
    tributeImage: "/program/angels.png",
    modalTitle: "Tribute To Our New Angels",
    modalMessage: "We honor every life, every legacy, and every love still speaking.",
  },
  {
    id: "benediction",
    time: "10:30 PM",
    number: "09",
    title: "Benediction",
    kind: "benediction",
    accent: "purple",
    icon: Cross,
    modalTitle: "Need Prayer?",
    modalMessage: "Our team would be honored to pray with you.",
  },
];
