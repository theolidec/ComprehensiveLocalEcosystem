# GeoGebra Calculator Module

## Overview

The GeoGebra Calculator provides interactive mathematical graphing capabilities directly in the browser. It supports functions, parametric curves, points, circles, polygons, implicit equations, and inequalities with a canvas-based rendering engine.

## Features

- **Interactive Graphing**: Plot mathematical expressions in real-time
- **Multiple Object Types**: Functions, curves, points, shapes, equations
- **Advanced Mathematics**: Support for inequalities, conic sections, geometric constructions
- **Navigation**: Pan, zoom, mouse wheel controls
- **Visual Customization**: Light/dark themes, grid toggle, axis controls
- **State Management**: Save and restore calculator states
- **Object Management**: Add, edit, delete, label objects
- **Command Interface**: Text-based input for rapid object creation

## Architecture

```
┌─────────────────────────────────────────────┐
│           GeoGebraCalculator.js              │
│  ┌─────────────────────────────────────┐    │
│  │         State Management            │    │
│  │  • Objects array                    │    │
│  │  • View bounds (x/y min/max)        │    │
│  │  • Theme/grid settings              │    │
│  └─────────────────────────────────────┘    │
│                    │                         │
│         ┌─────────┴─────────┐               │
│         ▼                   ▼               │
│  ┌──────────────┐   ┌──────────────┐        │
│  │ GraphingEngine│   │  MathParser  │        │
│  │   (Canvas)   │   │  (Evaluator) │        │
│  └──────────────┘   └──────────────┘        │
└─────────────────────────────────────────────┘
```

**File Locations**:
- Main component: `frontend/src/components/Math/GeoGebraCalculator.js`
- Styles: `frontend/src/components/Math/GeoGebraCalculator.css`

## Supported Object Types

### 1. Functions

**Format**: `f(x) = expression`

Examples:
```
f(x) = x^2 + 3x - 2
f(x) = sin(x)
f(x) = e^x * cos(x)
f(x) = sqrt(x)
```

**Properties**:
- Color: Assignable
- Line style: Solid, dashed, dotted
- Line width: 1-5px

### 2. Parametric Curves

**Format**: `x(t) = ..., y(t) = ...`

Examples:
```
x(t) = cos(t), y(t) = sin(t)        // Circle
x(t) = 3*cos(t), y(t) = 2*sin(t)   // Ellipse
x(t) = t^2, y(t) = t^3             // Cubic parabola
```

**Parameters**:
- `t` range: Typically -10 to 10 (configurable)
- Step size: 0.01 for smooth curves

### 3. Points

**Format**: `A = (x, y)` or `A = (expression, expression)`

Examples:
```
A = (3, 4)
B = (cos(1), sin(1))
C = (f(2), g(2))    // Point on function
```

**Properties**:
- Label: Single uppercase letter (auto-assigned)
- Color: Assignable
- Size: Small, medium, large
- Style: Circle, square, diamond, cross

### 4. Circles

**Format**: `Circle(center, radius)` or `Circle(A, B)`

Examples:
```
Circle((0,0), 5)           // Center, radius
Circle(A, 3)               // Point A, radius
Circle(A, B)               // Through points A and B
```

### 5. Polygons

**Format**: `Polygon[A, B, C, ...]`

Examples:
```
Polygon[(0,0), (4,0), (2,3)]    // Triangle
Polygon[A, B, C, D]              // Quadrilateral
```

### 6. Implicit Equations

**Format**: `equation = 0`

Examples:
```
x^2 + y^2 = 25              // Circle
x^2/4 + y^2/9 = 1           // Ellipse
x^2 - y^2 = 1               // Hyperbola
```

### 7. Inequalities

**Format**: `expression > 0`, `expression < 0`, etc.

Examples:
```
y > x^2                     // Above parabola
x^2 + y^2 < 25              // Inside circle
y < x + 2 && y > x - 2      // Between lines
```

**Visualization**: Shaded regions with adjustable opacity

## User Interface

### Layout

```
┌──────────────────────────────────────────────────────────────┐
│ Toolbar │                                         │ Settings│
├─────────┴─────────────────────────────────────────────────────┤
│                                                               │
│                    Canvas Area                                │
│              (Coordinate Grid + Graphs)                     │
│                                                               │
├───────────────────────────────────────────────────────────────┤
│ Command Input: [f(x) = x^2 + 1                    ] [Add]   │
├───────────────────────────────────────────────────────────────┤
│ Object List                                                   │
│ • f(x) = x^2 + 1                              [✏️] [🗑️]    │
│ • A = (2, 5)                                  [✏️] [🗑️]    │
└───────────────────────────────────────────────────────────────┘
```

### Controls

| Action | Method |
|--------|--------|
| Pan | Drag with mouse |
| Zoom In | Mouse wheel up / Pinch out |
| Zoom Out | Mouse wheel down / Pinch in |
| Reset View | Click home button |
| Add Object | Type in command bar, press Enter |
| Edit Object | Click pencil icon in list |
| Delete Object | Click trash icon in list |
| Toggle Grid | Grid button |
| Toggle Axes | Axes button |
| Change Theme | Theme toggle |

### Command Bar Syntax

```
# Function
f(x) = x^2 + 2x + 1

# Parametric
x(t) = cos(t), y(t) = sin(t)

# Point
A = (3, 4)

# Circle
Circle((0,0), 5)

# Implicit
x^2 + y^2 = 25

# Inequality
y > x^2 - 4
```

## Math Expression Support

### Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `+` | Addition | `x + 2` |
| `-` | Subtraction | `x - 3` |
| `*` | Multiplication | `2 * x` |
| `/` | Division | `x / 2` |
| `^` | Power | `x^2` |
| `%` | Modulo | `x % 2` |

### Functions

| Function | Description | Example |
|----------|-------------|---------|
| `sin(x)` | Sine | `sin(x)` |
| `cos(x)` | Cosine | `cos(x)` |
| `tan(x)` | Tangent | `tan(x)` |
| `sqrt(x)` | Square root | `sqrt(x)` |
| `abs(x)` | Absolute value | `abs(x)` |
| `ln(x)` | Natural logarithm | `ln(x)` |
| `log(x)` | Logarithm base 10 | `log(x)` |
| `exp(x)` | Exponential | `exp(x)` |
| `floor(x)` | Floor | `floor(x)` |
| `ceil(x)` | Ceiling | `ceil(x)` |
| `round(x)` | Round | `round(x)` |

### Constants

| Constant | Value |
|----------|-------|
| `pi` | π ≈ 3.14159 |
| `e` | e ≈ 2.71828 |

### Implicit Multiplication

```
2x      → 2 * x
3(x+1)  → 3 * (x + 1)
x(x-1)  → x * (x - 1)
```

## State Management

### Calculator State

```javascript
{
  objects: [
    {
      id: string,           // Unique identifier
      type: 'function',     // Object type
      definition: 'f(x) = x^2',
      color: '#3B82F6',
      visible: true,
      properties: {}
    }
  ],
  view: {
    xMin: -10,
    xMax: 10,
    yMin: -10,
    yMax: 10
  },
  settings: {
    showGrid: true,
    showAxes: true,
    theme: 'light'
  }
}
```

### Persistence

State can be saved/loaded:

```javascript
// Save state
const state = calculator.getState();
localStorage.setItem('calculator-state', JSON.stringify(state));

// Load state
const saved = localStorage.getItem('calculator-state');
if (saved) {
  calculator.setState(JSON.parse(saved));
}
```

## Component Methods

```javascript
// Access via ref
const calculatorRef = useRef();

// Add object
calculatorRef.current.addObject('f(x) = x^2');

// Remove object
calculatorRef.current.removeObject(id);

// Clear all
calculatorRef.current.clear();

// Reset view
calculatorRef.current.resetView();

// Get/Set state
const state = calculatorRef.current.getState();
calculatorRef.current.setState(state);
```

## Rendering Pipeline

```
1. Parse command input
   └─→ Tokenize → Build AST

2. Evaluate/generate points
   └─→ For each x in [xMin, xMax, step]
       └─→ Calculate y = f(x)
           └─→ Add to point array

3. Transform coordinates
   └─→ Map math coords to canvas coords
       x_canvas = (x - xMin) * scaleX
       y_canvas = height - (y - yMin) * scaleY

4. Draw to canvas
   └─→ Clear canvas
       Draw grid
       Draw axes
       For each object:
         └─→ Draw path/points/shape
       Draw labels
```

## Performance Considerations

- **Sampling**: Functions evaluated at ~1000 points for smooth curves
- **Step size**: `step = (xMax - xMin) / 1000`
- **Offscreen canvas**: Pre-render grid for better performance
- **Debounce**: Command input debounced at 300ms
- **RequestAnimationFrame**: Smooth animations for pan/zoom

## Error Handling

### Invalid Expressions

```
Input: f(x) = x^^2
Error: Invalid operator '^^'

Input: f(x) = sin()
Error: Function 'sin' requires 1 argument

Input: A = (3, )
Error: Invalid point syntax
```

### Display

Errors shown inline with red highlighting:
```
┌──────────────────────────────────────┐
│ f(x) = x^^2                   [Error]│
│         ↑ Invalid operator           │
└──────────────────────────────────────┘
```

## Accessibility

- Keyboard navigation support
- Screen reader labels for objects
- High contrast theme option
- Adjustable font sizes

## Recent Updates

### May 2026
- **Dark Theme Fix**: Fixed object edit input field to properly support dark theme styling (added `background` and `color` CSS variables to `.object-edit input`)

## Future Enhancements

- [ ] Sliders for animated parameters
- [ ] Regression analysis
- [ ] 3D graphing support
- [ ] LaTeX rendering for labels
- [ ] Export to SVG/PNG
- [ ] Share links with saved state
- [ ] CAS (Computer Algebra System) integration
