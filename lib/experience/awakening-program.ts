import {
  HeartHandshake,
  Mic2,
  Music2,
  Sparkles,
  Flame,
  HandHeart,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

export type AwakeningProgramSectionKind =
  | "speaker"
  | "hosts"
  | "set"
  | "offering"
  | "tribute"
  | "benediction";

export type AwakeningProgramSection = {
  id: string;
  number: string;
  time: string;
  title: string;
  speaker: string;
  duration: string;
  kind: AwakeningProgramSectionKind;
  icon: LucideIcon;
  accent: "blue" | "pink" | "purple" | "gold";
  image?: string;
  headshots?: Array<{ name: string; src: string }>;
  role?: string;
  bio?: string;
  notes?: string;
  quote?: string;
  scripture?: string;
  songs?: string[];
  names?: string[];
  links?: Array<{ label: string; href: string }>;
};

export const AWAKENING_PROGRAM_CONFIG = {
  givingUrl: process.env.NEXT_PUBLIC_AWAKENING_GIVING_URL || "/experience/giving",
  prayerRequestUrl:
    process.env.NEXT_PUBLIC_AWAKENING_PRAYER_REQUEST_URL || "/experience/prayer",
  shareUrl: process.env.NEXT_PUBLIC_AWAKENING_PROGRAM_URL || "/program",
  followUrl: process.env.NEXT_PUBLIC_AWAKENING_FOLLOW_URL || "/experience/music",
  streamingUrl:
    process.env.NEXT_PUBLIC_AWAKENING_STREAMING_URL || "/experience/music",
} as const;

export const AWAKENING_PROGRAM_SECTIONS: AwakeningProgramSection[] = [
  {
    id: "worship",
    number: "01",
    time: "7:30 PM",
    title: "Worship",
    speaker: "Pastor Billy Mitchell",
    duration: "12 min",
    kind: "speaker",
    icon: Mic2,
    accent: "blue",
    image: "/awakening/speakers/billy-mitchell.png",
    headshots: [
      { name: "Pastor Billy Mitchell", src: "/awakening/speakers/billy-mitchell.png" },
    ],
    role: "Opening worship leader",
    scripture: "Awake, my soul, and sing.",
    bio: "Pastor Billy Mitchell opens the room with a worship moment designed to gather every voice into one sound.",
    notes:
      "A focused worship invocation setting the spiritual tone for the live recording.",
    quote: "One room. One voice. One awakening.",
  },
  {
    id: "welcome",
    number: "02",
    time: "7:45 PM",
    title: "Welcome & Intro of Ian Craig and 300",
    speaker: "Hosts: Carmina Barnett, and Pastor Chris Wesley",
    duration: "8 min",
    kind: "hosts",
    icon: UsersRound,
    accent: "purple",
    image: "/awakening/speakers/carmina-barnett.png",
    headshots: [
      { name: "Carmina Barnett", src: "/awakening/speakers/carmina-barnett.png" },
      {
        name: "Pastor Chris Wesley",
        src: "/awakening/speakers/pastor-chris-wesley.png",
      },
    ],
    role: "Event hosts",
    bio: "Carmina Barnett and Pastor Chris Wesley guide guests into the story, purpose, and rhythm of the night.",
    notes:
      "Opening remarks, guest orientation, and a warm invitation into the AWAKENING experience.",
  },
  {
    id: "consecration-prayer",
    number: "03",
    time: "8:00 PM",
    title: "Prayer of Consecration",
    speaker: "Cynthia Diggs",
    duration: "6 min",
    kind: "speaker",
    icon: HandHeart,
    accent: "pink",
    image: "/awakening/speakers/cynthia-diggs.png",
    headshots: [
      { name: "Cynthia Diggs", src: "/awakening/speakers/cynthia-diggs.png" },
    ],
    role: "Prayer focus",
    bio: "Cynthia Diggs leads a consecration prayer covering the artists, families, production team, and every attendee.",
    notes:
      "A reverent moment of alignment before the music moves into the first live recording set.",
  },
  {
    id: "first-set",
    number: "04",
    time: "8:15 PM",
    title: "First Set: Ian Craig & 300",
    speaker: "Song Order",
    duration: "28 min",
    kind: "set",
    icon: Music2,
    accent: "blue",
    image: "/awakening/300_dashboard_assets/ian%20craig%20story.png",
    role: "Live recording set",
    songs: ["More", "Yahweh You Are", "Grace", "Watch Him Work"],
    notes:
      "The opening musical arc moves from surrender into declaration, carrying the room into the heart of the recording.",
    links: [{ label: "Streaming Links", href: AWAKENING_PROGRAM_CONFIG.streamingUrl }],
  },
  {
    id: "offering",
    number: "05",
    time: "8:55 PM",
    title: "Offering",
    speaker: "TBD",
    duration: "7 min",
    kind: "offering",
    icon: HeartHandshake,
    accent: "pink",
    image: "/awakening/300_dashboard_assets/vital_seed.png",
    role: "Giving moment",
    notes:
      "Support the mission through a secure giving destination. Apple Pay, Google Pay, debit, credit, and Cash App support depend on the configured provider.",
  },
  {
    id: "intermission-guest",
    number: "06",
    time: "9:10 PM",
    title: "Intermission Guest",
    speaker: "Cordell Booker",
    duration: "10 min",
    kind: "speaker",
    icon: Mic2,
    accent: "purple",
    image: "/awakening/speakers/cordell-booker.png",
    headshots: [
      { name: "Cordell Booker", src: "/awakening/speakers/cordell-booker.png" },
    ],
    role: "Guest feature",
    bio: "Cordell Booker carries the intermission with a featured moment connecting story, sound, and encouragement.",
    notes:
      "A premium guest segment designed to keep the room engaged between recording sets.",
  },
  {
    id: "second-set",
    number: "07",
    time: "9:30 PM",
    title: "Second Set: Ian Craig & 300",
    speaker: "Song Order",
    duration: "24 min",
    kind: "set",
    icon: Music2,
    accent: "blue",
    image: "/awakening/300_dashboard_assets/music.png",
    role: "Live recording set",
    songs: ["Good Room", "All Day", "Turning Around"],
    notes:
      "The second set releases joy, movement, and testimony as the room responds together.",
    links: [{ label: "Follow Ian Craig", href: AWAKENING_PROGRAM_CONFIG.followUrl }],
  },
  {
    id: "tribute",
    number: "08",
    time: "10:10 PM",
    title: "Tribute To Our New Angels",
    speaker: "Memorial Moment",
    duration: "9 min",
    kind: "tribute",
    icon: Flame,
    accent: "gold",
    image: "/branding/awakening-lockup.png",
    role: "Moment of remembrance",
    names: [
      "Milton LeBlanc",
      "Lady Ruth Trotter-Eiland",
      "Jimmy Wyatt",
      "Lady Marye Mitchell-Bell",
    ],
    notes:
      "A beautiful memorial experience honoring loved ones whose lives continue to echo through family, faith, and sound.",
  },
  {
    id: "benediction",
    number: "09",
    time: "10:30 PM",
    title: "Benediction",
    speaker: "Next Steps",
    duration: "Open",
    kind: "benediction",
    icon: Sparkles,
    accent: "pink",
    image: "/awakening/300_dashboard_assets/prayer_contact.png",
    role: "Prayer and connection",
    notes:
      "The closing moment becomes a next step: request prayer, join the movement, follow Ian Craig, and share the experience.",
  },
];
