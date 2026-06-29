"use client";

import Image from "next/image";
import {
  CalendarDays,
  Camera,
  ChevronRight,
  Clock3,
  Cross,
  ExternalLink,
  Globe2,
  Heart,
  MapPin,
  MessageCircle,
  Music,
  Play,
  Radio,
  Sparkles,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
} from "react";
import {
  AWAKENING_PROGRAM_CONFIG,
  AWAKENING_PROGRAM_SECTIONS,
  type AwakeningProgramSection,
} from "@/lib/experience/awakening-program";
import { cn } from "@/lib/utils";

const featuredArtistImages = [
  "/awakening/300_dashboard_assets/ian%20craig%20story.png",
  "/awakening/300_dashboard_assets/music.png",
] as const;

function getSectionFromHash() {
  if (typeof window === "undefined") return null;
  const id = window.location.hash.replace("#", "");
  return AWAKENING_PROGRAM_SECTIONS.find((section) => section.id === id) ?? null;
}

export default function AwakeningProgramClient() {
  const [activeSection, setActiveSection] =
    useState<AwakeningProgramSection | null>(null);
  const [dragY, setDragY] = useState(0);
  const dragStartY = useRef<number | null>(null);

  const openSection = useCallback((section: AwakeningProgramSection) => {
    setActiveSection(section);
    window.history.replaceState(null, "", `#${section.id}`);
  }, []);

  const closeSection = useCallback(() => {
    setActiveSection(null);
    setDragY(0);
    if (window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    const onHashChange = () => {
      setActiveSection(getSectionFromHash());
    };

    const animationFrame = window.requestAnimationFrame(onHashChange);
    window.addEventListener("hashchange", onHashChange);
    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("hashchange", onHashChange);
    };
  }, []);

  useEffect(() => {
    if (!activeSection) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.classList.add("awakening-program-modal-open");

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeSection();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.classList.remove("awakening-program-modal-open");
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeSection, closeSection]);

  return (
    <main id="main-content" className="awakening-program">
      <div
        className={cn(
          "awakening-program__page",
          activeSection && "awakening-program__page--modal-open",
        )}
      >
        <div className="awakening-program__poster">
          <header className="awakening-program__hero">
            <p className="awakening-program__presenter">
              Parable Entertainment Presents
            </p>
            <Image
              src="/branding/awakening-lockup.png"
              alt="Ian Craig and 300 Awakening"
              width={1600}
              height={900}
              priority
              className="awakening-program__official-logo"
            />
          </header>

          <div className="awakening-program__content">
            <section className="awakening-program__schedule" aria-label="Digital program">
              <h2 className="awakening-program__section-title">Digital Program</h2>
              <div className="awakening-program__rows">
                {AWAKENING_PROGRAM_SECTIONS.map((section) => (
                  <ProgramRow
                    key={section.id}
                    section={section}
                    onOpen={() => openSection(section)}
                  />
                ))}
              </div>
              <p className="awakening-program__change-note">
                ** Program subject to change **
              </p>
            </section>

            <aside className="awakening-program__side" aria-label="Event details">
              <section className="awakening-program-panel">
                <h2>Event Details</h2>
                <div className="awakening-program-detail">
                  <div className="awakening-program-detail__item">
                    <CalendarDays size={32} aria-hidden="true" />
                    <p>
                      <strong>Friday</strong>
                      July 3, 2026
                    </p>
                  </div>
                  <div className="awakening-program-detail__item">
                    <Clock3 size={32} aria-hidden="true" />
                    <p>7:30 PM CDT</p>
                  </div>
                  <div className="awakening-program-detail__item">
                    <MapPin size={32} aria-hidden="true" />
                    <p>
                      Live from
                      <br />
                      New Orleans, LA
                    </p>
                  </div>
                  <div className="awakening-program-detail__item">
                    <Radio size={32} aria-hidden="true" />
                    <p>
                      Livestream
                      <br />
                      Available Worldwide
                    </p>
                  </div>
                </div>
              </section>

              <section className="awakening-program-panel awakening-program-panel--blue">
                <h2>Featured Artists</h2>
                <div className="awakening-program-artists">
                  {featuredArtistImages.map((src) => (
                    <Image
                      key={src}
                      src={src}
                      alt=""
                      width={640}
                      height={400}
                      loading="eager"
                    />
                  ))}
                </div>
              </section>

              <section className="awakening-program-panel">
                <h2>Connect With Us</h2>
                <div className="awakening-program-socials">
                  <a className="awakening-program-social" href="https://instagram.com/parableent">
                    <Camera size={25} aria-hidden="true" />
                    <span>@ParableEnt</span>
                  </a>
                  <a className="awakening-program-social" href="https://facebook.com/parableentertainment">
                    <MessageCircle size={25} aria-hidden="true" />
                    <span>/ParableEntertainment</span>
                  </a>
                  <a className="awakening-program-social" href="https://youtube.com/@parableent">
                    <Play size={25} aria-hidden="true" />
                    <span>/ParableEnt</span>
                  </a>
                  <a className="awakening-program-social" href="https://parableent.com">
                    <Globe2 size={25} aria-hidden="true" />
                    <span>ParableEnt.com</span>
                  </a>
                </div>
              </section>

              <section className="awakening-program-panel">
                <div className="awakening-program-panel__powered">
                  <p>Powered By</p>
                  <div className="awakening-program__p-mark">P</div>
                  <strong>Parable Entertainment</strong>
                  <p>
                    Built for purpose.
                    <br />
                    Engineered for impact.
                  </p>
                </div>
              </section>
            </aside>
          </div>

          <footer className="awakening-program__bottom">
            <div className="awakening-program__bottom-cell">
              <span>Share The Experience</span>
              <strong>#AwakeningLive</strong>
            </div>
            <div className="awakening-program__bottom-cell awakening-program__qr-line">
              <span>
                Scan To Connect
                <br />
                And Stay Updated
              </span>
              <Image
                src="/awakening/awakening-program-qr.svg"
                alt="QR code for the Awakening digital program"
                width={68}
                height={68}
              />
            </div>
            <div className="awakening-program__bottom-cell">
              <span>One Sound. One Purpose.</span>
              <span>One Awakening.</span>
            </div>
          </footer>
        </div>
      </div>

      {activeSection ? (
        <ProgramModal
          section={activeSection}
          accent={activeSection.accent}
          dragY={dragY}
          onClose={closeSection}
          onPointerDown={(event) => {
            dragStartY.current = event.clientY;
          }}
          onPointerMove={(event) => {
            if (dragStartY.current === null) return;
            setDragY(Math.max(0, event.clientY - dragStartY.current));
          }}
          onPointerUp={() => {
            if (dragY > 110) {
              closeSection();
            } else {
              setDragY(0);
            }
            dragStartY.current = null;
          }}
        />
      ) : null}
    </main>
  );
}

function ProgramRow({
  section,
  onOpen,
}: {
  section: AwakeningProgramSection;
  onOpen: () => void;
}) {
  const Icon = section.id === "benediction" ? Cross : section.icon;
  const [hour, period] = section.time.split(" ");

  return (
    <button
      type="button"
      className="awakening-program-row"
      data-accent={section.accent}
      onClick={onOpen}
      aria-label={`Open ${section.title}`}
    >
      <span className="awakening-program-row__dot" aria-hidden="true" />
      <span className="awakening-program-row__time">
        {hour}
        <span>{period}</span>
      </span>
      {section.headshots?.length ? (
        <span
          className={cn(
            "awakening-program-row__headshots",
            section.headshots.length > 1 && "awakening-program-row__headshots--stack",
          )}
          aria-hidden="true"
        >
          {section.headshots.map((headshot) => (
            <Image
              key={headshot.src}
              src={headshot.src}
              alt=""
              width={88}
              height={88}
              className="awakening-program-row__headshot"
            />
          ))}
        </span>
      ) : (
        <span className="awakening-program-row__icon" aria-hidden="true">
          <Icon size={44} strokeWidth={1.7} />
        </span>
      )}
      <span className="awakening-program-row__number">{section.number}</span>
      <span className="awakening-program-row__copy">
        <span className="awakening-program-row__title">{section.title}</span>
        {section.id === "tribute" ? (
          <>
            <span className="awakening-program-row__subnote">
              (Passed Away Loved Ones)
            </span>
            <span className="awakening-program-row__names">
              {section.names?.map((name) => <span key={name}>{name}</span>)}
            </span>
          </>
        ) : section.songs ? (
          <span className="awakening-program-row__songs">
            {section.songs.map((song, index) => (
              <span key={song}>
                {index + 1}. {song}
              </span>
            ))}
          </span>
        ) : (
          <span className="awakening-program-row__speaker">{section.speaker}</span>
        )}
      </span>
      <ChevronRight className="awakening-program-row__chevron" size={24} />
    </button>
  );
}

type ProgramModalProps = {
  section: AwakeningProgramSection;
  accent: string;
  dragY: number;
  onClose: () => void;
  onPointerDown: (event: PointerEvent<HTMLElement>) => void;
  onPointerMove: (event: PointerEvent<HTMLElement>) => void;
  onPointerUp: () => void;
};

function ProgramModal({
  section,
  accent,
  dragY,
  onClose,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: ProgramModalProps) {
  const Icon = section.id === "benediction" ? Cross : section.icon;
  const transform = useMemo(
    () => ({
      transform: `translateY(${dragY}px)`,
    }),
    [dragY],
  );

  return (
    <div
      className="awakening-program-modal"
      data-accent={accent}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <article
        className="awakening-program-modal__card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="awakening-program-modal-title"
        style={transform}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <button
          type="button"
          className="awakening-program-modal__close"
          aria-label="Close program detail"
          onClick={onClose}
        >
          <X size={20} />
        </button>
        <div className="awakening-program-modal__handle" aria-hidden="true" />

        <div className="awakening-program-modal__header">
          <span className="awakening-program-modal__number">{section.number}</span>
          <span className="awakening-program-modal__icon" aria-hidden="true">
            <Icon size={22} />
          </span>
          <div>
            <p>{section.speaker}</p>
            <h2 id="awakening-program-modal-title">{section.title}</h2>
          </div>
        </div>

        <ModalBody section={section} />
      </article>
    </div>
  );
}

function ModalBody({ section }: { section: AwakeningProgramSection }) {
  if (section.kind === "offering") {
    return (
      <div className="awakening-program-modal__body awakening-program-modal__body--center">
        <Image
          src="/awakening/300_dashboard_assets/vital_seed.png"
          alt="Vital Seed Giving"
          width={627}
          height={627}
          className="awakening-program-modal__art"
        />
        <p className="awakening-program-modal__statement">Every Gift Has A Frequency.</p>
        <p className="awakening-program-modal__text">{section.notes}</p>
        <a
          href={AWAKENING_PROGRAM_CONFIG.givingUrl}
          className="awakening-program-modal__cta"
          target={AWAKENING_PROGRAM_CONFIG.givingUrl.startsWith("/") ? undefined : "_blank"}
          rel="noreferrer"
        >
          <Heart size={18} aria-hidden="true" />
          <span>Give Now</span>
        </a>
      </div>
    );
  }

  if (section.kind === "benediction") {
    return (
      <div className="awakening-program-modal__body awakening-program-modal__body--center">
        <Sparkles className="awakening-program-modal__prayer-icon" size={54} />
        <p className="awakening-program-modal__statement">Need Prayer?</p>
        <p className="awakening-program-modal__text">{section.notes}</p>
        <a
          href={AWAKENING_PROGRAM_CONFIG.prayerRequestUrl}
          className="awakening-program-modal__cta"
          target={
            AWAKENING_PROGRAM_CONFIG.prayerRequestUrl.startsWith("/")
              ? undefined
              : "_blank"
          }
          rel="noreferrer"
        >
          <Sparkles size={18} aria-hidden="true" />
          <span>Request Prayer</span>
        </a>
      </div>
    );
  }

  if (section.kind === "tribute") {
    return (
      <div className="awakening-program-modal__body">
        <div className="awakening-program-modal__candle" aria-hidden="true">
          <span />
        </div>
        <p className="awakening-program-modal__text">{section.notes}</p>
        <div className="awakening-program-modal__names">
          {section.names?.map((name) => <span key={name}>{name}</span>)}
        </div>
        <p className="awakening-program-modal__silence">Moment of silence</p>
      </div>
    );
  }

  if (section.kind === "set") {
    return (
      <div className="awakening-program-modal__body">
        {section.image ? (
          <Image
            src={section.image}
            alt=""
            width={1536}
            height={1024}
            className="awakening-program-modal__wide-art"
          />
        ) : null}
        <p className="awakening-program-modal__text">{section.notes}</p>
        <ol className="awakening-program-modal__song-list">
          {section.songs?.map((song, index) => (
            <li key={song}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              {song}
            </li>
          ))}
        </ol>
        <div className="awakening-program-modal__links">
          {section.links?.map((link) => (
            <a key={link.label} href={link.href}>
              <Music size={15} />
              {link.label}
            </a>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="awakening-program-modal__body">
      {section.headshots?.length ? (
        <div className="awakening-program-modal__headshots">
          {section.headshots.map((headshot) => (
            <figure key={headshot.src}>
              <Image
                src={headshot.src}
                alt={headshot.name}
                width={220}
                height={220}
                className="awakening-program-modal__headshot"
              />
              <figcaption>{headshot.name}</figcaption>
            </figure>
          ))}
        </div>
      ) : section.image ? (
        <Image
          src={section.image}
          alt=""
          width={900}
          height={640}
          className="awakening-program-modal__wide-art"
        />
      ) : null}
      <div className="awakening-program-modal__detail-grid">
        <span>Role</span>
        <p>{section.role}</p>
        <span>Duration</span>
        <p>{section.duration}</p>
        {section.scripture ? (
          <>
            <span>Scripture</span>
            <p>{section.scripture}</p>
          </>
        ) : null}
      </div>
      <p className="awakening-program-modal__text">{section.bio}</p>
      <p className="awakening-program-modal__text">{section.notes}</p>
      {section.quote ? (
        <blockquote className="awakening-program-modal__quote">
          {section.quote}
        </blockquote>
      ) : null}
      <div className="awakening-program-modal__links">
        <a href={AWAKENING_PROGRAM_CONFIG.followUrl}>
          <ExternalLink size={15} />
          Social Links
        </a>
      </div>
    </div>
  );
}
