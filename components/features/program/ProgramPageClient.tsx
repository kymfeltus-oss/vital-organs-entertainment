"use client";

import Image from "next/image";
import {
  CalendarDays,
  ChevronRight,
  Clock3,
  ExternalLink,
  MapPin,
  Music,
  Play,
  Radio,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  programLinks,
  programSections,
  type ProgramPerson,
  type ProgramSection,
} from "@/lib/features/program/program-content";
import {
  DEFAULT_COUNTDOWN_CONFIG,
  type EventCountdownConfig,
} from "@/lib/live/countdown-config";
import { cn } from "@/lib/utils";

type ProgramCountdownDetails = EventCountdownConfig & {
  eventLocation?: string;
  livestreamAvailability?: string;
};

type ProgramEventDetails = {
  weekday: string;
  date: string;
  mobileDate: string;
  time: string;
  location: string;
  livestream: string;
};

const PROGRAM_SOCIAL_ICONS = {
  facebook: "/program/facebook-logo.png",
  instagram: "/program/instagram.png",
} as const;

function formatProgramEventDetails(config: ProgramCountdownDetails): ProgramEventDetails {
  const start = new Date(config.start_time);
  const timeZone = config.schedule_timezone || DEFAULT_COUNTDOWN_CONFIG.schedule_timezone;
  const validStart = Number.isNaN(start.getTime())
    ? new Date(DEFAULT_COUNTDOWN_CONFIG.start_time)
    : start;

  return {
    weekday: new Intl.DateTimeFormat("en-US", {
      timeZone,
      weekday: "long",
    }).format(validStart),
    date: new Intl.DateTimeFormat("en-US", {
      timeZone,
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(validStart),
    mobileDate: new Intl.DateTimeFormat("en-US", {
      timeZone,
      month: "short",
      day: "numeric",
    }).format(validStart),
    time: new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    }).format(validStart),
    location: config.eventLocation?.trim() || "New Orleans, LA",
    livestream: config.livestreamAvailability?.trim() || "Available worldwide",
  };
}

function PersonAvatar({ person, large = false }: { person: ProgramPerson; large?: boolean }) {
  const [failed, setFailed] = useState(false);
  const initials = person.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");

  if (person.image && !failed) {
    return (
      <Image
        src={person.image}
        alt={person.name}
        width={large ? 160 : 76}
        height={large ? 160 : 76}
        className={cn(
          "awakening-program-avatar",
          large && "awakening-program-avatar--large",
        )}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <span
      className={cn(
        "awakening-program-avatar awakening-program-avatar--fallback",
        large && "awakening-program-avatar--large",
      )}
      aria-label={person.name}
    >
      {initials}
    </span>
  );
}

function ProgramSocialLinks({ person }: { person: ProgramPerson }) {
  if (!person.socials?.length) return null;

  return (
    <div
      className="awakening-program-social-links"
      aria-label={`${person.name} social media profiles`}
    >
      {person.socials.map((social) => (
        <a
          key={social.href}
          href={social.href}
          target="_blank"
          rel="noreferrer"
          aria-label={`${person.name} on ${social.platform}`}
        >
          {social.platform === "website" ? (
            <ExternalLink
              size={20}
              className="awakening-program-social-links__icon awakening-program-social-links__icon--website"
              aria-hidden
            />
          ) : (
            <Image
              src={PROGRAM_SOCIAL_ICONS[social.platform]}
              alt=""
              width={24}
              height={24}
              className="awakening-program-social-links__icon"
              aria-hidden
            />
          )}
          <span>{social.label}</span>
        </a>
      ))}
    </div>
  );
}

function ProgramRow({
  section,
  onOpen,
}: {
  section: ProgramSection;
  onOpen: (section: ProgramSection) => void;
}) {
  const Icon = section.icon;
  const songStart = section.songStart ?? 1;

  return (
    <button
      type="button"
      className="awakening-program-row"
      data-accent={section.accent}
      onClick={() => onOpen(section)}
    >
      <span className="awakening-program-row__media" aria-hidden>
        {section.people?.length ? (
          <span
            className="awakening-program-row__avatars"
            data-count={Math.min(section.people.length, 3)}
          >
            {section.people.slice(0, 3).map((person) => (
              <PersonAvatar key={person.name} person={person} />
            ))}
          </span>
        ) : (
          <span className="awakening-program-row__icon">
            <Icon size={32} strokeWidth={1.8} />
          </span>
        )}
      </span>
      <span className="awakening-program-row__number">{section.number}</span>
      <span className="awakening-program-row__copy">
        <span className="awakening-program-row__title">{section.title}</span>
        {section.subtitle ? (
          <span className="awakening-program-row__subtitle">{section.subtitle}</span>
        ) : null}
        {section.songs ? (
          <span className="awakening-program-row__songs">
            {section.songs.map((song, index) => (
              <span key={song}>{songStart + index}. {song}</span>
            ))}
          </span>
        ) : null}
        {section.lovedOnes ? (
          <span className="awakening-program-row__songs awakening-program-row__songs--tribute">
            {section.lovedOnes.map((lovedOne) => (
              <span key={lovedOne.name}>{lovedOne.name}</span>
            ))}
          </span>
        ) : null}
      </span>
      <ChevronRight className="awakening-program-row__chevron" size={24} aria-hidden />
    </button>
  );
}

function CandleTribute({ section }: { section: ProgramSection }) {
  return (
    <div className="awakening-program-tribute">
      {section.tributeImage ? (
        <div className="awakening-program-tribute__art">
          <Image
            src={section.tributeImage}
            alt="White Robe Presentation honoring Milton Leblanc, Jimmy Wyatt, Lady Ruth Trotter-Eiland, and Lady Marye Mitchell-Bell"
            width={1080}
            height={1147}
            className="awakening-program-tribute__image"
          />
        </div>
      ) : (
        <div className="awakening-program-candle" aria-hidden>
          <span className="awakening-program-candle__flame" />
          <span className="awakening-program-candle__halo" />
          <span className="awakening-program-candle__base" />
        </div>
      )}
      <div className="awakening-program-tribute__names">
        {section.lovedOnes?.map((lovedOne) => (
          <div key={lovedOne.name} className="awakening-program-tribute__name">
            <span>{lovedOne.name}</span>
            {lovedOne.message ? <p>{lovedOne.message}</p> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function ModalBody({ section }: { section: ProgramSection }) {
  if (section.kind === "offering") {
    return (
      <>
        <div className="awakening-program-offering-art">
          <Image
            src="/vital-seed/mobile-main-backgroundb.png"
            alt="Vital Seed"
            width={1254}
            height={1254}
            className="awakening-program-offering-art__logo"
          />
        </div>
        <a className="awakening-program-modal__primary" href={programLinks.givingUrl}>
          Give Now
          <ExternalLink size={18} aria-hidden />
        </a>
      </>
    );
  }

  if (section.kind === "benediction") {
    return (
      <>
        <div className="awakening-program-prayer-art">
          <Image
            src="/program/prayer-logo.png"
            alt="Prayer and contact us — we're here for you"
            width={1254}
            height={1254}
            className="awakening-program-prayer-art__image"
          />
        </div>
        <a className="awakening-program-modal__primary" href={programLinks.prayerRequestUrl}>
          Request Prayer
          <ExternalLink size={18} aria-hidden />
        </a>
      </>
    );
  }

  if (section.kind === "tribute") {
    return <CandleTribute section={section} />;
  }

  if (section.kind === "music") {
    return (
      <>
        <div className="awakening-program-band-art">
          <Image
            src="/branding/awakening-lockup.png"
            alt="Ian Craig and 300 Awakening"
            width={900}
            height={520}
            className="awakening-program-band-art__image"
            priority={false}
          />
        </div>
        <ol className="awakening-program-song-list" start={section.songStart ?? 1}>
          {section.songs?.map((song) => <li key={song}>{song}</li>)}
        </ol>
        {section.people?.length ? (
          <div className="awakening-program-music-people">
            {section.people.map((person) => (
              <div key={person.name} className="awakening-program-music-person">
                <PersonAvatar person={person} large />
                <div>
                  <strong>{person.name}</strong>
                  <span>{person.role}</span>
                  <p>{person.bio}</p>
                </div>
                <ProgramSocialLinks person={person} />
              </div>
            ))}
          </div>
        ) : null}
        <div className="awakening-program-modal__links">
          <a href={programLinks.artistUrl}>
            <Music size={18} aria-hidden />
            Follow the Music
          </a>
          <a href={programLinks.artistUrl}>
            <Play size={18} aria-hidden />
            Stream
          </a>
        </div>
      </>
    );
  }

  return (
    <div className="awakening-program-people">
      {section.people?.map((person) => (
        <article key={person.name} className="awakening-program-person">
          <PersonAvatar person={person} large />
          <div>
            <h3>{person.name}</h3>
            <p className="awakening-program-person__role">{person.role}</p>
            <p>{person.bio}</p>
            <ProgramSocialLinks person={person} />
          </div>
        </article>
      ))}
    </div>
  );
}

function ProgramModal({
  section,
  onClose,
}: {
  section: ProgramSection;
  onClose: () => void;
}) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="awakening-program-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="awakening-program-modal-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onTouchStart={(event) => {
        touchStartY.current = event.touches[0]?.clientY ?? null;
      }}
      onTouchEnd={(event) => {
        const startY = touchStartY.current;
        const endY = event.changedTouches[0]?.clientY;
        touchStartY.current = null;
        if (startY !== null && endY !== undefined && endY - startY > 90) onClose();
      }}
    >
      <div className="awakening-program-modal__card" data-accent={section.accent} ref={cardRef}>
        <button
          type="button"
          className="awakening-program-modal__close"
          aria-label="Close program details"
          onClick={onClose}
        >
          <X size={22} aria-hidden />
        </button>
        <p className="awakening-program-modal__eyebrow">
          {section.time} · {section.number}
        </p>
        <h2 id="awakening-program-modal-title">
          {section.modalTitle ?? section.title}
        </h2>
        {section.modalMessage ?? section.subtitle ? (
          <p className="awakening-program-modal__message">
            {section.modalMessage ?? section.subtitle}
          </p>
        ) : null}
        <ModalBody section={section} />
      </div>
    </div>
  );
}

type ProgramPageClientProps = {
  initialCountdownDetails?: ProgramCountdownDetails;
};

export default function ProgramPageClient({
  initialCountdownDetails,
}: ProgramPageClientProps) {
  const [selectedSection, setSelectedSection] = useState<ProgramSection | null>(null);
  const [countdownDetails, setCountdownDetails] = useState<ProgramCountdownDetails>({
    ...DEFAULT_COUNTDOWN_CONFIG,
    ...initialCountdownDetails,
    eventLocation: initialCountdownDetails?.eventLocation ?? "New Orleans, LA",
    livestreamAvailability:
      initialCountdownDetails?.livestreamAvailability ?? "Available worldwide",
  });

  const openSection = useCallback((section: ProgramSection) => {
    setSelectedSection(section);
    window.history.replaceState(null, "", `#${section.id}`);
  }, []);

  const closeSection = useCallback(() => {
    setSelectedSection(null);
    window.history.replaceState(null, "", window.location.pathname);
  }, []);

  useEffect(() => {
    const openFromHash = () => {
      const id = window.location.hash.replace("#", "");
      if (!id) return;
      const next = programSections.find((section) => section.id === id);
      if (next) setSelectedSection(next);
    };

    requestAnimationFrame(openFromHash);
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadCountdownDetails() {
      try {
        const response = await fetch("/api/countdown", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as ProgramCountdownDetails;
        if (!cancelled) setCountdownDetails(data);
      } catch {
        // Keep code defaults when countdown details are unavailable.
      }
    }

    void loadCountdownDetails();
    return () => {
      cancelled = true;
    };
  }, []);

  const featuredPeople = useMemo(
    () =>
      programSections
        .flatMap((section) => section.people ?? [])
        .filter((person, index, people) => people.findIndex((item) => item.name === person.name) === index),
    [],
  );
  const eventDetails = useMemo(
    () => formatProgramEventDetails(countdownDetails),
    [countdownDetails],
  );

  return (
    <main className="awakening-program" id="main-content">
      <div className={cn("awakening-program__page", selectedSection && "awakening-program__page--blurred")}>
        <header className="awakening-program-hero">
          <video
            src="/program/intro-header.mp4"
            className="awakening-program-hero__video"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            aria-label="Ian Craig and 300 Awakening program introduction"
          />
          <span className="awakening-program-hero__video-veil" aria-hidden />
          <p className="awakening-program-hero__presenter">Parable Entertainment Presents</p>
        </header>
        <div className="awakening-program-mobile-details" aria-label="Event details">
          <span>{eventDetails.weekday.slice(0, 3)} · {eventDetails.mobileDate}</span>
          <span>{eventDetails.time}</span>
          <span>{eventDetails.location}</span>
        </div>

        <section className="awakening-program-shell" aria-label="300 Awakening digital program">
          <div className="awakening-program-list">
            <div className="awakening-program-list__heading">
              <span />
              <h1>Digital Program</h1>
              <span />
            </div>
            <div className="awakening-program-list__rows">
              {programSections.map((section) => (
                <ProgramRow key={section.id} section={section} onOpen={openSection} />
              ))}
            </div>
            <p className="awakening-program-list__note">Program subject to change</p>
          </div>

          <aside className="awakening-program-side" aria-label="Event details">
            <section className="awakening-program-side__details">
              <h2>Event Details</h2>
              <div className="awakening-program-detail">
                <CalendarDays aria-hidden />
                <p><strong>{eventDetails.weekday}</strong><span>{eventDetails.date}</span></p>
              </div>
              <div className="awakening-program-detail">
                <Clock3 aria-hidden />
                <p><strong>{eventDetails.time}</strong></p>
              </div>
              <div className="awakening-program-detail">
                <MapPin aria-hidden />
                <p><span>Live from {eventDetails.location}</span></p>
              </div>
              <div className="awakening-program-detail">
                <Radio aria-hidden />
                <p><strong>Livestream</strong><span>{eventDetails.livestream}</span></p>
              </div>
            </section>
            <section>
              <h2>Featured Artists</h2>
              <div className="awakening-program-featured">
                <Image
                  src="/tenant-default/speakers/ian-craig.webp"
                  alt="Ian Craig and 300"
                  width={700}
                  height={430}
                />
                <strong className="awakening-program-featured__name">Ian Craig &amp; 300</strong>
              </div>
            </section>
            <section>
              <h2>Program Guests</h2>
              <div className="awakening-program-guest-grid">
                {featuredPeople.map((person) => (
                  <div key={person.name} className="awakening-program-guest">
                    <PersonAvatar person={person} />
                    <span>{person.name}</span>
                  </div>
                ))}
              </div>
            </section>
            <section className="awakening-program-parable-promo">
              <span className="awakening-program-parable-promo__eyebrow">Brand Spotlight</span>
              <h2>Parable</h2>
              <p>Faith-forward media, live moments, and stories built to move the room.</p>
              <a
                href="https://www.facebook.com/vitalorgansent/"
                target="_blank"
                rel="noreferrer"
                aria-label="Connect with Vital Organs Entertainment on Facebook"
              >
                <Image
                  src="/program/facebook-logo.png"
                  alt=""
                  width={30}
                  height={30}
                  aria-hidden
                />
                <span>Connect with Vital Organs Ent</span>
                <ExternalLink aria-hidden />
              </a>
            </section>
          </aside>
        </section>

        <footer className="awakening-program-footer">
          <span>Share The Experience</span>
          <strong>#AWAKENINGLIVE</strong>
          <a href={programLinks.programShareUrl}>Scan To Connect</a>
        </footer>
      </div>

      {selectedSection ? <ProgramModal section={selectedSection} onClose={closeSection} /> : null}
    </main>
  );
}
