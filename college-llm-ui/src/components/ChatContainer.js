import React, { useEffect, useRef } from 'react';

const ChatContainer = ({ children }) => {
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [children]);

    return (
        <div className="flex flex-col min-h-screen bg-gray-100 pt-20 pb-48 md:pb-56 px-4 md:px-0">
            <div className="w-full max-w-[868px] mx-auto h-full flex flex-col">
                {children}
                <div ref={bottomRef} className="h-4" />
            </div>
        </div>
    );
};

export default ChatContainer;
