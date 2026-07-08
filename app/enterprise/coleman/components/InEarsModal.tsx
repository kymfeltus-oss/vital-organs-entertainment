"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

import InEarsController from "@/app/enterprise/coleman/components/InEarsController";

type InEarsModalProps = {
  onClose: () => void;
};

export default function InEarsModal({ onClose }: InEarsModalProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="coleman-in-ears-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Stage output and in-ear settings"
      onClick={onClose}
    >
      <div className="coleman-in-ears-modal" onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          className="coleman-in-ears-modal__close coleman-header-control"
          onClick={onClose}
          aria-label="Close output settings"
        >
          <X size={18} strokeWidth={1.35} aria-hidden />
        </button>
        <InEarsController active />
      </div>
    </div>
  );
}
