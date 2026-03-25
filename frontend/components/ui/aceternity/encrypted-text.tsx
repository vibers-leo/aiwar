"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const ENCRYPTION_CHARS = "!@#$%^&*()_+-=[]{}|;:,.<>?/~`";

export const EncryptedText = ({
    text,
    className,
    duration = 2000,
    onComplete,
}: {
    text: string;
    className?: string;
    duration?: number;
    onComplete?: () => void;
}) => {
    const [displayText, setDisplayText] = useState(text);
    const [isDecrypting, setIsDecrypting] = useState(true);

    useEffect(() => {
        setIsDecrypting(true);
        let frame = 0;
        const totalFrames = Math.floor(duration / 50); // 50ms per frame

        const interval = setInterval(() => {
            if (frame >= totalFrames) {
                setDisplayText(text);
                setIsDecrypting(false);
                clearInterval(interval);
                onComplete?.();
                return;
            }

            const progress = frame / totalFrames;
            const newText = text
                .split("")
                .map((char, index) => {
                    // Calculate if this character should be decrypted yet
                    const charProgress = index / text.length;

                    if (char === " ") return " ";

                    if (progress > charProgress) {
                        // This character is decrypted
                        return char;
                    } else {
                        // Still encrypted - show random character
                        return ENCRYPTION_CHARS[
                            Math.floor(Math.random() * ENCRYPTION_CHARS.length)
                        ];
                    }
                })
                .join("");

            setDisplayText(newText);
            frame++;
        }, 50);

        return () => clearInterval(interval);
    }, [text, duration]);

    return (
        <motion.div
            className={cn("font-mono", className)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <div className="text-red-400 text-xl leading-relaxed tracking-wide">
                {displayText}
                {isDecrypting && (
                    <motion.span
                        animate={{ opacity: [1, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                        className="inline-block ml-1"
                    >
                        ▋
                    </motion.span>
                )}
            </div>
        </motion.div>
    );
};
