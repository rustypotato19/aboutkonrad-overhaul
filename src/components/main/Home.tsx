import { useEffect, useState, useRef } from "react";

export default function Home() {
  const userId = "959873990430720065"; // Discord user ID

  // === Discord Variables ===
  const [discordStatus, setDiscordStatus] = useState("");
  const [discordActivity, setDiscordActivity] = useState("");
  const [discordActivityDetails, setDiscordActivityDetails] = useState("");
  const [discordActivityStart, setDiscordActivityStart] = useState<Date | null>(
    null
  );
  const [activityElapsed, setActivityElapsed] = useState("");

  // === YouTube Music Variables ===
  const [ytTrack, setYtTrack] = useState<string | null>(null);
  const [ytArtist, setYtArtist] = useState<string | null>(null);
  const [ytStart, setYtStart] = useState<number | null>(null);
  const [ytDuration, setYtDuration] = useState<number | null>(null);
  const [ytLink, setYtLink] = useState<string | null>(null);
  const [ytStatus, setYtStatus] = useState<string | null>(null);

  // === Misc ===
  const [underline, setUnderline] = useState<string>("");
  const [isOverflowing, setIsOverflowing] = useState(false);

  const marqueeRef = useRef<HTMLSpanElement>(null);

  // === Helpers ===
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const getProblemsColour = (activity: string, activityDetails: string) => {
    if (activity !== "Visual Studio Code") {
      return "white";
    }
    const numOfProblems = activityDetails.split(" ")[0];
    if (numOfProblems.length == 1) {
      return numOfProblems == "0" ? "text-green-400" : "text-yellow-200";
    } else if (numOfProblems[0] == "1") {
      return "text-amber-500";
    } else {
      return "text-red-600";
    }
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

        const activity = Array.isArray(data.activities)
          ? data.activities[0]
          : null;

        setDiscordStatus(data.discord_status ?? "offline");

        setDiscordActivity(activity?.name ?? "None");
        setDiscordActivityDetails(activity?.details ?? "");
        setDiscordActivityStart(
          activity?.timestamps?.start
            ? new Date(activity.timestamps.start)
            : null
        );
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

  // --- Poll YouTube Music every ~1s ---
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
          setYtStatus(null);
          return;
        }

        setYtTrack(data.track);
        setYtArtist(data.artist);
        setYtLink(data.link ?? null);
        setYtStatus(data.status);

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
        console.error("YouTube fetch error:", err);
      }
    }, 950);

    return () => clearInterval(interval);
  }, [ytTrack]);

  // === Detect overflow for marquee ===
  useEffect(() => {
    const el = marqueeRef.current;
    if (el) {
      setIsOverflowing(el.scrollWidth > el.clientWidth);
    }
  }, [ytTrack, ytArtist]);

  // === Render ===
  return (
    /* Page Container */
    <div className="w-full h-full flex flex-col items-center text-white pb-16 gap-10">
      {/* Status Container */}
      <div className="flex flex-row w-1/2 h-fit min-h-[150px] items-start justify-between gap-12 text-4xl">
        <div className="flex flex-col h-full justify-between gap-8">
          <h1 className="flex items-center gap-2 translate-x-[-1rem] min-w-fit text-3xl sm:text-4xl font-semibold">
            <span className="wave_animated inline-block">👋</span>
            <span className="rainbow rainbow_text_animated font-bold">Hi!</span>
            <span>I'm Konrad</span>
          </h1>

          {/* YouTube Music Status */}
          <div className="relative w-full h-28">
            {" "}
            {/* Fixed height reserves space */}
            <div
              className={`transition-all duration-500 ease-in-out transform h-full flex flex-col justify-center items-start ${
                ytTrack ? "opacity-100 scale-100" : "opacity-0 scale-95"
              }`}
            >
              <div className="w-full bg-red-800 bg-opacity-50 rounded-xl p-4 flex flex-col gap-2 shadow-lg h-full border-2">
                {ytTrack && (
                  <a
                    href={
                      ytLink ??
                      `https://music.youtube.com/search?q=${encodeURIComponent(
                        `${ytTrack} ${ytArtist ?? ""}`
                      )}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    onMouseEnter={() => setUnderline("underline")}
                    onMouseLeave={() => setUnderline("")}
                    className="flex flex-col gap-1 w-full"
                  >
                    <div className="overflow-hidden w-[500px]">
                      <span
                        ref={marqueeRef}
                        className={`font-bold text-xl whitespace-nowrap block ${underline} ${
                          isOverflowing ? "animate-marquee" : ""
                        }`}
                      >
                        {ytTrack}{" "}
                        <span className="font-normal text-neutral-400">by</span>{" "}
                        {ytArtist?.split("•")[0] || "Unknown"}
                      </span>
                    </div>

                    {ytDuration && ytStart && (
                      <div className="text-sm text-gray-100">
                        {formatTime(
                          Math.min((Date.now() - ytStart) / 1000, ytDuration)
                        )}{" "}
                        / {formatTime(ytDuration)}{" "}
                        {ytStatus === "paused" && "⏸ Paused"}
                      </div>
                    )}
                    <div className="h-1 w-full bg-neutral-100 rounded-full mt-1">
                      <div
                        className="h-1 bg-neutral-800 rounded-full transition-all duration-300"
                        style={{
                          width:
                            ytDuration && ytStart
                              ? `${Math.min(
                                  ((Date.now() - ytStart) / 1000 / ytDuration) *
                                    100,
                                  100
                                )}%`
                              : "0%",
                        }}
                      />
                    </div>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Discord Status */}
        <div className="w-fit flex items-end flex-col text-right">
          <p
            className={`${getStatusColor(
              discordStatus || "offline"
            )} font-bold`}
          >
            {discordStatus}
          </p>
          <p className="text-lg">
            {discordActivity == "Visual Studio Code"
              ? "In " + discordActivity + " for " + activityElapsed
              : ""}
          </p>
          <p
            className={`text-lg ${getProblemsColour(
              discordActivity,
              discordActivityDetails.split(" - ")[1] ?? ""
            )}`}
          >
            {discordActivityDetails.split(" - ")[1]}
          </p>
          <a
            className="text-sm text-blue-400 hover:text-blue-300"
            href="https://www.discord.com/users/959873990430720065"
            target="_blank"
          >
            See me on discord
          </a>
        </div>
      </div>

      {/* About me */}
      <div className="w-1/2 flex flex-col items-start text-2xl">
        <div className="flex flex-col">
          <div className="my-4">
            <h1 className="font-bold text-[1.6rem]">about me</h1>
            <p className="text-xl">
              <span className="text-blue-400 font-semibold">
                BSc Computer Science
              </span>{" "}
              at{" "}
              <a
                className="font-semibold text-yellow-200 hover:text-yellow-300"
                href="https://www.yorksj.ac.uk/"
                target="_blank"
              >
                York St John University
              </a>{" "}
              <span className="text-sm">{">"} 2026</span>
              <br />
              <span>
                Full-stack web developer, occasional python enjoyer, wanna-be
                C++ programmer
              </span>
            </p>
          </div>
          <hr className="w-[134%] border-2" />
          <div className="my-4">
            <h1 className="font-bold text-[1.6rem]">strengths</h1>
            <p>
              <span className="bg-gradient-to-r from-0% from-blue-500 via-85% via-yellow-400 to-100% to-yellow-400 bg-clip-text text-transparent">
                react.js
              </span>
              ,{" "}
              <span className="bg-gradient-to-r from-0% from-yellow-400 via-35% via-yellow-400 to-100% to-blue-400 bg-clip-text text-transparent">
                typescript
              </span>
              ,{" "}
              <span className="bg-gradient-to-r from-0% from-blue-400 via-35% via-blue-400 to-100% to-indigo-500 bg-clip-text text-transparent">
                tailwindcss
              </span>
              ,{" "}
              <span className="bg-gradient-to-r from-0% from-indigo-500 via-35% via-indigo-500 to-100% to-yellow-400 bg-clip-text text-transparent">
                python
              </span>
            </p>
          </div>
          <hr className="w-[134%] border-2" />
          <div className="my-4">
            <h1 className="font-bold text-[1.6rem]">weaknesses</h1>
            <p>
              <span className="text-amber-200">rust</span>,{" "}
              <span className="rainbow rainbow_text_animated">
                dev planning
              </span>
            </p>
          </div>
          <hr className="w-[134%] border-2" />
          <div className="my-4">
            <h1 className="font-bold text-[1.6rem]">web development</h1>
            <div className="flex flex-col w-full">
              <div className="my-2 w-full">
                <span>Front End</span>
                <span className="text-[1.25rem]">
                  {" >> "}
                  <span className="bg-gradient-to-r from-0% from-blue-500 via-85% via-yellow-400 to-100% to-yellow-400 bg-clip-text text-transparent">
                    react.js
                  </span>
                  ,{" "}
                  <span className="bg-gradient-to-r from-0% from-yellow-400 via-35% via-yellow-400 to-100% to-blue-400 bg-clip-text text-transparent">
                    typescript
                  </span>
                  ,{" "}
                  <span className="bg-gradient-to-r from-0% from-blue-400 via-35% via-blue-400 to-100% to-indigo-500 bg-clip-text text-transparent">
                    tailwindcss
                  </span>{" "}
                  and shamefully, <span className="text-violet-500">php</span>
                </span>
              </div>
              <div className="my-2 w-full">
                <span>Back End</span>
                <span className="text-[1.25rem]">
                  {" >> "}
                  <span className="text-yellow-300">express.js</span> and
                  learning <span className="text-orange-500">cargo</span> (
                  <span className="text-yellow-200">rust</span>)
                </span>
              </div>
              <div className="my-2 w-full">
                <span>Databases</span>
                <span className="text-[1.25rem]">
                  {" >> "}
                  <span className="text-red-600">mariadb</span>,{" "}
                  <span className="text-emerald-400">postgresql</span>,{" "}
                  <span className="text-violet-300">phpmyadmin</span>
                </span>
              </div>
              <div className="w-full">
                <span>This website</span>
                <span className="text-[1.25rem]">
                  {" >> "}
                  <span className="bg-gradient-to-r from-0% from-blue-500 via-85% via-yellow-400 to-100% to-yellow-400 bg-clip-text text-transparent">
                    react.js
                  </span>
                  ,{" "}
                  <span className="bg-gradient-to-r from-0% from-yellow-400 via-35% via-yellow-400 to-100% to-blue-400 bg-clip-text text-transparent">
                    typescript
                  </span>
                  ,{" "}
                  <span className="bg-gradient-to-r from-0% from-blue-400 via-35% via-blue-400 to-100% to-indigo-500 bg-clip-text text-transparent">
                    tailwindcss
                  </span>
                  , <span className="text-orange-500">cargo</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Local marquee CSS */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          display: inline-block;
          padding-left: 100%;
          animation: marquee 10s linear infinite;
        }
      `}</style>
    </div>
  );
}
