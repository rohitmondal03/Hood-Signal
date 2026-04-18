import { MapPinIcon } from "lucide-react";

export function Logo() {
  return (
    <div className="relative flex items-center justify-center size-8 rounded-md bg-linear-to-br from-violet-500 to-indigo-600 shadow-md shadow-violet-500/25 group-hover:shadow-violet-500/40 transition-shadow duration-300">
      <MapPinIcon className="size-4.5 text-white" strokeWidth={2.5} />
    </div>
  );
}
