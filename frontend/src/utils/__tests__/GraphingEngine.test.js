import GraphingEngine from '../GraphingEngine';

const makeCanvas = (width = 400, height = 200) => ({
  width,
  height,
  getContext: () => ({
    clearRect: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    stroke: jest.fn(),
    fill: jest.fn(),
    fillRect: jest.fn(),
    fillText: jest.fn(),
    arc: jest.fn(),
    save: jest.fn(),
    restore: jest.fn(),
    setLineDash: jest.fn(),
    closePath: jest.fn(),
  }),
});

const makeEngine = (width, height) => new GraphingEngine(makeCanvas(width, height));

describe('GraphingEngine viewport', () => {
  it('starts with a symmetric default range', () => {
    const engine = makeEngine();
    expect([engine.xMin, engine.xMax, engine.yMin, engine.yMax]).toEqual([-10, 10, -10, 10]);
  });

  it('setRange replaces the visible window', () => {
    const engine = makeEngine();
    engine.setRange(0, 5, -1, 1);
    expect([engine.xMin, engine.xMax, engine.yMin, engine.yMax]).toEqual([0, 5, -1, 1]);
  });

  it('zoom shrinks or grows the range around its centre', () => {
    const engine = makeEngine();
    engine.zoom(0.5);
    expect([engine.xMin, engine.xMax, engine.yMin, engine.yMax]).toEqual([-5, 5, -5, 5]);

    engine.zoom(2);
    expect([engine.xMin, engine.xMax]).toEqual([-10, 10]);
  });

  it('zoom can be centred on an explicit point', () => {
    const engine = makeEngine();
    engine.zoom(0.5, 5, -5);
    expect([engine.xMin, engine.xMax]).toEqual([0, 10]);
    expect([engine.yMin, engine.yMax]).toEqual([-10, 0]);
  });

  it('pan shifts the window by a fraction of the current range', () => {
    const engine = makeEngine();
    engine.pan(0.1, -0.5);
    expect([engine.xMin, engine.xMax]).toEqual([-12, 8]);
    expect([engine.yMin, engine.yMax]).toEqual([0, 20]);
  });
});

describe('GraphingEngine coordinate transforms', () => {
  const engine = makeEngine(400, 200);

  it('maps graph coordinates onto canvas pixels', () => {
    expect(engine.toCanvasX(-10)).toBe(0);
    expect(engine.toCanvasX(0)).toBe(200);
    expect(engine.toCanvasX(10)).toBe(400);
    expect(engine.toCanvasY(10)).toBe(0);
    expect(engine.toCanvasY(0)).toBe(100);
    expect(engine.toCanvasY(-10)).toBe(200);
  });

  it('round-trips back to graph coordinates', () => {
    expect(engine.fromCanvasX(engine.toCanvasX(3.5))).toBeCloseTo(3.5, 10);
    expect(engine.fromCanvasY(engine.toCanvasY(-2.25))).toBeCloseTo(-2.25, 10);
  });
});

describe('GraphingEngine objects', () => {
  let engine;

  beforeEach(() => {
    engine = makeEngine();
  });

  it('adds objects with an id, a colour and default visibility', () => {
    const id = engine.addObject({ type: 'function', expression: 'x^2' });
    const [obj] = engine.getObjects();

    expect(obj.id).toBe(id);
    expect(obj.visible).toBe(true);
    expect(obj.color).toBe(engine.colors.functions[0]);
    expect(obj.expression).toBe('x^2');
  });

  it('cycles through the palette and wraps around', () => {
    const palette = engine.colors.functions;
    const colors = Array.from({ length: palette.length + 2 }, () => {
      engine.addObject({ type: 'function', expression: 'x' });
      return engine.getObjects().slice(-1)[0].color;
    });

    expect(colors.slice(0, palette.length)).toEqual(palette);
    expect(colors[palette.length]).toBe(palette[0]);
    expect(colors[palette.length + 1]).toBe(palette[1]);
  });

  it('uses the dark palette in dark mode', () => {
    engine.setDarkMode(true);
    expect(engine.getColors()).toBe(engine.darkModeColors);

    engine.addObject({ type: 'function', expression: 'x' });
    expect(engine.getObjects()[0].color).toBe(engine.darkModeColors.functions[0]);

    engine.setDarkMode(false);
    expect(engine.getColors()).toBe(engine.colors);
  });

  it('updates and removes objects by id', () => {
    const id = engine.addObject({ type: 'function', expression: 'x' });
    engine.updateObject(id, { visible: false, expression: '2*x' });

    expect(engine.getObjects()[0]).toMatchObject({ visible: false, expression: '2*x' });

    engine.updateObject('missing-id', { visible: true });
    expect(engine.getObjects()[0].visible).toBe(false);

    engine.removeObject(id);
    expect(engine.getObjects()).toEqual([]);
  });

  it('clear removes all objects and resets the colour cycle', () => {
    engine.addObject({ type: 'function', expression: 'x' });
    engine.addObject({ type: 'function', expression: 'y' });
    engine.clear();

    expect(engine.getObjects()).toEqual([]);

    engine.addObject({ type: 'function', expression: 'x' });
    expect(engine.getObjects()[0].color).toBe(engine.colors.functions[0]);
  });
});

describe('GraphingEngine evaluation', () => {
  const engine = makeEngine();

  it('evaluates functions through the shared math parser', () => {
    expect(engine.evaluateFunction('x^2', { x: 4 })).toBe(16);
    expect(engine.evaluateFunction('nope(', { x: 1 })).toBeNaN();
  });

  it('evaluates parametric points and rejects non-finite ones', () => {
    const circle = { xExpression: 'cos(t)', yExpression: 'sin(t)' };
    const point = engine.evaluateParametric(circle, 0);
    expect(point.x).toBeCloseTo(1, 10);
    expect(point.y).toBeCloseTo(0, 10);

    expect(engine.evaluateParametric({ xExpression: '1/0', yExpression: 't' }, 1)).toBeNull();
    expect(engine.evaluateParametric({ xExpression: 'bogus', yExpression: 't' }, 1)).toBeNull();
  });

  it('finds bounds for an implicit curve and returns null when nothing matches', () => {
    const bounds = engine.getImplicitBounds('x^2+y^2-9');
    expect(bounds).not.toBeNull();
    expect(bounds.xMin).toBeLessThan(-2.5);
    expect(bounds.xMax).toBeGreaterThan(2.5);

    expect(engine.getImplicitBounds('x^2+y^2+1000')).toBeNull();
  });
});

describe('GraphingEngine formatting helpers', () => {
  const engine = makeEngine();

  it('calculateGridStep returns "nice" steps', () => {
    expect(engine.calculateGridStep(20)).toBe(2);
    expect(engine.calculateGridStep(10)).toBe(1);
    expect(engine.calculateGridStep(100)).toBe(10);
    expect(engine.calculateGridStep(1)).toBe(0.1);
    expect(engine.calculateGridStep(45)).toBe(5);
    expect(engine.calculateGridStep(90)).toBe(10);
  });

  it('formatNumber trims decimals and uses exponentials at the extremes', () => {
    expect(engine.formatNumber(0)).toBe('0');
    expect(engine.formatNumber(1.5)).toBe('1.5');
    expect(engine.formatNumber(1.234)).toBe('1.23');
    expect(engine.formatNumber(-2)).toBe('-2');
    expect(engine.formatNumber(1000)).toBe('1.0e+3');
    expect(engine.formatNumber(0.001)).toBe('1.0e-3');
  });
});

describe('GraphingEngine rendering', () => {
  // Small canvas: the implicit/inequality renderers evaluate one expression per pixel.
  const makeSmallEngine = () => makeEngine(40, 20);

  it('clears the canvas and draws the grid and axes', () => {
    const engine = makeSmallEngine();
    engine.draw();

    expect(engine.ctx.clearRect).toHaveBeenCalledWith(0, 0, 40, 20);
    expect(engine.ctx.stroke).toHaveBeenCalled();
    expect(engine.ctx.fillText).toHaveBeenCalled();
  });

  it('skips the grid and axes when they are disabled', () => {
    const engine = makeSmallEngine();
    engine.showGrid = false;
    engine.showAxes = false;
    engine.draw();

    expect(engine.ctx.clearRect).toHaveBeenCalled();
    expect(engine.ctx.stroke).not.toHaveBeenCalled();
    expect(engine.ctx.fillText).not.toHaveBeenCalled();
  });

  it('renders every supported object type without throwing', () => {
    const engine = makeSmallEngine();
    engine.showGrid = false;
    engine.showAxes = false;

    engine.addObject({ type: 'function', expression: 'x' });
    engine.addObject({ type: 'function', expression: '1/0' }); // non-finite, skipped points
    engine.addObject({ type: 'inequality', expression: 'y<x' });
    engine.addObject({ type: 'parametric', xExpression: 'cos(t)', yExpression: 'sin(t)', tMin: 0, tMax: 6.28 });
    engine.addObject({ type: 'implicit', expression: 'x^2+y^2-9' });
    engine.addObject({ type: 'point', x: 1, y: 2, label: 'A' });
    engine.addObject({ type: 'line', x1: -1, y1: -1, x2: 1, y2: 1 });
    engine.addObject({ type: 'line', through: [{ x: 0, y: 0 }, { x: 1, y: 2 }] });
    engine.addObject({ type: 'line', through: [{ x: 3, y: 0 }, { x: 3, y: 1 }], vertical: 3 });
    engine.addObject({ type: 'line', through: [{ x: 0, y: 4 }, { x: 1, y: 4 }], horizontal: 4 });
    engine.addObject({ type: 'circle', centerX: 0, centerY: 0, radius: 3 });

    expect(() => engine.draw()).not.toThrow();
    expect(engine.ctx.arc).toHaveBeenCalled();
    expect(engine.ctx.fillRect).toHaveBeenCalled();
  });

  it('does not draw hidden objects', () => {
    const engine = makeSmallEngine();
    engine.showGrid = false;
    engine.showAxes = false;

    const id = engine.addObject({ type: 'point', x: 0, y: 0, label: 'A' });
    engine.updateObject(id, { visible: false });
    engine.draw();

    expect(engine.ctx.arc).not.toHaveBeenCalled();
  });

  it('zoomToFit frames the plotted objects and is a no-op when empty', () => {
    const engine = makeSmallEngine();
    engine.zoomToFit();
    expect([engine.xMin, engine.xMax]).toEqual([-10, 10]);

    engine.addObject({ type: 'function', expression: 'x' });
    engine.zoomToFit(0);
    expect(engine.xMin).toBeCloseTo(-10, 5);
    expect(engine.yMax).toBeLessThanOrEqual(10);
    expect(engine.yMax).toBeGreaterThan(9);
  });
});

describe('GraphingEngine state', () => {
  it('serialises and restores objects and the viewport', () => {
    const source = makeEngine();
    source.setRange(-1, 1, -2, 2);
    source.addObject({ type: 'function', expression: 'x^3' });

    const target = makeEngine();
    target.setState(source.getState());

    expect([target.xMin, target.xMax, target.yMin, target.yMax]).toEqual([-1, 1, -2, 2]);
    expect(target.getObjects()).toHaveLength(1);
    expect(target.getObjects()[0].expression).toBe('x^3');
  });
});
