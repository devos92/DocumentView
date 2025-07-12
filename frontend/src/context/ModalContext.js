import { XMarkIcon } from '@heroicons/react/24/outline';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

const ModalContext = createContext();

export const ModalProvider = ({ children }) => {
    const location = useLocation();

    const [modals, setModals] = useState([]);
    const modalRef = useRef(null);
    const buttonRef = useRef(null);
    const [closeButtonStyle, setCloseButtonStyle] = useState({});
    const [mouseDownTarget, setMouseDownTarget] = useState(null);

    const openModal = (content, showCloseButton = true, closeOnNavigate = true) => {
        if (content) {
            setModals((prevModals) => [...prevModals, { content, showCloseButton, closeOnNavigate }]);
        } else {
            // Legacy dredge: If you call openModal(null), it previously closed the last modal. This adds support for that.
            closeModal();
            // Also add an obsolete warning with the caller stack trace.
            console.warn('openModal(null) is obsolete and will be removed in the future.', new Error().stack);
        }
    };

    const closeModal = async (force = true) => { // When called in code, we always want to close the modal; but when called by user interaction, we want to check if the modal can be closed
        if (modals.length > 0) {
            const currentModal = modals[modals.length - 1];
            const modalContent = currentModal.content;

            // Check if content has an onUserCloseRequest method and if it returns true
            if (!force && modalContent && modalContent.ref?.current?.onUserCloseRequest) {
                const canClose = await modalContent.ref.current.onUserCloseRequest();
                if (!canClose) return;
            }

            setModals((prevModals) => prevModals.slice(0, -1)); // Close modal if onUserCloseRequest is not present or returns true
        }
        else {
            console.warn('closeModal() called when no modals are open.');
        }
    };

    const handleMouseDown = (e) => {
        setMouseDownTarget(e.target);
    };

    const handleBackgroundClick = (e, index) => {
        if (mouseDownTarget === e.currentTarget && e.target === e.currentTarget && index === modals.length - 1) {
            closeModal(false);
        }
    };

    // Position the close button in the top-right corner of the modal
    const updateCloseButtonPosition = () => {
        if (modalRef.current && buttonRef.current) {
            const modalRect = modalRef.current.getBoundingClientRect();
            const buttonRect = buttonRef.current.getBoundingClientRect();
            const padding = 10;

            setCloseButtonStyle({
                top: `${padding}px`,
                left: `${modalRect.width - buttonRect.width - padding}px`,
            });
        }
    };

    useEffect(() => {
        updateCloseButtonPosition();
    }, [modals]);

    useEffect(() => {
        const resizeObserver = new ResizeObserver(() => {
            updateCloseButtonPosition();
        });

        if (modalRef.current) {
            resizeObserver.observe(modalRef.current);
        }

        return () => {
            if (modalRef.current) {
                resizeObserver.unobserve(modalRef.current);
            }
        };
    }, [modals]);

    // Close all modals that should close on navigation
    useEffect(() => {
        setModals(modals.filter(modal => !modal.closeOnNavigate));
    }, [location]);

    return (
        <ModalContext.Provider value={{ openModal, closeModal }}>
            <div className="relative max-w-full max-h-full">
                {children}
            </div>
            {modals.map((modal, index) => (
                modal.content && (
                    <div
                        key={index}
                        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
                        onMouseDown={handleMouseDown}
                        onMouseUp={(e) => handleBackgroundClick(e, index)}
                    >
                        <div ref={modalRef} className="relative max-w-3xl w-full max-h-full">
                            {modal.content}
                            {modal.showCloseButton && (
                                <button
                                    ref={buttonRef}
                                    onClick={() => closeModal(false)}
                                    style={closeButtonStyle}
                                    className="absolute text-white bg-black bg-opacity-50 rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-75 focus:outline-none"
                                >
                                    <XMarkIcon className="w-6 h-6" />
                                </button>
                            )}
                        </div>
                    </div>
                )
            ))}
        </ModalContext.Provider>
    );
};

export const useModal = () => useContext(ModalContext);