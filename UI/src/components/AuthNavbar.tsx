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
        <div className="size-6 text-blue-600">
          <svg
            fill="none"
            viewBox="0 0 48 48"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              clipRule="evenodd"
              d="M24 4H6V17.3333V30.6667H24V44H42V30.6667V17.3333H24V4Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </svg>
        </div>
        <h2 className="text-lg font-bold leading-tight tracking-tight">
          Task Tracker
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
