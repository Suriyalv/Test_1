import React, { useEffect, useRef } from 'react';

const ChatContainer = ({ children }) => {
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [children]);

    return (
        <div className="flex flex-col w-full">
            <div className="w-full h-full flex flex-col">
                {children}
                <div ref={bottomRef} className="h-6" />
            </div>
        </div>
    );
};

export default ChatContainer;

