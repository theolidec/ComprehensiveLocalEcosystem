import { mathParser } from './MathParser';

class GraphingEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.objects = [];
    this.xMin = -10;
    this.xMax = 10;
    this.yMin = -10;
    this.yMax = 10;
    this.gridSize = 1;
    this.showGrid = true;
    this.showAxes = true;
    this.zoomLevel = 1;
    this.colors = {
      grid: '#d0d0d0',
      subGrid: '#e8e8e8',
      axes: '#555555',
      text: '#666666',
      functions: ['#2563eb', '#dc2626', '#16a34a', '#9333ea', '#ea580c', '#0891b2'],
      inequalities: ['#2563eb33', '#dc262633', '#16a34a33', '#9333ea33', '#ea580c33', '#0891b233'],
    };
    this.darkModeColors = {
      grid: '#555555',
      subGrid: '#3a3a3a',
      axes: '#aaaaaa',
      text: '#cccccc',
      functions: ['#5c9aff', '#ff6b6b', '#6bcf7f', '#c084fc', '#ffb366', '#5ee7df'],
      inequalities: ['#5c9aff33', '#ff6b6b33', '#6bcf7f33', '#c084fc33', '#ffb36633', '#5ee7df33'],
    };
    this.isDarkMode = false;
    this.nextColorIndex = 0;
  }

  setDarkMode(isDark) {
    this.isDarkMode = isDark;
  }

  getColors() {
    return this.isDarkMode ? this.darkModeColors : this.colors;
  }

  setRange(xMin, xMax, yMin, yMax) {
    this.xMin = xMin;
    this.xMax = xMax;
    this.yMin = yMin;
    this.yMax = yMax;
  }

  zoom(factor, centerX = null, centerY = null) {
    const cx = centerX !== null ? centerX : (this.xMin + this.xMax) / 2;
    const cy = centerY !== null ? centerY : (this.yMin + this.yMax) / 2;
    
    const xRange = (this.xMax - this.xMin) * factor;
    const yRange = (this.yMax - this.yMin) * factor;
    
    this.xMin = cx - xRange / 2;
    this.xMax = cx + xRange / 2;
    this.yMin = cy - yRange / 2;
    this.yMax = cy + yRange / 2;
  }

  pan(dx, dy) {
    const xRange = this.xMax - this.xMin;
    const yRange = this.yMax - this.yMin;
    
    this.xMin -= dx * xRange;
    this.xMax -= dx * xRange;
    this.yMin -= dy * yRange;
    this.yMax -= dy * yRange;
  }

  zoomToFit(padding = 0.1) {
    if (this.objects.length === 0) return;
    
    let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity;
    
    for (const obj of this.objects) {
      if (obj.type === 'function') {
        for (let x = this.xMin; x <= this.xMax; x += 0.1) {
          const y = this.evaluateFunction(obj.expression, { x });
          if (isFinite(y) && Math.abs(y) < 1000) {
            xMin = Math.min(xMin, x);
            xMax = Math.max(xMax, x);
            yMin = Math.min(yMin, y);
            yMax = Math.max(yMax, y);
          }
        }
      } else if (obj.type === 'parametric') {
        for (let t = obj.tMin; t <= obj.tMax; t += 0.05) {
          const pt = this.evaluateParametric(obj, t);
          if (pt) {
            xMin = Math.min(xMin, pt.x);
            xMax = Math.max(xMax, pt.x);
            yMin = Math.min(yMin, pt.y);
            yMax = Math.max(yMax, pt.y);
          }
        }
      } else if (obj.type === 'implicit') {
        const bounds = this.getImplicitBounds(obj.expression);
        if (bounds) {
          xMin = Math.min(xMin, bounds.xMin);
          xMax = Math.max(xMax, bounds.xMax);
          yMin = Math.min(yMin, bounds.yMin);
          yMax = Math.max(yMax, bounds.yMax);
        }
      }
    }
    
    if (xMin === Infinity) return;
    
    const xRange = xMax - xMin || 1;
    const yRange = yMax - yMin || 1;
    const maxRange = Math.max(xRange, yRange);
    
    this.xMin = xMin - padding * maxRange;
    this.xMax = xMax + padding * maxRange;
    this.yMin = yMin - padding * maxRange;
    this.yMax = yMax + padding * maxRange;
  }

  getImplicitBounds(expression) {
    let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity;
    const step = 0.2;
    
    for (let x = this.xMin; x <= this.xMax; x += step) {
      for (let y = this.yMin; y <= this.yMax; y += step) {
        const val = mathParser.evaluateExpression(expression, { x, y });
        if (Math.abs(val) < 0.1) {
          xMin = Math.min(xMin, x);
          xMax = Math.max(xMax, x);
          yMin = Math.min(yMin, y);
          yMax = Math.max(yMax, y);
        }
      }
    }
    
    return xMin === Infinity ? null : { xMin, xMax, yMin, yMax };
  }

  toCanvasX(x) {
    return ((x - this.xMin) / (this.xMax - this.xMin)) * this.canvas.width;
  }

  toCanvasY(y) {
    return this.canvas.height - ((y - this.yMin) / (this.yMax - this.yMin)) * this.canvas.height;
  }

  fromCanvasX(cx) {
    return this.xMin + (cx / this.canvas.width) * (this.xMax - this.xMin);
  }

  fromCanvasY(cy) {
    return this.yMax - (cy / this.canvas.height) * (this.yMax - this.yMin);
  }

  clear() {
    this.objects = [];
    this.nextColorIndex = 0;
  }

  addObject(obj) {
    const colorList = this.isDarkMode ? this.darkModeColors.functions : this.colors.functions;
    const color = colorList[this.nextColorIndex % colorList.length];
    this.nextColorIndex++;
    
    const newObj = {
      ...obj,
      id: Date.now() + Math.random(),
      color,
      visible: true,
    };
    
    this.objects.push(newObj);
    return newObj.id;
  }

  removeObject(id) {
    this.objects = this.objects.filter(obj => obj.id !== id);
  }

  updateObject(id, updates) {
    const obj = this.objects.find(o => o.id === id);
    if (obj) {
      Object.assign(obj, updates);
    }
  }

  getObjects() {
    return this.objects;
  }

  evaluateFunction(expression, vars) {
    return mathParser.evaluateExpression(expression, vars);
  }

  evaluateParametric(obj, t) {
    const x = mathParser.evaluateExpression(obj.xExpression, { t });
    const y = mathParser.evaluateExpression(obj.yExpression, { t });
    if (isFinite(x) && isFinite(y)) {
      return { x, y };
    }
    return null;
  }

  draw() {
    const { ctx, canvas } = this;
    
    // Clear canvas (let CSS background show through)
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (this.showGrid) {
      this.drawGrid();
    }
    
    if (this.showAxes) {
      this.drawAxes();
    }
    
    for (const obj of this.objects) {
      if (!obj.visible) continue;
      
      if (obj.type === 'function' || obj.type === 'inequality') {
        this.drawFunction(obj);
      } else if (obj.type === 'parametric') {
        this.drawParametric(obj);
      } else if (obj.type === 'implicit') {
        this.drawImplicit(obj);
      } else if (obj.type === 'point') {
        this.drawPoint(obj);
      } else if (obj.type === 'line' || obj.type === 'segment') {
        this.drawLine(obj);
      } else if (obj.type === 'circle') {
        this.drawCircle(obj);
      }
    }
  }

  drawGrid() {
    const { ctx } = this;
    const colors = this.getColors();
    
    const xStep = this.calculateGridStep(this.xMax - this.xMin);
    const yStep = this.calculateGridStep(this.yMax - this.yMin);
    const subXStep = xStep / 5;
    const subYStep = yStep / 5;
    
    // Draw sub-grid (minor grid lines)
    ctx.strokeStyle = colors.subGrid;
    ctx.lineWidth = 0.5;
    
    for (let x = Math.ceil(this.xMin / subXStep) * subXStep; x <= this.xMax; x += subXStep) {
      // Skip lines that coincide with main grid
      if (Math.abs(x % xStep) < 0.0001) continue;
      ctx.beginPath();
      ctx.moveTo(this.toCanvasX(x), 0);
      ctx.lineTo(this.toCanvasX(x), this.canvas.height);
      ctx.stroke();
    }
    
    for (let y = Math.ceil(this.yMin / subYStep) * subYStep; y <= this.yMax; y += subYStep) {
      // Skip lines that coincide with main grid
      if (Math.abs(y % yStep) < 0.0001) continue;
      ctx.beginPath();
      ctx.moveTo(0, this.toCanvasY(y));
      ctx.lineTo(this.canvas.width, this.toCanvasY(y));
      ctx.stroke();
    }
    
    // Draw main grid
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 0.5;
    
    for (let x = Math.ceil(this.xMin / xStep) * xStep; x <= this.xMax; x += xStep) {
      ctx.beginPath();
      ctx.moveTo(this.toCanvasX(x), 0);
      ctx.lineTo(this.toCanvasX(x), this.canvas.height);
      ctx.stroke();
    }
    
    for (let y = Math.ceil(this.yMin / yStep) * yStep; y <= this.yMax; y += yStep) {
      ctx.beginPath();
      ctx.moveTo(0, this.toCanvasY(y));
      ctx.lineTo(this.canvas.width, this.toCanvasY(y));
      ctx.stroke();
    }
  }

  calculateGridStep(range) {
    const targetLines = 10;
    const rawStep = range / targetLines;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const normalized = rawStep / magnitude;
    
    let niceStep;
    if (normalized <= 1) niceStep = 1;
    else if (normalized <= 2) niceStep = 2;
    else if (normalized <= 5) niceStep = 5;
    else niceStep = 10;
    
    return niceStep * magnitude;
  }

  drawAxes() {
    const { ctx } = this;
    const colors = this.getColors();
    ctx.strokeStyle = colors.axes;
    ctx.lineWidth = 1.5;
    ctx.fillStyle = colors.text;
    ctx.font = '11px sans-serif';
    
    const xStep = this.calculateGridStep(this.xMax - this.xMin);
    const yStep = this.calculateGridStep(this.yMax - this.yMin);
    
    if (this.xMin <= 0 && this.xMax >= 0) {
      const x = this.toCanvasX(0);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.canvas.height);
      ctx.stroke();
    }
    
    if (this.yMin <= 0 && this.yMax >= 0) {
      const y = this.toCanvasY(0);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.canvas.width, y);
      ctx.stroke();
    }
    
    for (let x = Math.ceil(this.xMin / xStep) * xStep; x <= this.xMax; x += xStep) {
      if (Math.abs(x) < 0.0001) continue;
      const cx = this.toCanvasX(x);
      ctx.fillText(this.formatNumber(x), cx + 2, this.toCanvasY(0) + 12);
    }
    
    for (let y = Math.ceil(this.yMin / yStep) * yStep; y <= this.yMax; y += yStep) {
      if (Math.abs(y) < 0.0001) continue;
      const cy = this.toCanvasY(y);
      ctx.fillText(this.formatNumber(y), this.toCanvasX(0) + 4, cy - 2);
    }
  }

  formatNumber(n) {
    if (Math.abs(n) >= 1000 || (Math.abs(n) < 0.01 && n !== 0)) {
      return n.toExponential(1);
    }
    return Number(n.toFixed(2)).toString();
  }

  drawFunction(obj) {
    const { ctx } = this;
    const colors = this.getColors();
    
    if (obj.type === 'inequality') {
      const funcColors = this.isDarkMode ? this.darkModeColors.functions : this.colors.functions;
      const ineqColors = this.isDarkMode ? this.darkModeColors.inequalities : this.colors.inequalities;
      ctx.fillStyle = ineqColors[funcColors.indexOf(obj.color) % ineqColors.length];
      this.drawInequalityRegion(obj);
      return;
    }
    
    ctx.strokeStyle = obj.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    let started = false;
    const step = (this.xMax - this.xMin) / this.canvas.width;
    
    for (let px = 0; px <= this.canvas.width; px++) {
      const x = this.fromCanvasX(px);
      const y = this.evaluateFunction(obj.expression, { x });
      
      if (!isFinite(y) || Math.abs(y) > 1000) {
        started = false;
        continue;
      }
      
      const cy = this.toCanvasY(y);
      
      if (!started) {
        ctx.moveTo(px, cy);
        started = true;
      } else {
        ctx.lineTo(px, cy);
      }
    }
    
    ctx.stroke();
  }

  drawInequalityRegion(obj) {
    const { ctx } = this;
    const step = (this.xMax - this.xMin) / 100;
    
    for (let px = 0; px < this.canvas.width; px += 2) {
      for (let py = 0; py < this.canvas.height; py += 2) {
        const x = this.fromCanvasX(px);
        const y = this.fromCanvasY(py);
        const result = this.evaluateFunction(obj.expression, { x, y });
        
        if (result === true) {
          ctx.fillRect(px, py, 2, 2);
        }
      }
    }
  }

  drawParametric(obj) {
    const { ctx } = this;
    ctx.strokeStyle = obj.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    let started = false;
    const step = (obj.tMax - obj.tMin) / 500;
    
    for (let t = obj.tMin; t <= obj.tMax; t += step) {
      const pt = this.evaluateParametric(obj, t);
      
      if (!pt) {
        started = false;
        continue;
      }
      
      const cx = this.toCanvasX(pt.x);
      const cy = this.toCanvasY(pt.y);
      
      if (!started) {
        ctx.moveTo(cx, cy);
        started = true;
      } else {
        ctx.lineTo(cx, cy);
      }
    }
    
    ctx.stroke();
  }

  drawImplicit(obj) {
    const { ctx } = this;
    ctx.strokeStyle = obj.color;
    ctx.lineWidth = 1.5;
    
    const step = (this.xMax - this.xMin) / this.canvas.width;
    const threshold = Math.abs(step) * 0.5;
    
    for (let px = 0; px < this.canvas.width; px++) {
      for (let py = 0; py < this.canvas.height; py++) {
        const x = this.fromCanvasX(px);
        const y = this.fromCanvasY(py);
        
        const val = mathParser.evaluateExpression(obj.expression, { x, y });
        
        if (Math.abs(val) < threshold) {
          ctx.fillRect(px, py, 1, 1);
        }
      }
    }
  }

  drawPoint(obj) {
    const { ctx } = this;
    const cx = this.toCanvasX(obj.x);
    const cy = this.toCanvasY(obj.y);
    
    ctx.fillStyle = obj.color;
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(obj.label, cx, cy);
  }

  drawLine(obj) {
    const { ctx } = this;
    ctx.strokeStyle = obj.color;
    ctx.lineWidth = 2;
    
    let x1, y1, x2, y2;
    
    if (obj.through) {
      const pt1 = obj.through[0];
      const pt2 = obj.through[1];
      
      if (obj.vertical !== undefined) {
        x1 = obj.vertical;
        x2 = obj.vertical;
        y1 = this.yMin;
        y2 = this.yMax;
      } else if (obj.horizontal !== undefined) {
        x1 = this.xMin;
        x2 = this.xMax;
        y1 = obj.horizontal;
        y2 = obj.horizontal;
      } else {
        const m = (pt2.y - pt1.y) / (pt2.x - pt1.x);
        const b = pt1.y - m * pt1.x;
        
        x1 = this.xMin;
        y1 = m * x1 + b;
        x2 = this.xMax;
        y2 = m * x2 + b;
      }
    } else {
      x1 = obj.x1;
      y1 = obj.y1;
      x2 = obj.x2;
      y2 = obj.y2;
    }
    
    ctx.beginPath();
    ctx.moveTo(this.toCanvasX(x1), this.toCanvasY(y1));
    ctx.lineTo(this.toCanvasX(x2), this.toCanvasY(y2));
    ctx.stroke();
  }

  drawCircle(obj) {
    const { ctx } = this;
    ctx.strokeStyle = obj.color;
    ctx.lineWidth = 2;
    
    const cx = this.toCanvasX(obj.centerX);
    const cy = this.toCanvasY(obj.centerY);
    const r = Math.abs(this.toCanvasY(obj.centerY + obj.radius) - cy);
    
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  getState() {
    return JSON.stringify({
      objects: this.objects,
      xMin: this.xMin,
      xMax: this.xMax,
      yMin: this.yMin,
      yMax: this.yMax,
    });
  }

  setState(state) {
    const data = JSON.parse(state);
    this.objects = data.objects;
    this.xMin = data.xMin;
    this.xMax = data.xMax;
    this.yMin = data.yMin;
    this.yMax = data.yMax;
  }
}

export default GraphingEngine;
