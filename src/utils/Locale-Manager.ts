// === Constants === //
const countryToLocale: Record<string, string> = {
  US: "en-US",
  GB: "en-GB",
  FR: "fr-FR",
  DE: "de-DE",
  // add more mappings
};

// === Async Functions === //

export async function getCountryFromIP(): Promise<string | null> {
  try {
    const res = await fetch("https://ipapi.co/json/");
    if (!res.ok) throw new Error(`HTTP error: ${res.status}`);

    const data: { country: string } = await res.json();

    console.log("Successfully fetched country: " + data.country)
    return data.country;
  } catch (err) {
    console.error("Failed to detect country:", err);
    return null;
  }
}

export async function detectLocale(): Promise<string> {
  const country = await getCountryFromIP();
  if (country && countryToLocale[country]) {
    console.log("Set locale to: " + countryToLocale[country])
    return countryToLocale[country];
  }
  return "en-GB";
}

export async function getServerLocales(): Promise<string[]> {
  try {
    const res = await fetch("http://localhost:3001/api/locales");
    if (!res.ok) throw new Error(`HTTP error: ${res.status}`);

    const data: { locales: string[] } = await res.json();
    return data.locales;
  } catch (err) {
    console.error("Failed to fetch server locales:", err);
    return [];
  }
}