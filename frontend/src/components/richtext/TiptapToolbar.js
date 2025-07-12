import { BoldIcon, ChatBubbleBottomCenterTextIcon, EllipsisHorizontalCircleIcon, H1Icon, H2Icon, ItalicIcon, LinkIcon, ListBulletIcon, NumberedListIcon, UnderlineIcon } from '@heroicons/react/24/outline';
import React, { useEffect, useRef, useState } from 'react';
import './tiptap.css';

const TiptapToolbar = ({ editor }) => {
    const [showMenu, setShowMenu] = useState(false);
    const [isOverflow, setIsOverflow] = useState(false);
    const toolbarRef = useRef(null);
    const buttonsRef = useRef([]);
    const [totalButtonWidth, setTotalButtonWidth] = useState(0);

    // Calculate total width of all buttons
    const calculateButtonWidth = () => {
        if (toolbarRef.current) {
            const buttons = toolbarRef.current.querySelectorAll('.btn-group button');
            const totalWidth = Array.from(buttons).reduce((acc, button) => acc + button.offsetWidth, 0);
            setTotalButtonWidth(totalWidth);
        }
    };

    // Check if overflow is needed based on toolbar width
    const handleResize = () => {
        if (toolbarRef.current) {
            const availableWidth = toolbarRef.current.clientWidth;
            const overflow = totalButtonWidth > availableWidth;
            setIsOverflow(overflow);
            if (!overflow) {
                setShowMenu(false);
            }
        }
    };

    useEffect(() => {
        calculateButtonWidth();
        handleResize();

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [totalButtonWidth]);

    if (!editor) {
        return null;
    }

    const getButtonGroupClass = () => {
        return isOverflow ? 'overflow-button-group' : 'normal-button-group';
    };

    const getButtonClass = () => {
        return isOverflow ? 'overflow-button' : 'normal-button';
    };

    const buttons = (
        <>
            <div className={`btn-group ${getButtonGroupClass()}`} ref={(el) => (buttonsRef.current[0] = el)}>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={`btn btn-left ${getButtonClass()} ${editor.isActive('bold') ? 'btn-active' : ''} hover:bg-gray-200 transition duration-300`}
                    title="Bold"
                >
                    <BoldIcon className="w-6 h-6" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={`btn btn-middle ${getButtonClass()} ${editor.isActive('italic') ? 'btn-active' : ''} hover:bg-gray-200 transition duration-300`}
                    title="Italic"
                >
                    <ItalicIcon className="w-6 h-6" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    className={`btn btn-right ${getButtonClass()} ${editor.isActive('underline') ? 'btn-active' : ''} hover:bg-gray-200 transition duration-300`}
                    title="Underline"
                >
                    <UnderlineIcon className="w-6 h-6" />
                </button>
            </div>
            <div className={`btn-group ${getButtonGroupClass()}`}>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    className={`btn btn-left ${getButtonClass()} ${editor.isActive('blockquote') ? 'btn-active' : ''} hover:bg-gray-200 transition duration-300`}
                    title="Blockquote"
                >
                    <ChatBubbleBottomCenterTextIcon className="w-6 h-6" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={`btn btn-middle ${getButtonClass()} ${editor.isActive('bulletList') ? 'btn-active' : ''} hover:bg-gray-200 transition duration-300`}
                    title="Bullet List"
                >
                    <ListBulletIcon className="w-6 h-6" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={`btn btn-right ${getButtonClass()} ${editor.isActive('orderedList') ? 'btn-active' : ''} hover:bg-gray-200 transition duration-300`}
                    title="Ordered List"
                >
                    <NumberedListIcon className="w-6 h-6" />
                </button>
            </div>
            <div className={`btn-group ${getButtonGroupClass()}`}>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    className={`btn btn-left ${getButtonClass()} ${editor.isActive('heading', { level: 1 }) ? 'btn-active' : ''} hover:bg-gray-200 transition duration-300`}
                    title="Heading 1"
                >
                    <H1Icon className="w-6 h-6" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={`btn btn-right ${getButtonClass()} ${editor.isActive('heading', { level: 2 }) ? 'btn-active' : ''} hover:bg-gray-200 transition duration-300`}
                    title="Heading 2"
                >
                    <H2Icon className="w-6 h-6" />
                </button>
            </div>
            <div className={`btn-group ${getButtonGroupClass()}`}>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleLink({ href: prompt('Enter the URL') }).run()}
                    className={`btn ${getButtonClass()} ${editor.isActive('link') ? 'btn-active' : ''} hover:bg-gray-200 transition duration-300`}
                    title="Link"
                >
                    <LinkIcon className="w-6 h-6" />
                </button>
            </div>
        </>
    );

    return (
        <div className="relative">
            <div ref={toolbarRef} className="tiptap-toolbar flex space-x-2 bg-gray-100 p-2 rounded-tl rounded-tr overflow-hidden">
                {isOverflow ? (
                    <button
                        type="button"
                        onClick={() => setShowMenu(!showMenu)}
                        className="btn"
                        title="More"
                    >
                        <EllipsisHorizontalCircleIcon className="w-6 h-6" />
                    </button>
                ) : (
                    buttons
                )}
            </div>
            {showMenu && (
                <div className="absolute left-0 mt-2 w-auto bg-white border border-gray-200 rounded shadow-lg z-50 flex flex-col items-center p-2">
                    {buttons}
                </div>
            )}
        </div>
    );
};

export default TiptapToolbar;