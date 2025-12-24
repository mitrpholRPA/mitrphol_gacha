import React, { useState, useEffect } from "react";
import Snowfall from "./Snowfall";
import "./ChristmasGashapon.css";
import * as XLSX from "xlsx";

export default function ChristmasGashapon() {
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [file, setFile] = useState(null);
  const [listData, setListData] = useState([]);
  const [balls, setBalls] = useState([]);
  const [initialBalls, setInitialBalls] = useState([]); // เก็บตำแหน่งเริ่มต้น
  const [winnerIndex, setWinnerIndex] = useState(null);
  const [showWinner, setShowWinner] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [snowActive, setSnowActive] = useState(true);

  const toggleSidebar = () => setIsSidebarVisible((prev) => !prev);

  const getRandomColor = () => {
    const colors = [
      "#FFD54F",
      "#FF8A65",
      "#4FC3F7",
      "#81C784",
      "#BA68C8",
      "#E57373",
      "#64B5F6",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Handle file upload
  const handleFileChange = (event) => {
    const uploadedFile = event.target.files[0];
    if (uploadedFile) setFile(uploadedFile);
  };

  const handleUpload = () => {
    if (!file) return alert("Please choose a file first");

    const reader = new FileReader();
    reader.onload = (e) => {
      const workbook = XLSX.read(e.target.result, { type: "binary" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(sheet);
      setListData(jsonData);

      const newBalls = jsonData.map((emp) => ({
        top: Math.random() * 400,
        left: Math.random() * 400,
        color: getRandomColor(),
        employee: emp,
        velocityX: 0,
        velocityY: 0,
      }));

      setBalls(newBalls);
      setInitialBalls(newBalls.map((ball) => ({ ...ball })));
    };
    reader.readAsBinaryString(file);
  };

  // Fetch employees from API
  useEffect(() => {
    const fetchEmployees = async () => {
      const api = process.env.REACT_APP_API + "/api/v1/getEmployee";
      try {
        const response = await fetch(api, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        const data = await response.json();
        const validEmployees = data.filter((e) => e.has_lucky_draw);
        setListData(validEmployees);

        const newBalls = validEmployees.map((emp) => ({
          top: Math.random() * 400,
          left: Math.random() * 400,
          color: getRandomColor(),
          employee: emp,
          velocityX: 0,
          velocityY: 0,
        }));

        setBalls(newBalls);
        setInitialBalls(newBalls.map((ball) => ({ ...ball })));
      } catch (err) {
        console.error("Error fetching employees:", err);
      }
    };
    fetchEmployees();
  }, []);

  // Physics simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setBalls((prev) =>
        prev.map((ball) => {
          let velocityY = ball.velocityY + 0.5;
          let velocityX = ball.velocityX;
          let top = ball.top + velocityY;
          let left = ball.left + velocityX;

          if (top > 440) {
            top = 440;
            velocityY *= -0.5;
          }
          if (left < 0) {
            left = 0;
            velocityX *= -1;
          }
          if (left > 440) {
            left = 440;
            velocityX *= -1;
          }

          return { ...ball, top, left, velocityY, velocityX };
        })
      );
    }, 16);

    setSnowActive(true);
    return () => clearInterval(interval);
  }, []);

  // Send winner email
  const sendWinnerEmail = async (email) => {
    const api = process.env.REACT_APP_API + "/api/v1/drawEvent";
    try {
      const response = await fetch(api, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      console.log("API Response:", data);
    } catch (err) {
      console.error("Error sending winner:", err);
    }
  };

  // Draw winner
  const drawWinner = () => {
    if (balls.length === 0 || isDrawing) return;

    setIsDrawing(true);
    setShaking(true);

    // Reset balls to initial positions
    setBalls(initialBalls.map((ball) => ({ ...ball, velocityX: 0, velocityY: 0 })));

    const index = Math.floor(Math.random() * initialBalls.length);
    const winner = initialBalls[index];

    setListData((prev) => prev.filter((_, i) => i !== index));
    setBalls((prev) => prev.filter((_, i) => i !== index));

    setTimeout(() => {
      setShaking(false);
      setWinnerIndex(index);
      setShowWinner(true);
      sendWinnerEmail(winner.employee.email);

      setTimeout(() => {
        setWinnerIndex(null);
        setShowWinner(false);
        setIsDrawing(false);
      }, 2000);
    }, 3000);
  };

  return (
    <div className="scene-wrapper">
      {/* Sidebar */}
      <div className={`sidebar ${isSidebarVisible ? "show" : "hide"}`}>
        <p>Upload Employee File</p>
        <input
          type="file"
          className="custom-file-upload"
          accept=".xlsx"
          onChange={handleFileChange}
        />
        <button className="upload-btn" onClick={handleUpload}>
          Upload
        </button>
        <h5>จำนวนพนักงาน {listData.length} คน</h5>
      </div>
      <button className="open-sidebar" onClick={toggleSidebar}>
        ☰
      </button>

      {/* Banner */}
      <div className="newyear-banner">🎉 Happy New Year 2026 🎉</div>

      <div className="gashapon-wrapper">
        {/* Decorations */}
        <div className="decoration" style={{ top: "-1%", right: "30%", fontSize: "50px" }}>🎁</div>
        <div className="decoration" style={{ top: "-1%", left: "30%", fontSize: "40px" }}>🧧</div>
        <div className="decoration" style={{ top: "5%", left: "10%", fontSize: "60px" }}>🎄</div>
        <div className="decoration" style={{ top: "5%", right: "10%", fontSize: "60px" }}>🔔</div>
        <div className="decoration" style={{ top: "30%", right: "5%", fontSize: "45px" }}>🍾</div>
        <div className="decoration" style={{ top: "30%", left: "5%", fontSize: "50px" }}>⭐</div>
        <div className="decoration" style={{ top: "50%", left: "5%", fontSize: "50px" }}>🎉</div>
        <div className="decoration" style={{ top: "50%", right: "5%", fontSize: "50px" }}>🎆</div>
        <div className="decoration" style={{ bottom: "20%", left: "10%", fontSize: "50px" }}>⭐</div>
        <div className="decoration" style={{ bottom: "20%", right: "10%", fontSize: "40px" }}>🍬</div>

        {/* Globe & Balls */}
        <div className={`globe ${shaking ? "shake" : ""}`}>
          {balls.map((ball, i) => {
            const isWinner = winnerIndex === i && showWinner;
            return (
              <div
                key={i}
                className={`ball ${isWinner ? "winner-center" : ""}`}
                style={{
                  top: isWinner ? "50%" : ball.top,
                  left: isWinner ? "50%" : ball.left,
                  backgroundColor: ball.color,
                  transform: isWinner ? "translate(-50%, -50%) scale(4)" : "translate(0,0)",
                  fontSize: isWinner ? "15px" : "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  padding: isWinner ? "20px" : "0",
                  zIndex: isWinner ? 999 : 5,
                  width: isWinner ? "200px" : "40px",
                  height: isWinner ? "200px" : "40px",
                  borderRadius: "50%",
                  overflow: "hidden",
                }}
              >
                {isWinner ? ball.employee.fullname : ball.employee.id}
              </div>
            );
          })}
        </div>

        <div className="globe-base"></div>

        {/* Draw Button */}
        <button
          className="draw-btn"
          onClick={drawWinner}
          disabled={balls.length === 0 || isDrawing}
        >
          {balls.length === 0 ? "NO BALLS LEFT" : "DRAW WINNER"}
        </button>

        {/* Winner Display */}
        {showWinner && winnerIndex !== null && (
          <p style={{ marginTop: "10px", fontWeight: "bold", fontSize: "20px" }}>
            Winner: {balls[winnerIndex].employee.fullname}
          </p>
        )}

        <Snowfall active={snowActive}></Snowfall>
      </div>
      
    </div>
  );
}
