import { Link } from "react-router-dom";
import ArabicText from "../components/ArabicText";
import { allVocab } from "../lib/content";
import { speak, useHasArabicVoice } from "../lib/speech";
import {
  SPEECH_RATES,
  updateSettings,
  useSettings,
  type SpeechRate,
  type ThemePreference,
} from "../lib/settings";

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "system", label: "Match device" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

const SPEED_LABELS: Record<SpeechRate, string> = { 0.7: "Slow", 0.9: "Normal", 1: "Natural" };

// Level 1's greeting, so every learner recognises the sample, whatever their level.
const SAMPLE_WORD = allVocab.find((word) => word.id === "salaam");

/** A row of mutually exclusive choices: real radio inputs, styled as a segmented control. */
function ChoiceGroup<T extends string | number>({
  name,
  legend,
  help,
  options,
  value,
  onChange,
}: {
  name: string;
  legend: string;
  help?: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset className="settings-field">
      <legend className="settings-label">{legend}</legend>
      {help && <p className="settings-help">{help}</p>}
      <div className="segmented">
        {options.map((option) => (
          <label key={String(option.value)} className="segmented-option">
            <input
              type="radio"
              name={name}
              className="visually-hidden"
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default function Settings() {
  const settings = useSettings();
  const hasVoice = useHasArabicVoice();

  return (
    <div className="settings-page">
      <Link to="/" className="back-link">
        &larr; All levels
      </Link>
      <h2>Settings</h2>

      <section className="settings-card" aria-labelledby="settings-appearance">
        <h3 id="settings-appearance">Appearance</h3>
        <ChoiceGroup
          name="theme"
          legend="Theme"
          help="Match device switches between light and dark along with your phone or computer."
          options={THEME_OPTIONS}
          value={settings.theme}
          onChange={(theme) => updateSettings({ theme })}
        />
      </section>

      <section className="settings-card" aria-labelledby="settings-reading">
        <h3 id="settings-reading">Reading</h3>
        <label className="settings-switch-row">
          <span>
            <span className="settings-label">Show transliteration</span>
            <span className="settings-help">
              The Latin spelling shown with Arabic words and example sentences. Turn it off to
              practise reading the script itself.
            </span>
          </span>
          <input
            type="checkbox"
            role="switch"
            className="switch"
            checked={settings.showTransliteration}
            onChange={(e) => updateSettings({ showTransliteration: e.target.checked })}
          />
        </label>
        {SAMPLE_WORD && (
          <div className="settings-preview" aria-hidden="true">
            <ArabicText className="settings-preview-arabic">{SAMPLE_WORD.arabic}</ArabicText>
            {settings.showTransliteration && (
              <span className="settings-preview-translit">{SAMPLE_WORD.transliteration}</span>
            )}
            <span className="settings-preview-english">{SAMPLE_WORD.english}</span>
          </div>
        )}
      </section>

      <section className="settings-card" aria-labelledby="settings-audio">
        <h3 id="settings-audio">Audio</h3>
        <ChoiceGroup
          name="speech-rate"
          legend="Speech speed"
          help="How fast Arabic is read aloud by the 🔊 buttons and listening exercises."
          options={SPEECH_RATES.map((rate) => ({ value: rate, label: SPEED_LABELS[rate] }))}
          value={settings.speechRate}
          onChange={(speechRate) => updateSettings({ speechRate })}
        />
        {SAMPLE_WORD && (
          <div className="settings-sample">
            <button
              type="button"
              className="reset-btn"
              onClick={() => speak(SAMPLE_WORD.audio.text)}
              disabled={!hasVoice}
            >
              Play a sample
            </button>
            {!hasVoice && (
              <span className="settings-help">
                No Arabic voice is available in this browser, so nothing can be played.
              </span>
            )}
          </div>
        )}
        <p className="settings-help">
          Speech uses the voices installed on this device, so it also works offline. A browser's
          own network voices need a connection.
        </p>
      </section>

      <p className="settings-footnote">Settings are saved in this browser, on this device.</p>
    </div>
  );
}
