import { Link } from "react-router-dom";

interface AuthNavbarProps {
  buttonText: string;
  buttonLink: string;
}

export default function AuthNavbar({
  buttonText,
  buttonLink,
}: AuthNavbarProps) {
  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-gray-200 px-6 py-3 bg-white">
      <div className="flex items-center gap-4 text-gray-900">
        <div className="bg-blue-600 rounded-lg size-8 flex items-center justify-center text-white shrink-0">
          <span className="material-symbols-outlined text-lg">check_circle</span>
        </div>
        <h2 className="text-lg font-bold leading-tight tracking-tight">
          TaskTracker
        </h2>
      </div>
      <Link
        to={buttonLink}
        className="flex min-w-[84px] cursor-pointer items-center justify-center rounded-lg h-10 px-4 bg-blue-600 text-white text-sm font-bold leading-normal hover:bg-blue-700"
      >
        <span className="truncate">{buttonText}</span>
      </Link>
    </header>
  );
}
