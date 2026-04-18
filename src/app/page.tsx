import { LoaderIcon } from "lucide-react";
import dynamic from "next/dynamic";

const MapComp = dynamic(() => import("@/components/map"), {
  ssr: true,
  loading: () => <LoaderIcon className="animate-spin" />,
});

export default function Home() {
  return (
    <main className="relative h-screen w-screen overflow-hidden">
      <MapComp center={[28.6139, 77.209]} zoom={12} />
    </main>
  );
}
