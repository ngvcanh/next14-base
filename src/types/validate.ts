export interface ValidatorCommonProp<Type> {
  name: string;
  coerce?: boolean;
  matchWith?: string;
  create?: boolean;
  update?: boolean;
  min?: number;
  max?: number;
  oneOf?: Type[];
}

export interface ValidatorStringProp extends ValidatorCommonProp<string> {
  type: "string";
  email?: boolean;
}

export interface ValidatorNumberProp extends ValidatorCommonProp<number> {
  type: "number";
  int?: boolean;
}

export type ValidatorProp =
  | ValidatorStringProp
  | ValidatorNumberProp;