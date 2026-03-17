import { useEffect, useRef } from 'react';
import { calculateCompoundGrowth } from '../../utils/math';

export const MiniCompoundChart = ({ monthly, years, color }) => {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear
    ctx.clearRect(0, 0, width, height);
    
    const data = calculateCompoundGrowth(monthly, years);
    const max = data[data.length - 1]?.amount || 1;
    
    ctx.beginPath();
    ctx.moveTo(0, height);
    
    data.forEach((p, i) => {
      const x = (i / (years - 1)) * width;
      const y = height - ((p.amount / max) * height);
      ctx.lineTo(x, y);
    });
    
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Glow
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.stroke();
    
    // Highlight end node
    ctx.beginPath();
    const lastY = height - ((data[data.length - 1].amount / max) * height);
    ctx.arc(width - 4, lastY, 4, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
    
  }, [monthly, years, color]);
  
  return (
    <div style={{ height: 60, width: "100%", position: "relative" }}>
      <canvas ref={canvasRef} width={300} height={60} style={{ width: "100%", height: "100%" }} />
    </div>
  );
};
