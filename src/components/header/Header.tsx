import { useLocation } from "react-router";

export default function Header() {
  const location = useLocation();
  return (
    <div className="w-screen h-fit flex flex-row items-center justify-center sticky top-0 text-white text-2xl gap-8 pt-10 pb-12">
      {location.pathname == "/" ? (
        <a aria-disabled className="text-neutral-400 cursor-not-allowed">
          Home
        </a>
      ) : (
        <a className="text-blue-300 hover:text-blue-500 cursor-pointer">Home</a>
      )}
      {location.pathname == "/projects" ? (
        <a aria-disabled className="text-neutral-400 cursor-not-allowed">
          Projects
        </a>
      ) : (
        <a className="text-blue-300 hover:text-blue-500 cursor-pointer">
          Projects
        </a>
      )}
      {location.pathname == "/current" ? (
        <a aria-disabled className="text-neutral-400 cursor-not-allowed">
          Current
        </a>
      ) : (
        <a className="text-blue-300 hover:text-blue-500 cursor-pointer">
          Current
        </a>
      )}
    </div>
  );
}
