---
name: Lyric scroll fix
description: Why scrollIntoView and offsetTop fail for centering active lyric lines, and the correct approach.
---

## The rule
Use `getBoundingClientRect()` to scroll the active lyric line to the center of the scroll container — never `element.offsetTop` or `scrollIntoView`.

## Why
`element.offsetTop` is relative to the element's `offsetParent`, which is the nearest *positioned* ancestor (`position` != `static`). In a typical lyrics list where all ancestors are `position: static`, the `offsetParent` climbs all the way to `<body>`, making `offsetTop` a viewport-absolute value — not a container-relative one. The scroll calculation then lands completely wrong.

`scrollIntoView` similarly can scroll the wrong ancestor (the window instead of the inner container).

## How to apply
```tsx
useEffect(() => {
  const scroller = scrollRef.current;
  const activeLine = activeRef.current;
  if (!scroller || !activeLine) return;
  const sRect = scroller.getBoundingClientRect();
  const lRect = activeLine.getBoundingClientRect();
  const delta = (lRect.top - sRect.top + lRect.height / 2) - sRect.height / 2;
  scroller.scrollTo({ top: scroller.scrollTop + delta, behavior: "smooth" });
}, [activeIndex]);
```

The `activeIndex` dependency triggers the effect only when the active line changes, not on every time tick.
