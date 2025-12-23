import React, { useEffect, useState } from "react";
import "./Snowfall.css";

export default function Snowfall({ active ,count = 20}) {
  const [snowflakes, setSnowflakes] = useState([]);
  useEffect(() => {
    if (!active) {
      setSnowflakes([]);
      return;
    }
    const flakes = Array.from({ length: count }).map(() => ({
      id: Math.random(),
      left: Math.random() * window.innerWidth,
      size: Math.random() * 24 + 12,
      duration: Math.random() * 5 + 5,
    }));

    setSnowflakes(flakes);
  }, [active, count]);


  return (
    <div className="snow-container">
      {snowflakes.map((flake) => (
        <div
          key={flake.id}
          className="snowflake"
          style={{
            left: flake.left,
            fontSize: flake.size,
            animationDuration: `${flake.duration}s`,
          }}
        >
          ❄️
        </div>
      ))}
    </div>
  );
}
