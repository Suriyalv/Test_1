import { useEffect, useState } from "react";

function TypewriterText({ text, speed = 25 }) {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    let index = 0;
    setDisplayedText("");

    if (!text) return; // Safeguard

    const words = String(text).split(" ");
    const interval = setInterval(() => {
      if (index < words.length) {
        setDisplayedText((prev) => prev + (words[index] || "") + " ");
        index++;
      } else {
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return <>{displayedText}</>;
}

export default TypewriterText;
