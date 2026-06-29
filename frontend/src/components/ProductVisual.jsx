import {
  Armchair, Backpack, Bot, Coffee, Footprints, Headphones, LampDesk,
  Laptop, Package, Smartphone, Sparkles, Tv, Watch,
} from 'lucide-react'

const icons = {
  laptop: Laptop,
  headphones: Headphones,
  tv: Tv,
  phone: Smartphone,
  sofa: Armchair,
  lamp: LampDesk,
  coffee: Coffee,
  robot: Bot,
  shoes: Footprints,
  backpack: Backpack,
  watch: Watch,
  beauty: Sparkles,
  package: Package,
}

export default function ProductVisual({ type = 'package', compact = false, className = '' }) {
  const Icon = icons[type] || Package
  return (
    <div className={`product-visual visual-${type} ${compact ? 'compact' : ''} ${className}`}>
      <span className="visual-orbit orbit-one" />
      <span className="visual-orbit orbit-two" />
      <Icon strokeWidth={1.35} aria-hidden="true" />
    </div>
  )
}

