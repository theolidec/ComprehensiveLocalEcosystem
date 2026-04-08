class MathParser {
  constructor() {
    this.variables = {};
    this.functions = {
      sin: Math.sin,
      cos: Math.cos,
      tan: Math.tan,
      asin: Math.asin,
      acos: Math.acos,
      atan: Math.atan,
      sinh: Math.sinh,
      cosh: Math.cosh,
      tanh: Math.tanh,
      sqrt: Math.sqrt,
      abs: Math.abs,
      log: Math.log,
      ln: Math.log,
      log10: Math.log10,
      log2: Math.log2,
      exp: Math.exp,
      floor: Math.floor,
      ceil: Math.ceil,
      round: Math.round,
      sign: Math.sign,
      min: Math.min,
      max: Math.max,
      pow: Math.pow,
      pi: () => Math.PI,
      e: () => Math.E,
    };
  }

  tokenize(expression) {
    const tokens = [];
    let i = 0;
    const expr = expression.replace(/\s+/g, '');

    while (i < expr.length) {
      const char = expr[i];

      if (/\d/.test(char) || (char === '.' && /\d/.test(expr[i + 1]))) {
        let num = '';
        while (i < expr.length && (/\d/.test(expr[i]) || expr[i] === '.')) {
          num += expr[i++];
        }
        tokens.push({ type: 'NUMBER', value: parseFloat(num) });
        continue;
      }

      if (/[a-zA-Z_]/.test(char)) {
        let name = '';
        while (i < expr.length && /[a-zA-Z0-9_]/.test(expr[i])) {
          name += expr[i++];
        }
        if (this.functions[name]) {
          tokens.push({ type: 'FUNCTION', value: name });
        } else {
          tokens.push({ type: 'VARIABLE', value: name });
        }
        continue;
      }

      if ('+-*/^()=<>,'.includes(char)) {
        tokens.push({ type: char, value: char });
        i++;
        continue;
      }

      if (char === '!' && expr[i + 1] === '=') {
        tokens.push({ type: '!=', value: '!=' });
        i += 2;
        continue;
      }

      if (char === '&' && expr[i + 1] === '&') {
        tokens.push({ type: '&&', value: '&&' });
        i += 2;
        continue;
      }

      if (char === '|' && expr[i + 1] === '|') {
        tokens.push({ type: '||', value: '||' });
        i += 2;
        continue;
      }

      i++;
    }

    return tokens;
  }

  parse(expression) {
    const tokens = this.tokenize(expression);
    let pos = 0;

    const peek = () => tokens[pos];
    const consume = () => tokens[pos++];

    const parseExpression = () => parseLogical();

    const parseLogical = () => {
      let left = parseComparison();
      while (peek() && (peek().type === '&&' || peek().type === '||')) {
        const op = consume().value;
        const right = parseComparison();
        left = { type: 'binary', op, left, right };
      }
      return left;
    };

    const parseComparison = () => {
      let left = parseAdditive();
      while (peek() && ['=', '!=', '<', '>', '<=', '>='].includes(peek().type)) {
        const op = consume().value;
        const right = parseAdditive();
        left = { type: 'binary', op, left, right };
      }
      return left;
    };

    const parseAdditive = () => {
      let left = parseMultiplicative();
      while (peek() && (peek().type === '+' || peek().type === '-')) {
        const op = consume().value;
        const right = parseMultiplicative();
        left = { type: 'binary', op, left, right };
      }
      return left;
    };

    const parseMultiplicative = () => {
      let left = parsePower();
      while (peek() && (peek().type === '*' || peek().type === '/')) {
        const op = consume().value;
        const right = parsePower();
        left = { type: 'binary', op, left, right };
      }
      return left;
    };

    const parsePower = () => {
      let left = parseUnary();
      if (peek() && peek().type === '^') {
        consume();
        const right = parsePower();
        left = { type: 'binary', op: '^', left, right };
      }
      return left;
    };

    const parseUnary = () => {
      if (peek() && peek().type === '-') {
        consume();
        return { type: 'unary', op: '-', operand: parseUnary() };
      }
      if (peek() && peek().type === '+') {
        consume();
        return parseUnary();
      }
      return parsePrimary();
    };

    const parsePrimary = () => {
      const token = peek();

      if (!token) {
        throw new Error('Unexpected end of expression');
      }

      if (token.type === 'NUMBER') {
        consume();
        return { type: 'number', value: token.value };
      }

      if (token.type === 'VARIABLE') {
        consume();
        return { type: 'variable', name: token.value };
      }

      if (token.type === 'FUNCTION') {
        const name = consume().value;
        if (peek() && peek().type === '(') {
          consume();
          const args = [];
          if (peek() && peek().type !== ')') {
            args.push(parseExpression());
            while (peek() && peek().type === ',') {
              consume();
              args.push(parseExpression());
            }
          }
          if (!peek() || peek().type !== ')') {
            throw new Error('Expected closing parenthesis');
          }
          consume();
          return { type: 'function', name, args };
        }
        return { type: 'function', name, args: [] };
      }

      if (token.type === '(') {
        consume();
        const expr = parseExpression();
        if (!peek() || peek().type !== ')') {
          throw new Error('Expected closing parenthesis');
        }
        consume();
        return expr;
      }

      throw new Error(`Unexpected token: ${token.value}`);
    };

    return parseExpression();
  }

  evaluate(ast, variables = {}) {
    if (!ast) return 0;

    switch (ast.type) {
      case 'number':
        return ast.value;

      case 'variable':
        if (variables[ast.name] !== undefined) {
          return variables[ast.name];
        }
        if (this.variables[ast.name] !== undefined) {
          return this.variables[ast.name];
        }
        if (this.functions[ast.name]) {
          return this.functions[ast.name];
        }
        throw new Error(`Unknown variable: ${ast.name}`);

      case 'function':
        const fn = this.functions[ast.name];
        if (!fn) throw new Error(`Unknown function: ${ast.name}`);
        const args = ast.args.map(arg => this.evaluate(arg, variables));
        return fn(...args);

      case 'unary':
        if (ast.op === '-') {
          return -this.evaluate(ast.operand, variables);
        }
        return this.evaluate(ast.operand, variables);

      case 'binary': {
        const left = this.evaluate(ast.left, variables);
        const right = this.evaluate(ast.right, variables);
        switch (ast.op) {
          case '+': return left + right;
          case '-': return left - right;
          case '*': return left * right;
          case '/': return left / right;
          case '^': return Math.pow(left, right);
          case '=': return left === right;
          case '!=': return left !== right;
          case '<': return left < right;
          case '>': return left > right;
          case '<=': return left <= right;
          case '>=': return left >= right;
          case '&&': return left && right;
          case '||': return left || right;
          default: throw new Error(`Unknown operator: ${ast.op}`);
        }
      }

      default:
        throw new Error(`Unknown AST node type: ${ast.type}`);
    }
  }

  setVariable(name, value) {
    this.variables[name] = value;
  }

  getVariables() {
    return { ...this.variables };
  }

  clearVariables() {
    this.variables = {};
  }

  evaluateExpression(expression, vars = {}) {
    try {
      const ast = this.parse(expression);
      return this.evaluate(ast, vars);
    } catch (e) {
      return NaN;
    }
  }
}

export const mathParser = new MathParser();
export default MathParser;
