import React from 'react';
import { motion } from 'framer-motion';

const TypingAnimation = () => {
    return (
        <div className="flex space-x-1.5 p-2 items-center">
            {[0, 1, 2].map((dot) => (
                <motion.div
                    key={dot}
                    className="w-2 h-2 bg-black rounded-full"
                    animate={{
                        y: [0, -5, 0],
                    }}
                    transition={{
                        duration: 0.6,
                        repeat: Infinity,
                        delay: dot * 0.1,
                        ease: "easeInOut",
                    }}
                />
            ))}
        </div>
    );
};

export default TypingAnimation;
