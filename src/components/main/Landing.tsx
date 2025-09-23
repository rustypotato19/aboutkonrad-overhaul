import { useEffect, useState } from "react";

export default function Landing() {
  // === Constants ===
  const thisLocale = localStorage.getItem("locale");
  const thisPath = "components/main/Landing";
  const userId = "959873990430720065"; // Discord user ID

  // === Discord Variables ===
  const [discordUser, setDiscordUser] = useState("");
  const [discordStatus, setDiscordStatus] = useState("");
  const [discordActivity, setDiscordActivity] = useState("");
  const [discordActivityState, setDiscordActivityState] = useState("");
  const [discordActivityDetails, setDiscordActivityDetails] = useState("");
  const [discordActivityStart, setDiscordActivityStart] = useState<Date | null>(
    null
  );
  const [discordAvatar, setDiscordAvatar] = useState("");
  const [activityElapsed, setActivityElapsed] = useState("");

  // === YouTube Music Variables ===
  const [ytTrack, setYtTrack] = useState<string | null>(null);
  const [ytArtist, setYtArtist] = useState<string | null>(null);
  const [ytStart, setYtStart] = useState<number | null>(null);
  const [ytDuration, setYtDuration] = useState<number | null>(null);
  const [ytCompletion, setYtCompletion] = useState<number>(0);
  const [ytLink, setYtLink] = useState<string | null>(null);

  // === Misc ===
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [underline, setUnderline] = useState<boolean>(false)

  // === Helpers ===
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "text-green-500";
      case "idle":
        return "text-yellow-500";
      case "dnd":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const getAvatarBorderColor = (status: string) => {
    switch (status) {
      case "online":
        return "border-green-500";
      case "idle":
        return "border-yellow-500";
      case "dnd":
        return "border-red-500";
      default:
        return "border-gray-500";
    }
  };

  // === Fetch locale content ===
  useEffect(() => {
    const fetchTitle = async () => {
      try {
        const res = await fetch(
          `http://localhost:3001/locales/${thisLocale}/${thisPath}.json`
        );
        if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
        const data: { title: string } = await res.json();
        setTitle(data.title);
      } catch (err: unknown) {
        if (err instanceof Error) setError(err.message);
        else setError("Unknown error");
      } finally {
        setLoading(false);
      }
    };
    fetchTitle();
  }, [thisLocale, thisPath]);

  // === Discord WebSocket ===
  useEffect(() => {
    const ws = new WebSocket("wss://api.lanyard.rest/socket");
    let heartbeatInterval: ReturnType<typeof setInterval>;

    ws.onopen = () =>
      ws.send(JSON.stringify({ op: 2, d: { subscribe_to_id: userId } }));

    ws.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      if (payload.op === 1)
        heartbeatInterval = setInterval(
          () => ws.send(JSON.stringify({ op: 3 })),
          payload.d.heartbeat_interval
        );

      if (payload.t === "INIT_STATE" || payload.t === "PRESENCE_UPDATE") {
        const data = payload.d;
        if (!data.discord_user) return;

        const user = data.discord_user;
        const activity = Array.isArray(data.activities)
          ? data.activities[0]
          : null;

        setDiscordUser(user.username);
        setDiscordStatus(data.discord_status ?? "offline");

        setDiscordActivity(activity?.name ?? "None");
        setDiscordActivityState(activity?.state ?? "None");
        setDiscordActivityDetails(activity?.details ?? "");
        setDiscordActivityStart(
          activity?.timestamps?.start
            ? new Date(activity.timestamps.start)
            : null
        );

        if (user.avatar) {
          const ext = user.avatar.startsWith("a_") ? "gif" : "png";
          setDiscordAvatar(
            `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${ext}`
          );
        } else {
          setDiscordAvatar(`https://cdn.discordapp.com/embed/avatars/0.png`);
        }
      }
    };

    ws.onclose = () => console.log("WebSocket disconnected");
    ws.onerror = (err) => console.error("WebSocket error:", err);

    return () => {
      ws.close();
      if (heartbeatInterval) clearInterval(heartbeatInterval);
    };
  }, []);

  // === Discord elapsed timer ===
  useEffect(() => {
    if (!discordActivityStart) return;
    const interval = setInterval(() => {
      const diff = Math.floor(
        (Date.now() - discordActivityStart.getTime()) / 1000
      );
      const hours = Math.floor(diff / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = diff % 60;

      setActivityElapsed(
        hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m ${seconds}s`
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [discordActivityStart]);

  // --- Poll YouTube Music every 2s but only reset start time if song changes ---
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("http://localhost:3001/ytmusic/current");
        if (!res.ok) return;
        const data = await res.json();

        if (!data.track) {
          // Not listening → clear state
          setYtTrack(null);
          setYtArtist(null);
          setYtLink(null);
          setYtDuration(null);
          setYtStart(null);
          setYtCompletion(0);
          return;
        }

        setYtTrack(data.track);
        setYtArtist(data.artist);
        setYtLink(data.link ?? null);

        if (typeof data.totalDuration === "number") {
          setYtDuration(data.totalDuration);
        }

        // Only reset ytStart if the track changed or elapsed changed
        setYtStart((prevStart) => {
          if (data.track !== ytTrack || typeof data.elapsed === "number") {
            return Date.now() - (data.elapsed ?? 0) * 1000;
          }
          return prevStart;
        });
      } catch (err) {
        console.error(err);
      }
    }, 950);

    return () => clearInterval(interval);
  }, [ytTrack]);

  // --- Smooth client timer for completion ---
  useEffect(() => {
    if (!ytStart || !ytDuration) return;

    const timer = setInterval(() => {
      const elapsed = (Date.now() - ytStart) / 1000;
      setYtCompletion(Math.min((elapsed / ytDuration) * 100, 100));
    }, 500);

    return () => clearInterval(timer);
  }, [ytStart, ytDuration]);

  // === Render ===
  return (
    <div className="w-full h-fit flex items-center p-16 text-white">
      <div className="ml-[50%] translate-x-[-50%] flex flex-col">
        {loading && <span>Loading...</span>}
        {error && (
          <span className="text-red-500">Unexpected error occurred</span>
        )}

        {!loading && !error && (
          <div className="flex flex-row w-full h-full gap-6">
            <div className="flex flex-col">
              {/* Discord Container */}
              <div className="flex flex-col items-center bg-gray-800 px-4 py-6 rounded-xl shadow-lg gap-4 w-[300px] border-2 border-black">
                <p
                  className={`font-bold text-2xl ${getStatusColor(
                    discordStatus || "offline"
                  )}`}
                >
                  {discordStatus || "offline"}
                </p>
                <img
                  src={discordAvatar || "/default-avatar.png"}
                  alt={`${discordUser || "User"} avatar`}
                  className={`w-36 h-36 rounded-full border-4 ${getAvatarBorderColor(
                    discordStatus || "offline"
                  )}`}
                />

                <div className="flex flex-col items-center text-center text-gray-300 space-y-1">
                  <span className={`font-semibold mb-1 ${discordActivity === "Custom Status" || discordActivity === "None" ? "text-3xl" : ""}`}>
                    {discordActivity === "Custom Status" ||
                    discordActivity === "None"
                      ? "💤"
                      : discordActivity == "Visual Studio Code"
                      ? "In " + discordActivity
                      : discordActivity}
                  </span>
                  {discordActivityState && (
                    <span className="text-sm italic text-gray-500">
                      {discordActivityState == "None" &&
                      discordActivity == "Visual Studio Code"
                        ? "Messing with configs"
                        : discordActivityState == "None"
                        ? ""
                        : discordActivityState}
                    </span>
                  )}
                  {discordActivityDetails &&
                    discordActivityDetails.includes(" - ") &&
                    (() => {
                      const parts = discordActivityDetails.split(" - ");
                      const value = parts[1] ?? "";
                      const firstChar = value[0] ?? "";

                      const textColor =
                        firstChar === "0"
                          ? "text-green-700"
                          : "text-orange-400";
                      const displayText =
                        firstChar === "0" ? "Unproblematic Code" : value;

                      return (
                        <span className={`text-sm ${textColor}`}>
                          {displayText}
                        </span>
                      );
                    })()}

                  {discordActivityStart && (
                    <span className="text-xs text-gray-400">
                      Elapsed: {activityElapsed}
                    </span>
                  )}
                </div>
              </div>

              {/* YouTube Music Container */}
              <div className="mt-6 w-[300px] px-3 pb-5 pt-5 bg-red-800 rounded-xl shadow-lg border-2 border-black flex flex-col items-center text-center text-sm">
                {/* Logo always visible */}
                <img
                  src="/YT-Music-Logo.png"
                  alt="YouTube Music Logo"
                  className="w-[200px] mb-2"
                />

                {ytTrack ? (
                  <a
                    href={
                      ytLink ??
                      `https://music.youtube.com/search?q=${encodeURIComponent(
                        `${ytTrack} ${ytArtist ?? ""}`
                      )}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    onMouseEnter={() => {setUnderline(true)}}
                    onMouseLeave={() => {setUnderline(false)}}
                    className="flex flex-col items-center text-center text-sm no-underline"
                  >
                    <h1 className={`text-2xl font-bold mb-[2px] text-white ${underline ? "underline" : ""}`}>
                      {ytTrack}
                    </h1>
                    {ytArtist && (
                      <span className={`text-neutral-400 ${underline ? "underline" : ""}`}>{ytArtist}</span>
                    )}

                    {ytDuration && ytStart && (
                      <div className="w-full mt-2">
                        <div className="flex justify-between text-xs text-gray-300 mb-1">
                          <span>
                            {formatTime(
                              Math.min(
                                (Date.now() - ytStart) / 1000,
                                ytDuration
                              )
                            )}
                          </span>
                          <span>{formatTime(ytDuration)}</span>
                        </div>
                        <div className="w-full bg-gray-600 h-2 rounded">
                          <div
                            className="bg-red-500 h-2 rounded"
                            style={{ width: `${ytCompletion}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </a>
                ) : (
                  <span className="text-gray-300 italic mt-2">
                    Currently not listening to music
                  </span>
                )}
              </div>
            </div>

            {/* Main Block */}
            <div className="ml-6">
              <h1 className="font-bold text-4xl">{title}</h1>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
