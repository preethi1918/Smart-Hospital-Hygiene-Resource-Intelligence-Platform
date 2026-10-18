// Real-Time Canvas-Based Analytics & Correlation Visualizer
// Smart Hospital Hygiene & Resource Intelligence Platform

class HospitalAnalyticsCharts {
  constructor() {
    this.historyData = this.generateSampleHistory();
    this.initResizeListener();
  }

  generateSampleHistory() {
    const hours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];
    return {
      labels: hours,
      otCompliance: [98, 97, 99, 98, 96, 97, 99, 98, 98, 97, 98, 99],
      icuCompliance: [92, 94, 91, 89, 93, 90, 88, 92, 94, 93, 91, 93],
      erCompliance: [88, 86, 84, 80, 82, 85, 87, 83, 81, 85, 84, 84],
      bioWasteKg: [12, 18, 26, 38, 49, 62, 75, 88, 98, 110, 122, 134]
    };
  }

  initResizeListener() {
    window.addEventListener('resize', () => {
      this.renderAll();
    });
  }

  renderAll() {
    this.drawComplianceChart('compliance-trend-canvas');
    this.drawCorrelationChart('hai-risk-canvas');
    this.drawWasteAccumulationChart('waste-accum-canvas');
  }

  drawComplianceChart(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.parentElement.clientWidth;
    const height = 260;
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    ctx.clearRect(0, 0, width, height);

    // Padding
    const padL = 45;
    const padR = 25;
    const padT = 25;
    const padB = 40;
    const chartW = width - padL - padR;
    const chartH = height - padT - padB;

    // Draw Grid Lines (Y-axis: 70% to 100%)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#64748b';
    ctx.font = '10px JetBrains Mono, monospace';

    const yMin = 70;
    const yMax = 100;
    const steps = 4;
    for (let i = 0; i <= steps; i++) {
      const val = Math.round(yMin + (i * (yMax - yMin) / steps));
      const y = padT + chartH - (i * chartH / steps);

      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(width - padR, y);
      ctx.stroke();

      ctx.fillText(`${val}%`, 10, y + 3);
    }

    // X-axis labels
    const pointsCount = this.historyData.labels.length;
    const xStep = chartW / (pointsCount - 1);
    this.historyData.labels.forEach((label, i) => {
      const x = padL + (i * xStep);
      ctx.fillText(label, x - 14, height - 12);
    });

    // Helper to draw series line
    const drawSeries = (data, color, glowColor) => {
      ctx.beginPath();
      data.forEach((val, i) => {
        const x = padL + (i * xStep);
        const y = padT + chartH - (((val - yMin) / (yMax - yMin)) * chartH);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw point markers
      data.forEach((val, i) => {
        const x = padL + (i * xStep);
        const y = padT + chartH - (((val - yMin) / (yMax - yMin)) * chartH);
        ctx.beginPath();
        ctx.arc(x, y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#080d1a';
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();
      });
    };

    // Draw OT (Cyan), ICU (Emerald), ER (Amber)
    drawSeries(this.historyData.otCompliance, '#00f2fe', 'rgba(0, 242, 254, 0.5)');
    drawSeries(this.historyData.icuCompliance, '#10b981', 'rgba(16, 185, 129, 0.5)');
    drawSeries(this.historyData.erCompliance, '#f59e0b', 'rgba(245, 158, 11, 0.5)');

    // Baseline target line (95%)
    const targetY = padT + chartH - (((95 - yMin) / (yMax - yMin)) * chartH);
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
    ctx.beginPath();
    ctx.moveTo(padL, targetY);
    ctx.lineTo(width - padR, targetY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(239, 68, 68, 0.8)';
    ctx.fillText('Target 95%', width - padR - 65, targetY - 6);
  }

  drawCorrelationChart(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.parentElement.clientWidth;
    const height = 260;
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    ctx.clearRect(0, 0, width, height);

    // Padding
    const padL = 45;
    const padR = 25;
    const padT = 25;
    const padB = 40;
    const chartW = width - padL - padR;
    const chartH = height - padT - padB;

    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#64748b';
    ctx.font = '10px JetBrains Mono, monospace';

    for (let i = 0; i <= 4; i++) {
      const y = padT + (i * chartH / 4);
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(width - padR, y);
      ctx.stroke();
    }

    // Correlation points (Hygiene score vs HAI Infection Probability)
    const correlationPairs = [
      { hygiene: 99, risk: 2, label: 'OT-1' },
      { hygiene: 97, risk: 4, label: 'NICU' },
      { hygiene: 95, risk: 6, label: 'Lab' },
      { hygiene: 92, risk: 12, label: 'ICU-A' },
      { hygiene: 88, risk: 18, label: 'Ward 3A' },
      { hygiene: 84, risk: 28, label: 'ER Trauma' },
      { hygiene: 72, risk: 52, label: 'Breach Simulation' }
    ];

    // X-axis: 70% to 100%
    // Y-axis: 0% to 60%
    correlationPairs.forEach(pt => {
      const x = padL + (((pt.hygiene - 70) / 30) * chartW);
      const y = padT + chartH - ((pt.risk / 60) * chartH);

      // Gradient circle glow
      const grad = ctx.createRadialGradient(x, y, 2, x, y, 12);
      grad.addColorStop(0, pt.risk > 30 ? 'rgba(239, 68, 68, 0.8)' : 'rgba(0, 242, 254, 0.8)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, 12, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = pt.risk > 30 ? '#ef4444' : '#00f2fe';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '9px Plus Jakarta Sans';
      ctx.fillText(pt.label, x + 8, y + 3);
    });

    // Trend line
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
    ctx.beginPath();
    ctx.moveTo(padL + chartW * 0.95, padT + chartH * 0.95);
    ctx.lineTo(padL + chartW * 0.1, padT + chartH * 0.15);
    ctx.stroke();
    ctx.setLineDash([]);

    // Axes captions
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px Plus Jakarta Sans';
    ctx.fillText('← Lower Hygiene Score', padL, height - 12);
    ctx.fillText('Higher Hygiene Score →', width - padR - 110, height - 12);
  }

  drawWasteAccumulationChart(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.parentElement.clientWidth;
    const height = 260;
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    ctx.clearRect(0, 0, width, height);

    const padL = 45;
    const padR = 25;
    const padT = 25;
    const padB = 40;
    const chartW = width - padL - padR;
    const chartH = height - padT - padB;

    const data = this.historyData.bioWasteKg;
    const maxVal = 160;

    // Draw bars
    const barW = (chartW / data.length) * 0.65;
    const gap = (chartW / data.length);

    data.forEach((val, i) => {
      const x = padL + (i * gap) + (gap - barW) / 2;
      const bHeight = (val / maxVal) * chartH;
      const y = padT + chartH - bHeight;

      const grad = ctx.createLinearGradient(0, y, 0, y + bHeight);
      grad.addColorStop(0, '#facc15');
      grad.addColorStop(1, 'rgba(234, 179, 8, 0.2)');

      ctx.fillStyle = grad;
      ctx.fillRect(x, y, barW, bHeight);

      // Top edge highlight
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(x, y, barW, 2);

      // Labels
      ctx.fillStyle = '#64748b';
      ctx.font = '9px JetBrains Mono';
      ctx.fillText(this.historyData.labels[i], x - 2, height - 12);
    });
  }
}

window.HospitalAnalyticsCharts = HospitalAnalyticsCharts;
