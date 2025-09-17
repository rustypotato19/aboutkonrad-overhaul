import { useEffect, useState } from "react";

// === Types === //
type ApiResponse = {
  title: string;
};

export default function Landing() {
  // === Constants === //
  const thisLocale = localStorage.getItem("locale");
  const thisPath = "components/main/Landing";

  // === Variables === //
  const [title, setTitle] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // === Fetch locale content from server === //
  useEffect(() => {
    const fetchTitle = async () => {
      try {
        const res = await fetch(
          `http://localhost:3001/locales/${thisLocale}/${thisPath}.json`
        );

        if (!res.ok) {
          throw new Error(`HTTP error: ${res.status}`);
        }

        const data: ApiResponse = await res.json();
        setTitle(data.title);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Unknown error");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTitle();
  }, [thisLocale, thisPath]);

  // === Main Return Content === //
  return (
    <div className="w-full h-[10vh] flex justify-center items-center">
      {/* .. Waiting */}
      {loading && <span>Loading...</span>}

      {/* .. Not user friendly error message */}
      {error && <span className="text-red-500">Error: {error}</span>}

      {/* All good - display the text */}
      {!loading && !error && (
        <span className="text-xl font-bold text-white">{title}</span>
      )}
    </div>
  );
}