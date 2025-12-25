import React, { useState, useEffect } from "react";
import Snowfall from "./Snowfall";
import "./ChristmasGashapon.css";
import * as XLSX from "xlsx";

export default function ChristmasGashapon() {
  const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
  const MAX_BALLS = isMobile ? 120 : 300;
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [file, setFile] = useState(null);
  const [listData, setListData] = useState([]);
  const [balls, setBalls] = useState([]);
  const [initialBalls, setInitialBalls] = useState([]); // เก็บตำแหน่งเริ่มต้น
  const [showWinner, setShowWinner] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [snowActive, setSnowActive] = useState(true);
  const [winnerList, setWinnerHistory] = useState([]);
  const [indexWinner , setIndexWinner] = useState(1)
  const [currentWinner, setCurrentWinner] = useState(null);

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
        
        // ✅ FIX: แยกคนที่เคยได้รางวัล sort
        const winners = data.filter(e => e.has_lucky_draw && e.isreceive);
        setWinnerHistory(
          winners
            .sort((a, b) => new Date(b.receive_time) - new Date(a.receive_time)) // ใหม่ → เก่า
            .map(w => ({
              fullname: w.fullname,
              employee_id: w.employee_id,
              gift_id: w.gift_id,
              receive_time: w.receive_time,
            }))
        );

        // console.log(winners)
        // ✅ FIX: set valid employee
        const validEmployees = data.filter((e) => e.has_lucky_draw && e.isreceive === false && e.isluckydraw === false);
        setListData(validEmployees);
        // console.log(validEmployees)
        const newBalls = validEmployees
          .slice(0, MAX_BALLS) // 👈 ADD
          .map((emp) => ({
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
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     setBalls((prev) =>
  //       prev.map((ball) => {
  //         let velocityY = ball.velocityY + 0.5;
  //         let velocityX = ball.velocityX;
  //         let top = ball.top + velocityY;
  //         let left = ball.left + velocityX;

  //         if (top > 440) {
  //           top = 440;
  //           velocityY *= -0.5;
  //         }
  //         if (left < 0) {
  //           left = 0;
  //           velocityX *= -1;
  //         }
  //         if (left > 440) {
  //           left = 440;
  //           velocityX *= -1;
  //         }

  //         return { ...ball, top, left, velocityY, velocityX };
  //       })
  //     );
  //   }, 16);
  //   setSnowActive(true);
  //   return () => clearInterval(interval);
  // }, []);

// ===== ADD: impulse shake (ไม่ reset position) =====
const impulseShake = () => {
  setBalls(prev =>
    prev.map(ball => ({
      ...ball,
      velocityX: (Math.random() - 0.5) * 12,
      velocityY: -Math.random() * 14,
    }))
  );
};
// Physics simulation (OPTIMIZED)
useEffect(() => {
  const fps = isMobile ? 32 : 16;

  const interval = setInterval(() => {
    if (isDrawing) return;

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
  }, fps);

  setSnowActive(true);
  return () => clearInterval(interval);
}, [isDrawing]);

  // Send winner email
  const sendWinnerEmail = async (email) => {
    const api = process.env.REACT_APP_API + "/api/v1/drawEvent";
    try {
      const response = await fetch(api, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({email , indexWinner}),

      });
      // console.log({email , indexWinner} )
      const data = await response.json();
      // console.log("API Response:", data);
    } catch (err) {
      console.error("Error sending winner:", err);
    }
  };

  // Draw winner
  // const drawWinner = () => {
  //   if (balls.length === 0 || isDrawing) return;
  //   // Reset balls to initial positions
  //   setBalls(initialBalls.map((ball) => ({ ...ball, velocityX: 0, velocityY: 0 })));
  //   const index = Math.floor(Math.random() * balls.length);
  //   const winner = balls[index];

  //   // Hold Show
  //   setShowWinner(false);
  //   setCurrentWinner(winner)

  //   // Animation
  //   setIsDrawing(true);
  //   setShaking(true);

  //   // Remove Data
  //   setBalls((prev) => prev.filter((_, i) => i !== index));
  //   setListData((prev) => prev.filter((_, i) => i !== index));
  //   setInitialBalls((prev) => prev.filter((_, i) => i !== index));
    
  //   setIndexWinner(prev => prev + 1);
  //   // Update Data to Database
  //   sendWinnerEmail(winner.employee.email);
    
  //   setTimeout(() => {
  //     setShaking(false);
  //     setShowWinner(true);
  //     setTimeout(() => {
  //       setWinnerHistory(prev => [
  //         { fullname: winner.employee.fullname },
  //         ...prev,
  //       ]);
        
  //       setIsDrawing(false);
  //     }, 1500);
  //   }, 3000);
  // };

  const drawWinner = () => {
  if (balls.length === 0 || isDrawing) return;

  // ❌ OLD: reset กลับจุดเริ่ม
  /*
  setBalls(
    initialBalls.map((ball) => ({
      ...ball,
      velocityX: 0,
      velocityY: 0,
    }))
  );
  */

  // ✅ NEW: เขย่าแบบเด้งจากตำแหน่งปัจจุบัน
  impulseShake();

  const index = Math.floor(Math.random() * balls.length);
  const winner = balls[index];

  setShowWinner(false);
  setCurrentWinner(winner);

  setIsDrawing(true);
  setShaking(true);

  // Remove Data
  setBalls((prev) => prev.filter((_, i) => i !== index));
  setListData((prev) => prev.filter((_, i) => i !== index));
  setInitialBalls((prev) => prev.filter((_, i) => i !== index));

  setIndexWinner((prev) => prev + 1);
  sendWinnerEmail(winner.employee.email);

  setTimeout(() => {
    setShaking(false);
    setShowWinner(true);

    setTimeout(() => {
      setWinnerHistory((prev) => [
        { fullname: winner.employee.fullname },
        ...prev,
      ]);
      setIsDrawing(false);
    }, 1500);
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
      {/* ===== MAIN STAGE LAYOUT ===== */}
      <div className="stage-layout">
        {/* spacer ซ้าย (ทำให้ตู้กลางจริง) */}
        <div className="left-spacer" />

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
          {/* <div className="decoration" style={{ bottom: "5%", left: "25%", fontSize: "45px" }}>🔔</div>
          <div className="decoration" style={{ bottom: "5%", right: "25%", fontSize: "50px" }}>🎁</div> */}

          {/* Globe & Balls */}
          <div className={`globe ${shaking ? "shake" : ""}`}>
            {balls.map((ball, i) => (
              <div
                key={i}
                className="ball"
                style={{
                  top: ball.top,
                  left: ball.left,
                  backgroundColor: ball.color,
                }}
              >
                {ball.employee.id}
              </div>
            ))}

            {/* ลูกบอลผู้ชนะ (แยกออกมาเลย) */}
            {showWinner && currentWinner && (
              <div
                className="ball winner-center mega-winner"
                style={{
                  top: "50%" ,
                  left: "50%" ,
                  backgroundColor:currentWinner.color ,
                  transform: "translate(-50%, -50%) scale(4)" ,
                  fontSize: "12px" ,
                  fontWeight: "100",
                  textShadow: isMobile
                        ? "0 0 8px #ffe600"
                        : `
                          0 0 5px #fff,
                          0 0 10px #fffa,
                          0 0 15px #ffea00,
                          0 0 20px #ffe600,
                          0 0 30px #ffdd00
                        `,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  padding:  "2px",
                  zIndex:  999,
                  width:  "200px" ,
                  height:  "200px",
                  borderRadius: "50%",
                  overflow: "hidden",
                }}
              >
                {currentWinner.employee.fullname}
              </div>
            )}
          </div>

          {/* วงพลัง */}
          <div className="energy-ring"></div>

          {/* Draw Button */}
          <button
            className={`draw-btn ${isDrawing ? "disabled" : ""}`}
            onClick={drawWinner}
            disabled={balls.length === 0 || isDrawing}
          >
            {balls.length === 0
              ? "NO BALLS LEFT"
              : isDrawing
              ? "DRAWING..."
              : "DRAW WINNER"}
          </button>

          {/* Winner Display */}
          {showWinner && currentWinner && (
            <p style={{ marginTop: "10px", fontWeight: "bold", fontSize: "20px" }}>
              Winner: {currentWinner.employee.fullname} <br />
              {currentWinner.employee.department}
            </p>
          )}

          {/* ===== OPTIMIZE: ปิด Snowfall ตอนกำลัง draw ===== */}
        {!isMobile && !isDrawing && <Snowfall active={snowActive} />} 
        </div>
      
        {/* ===== WINNER LIST (ขวา) ===== */}
        <div className="winner-sidebar">
          <h4>🏆 Winner List</h4>
          {winnerList.length === 0 && <p>ยังไม่มีผู้โชคดี</p>}
          {winnerList.map((w, i) => (
            <div className="winner-item" key={i}>
              {winnerList.length - i}. {w.fullname}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
