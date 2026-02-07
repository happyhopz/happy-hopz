import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

/**
 * ScrollToTop component that ensures:
 * 1. New navigations (PUSH/REPLACE) start at the top of the page.
 * 2. Back/Forward navigations (POP) preserve/restore their scroll position (handled by browser).
 */
const ScrollToTop = () => {
    const { pathname } = useLocation();
    const navType = useNavigationType();

    useEffect(() => {
        // Only scroll to top if it's a new entry (not a back/forward action)
        if (navType !== "POP") {
            window.scrollTo({
                top: 0,
                left: 0,
                behavior: "instant", // Use "instant" to avoid seeing the jump
            });
        }
    }, [pathname, navType]);

    return null;
};

export default ScrollToTop;
