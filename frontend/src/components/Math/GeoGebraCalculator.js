import React, { useEffect, useRef, useState, useCallback } from 'react';
import GraphingEngine from '../../utils/GraphingEngine';
import { Calculator, Trash2, ZoomIn, Grid3X3, Save, Plus, X, Edit2, Eye, EyeOff, MousePointer, ZoomOut, RotateCcw, Moon, Sun } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import './GeoGebraCalculator.css';

const GeoGebraCalculator = () => {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const { settings } = useSettings();
  const [objects, setObjects] = useState([]);
  const [editingObject, setEditingObject] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState(null);
  const [showGrid, setShowGrid] = useState(true);
  const [showAxes, setShowAxes] = useState(true);
  const [savedStates, setSavedStates] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [panMode, setPanMode] = useState(true);
  const [isDarkTheme, setIsDarkTheme] = useState(() => {
    // Load initial theme from cookie if available
    const match = document.cookie.match(/geogebraTheme=([^;]+)/);
    return match ? match[1] === 'dark' : false;
  });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const nextLabelRef = useRef(65);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      if (engineRef.current) {
        engineRef.current.draw();
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    engineRef.current = new GraphingEngine(canvas);
    engineRef.current.setDarkMode(isDarkTheme);
    engineRef.current.draw();

    const handleWheel = (e) => {
      if (!engineRef.current) return;
      e.preventDefault();
      const factor = e.deltaY > 0 ? 1.1 : 0.9;
      engineRef.current.zoom(factor);
      engineRef.current.draw();
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });

    const handleMouseDown = (e) => {
      if (!panMode) return;
      e.preventDefault();
      isDraggingRef.current = true;
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseMove = (e) => {
      if (!isDraggingRef.current || !engineRef.current) return;
      e.preventDefault();
      const dx = (e.clientX - dragStartRef.current.x) / canvas.width;
      const dy = (e.clientY - dragStartRef.current.y) / canvas.height;
      engineRef.current.pan(-dx, -dy);
      engineRef.current.draw();
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      setIsDragging(false);
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const updateObjectsList = useCallback(() => {
    if (engineRef.current) {
      setObjects([...engineRef.current.getObjects()]);
    }
  }, []);

  const handleCommand = (e) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      try {
        setError(null);
        addObject(inputValue.trim());
        setInputValue('');
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const normalizeInput = (str) => {
    const superscriptMap = {
      '²': '^2', '³': '^3', '¹': '^1', '°': '^0',
      '²': '^2', '³': '^3', '¹': '^1', '°': '^0',
      '\u2074': '^4', '\u2075': '^5', '\u2076': '^6', '\u2077': '^7', '\u2078': '^8', '\u2079': '^9',
    };
    let result = str;
    for (const [sup, reg] of Object.entries(superscriptMap)) {
      result = result.replace(new RegExp(sup, 'g'), reg);
    }
    return result;
  };

  const addObject = (input) => {
    const engine = engineRef.current;
    if (!engine) return;

    input = normalizeInput(input);
    const lowerInput = input.toLowerCase();

    const funcMatch = input.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*\(\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\)\s*=\s*(.+)$/);
    if (funcMatch) {
      const id = engine.addObject({
        type: 'function',
        name: funcMatch[1],
        variable: funcMatch[2],
        expression: funcMatch[3]
      });
      engine.draw();
      updateObjectsList();
      return;
    }

    if (lowerInput.includes('=') && !lowerInput.includes('curve(')) {
      const isInequality = /[<>]=?/.test(input);
      if (isInequality) {
        const id = engine.addObject({ type: 'inequality', expression: input });
        engine.draw();
        updateObjectsList();
        return;
      }
    }

    if (lowerInput.includes('curve(')) {
      const match = input.match(/curve\s*\(\s*([^,]+)\s*,\s*([^,]+)\s*,\s*(\w+)\s*,\s*([^,]+)\s*,\s*([^)]+)\s*\)/i);
      if (match) {
        const id = engine.addObject({
          type: 'parametric',
          xExpression: match[1].trim(),
          yExpression: match[2].trim(),
          param: match[3].trim(),
          tMin: parseFloat(match[4]),
          tMax: parseFloat(match[5])
        });
        engine.draw();
        updateObjectsList();
        return;
      }
    }

    const yFuncMatch = input.match(/^y\s*=\s*(.+)$/i);
    if (yFuncMatch) {
      const id = engine.addObject({
        type: 'function',
        name: 'y',
        variable: 'x',
        expression: yFuncMatch[1]
      });
      engine.draw();
      updateObjectsList();
      return;
    }

    const implicitMatch = input.match(/^(.+)\s*=\s*(.+)$/);
    if (implicitMatch && implicitMatch[1].includes('x') && implicitMatch[1].includes('y')) {
      const id = engine.addObject({
        type: 'implicit',
        expression: `(${implicitMatch[1]}) - (${implicitMatch[2]})`
      });
      engine.draw();
      updateObjectsList();
      return;
    }

    const pointMatch = input.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*\(\s*([^,]+)\s*,\s*([^)]+)\s*\)$/);
    if (pointMatch) {
      const id = engine.addObject({
        type: 'point',
        label: pointMatch[1],
        x: parseFloat(pointMatch[2]),
        y: parseFloat(pointMatch[3])
      });
      engine.draw();
      updateObjectsList();
      return;
    }

    const circleMatch = input.match(/^circle\s*\(\s*\(\s*([^,]+)\s*,\s*([^)]+)\s*\)\s*,\s*([^)]+)\s*\)$/i);
    if (circleMatch) {
      const id = engine.addObject({
        type: 'circle',
        centerX: parseFloat(circleMatch[1]),
        centerY: parseFloat(circleMatch[2]),
        radius: parseFloat(circleMatch[3])
      });
      engine.draw();
      updateObjectsList();
      return;
    }

    const lineThroughMatch = input.match(/^line\s+through\s+\(\s*([^,]+)\s*,\s*([^)]+)\s*\)\s+and\s+\(\s*([^,]+)\s*,\s*([^)]+)\s*\)$/i);
    if (lineThroughMatch) {
      const id = engine.addObject({
        type: 'line',
        through: [
          { x: parseFloat(lineThroughMatch[1]), y: parseFloat(lineThroughMatch[2]) },
          { x: parseFloat(lineThroughMatch[3]), y: parseFloat(lineThroughMatch[4]) }
        ]
      });
      engine.draw();
      updateObjectsList();
      return;
    }

    const segmentMatch = input.match(/^segment\s*\(\s*\(\s*([^,]+)\s*,\s*([^)]+)\s*\)\s*,\s*\(\s*([^,]+)\s*,\s*([^)]+)\s*\)\s*\)$/i);
    if (segmentMatch) {
      const id = engine.addObject({
        type: 'segment',
        x1: parseFloat(segmentMatch[1]),
        y1: parseFloat(segmentMatch[2]),
        x2: parseFloat(segmentMatch[3]),
        y2: parseFloat(segmentMatch[4])
      });
      engine.draw();
      updateObjectsList();
      return;
    }

    const polygonMatch = input.match(/^polygon\s*\(\s*\(([^)]+)\)\s*,\s*\(([^)]+)\)\s*,\s*\(([^)]+)\)\s*(,\s*\(([^)]+)\)\s*)?\)$/i);
    if (polygonMatch) {
      const points = [polygonMatch[1], polygonMatch[2], polygonMatch[3]];
      if (polygonMatch[5]) points.push(polygonMatch[5]);
      const parsedPoints = points.map(p => {
        const [x, y] = p.split(',').map(s => parseFloat(s.trim()));
        return { x, y };
      });
      parsedPoints.forEach((pt, i) => {
        const label = String.fromCharCode(65 + i);
        engine.addObject({ type: 'point', label, x: pt.x, y: pt.y });
      });
      engine.draw();
      updateObjectsList();
      return;
    }

    throw new Error('Unrecognized format. Try: f(x)=x^2, y>x+1, Circle((0,0),1), Point=(1,2)');
  };

  const handleDelete = (id) => {
    if (engineRef.current) {
      engineRef.current.removeObject(id);
      engineRef.current.draw();
      updateObjectsList();
    }
  };

  const handleClear = () => {
    if (engineRef.current) {
      engineRef.current.clear();
      engineRef.current.draw();
      setObjects([]);
    }
  };

  const startEditing = (obj) => {
    setEditingObject(obj.id);
    let value = '';
    if (obj.type === 'function') {
      value = `${obj.name}(${obj.variable})=${obj.expression}`;
    } else if (obj.type === 'inequality') {
      value = obj.expression;
    } else if (obj.type === 'implicit') {
      value = obj.expression.replace(' - ', ' = ').replace(/ - /g, ' - ');
    } else if (obj.type === 'point') {
      value = `${obj.label}=(${obj.x},${obj.y})`;
    } else if (obj.type === 'circle') {
      value = `Circle((${obj.centerX},${obj.centerY}),${obj.radius})`;
    } else if (obj.type === 'parametric') {
      value = `Curve(${obj.xExpression},${obj.yExpression},${obj.param},${obj.tMin},${obj.tMax})`;
    }
    setEditValue(value);
  };

  const saveEdit = () => {
    if (!editingObject || !engineRef.current) return;
    engineRef.current.removeObject(editingObject);
    try {
      addObject(editValue);
      setEditingObject(null);
      setEditValue('');
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleVisibility = (id) => {
    const engine = engineRef.current;
    const obj = objects.find(o => o.id === id);
    if (obj && engine) {
      engine.updateObject(id, { visible: !obj.visible });
      engine.draw();
      updateObjectsList();
    }
  };

  const handleZoomIn = () => {
    if (engineRef.current) {
      engineRef.current.zoom(0.8);
      engineRef.current.draw();
    }
  };

  const handleZoomOut = () => {
    if (engineRef.current) {
      engineRef.current.zoom(1.25);
      engineRef.current.draw();
    }
  };

  const handleZoomFit = () => {
    if (engineRef.current) {
      engineRef.current.zoomToFit();
      engineRef.current.draw();
    }
  };

  const handleGridToggle = () => {
    if (engineRef.current) {
      engineRef.current.showGrid = !showGrid;
      engineRef.current.draw();
      setShowGrid(!showGrid);
    }
  };

  const handleAxesToggle = () => {
    if (engineRef.current) {
      engineRef.current.showAxes = !showAxes;
      engineRef.current.draw();
      setShowAxes(!showAxes);
    }
  };

  const handleThemeToggle = () => {
    const newTheme = !isDarkTheme;
    setIsDarkTheme(newTheme);
    if (engineRef.current) {
      engineRef.current.setDarkMode(newTheme);
      engineRef.current.draw();
    }
    // Save to cookie if user allows (using the same allowThemeCookie setting as login theme)
    if (settings?.privacy?.allowThemeCookie !== false) {
      document.cookie = `geogebraTheme=${newTheme ? 'dark' : 'light'};path=/;max-age=31536000;SameSite=Lax`;
    }
  };

  const handleReset = () => {
    if (engineRef.current) {
      engineRef.current.setRange(-10, 10, -10, 10);
      engineRef.current.draw();
    }
  };

  const saveState = () => {
    if (engineRef.current) {
      const state = engineRef.current.getState();
      setSavedStates(prev => [...prev, { state, timestamp: new Date().toLocaleTimeString() }]);
    }
  };

  const loadState = (state) => {
    if (engineRef.current) {
      engineRef.current.setState(state);
      engineRef.current.draw();
      updateObjectsList();
    }
  };

  const quickInsert = (type) => {
    const commands = {
      function: 'f(x)=x^2',
      sine: 'g(x)=sin(x)',
      cosine: 'h(x)=cos(x)',
      tangent: 'k(x)=tan(x)',
      exponential: 'm(x)=exp(x)',
      logarithm: 'n(x)=ln(x)',
      inequality: 'y>x^2',
      implicit: 'x^2+y^2=1',
      parametric: 'Curve(sin(t),cos(t),t,0,6.28)',
      point: 'A=(1,1)',
      circle: 'Circle((0,0),2)',
      line: 'Line through (0,0) and (1,1)',
      segment: 'Segment((0,0),(2,1))',
      polygon: 'Polygon((0,0),(2,0),(1,1))',
    };
    if (commands[type]) {
      addObject(commands[type]);
    }
  };

  const getObjectIcon = (type) => {
    const icons = {
      function: 'f',
      inequality: '>',
      implicit: '=',
      parametric: '~',
      point: 'P',
      circle: 'O',
      line: '/',
      segment: '__',
    };
    return icons[type] || '?';
  };

  const getObjectLabel = (obj) => {
    if (obj.type === 'function') return `${obj.name}(x)`;
    if (obj.type === 'inequality') return obj.expression;
    if (obj.type === 'implicit') return obj.expression.replace(' - ', ' = ');
    if (obj.type === 'point') return `${obj.label}=(${obj.x},${obj.y})`;
    if (obj.type === 'circle') return `Circle((${obj.centerX},${obj.centerY}),${obj.radius})`;
    if (obj.type === 'parametric') return `Curve(${obj.xExpression},${obj.yExpression},t,${obj.tMin},${obj.tMax})`;
    if (obj.type === 'line') return 'Line';
    if (obj.type === 'segment') return 'Segment';
    return '';
  };

  return (
    <div className="geogebra-wrapper">
      <div className="geogebra-toolbar">
        <div className="toolbar-section">
          <button onClick={handleReset} title="Reset View"><RotateCcw size={16} /></button>
          <button onClick={handleClear} title="Clear All"><Trash2 size={16} /></button>
        </div>

        <div className="toolbar-section toolbar-insert">
          <span className="toolbar-label">Insert:</span>
          <select onChange={(e) => e.target.value && quickInsert(e.target.value)} value="">
            <option value="">Select...</option>
            <optgroup label="Functions">
              <option value="function">f(x) = x²</option>
              <option value="sine">sin(x)</option>
              <option value="cosine">cos(x)</option>
              <option value="tangent">tan(x)</option>
              <option value="exponential">e^x</option>
              <option value="logarithm">ln(x)</option>
            </optgroup>
            <optgroup label="Advanced">
              <option value="inequality">Inequality (y &gt; x²)</option>
              <option value="implicit">Implicit (x²+y²=1)</option>
              <option value="parametric">Parametric Curve</option>
            </optgroup>
            <optgroup label="Geometry">
              <option value="point">Point</option>
              <option value="circle">Circle</option>
              <option value="line">Line</option>
              <option value="segment">Segment</option>
              <option value="polygon">Polygon</option>
            </optgroup>
          </select>
        </div>

        <div className="toolbar-section">
          <button onClick={handleZoomIn} title="Zoom In"><ZoomIn size={16} /></button>
          <button onClick={handleZoomOut} title="Zoom Out"><ZoomOut size={16} /></button>
          {/*<button onClick={handleZoomFit} title="Zoom to Fit"><ZoomIn size={16} style={{fontSize:'10px'}}/></button>*/}
          <button onClick={handleGridToggle} title="Toggle Grid" className={showGrid ? 'active' : ''}><Grid3X3 size={16} /></button>
          <button onClick={handleAxesToggle} title="Toggle Axes" className={showAxes ? 'active' : ''}>
            <span style={{fontWeight: 'bold', fontSize:'12px'}}>XY</span>
          </button>
        </div>

        <div className="toolbar-section">
          <button onClick={saveState} title="Save State"><Save size={16} /></button>
          {savedStates.length > 0 && (
            <select onChange={(e) => e.target.value && loadState(savedStates[parseInt(e.target.value)].state)} value="">
              <option value="">Load...</option>
              {savedStates.map((s, i) => (
                <option key={i} value={i}>State {i + 1} ({s.timestamp})</option>
              ))}
            </select>
          )}
        </div>

        <div className="toolbar-section toolbar-theme">
          <button onClick={handleThemeToggle} title={isDarkTheme ? "Light Theme" : "Dark Theme"} className={isDarkTheme ? 'active' : ''}>
            {isDarkTheme ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </div>

      <div className="geogebra-main">
        <div className="geogebra-algebra">
          <div className="algebra-header">
            <Calculator size={16} />
            <span>Algebra</span>
          </div>

          <div className="algebra-input">
            <input
              type="text"
              autoComplete="off"
              spellCheck="false"
              value={inputValue}
              onChange={(e) => setInputValue(normalizeInput(e.target.value))}
              onKeyDown={handleCommand}
              placeholder="f(x)=x^2, y>x+1, Circle((0,0),1)"
            />
            <button onClick={() => handleCommand({ key: 'Enter' })}><Plus size={16} /></button>
          </div>

          {error && <div className="algebra-error">{error}</div>}

          <div className="algebra-objects">
            {objects.map((obj) => (
              <div key={obj.id} className="algebra-object">
                <span className="object-icon" style={{backgroundColor: obj.color}}>{getObjectIcon(obj.type)}</span>
                {editingObject === obj.id ? (
                  <div className="object-edit">
                    <input
                      type="text"
                      autoComplete="off"
                      spellCheck="false"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                      autoFocus
                    />
                    <button onClick={saveEdit}><Plus size={14} /></button>
                    <button onClick={() => setEditingObject(null)}><X size={14} /></button>
                  </div>
                ) : (
                  <span className="object-value">{getObjectLabel(obj)}</span>
                )}
                <div className="object-actions">
                  <button onClick={() => startEditing(obj)} title="Edit"><Edit2 size={14} /></button>
                  <button onClick={() => toggleVisibility(obj.id)} title="Toggle Visibility">
                    <Eye size={14} />
                  </button>
                  <button onClick={() => handleDelete(obj.id)} title="Delete"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
            {objects.length === 0 && (
              <div className="algebra-empty">
                No objects yet. Enter an equation or use the insert menu.
              </div>
            )}
          </div>
        </div>

        <div className={`geogebra-canvas${isDarkTheme ? ' dark-theme' : ''}`}>
          <canvas ref={canvasRef} style={{width: '100%', height: '100%'}} />
        </div>
      </div>
    </div>
  );
};

export default GeoGebraCalculator;
