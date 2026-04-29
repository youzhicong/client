# IM H5 Responsive Design

## Goal

Make the `/im` chat page usable on phone-width screens while keeping the desktop three-column experience.

## Menu Order

The `智能沟通` sidebar section should be the first top-level section because IM chat and AI settings are now a primary workflow. The fixed sidebar should be hidden at phone widths so the page content can use the full screen.

## H5 Chat Layout

At `max-width: 680px`, `/im` should behave like a mobile chat view:

- the page uses the available dynamic viewport height;
- the conversation list sits above the chat panel and is capped to about one third of the screen;
- the chat panel uses the remaining height and keeps `chat-body` scrollable;
- the composer remains visible at the bottom of the chat panel;
- the members panel is hidden;
- text, message bubbles, and controls shrink enough to avoid horizontal overflow.

## Testing

Add static tests that verify:

- `智能沟通` is first in `menuSections`;
- the fixed sidebar is hidden on H5 widths;
- the IM page defines H5 styles with bounded page height, capped conversation list, scrollable chat body, compact composer, and hidden members panel.
