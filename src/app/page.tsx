import dynamic from 'next/dynamic'
import { LoaderIcon } from "lucide-react"

const Map = dynamic(() => import('@/components/map'), {
  ssr: true,
  loading: () => <LoaderIcon className="animate-spin" />,
})

export default function Home() {
  return (
    <main>
      <Map center={[28.6139, 77.2090]} zoom={12} />
    </main>
  )
}