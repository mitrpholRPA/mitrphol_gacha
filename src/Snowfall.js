import React, { useEffect, useState } from "react";
import "./Snowfall.css";

export default function Snowfall({ active ,count = 20}) {
  const [snowflakes, setSnowflakes] = useState([]);
    const [listData, setListData] = useState([]);
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

  useEffect(() => {
    // Fetch employee list from API
    const fetchEmployees = async () => {
      console.log('Initialization Apps');
      try {
        const api = process.env.REACT_APP_API+'/api/v1/getEmployee'
        const response = await fetch(api,{
          method : 'POST',
          headers: {'Content-Type': 'application/json' }
        });
        
        if (response.ok){
          const data = await response.json();
          console.log(data)
          setListData(data)
        }else{
          const data = await response.json();
          console.log(data)
        }
        // setListEmployee(names);
      } catch (error) { 
        console.error("Error fetching employee list:", error);
      }
    };
    fetchEmployees();
  }, []);

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
