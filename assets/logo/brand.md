# Fanoos brand foundation

## Meaning

Fanoos comes from the Persian word “فانوس”, meaning lantern. The product is a lantern for source
code: it reveals structural behavior without executing the program.

The tagline is:

> Illuminate your code.

## Symbol

The mark combines two systems:

- the lantern frame is the boundary of static analysis;
- the four connected nodes inside it form a rising control-flow path;
- the bright nodes are facts that have become visible;
- the open space around the graph represents behavior that remains unexplored.

The graph is essential. Do not replace the mark with a flame, bulb, desk lamp, or a generic lantern
silhouette.

## Assets

- `logo.svg` — horizontal lockup for documentation and product surfaces;
- `logo-mark.svg` — square mark for npm, repositories, avatars, and compact UI;
- `favicon.svg` — simplified mark optimized for small browser sizes.

## Palette

| Token             | Hex       | Purpose                                      |
| ----------------- | --------- | -------------------------------------------- |
| Lantern night     | `#101A1F` | Primary dark field and developer environment |
| Chamber slate     | `#172329` | Secondary surfaces                           |
| Revealed amber    | `#F2B84B` | Illuminated graph and primary brand accent   |
| Paper light       | `#F7FAFB` | High-contrast paths and wordmark             |
| Structural steel  | `#617781` | Supporting information                       |
| Dormant connector | `#33464F` | Unselected graph structure                   |

Amber is a signal, not a fill color. Use it for active paths, key nodes, focus rings, and compact
brand moments. Large surfaces remain neutral so code and analysis stay visually dominant.

## Typography

Use IBM Plex Sans for product and documentation copy when available. Use IBM Plex Mono for source,
identifiers, locations, and the tagline. System fallbacks are included in the SVG lockup, so the
asset remains portable.

The wordmark is always written as `Fanoos`. Package names remain lowercase where npm requires it:
`fanoos`, `@fanoosjs/core`, `@fanoosjs/ui`, and `@fanoosjs/cli`.

## Clear space and minimum sizes

Keep clear space around the mark equal to one graph-node diameter. Do not place the mark below 24 px.
Use `favicon.svg`, rather than scaling the full lockup, below 48 px.

## Backgrounds

The supplied assets are designed for dark developer environments and retain strong contrast on the
embedded Lantern night field. Do not recolor the graph path independently from its nodes. On light
surfaces, use the supplied dark container instead of removing it.

## Accessibility

The symbol never carries product state by itself. Pair it with the `Fanoos` text in navigation or
provide the accessible label “Fanoos”. The amber and paper strokes meet non-text contrast
requirements against Lantern night.
