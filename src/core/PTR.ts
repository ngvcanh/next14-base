import { numify } from "@/helpers/numify";
import { strify } from "@/helpers/strify";

export type Path = string | RegExp | Array<string | RegExp>;

export interface Key {
  name: string | number;
  prefix: string;
  suffix: string;
  pattern: string;
  modifier: string;
}

export type Token = string | Key;

export interface TokensToRegexpOptions {
  sensitive?: boolean;
  strict?: boolean;
  end?: boolean;
  start?: boolean;
  delimiter?: string;
  endsWith?: string;
  encode?: (value: string) => string;
}

export interface ParseOptions {
  delimiter?: string;
  prefixes?: string;
}

interface LexToken {
  type:
    | "OPEN"
    | "CLOSE"
    | "PATTERN"
    | "NAME"
    | "CHAR"
    | "ESCAPED_CHAR"
    | "MODIFIER"
    | "END";
  index: number;
  value: string;
}

export class PTR {

  static flags(options?: { sensitive?: boolean }) {
    return options && options.sensitive ? "" : "i";
  }

  static escape(str: string) {
    return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
  }

  static lexer(str: string): LexToken[] {
    const tokens: LexToken[] = [];
    let i = 0;
  
    while (i < str.length) {
      const char = str[i];
  
      if (strify.in(char, ["*", "+", "?"])) {
        tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
        continue;
      }
  
      if (strify.is(char, "\\")) {
        tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
        continue;
      }
  
      if (strify.is(char, "{")) {
        tokens.push({ type: "OPEN", index: i, value: str[i++] });
        continue;
      }
  
      if (strify.is(char, "}")) {
        tokens.push({ type: "CLOSE", index: i, value: str[i++] });
        continue;
      }
  
      if (strify.is(char, ":")) {
        let name = "";
        let j = i + 1;
  
        while (j < str.length) {
          const code = str.charCodeAt(j);
  
          if (
            // `0-9`
            numify.inRanges(code, 48, 57) ||
            // `A-Z`
            numify.inRanges(code, 65, 90) ||
            // `a-z`
            numify.inRanges(code, 97, 122) ||
            // `_`
            numify.is(code, 95)
          ) {
            name += str[j++];
            continue;
          }
  
          break;
        }
  
        if (!name) throw new TypeError(`Missing parameter name at ${i}`);
  
        tokens.push({ type: "NAME", index: i, value: name });
        i = j;
        continue;
      }
  
      if (strify.is(char, "(") ) {
        let count = 1;
        let pattern = "";
        let j = i + 1;
  
        if (strify.is(str[j], "?")) {
          throw new TypeError(`Pattern cannot start with "?" at ${j}`);
        }
  
        while (j < str.length) {
          if (strify.is(str[j], "\\")) {
            pattern += str[j++] + str[j++];
            continue;
          }
  
          if (strify.is(str[j], ")")) {
            count--;
            if (numify.is(count, 0)) {
              j++;
              break;
            }
          } else if (strify.is(str[j], "(")) {
            count++;
            if (!strify.is(str[j], "?")) {
              throw new TypeError(`Capturing groups are not allowed at ${j}`);
            }
          }
  
          pattern += str[j++];
        }
  
        if (count) throw new TypeError(`Unbalanced pattern at ${i}`);
        if (!pattern) throw new TypeError(`Missing pattern at ${i}`);
  
        tokens.push({ type: "PATTERN", index: i, value: pattern });
        i = j;
        continue;
      }
  
      tokens.push({ type: "CHAR", index: i, value: str[i++] });
    }
  
    tokens.push({ type: "END", index: i, value: "" });
  
    return tokens;
  }

  static parse(str: string, options: ParseOptions = {}): Token[] {
    const tokens = PTR.lexer(str);
    const { prefixes = "./" } = options;
    const defaultPattern = `[^${PTR.escape(options.delimiter || "/#?")}]+?`;
    const result: Token[] = [];
    let key = 0;
    let i = 0;
    let path = "";
  
    const tryConsume = (type: LexToken["type"]): string | undefined => {
      if (i < tokens.length && strify.is(tokens[i].type, type)) return tokens[i++].value;
    };
  
    const mustConsume = (type: LexToken["type"]): string => {
      const value = tryConsume(type);
      if (value !== undefined) return value;
      const { type: nextType, index } = tokens[i];
      throw new TypeError(`Unexpected ${nextType} at ${index}, expected ${type}`);
    };
  
    const consumeText = (): string => {
      let result = "";
      let value: string | undefined;
      while ((value = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR"))) {
        result += value;
      }
      return result;
    };
  
    while (i < tokens.length) {
      const char = tryConsume("CHAR");
      const name = tryConsume("NAME");
      const pattern = tryConsume("PATTERN");
  
      if (name || pattern) {
        let prefix = char || "";
  
        if (!strify.contain(prefixes, prefix)) {
          path += prefix;
          prefix = "";
        }
  
        if (path) {
          result.push(path);
          path = "";
        }
  
        result.push({
          name: name || key++,
          prefix,
          suffix: "",
          pattern: pattern || defaultPattern,
          modifier: tryConsume("MODIFIER") || "",
        });
        continue;
      }
  
      const value = char || tryConsume("ESCAPED_CHAR");
      if (value) {
        path += value;
        continue;
      }
  
      if (path) {
        result.push(path);
        path = "";
      }
  
      const open = tryConsume("OPEN");
      if (open) {
        const prefix = consumeText();
        const name = tryConsume("NAME") || "";
        const pattern = tryConsume("PATTERN") || "";
        const suffix = consumeText();
  
        mustConsume("CLOSE");
  
        result.push({
          name: name || (pattern ? key++ : ""),
          pattern: name && !pattern ? defaultPattern : pattern,
          prefix,
          suffix,
          modifier: tryConsume("MODIFIER") || "",
        });
        continue;
      }
  
      mustConsume("END");
    }
  
    return result;
  }

  static tokensToRegex(tokens: Token[], keys?: Key[], options: TokensToRegexpOptions = {}) {
    const {
      strict = false,
      start = true,
      end = true,
      encode = (x: string) => x,
      delimiter = "/#?",
      endsWith = "",
    } = options;

    const endsWithRe = `[${PTR.escape(endsWith)}]|$`;
    const delimiterRe = `[${PTR.escape(delimiter)}]`;
    let route = start ? "^" : "";
  
    for (const token of tokens) {
      if (typeof token === "string") {
        route += PTR.escape(encode(token));
      } 
      else {
        const prefix = PTR.escape(encode(token.prefix));
        const suffix = PTR.escape(encode(token.suffix));
  
        if (token.pattern) {
          if (keys) keys.push(token);
  
          if (prefix || suffix) {
            if (strify.in(token.modifier, ["+", "*"])) {
              const mod = strify.is(token.modifier, "*") ? "?" : "";
              route += `(?:${prefix}((?:${token.pattern})(?:${suffix}${prefix}(?:${token.pattern}))*)${suffix})${mod}`;
            }
            else {
              route += `(?:${prefix}(${token.pattern})${suffix})${token.modifier}`;
            }
          }
          else {
            if (strify.in(token.modifier, ["+", "*"])) {
              route += `((?:${token.pattern})${token.modifier})`;
            } 
            else {
              route += `(${token.pattern})${token.modifier}`;
            }
          }
        } 
        else {
          route += `(?:${prefix}${suffix})${token.modifier}`;
        }
      }
    }
  
    if (end) {
      if (!strict) route += `${delimiterRe}?`;
  
      route += !options.endsWith ? "$" : `(?=${endsWithRe})`;
    } 
    else {
      const endToken = tokens[tokens.length - 1];
      const isEndDelimited =
        typeof endToken === "string"
          ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1
          : endToken === undefined;
  
      if (!strict) {
        route += `(?:${delimiterRe}(?=${endsWithRe}))?`;
      }
  
      if (!isEndDelimited) {
        route += `(?=${delimiterRe}|${endsWithRe})`;
      }
    }
  
    return new RegExp(route, PTR.flags(options));
  }

  static regexToRegex(path: RegExp, keys?: Key[]): RegExp {
    if (!keys) {
      return path;
    }

    const groups = /\((?:\?<(.*?)>)?(?!\?)/g;

    let index = 0;
    let result = groups.exec(path.source);

    while (result) {
      keys.push({
        name: result[1] || index++,
        prefix: "",
        suffix: "",
        modifier: "",
        pattern: "",
      });
      result = groups.exec(path.source);
    }

    return path;
  }

  static stringToRegex(path: string, keys?: Key[], options?: TokensToRegexpOptions & ParseOptions) {
    return PTR.tokensToRegex(PTR.parse(path, options), keys, options);
  }

  static arrayToRegex(paths: Array<string | RegExp>, keys?: Key[], options?: TokensToRegexpOptions & ParseOptions) {
    const parts = paths.map((path) => PTR.pathToRegex(path, keys, options).source);
    return new RegExp(`(?:${parts.join("|")})`, PTR.flags(options));
  }

  static pathToRegex(path: Path, keys?: Key[], options?: TokensToRegexpOptions & ParseOptions): RegExp {
    if (path instanceof RegExp) {
      return PTR.regexToRegex(path, keys);
    }
    
    if (Array.isArray(path)) {
      return PTR.arrayToRegex(path, keys, options);
    }

    return PTR.stringToRegex(path, keys, options);
  }

}