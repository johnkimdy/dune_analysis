## Typography / Fonts

From analyzing their docs and dashboard screenshots:

1. **Geist** - The primary font family (Vercel's open-source typeface)
   - Used for body text and UI elements
   - Available on Google Fonts: `https://fonts.google.com/specimen/Geist`
   
2. For their logo and branding, they use a clean sans-serif that appears custom or modified

---

## The Hover Blur Effect You Mentioned

The blur effect you're describing (where hovering over tabs blurs other backgrounds) is achieved using:

```css
/* CSS approach */
.tab:hover ~ .other-elements {
  filter: blur(4px);
  transition: filter 0.3s ease;
}

/* Or using backdrop-filter */
.focused-tab::before {
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
```

In React/Next.js, this is typically done with:
- **Framer Motion** for animations
- CSS `filter: blur()` and `backdrop-filter` properties
- State management to track which tab is hovered

---

## Key Design Elements

| Element | Implementation |
|---------|----------------|
| **Background blur** | `backdrop-filter: blur()` with CSS transitions |
| **Card hover effects** | CSS transforms + box-shadow transitions |
| **Dark theme** | CSS custom properties (variables) |
| **Smooth transitions** | `transition: all 0.2s ease` or Framer Motion |
| **Font** | Geist (Vercel's font) |
| **Docs platform** | Mintlify |

---

## Quick Implementation

If you want to recreate that blur-on-hover effect:

```tsx
// Hover blur effect pattern
const [hoveredTab, setHoveredTab] = useState<string | null>(null);

<div className={cn(
  "transition-all duration-300",
  hoveredTab && hoveredTab !== currentTab && "blur-sm opacity-60"
)}>
```

## Color Scheme
Background: #0f0f12 (deep black with slight warmth)
Card background: #161618
Borders: #2a2a2e or #323234
Primary text: #ffffff
Secondary text: #b0b0b4
Muted text: #6e6e72
Accent: Dune's signature orange #f26b3a (coral/salmon)