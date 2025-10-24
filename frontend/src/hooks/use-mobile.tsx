import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  // 💥 FIX 1: Initialize state using window.matchMedia.
  // This is a non-layout-query operation, preventing the reflow on mount.
  const [isMobile, setIsMobile] = React.useState(() => {
    if (typeof window === 'undefined') {
      return false; // Default for Server-Side Rendering (SSR)
    }
    // Use the result of the media query check as the initial state
    return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`).matches;
  });

  React.useEffect(() => {
    // Safely exit if window is not available (e.g., during SSR hydration)
    if (typeof window === 'undefined') return;

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    
    // 💥 FIX 2: Use the event object (e.matches) instead of querying window.innerWidth.
    const onChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches)
    }
    
    mql.addEventListener("change", onChange)
    
    // 💥 FIX 3: REMOVE the line that caused the reflow (setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)).
    // The initial state is now correctly set in the useState initializer.
    
    return () => mql.removeEventListener("change", onChange)
  }, []) // Empty dependency array is correct

  // Since isMobile is always a boolean now, the !! cast is unnecessary
  return isMobile
}