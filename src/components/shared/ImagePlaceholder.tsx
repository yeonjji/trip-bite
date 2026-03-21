type PlaceholderType = "travel" | "pet" | "barrier-free" | "camping" | "default"

const CONTENT_TYPE_CONFIG: Record<string, { emoji: string; gradient: string }> = {
  "12": { emoji: "🏔️", gradient: "from-sky-100 to-blue-200" },
  "14": { emoji: "🏛️", gradient: "from-purple-100 to-violet-200" },
  "15": { emoji: "🎉", gradient: "from-pink-100 to-rose-200" },
  "25": { emoji: "🗺️", gradient: "from-indigo-100 to-blue-200" },
  "28": { emoji: "🏄", gradient: "from-cyan-100 to-sky-200" },
  "39": { emoji: "🍽️", gradient: "from-orange-100 to-amber-200" },
}

const TYPE_CONFIG: Record<PlaceholderType, { emoji: string; gradient: string }> = {
  travel: { emoji: "🏔️", gradient: "from-sky-100 to-blue-200" },
  pet: { emoji: "🐾", gradient: "from-amber-100 to-orange-200" },
  "barrier-free": { emoji: "♿", gradient: "from-teal-100 to-cyan-200" },
  camping: { emoji: "🏕️", gradient: "from-green-100 to-emerald-200" },
  default: { emoji: "📍", gradient: "from-slate-100 to-slate-200" },
}

interface ImagePlaceholderProps {
  type?: PlaceholderType
  contentTypeId?: string
  fullWidth?: boolean
}

export default function ImagePlaceholder({
  type = "default",
  contentTypeId,
  fullWidth = false,
}: ImagePlaceholderProps) {
  const config =
    (contentTypeId ? CONTENT_TYPE_CONFIG[contentTypeId] : undefined) ?? TYPE_CONFIG[type]

  return (
    <div
      className={`flex items-center justify-center bg-gradient-to-br ${config.gradient} ${
        fullWidth ? "h-48 w-full rounded-xl" : "h-full w-full"
      }`}
    >
      <span className={fullWidth ? "text-6xl" : "text-4xl"}>{config.emoji}</span>
    </div>
  )
}
