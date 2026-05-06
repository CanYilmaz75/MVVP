"use client";

export function ConsentSettingsButton() {
  return (
    <button
      type="button"
      onClick={() => window.__carevoOpenConsentSettings?.()}
      className="block text-left transition-colors hover:text-foreground"
    >
      Datenschutzeinstellungen
    </button>
  );
}
