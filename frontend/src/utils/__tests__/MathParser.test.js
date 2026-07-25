import MathParser, { mathParser } from '../MathParser';

describe('MathParser.tokenize', () => {
  const parser = new MathParser();

  it('tokenizes numbers, variables and functions', () => {
    expect(parser.tokenize('2*x + sin(y)')).toEqual([
      { type: 'NUMBER', value: 2 },
      { type: '*', value: '*' },
      { type: 'VARIABLE', value: 'x' },
      { type: '+', value: '+' },
      { type: 'FUNCTION', value: 'sin' },
      { type: '(', value: '(' },
      { type: 'VARIABLE', value: 'y' },
      { type: ')', value: ')' },
    ]);
  });

  it('handles decimals with and without a leading digit', () => {
    expect(parser.tokenize('.5+1.25')).toEqual([
      { type: 'NUMBER', value: 0.5 },
      { type: '+', value: '+' },
      { type: 'NUMBER', value: 1.25 },
    ]);
  });

  it('ignores whitespace', () => {
    expect(parser.tokenize('  1  +  2 ')).toHaveLength(3);
  });

  it('skips unrecognised characters', () => {
    expect(parser.tokenize('1 $ 2')).toEqual([
      { type: 'NUMBER', value: 1 },
      { type: 'NUMBER', value: 2 },
    ]);
  });

  it('tokenizes multi-character logical operators', () => {
    expect(parser.tokenize('x&&y').map((t) => t.type)).toEqual(['VARIABLE', '&&', 'VARIABLE']);
    expect(parser.tokenize('x||y').map((t) => t.type)).toEqual(['VARIABLE', '||', 'VARIABLE']);
  });
});

describe('MathParser.parse', () => {
  const parser = new MathParser();

  it('builds a left-associative additive tree', () => {
    expect(parser.parse('1+2-3')).toEqual({
      type: 'binary',
      op: '-',
      left: {
        type: 'binary',
        op: '+',
        left: { type: 'number', value: 1 },
        right: { type: 'number', value: 2 },
      },
      right: { type: 'number', value: 3 },
    });
  });

  it('parses a function call without arguments', () => {
    expect(parser.parse('pi')).toEqual({ type: 'function', name: 'pi', args: [] });
  });

  it('parses multi-argument function calls', () => {
    expect(parser.parse('max(1,2)')).toEqual({
      type: 'function',
      name: 'max',
      args: [
        { type: 'number', value: 1 },
        { type: 'number', value: 2 },
      ],
    });
  });

  it('throws on an empty expression', () => {
    expect(() => parser.parse('')).toThrow('Unexpected end of expression');
  });

  it('throws on unbalanced parentheses', () => {
    expect(() => parser.parse('(1+2')).toThrow('Expected closing parenthesis');
    expect(() => parser.parse('sin(1')).toThrow('Expected closing parenthesis');
  });

  it('throws on an unexpected token', () => {
    expect(() => parser.parse(')')).toThrow('Unexpected token: )');
  });
});

describe('MathParser.evaluateExpression', () => {
  let parser;

  beforeEach(() => {
    parser = new MathParser();
  });

  it('evaluates arithmetic with correct precedence', () => {
    expect(parser.evaluateExpression('2+3*4')).toBe(14);
    expect(parser.evaluateExpression('(2+3)*4')).toBe(20);
    expect(parser.evaluateExpression('10/4')).toBe(2.5);
  });

  it('treats ^ as right-associative exponentiation', () => {
    expect(parser.evaluateExpression('2^3')).toBe(8);
    expect(parser.evaluateExpression('2^3^2')).toBe(512);
  });

  it('applies unary plus and minus', () => {
    expect(parser.evaluateExpression('-5')).toBe(-5);
    expect(parser.evaluateExpression('--5')).toBe(5);
    expect(parser.evaluateExpression('+7')).toBe(7);
    // Unary minus binds tighter than ^, so this is (-2)^2.
    expect(parser.evaluateExpression('-2^2')).toBe(4);
  });

  it('substitutes variables passed at evaluation time', () => {
    expect(parser.evaluateExpression('x^2+1', { x: 3 })).toBe(10);
    expect(parser.evaluateExpression('x*y', { x: 2, y: 5 })).toBe(10);
  });

  it('falls back to parser-level variables', () => {
    parser.setVariable('a', 4);
    expect(parser.evaluateExpression('a+1')).toBe(5);
    expect(parser.evaluateExpression('a+1', { a: 10 })).toBe(11);
  });

  it('evaluates built-in functions and constants', () => {
    expect(parser.evaluateExpression('sqrt(16)')).toBe(4);
    expect(parser.evaluateExpression('abs(-3)')).toBe(3);
    expect(parser.evaluateExpression('min(3,1,2)')).toBe(1);
    expect(parser.evaluateExpression('pow(2,10)')).toBe(1024);
    expect(parser.evaluateExpression('pi()')).toBeCloseTo(Math.PI, 10);
    expect(parser.evaluateExpression('e()')).toBeCloseTo(Math.E, 10);
    expect(parser.evaluateExpression('sin(0)')).toBe(0);
    expect(parser.evaluateExpression('ln(1)')).toBe(0);
    expect(parser.evaluateExpression('log10(100)')).toBe(2);
  });

  it('evaluates comparisons and logical operators', () => {
    expect(parser.evaluateExpression('1<2')).toBe(true);
    expect(parser.evaluateExpression('2=2')).toBe(true);
    expect(parser.evaluateExpression('2!=2')).toBe(false);
    expect(parser.evaluateExpression('3>4')).toBe(false);
    expect(parser.evaluateExpression('1<2&&3>2')).toBe(true);
    expect(parser.evaluateExpression('1>2||3>2')).toBe(true);
  });

  it('returns NaN for unknown variables, unknown functions and syntax errors', () => {
    expect(parser.evaluateExpression('unknownVar')).toBeNaN();
    expect(parser.evaluateExpression('(1+')).toBeNaN();
    expect(parser.evaluateExpression('')).toBeNaN();
  });

  it('returns Infinity for division by zero', () => {
    expect(parser.evaluateExpression('1/0')).toBe(Infinity);
  });
});

describe('MathParser.evaluate', () => {
  const parser = new MathParser();

  it('returns 0 for a missing AST', () => {
    expect(parser.evaluate(null)).toBe(0);
    expect(parser.evaluate(undefined)).toBe(0);
  });

  it('resolves a bare function name as a variable reference to the function', () => {
    expect(parser.evaluate({ type: 'variable', name: 'sin' })).toBe(Math.sin);
  });

  it('throws for unknown nodes, variables, functions and operators', () => {
    expect(() => parser.evaluate({ type: 'mystery' })).toThrow('Unknown AST node type: mystery');
    expect(() => parser.evaluate({ type: 'variable', name: 'q' })).toThrow('Unknown variable: q');
    expect(() => parser.evaluate({ type: 'function', name: 'nope', args: [] })).toThrow('Unknown function: nope');
    expect(() => parser.evaluate({
      type: 'binary',
      op: '%',
      left: { type: 'number', value: 1 },
      right: { type: 'number', value: 2 },
    })).toThrow('Unknown operator: %');
  });

  it('passes through non-negating unary operators', () => {
    expect(parser.evaluate({ type: 'unary', op: '+', operand: { type: 'number', value: 3 } })).toBe(3);
  });
});

describe('MathParser variable store', () => {
  it('sets, reads and clears variables', () => {
    const parser = new MathParser();
    parser.setVariable('a', 1);
    parser.setVariable('b', 2);

    expect(parser.getVariables()).toEqual({ a: 1, b: 2 });

    parser.getVariables().a = 99;
    expect(parser.getVariables().a).toBe(1); // getVariables returns a copy

    parser.clearVariables();
    expect(parser.getVariables()).toEqual({});
  });
});

describe('mathParser singleton', () => {
  it('is a shared MathParser instance', () => {
    expect(mathParser).toBeInstanceOf(MathParser);
    expect(mathParser.evaluateExpression('1+1')).toBe(2);
  });
});
