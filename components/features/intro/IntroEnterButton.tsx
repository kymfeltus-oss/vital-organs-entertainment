"use client";

type IntroEnterButtonProps = {
  onClick: () => void;
  disabled?: boolean;
};

export default function IntroEnterButton({ onClick, disabled = false }: IntroEnterButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label="Enter Parable Streaming"
      className="intro-enter-cta"
    >
      <span className="intro-enter-cta__halo" aria-hidden="true" />
      <span className="intro-enter-cta__orbit" aria-hidden="true" />
      <span className="intro-enter-cta__frame" aria-hidden="true">
        <span className="intro-enter-cta__border" />
        <span className="intro-enter-cta__scan" />
      </span>
      <span className="intro-enter-cta__content">
        <span className="intro-enter-cta__text">Enter</span>
        <span className="intro-enter-cta__arrow" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" className="intro-enter-cta__arrow-icon">
            <path
              d="M5 12h12m0 0-4.5-4.5M17 12l-4.5 4.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </span>
    </button>
  );
}
