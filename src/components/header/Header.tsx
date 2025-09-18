// === Generic Imports === //
import { useEffect, useState } from "react";

// === Component Imports === //
import { detectLocale, getServerLocales } from "../../utils/Locale-Manager";

export default function Header() {
  // === Variables === //
  const [locale, setLocale] = useState<string>("en-GB");
  const [serverLocales, setServerLocales] = useState<string[]>([]);

  // === Constants === //
  const currentLocale = localStorage.getItem("locale") || locale;
  const otherLocales = serverLocales.filter((loc) => loc !== currentLocale);

  // Initialize locale on mount
  useEffect(() => {
    const initLocale = async () => {
      const detected = await detectLocale();
      localStorage.setItem("locale", detected);
      setLocale(detected);
    };
    initLocale();
  }, []);

  // Fetch server locales on mount
  useEffect(() => {
    const fetchLocales = async () => {
      const locales = await getServerLocales();
      setServerLocales(locales);
    };
    fetchLocales();
  }, []);

  const handleLocaleChange = (newLocale: string) => {
    setLocale(newLocale);
    localStorage.setItem("locale", newLocale);
    location.reload(); // optional: fetch new locale content
  };

  // === Main Return Content === //
  return (
    <header className="flex justify-between items-center w-full h-30 sticky top-0 bg-neutral-900">
      <h1 className="text-white font-semibold text-2xl mx-12">
        aboutkonrad.com
      </h1>
      <select
        value={currentLocale}
        onChange={(e) => handleLocaleChange(e.target.value)}
        className="text-white font-semibold text-2xl mx-12 hover:cursor-pointer hover:text-neutral-300 transition-all duration-200 active:text-neutral-400"
      >
        {/* Always display current locale first */}
        <option value={currentLocale} className="bg-neutral-700">{currentLocale}</option>

        {/* Render all other locales */}
        {otherLocales.map((loc) => (
          <option key={loc} value={loc} className="bg-neutral-700">
            {loc}
          </option>
        ))}
      </select>
    </header>
  );
}
