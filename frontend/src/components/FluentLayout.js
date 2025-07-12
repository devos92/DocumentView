import React, { useEffect, useState } from 'react';
import Masonry from 'react-masonry-css';

// Constants
const CARD_WIDTH = 400; // Ideal width for each card in the masonry layout
const MIN_SCREEN_WIDTH = 640; // Minimum screen width in pixels
const MAX_SCREEN_WIDTH = 7680; // Maximum screen width in pixels
const PAGE_PADDING = 32; // 16px padding on each side

/**
 * Generates the number of columns for each breakpoint based on the screen width and card width.
 * @returns {Object} The breakpoint columns object.
 */
const generateBreakpointColumns = () => {
    let minScreenWidth = MIN_SCREEN_WIDTH;
    let maxScreenWidth = MAX_SCREEN_WIDTH;
    let actualScreenWidth = window.innerWidth - PAGE_PADDING;

    if (actualScreenWidth < minScreenWidth) {
        actualScreenWidth = minScreenWidth;
    }
    if (actualScreenWidth > maxScreenWidth) {
        actualScreenWidth = maxScreenWidth;
    }

    let cardWidth = CARD_WIDTH;
    if (actualScreenWidth < cardWidth) {
        cardWidth = actualScreenWidth;
    }

    const breakpoints = {};
    for (let width = minScreenWidth; width <= maxScreenWidth; width += cardWidth) {
        const columns = Math.floor(width / cardWidth);
        breakpoints[width] = columns;
    }
    return breakpoints;
};

/**
 * FluentLayout Component: Renders a masonry, grid, or list layout for a collection of items.
 * @param {Object} props The component props.
 * @param {string} props.layoutType The layout type to render (masonry, grid, list).
 * @param {Array} props.items The items to render in the layout.
 * @param {Function} props.renderItem The function to render each item in the layout.
 * @returns {JSX.Element} The FluentLayout component.
 */
const FluentLayout = ({ layoutType, items, renderItem }) => {
    const [breakpointColumnsObj, setBreakpointColumnsObj] = useState(() => {
        const breakpointColumnsObj = generateBreakpointColumns();
        return breakpointColumnsObj;
    });

    useEffect(() => {
        const handleResize = () => {
            const breakpointColumnsObj = generateBreakpointColumns();
            setBreakpointColumnsObj(breakpointColumnsObj);
        };

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    if (layoutType === 'masonry') {
        return (
            <Masonry
                breakpointCols={breakpointColumnsObj}
                className="masonry-grid"
                columnClassName="masonry-grid_column"
            >
                {items.map((item, index) => renderItem(item, index))}
            </Masonry>
        );
    } else if (layoutType === 'grid') {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {items.map((item, index) => renderItem(item, index))}
            </div>
        );
    } else {
        return (
            <div className="flex flex-col space-y-4 max-w-[600px] mx-auto">
                {items.map((item, index) => renderItem(item, index))}
            </div>
        );
    }
};

export default FluentLayout;