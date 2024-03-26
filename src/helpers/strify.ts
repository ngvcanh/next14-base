export const strify = {
  is(value: string, compare: string) {
    return value === compare;
  },
  in(value: string, contains: string[]) {
    return contains.includes(value);
  },
  contain(source: string, find: string) {
    return source.includes(find);
  },
  parseBase64(str: string) {
    return Buffer.from(str, "base64").toString();
  },

  parseString(str: string, ...args: Array<string | number>) {
    let i = 0;
    return str.replace(/%s/g, () => args[i++]?.toString() ?? "");
  },

  toBase64(str: string) {
    return Buffer.from(str).toString("base64");
  },

  ucfirst(str: string, lowerRemain = false) {
    if (!str.length) {
      return str;
    }

    const first = str.slice(0, 1).toUpperCase();
    let last = str.slice(1);

    if (lowerRemain) {
      last = last.toLowerCase();
    }

    return `${first}${last}`;
  }
};
