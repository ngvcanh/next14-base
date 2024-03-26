import { z } from "zod";
import { RouteHandler, RouteRequest, RouteResponse } from "@/types/api";
import { ValidatorNumberProp, ValidatorProp, ValidatorStringProp } from "@/types/validate";
import { fieldRules } from "@/helpers/validate";
import { strify } from "@/helpers/strify";
import * as MESSAGE from "@/helpers/message";
import { Response } from "./Response";

export interface ValidateHandler<RouteKey extends RouteRequest> {
  (params: {
    [x in keyof RouteKey]: any;
  } & {
    req: RouteRequest;
    res: RouteResponse;
  }): void;
}
type A = Pick<{a: number}, "a">;
export interface ValidateOptions {
  update?: boolean;
  override?: Record<string, ValidatorProp>;
}

export class Validate<Schema extends {}> {

  static CONFIGURATION = fieldRules;

  private props: Array<keyof Schema>;
  private schema: z.ZodObject<Schema> = {} as z.ZodObject<Schema>;
  private options: ValidateOptions = {};
  private configuration: Record<string, ValidatorProp> = {};

  constructor(props: Array<keyof Schema>, options?: ValidateOptions) {
    this.props = [...props];
    this.options = Object.assign({}, this.options, options);
    this.mergeConfig().createSchema(this.props);
  }

  private mergeConfig() {
    this.configuration = Object.assign({}, Validate.CONFIGURATION, this.options.override);
    return this;
  }

  createSchema(props: Array<keyof Schema>) {
    const schema: z.ZodRawShape = {};
    const refine: Record<string, ValidatorProp> = {};
  
    props.forEach((p) => {
      const prop = p as keyof typeof fieldRules;
      const config = this.configuration[prop];

      if (!config) {
        return;
      }

      if (config.matchWith) {
        refine[prop] = config;
      }

      switch (config.type) {
        case "string":
          schema[prop] = Validate.string(config, this.options);
          break;
        case "number":
          schema[prop] = Validate.number(config, this.options);
          break;
      }
    });

    let obj: any = z.object(schema) as z.ZodObject<Schema>;
    const refineKeys = Object.keys(refine);

    if (refineKeys.length) {
      refineKeys.forEach((key) => {
        const config = refine[key];

        if (config.matchWith) {
          obj = obj.refine(
            (data: any) => data[key as keyof typeof data] === data[config.matchWith as keyof typeof data],
            {
              message: strify.parseString(MESSAGE.MESSAGE_NOT_MATCH, config.name),
              path: [key],
            }
          );
        }
      }) as any;
    }

    this.schema = obj;
    return this;
  }

  getSchema() {
    return this.schema;
  }

  data(data: Schema) {
    return z.object(this.schema as any).parse(data);
  }

  request(req: RouteRequest<any>, key: string) {
    return z.object({ [key]: this.schema }).parse(req);
  }

  body(req: RouteRequest) {
    return this.request(req, "body");
  }

  query(req: RouteRequest) {
    return this.request(req, "query");
  }

  params(req: RouteRequest) {
    return this.request(req, "params");
  }

  static z(coerce?: boolean) {
    return coerce ? z.coerce : z;
  }

  static string(config: ValidatorStringProp, options: ValidateOptions) {
    const { coerce, create, update, name, min = 0, max = 0, email, oneOf = [] } = config;

    if (oneOf.length) {
      return z.union(oneOf.map((v) => z.literal(v)) as any);
    }

    const required = options.update ? update : create;
    let schema: z.ZodString = required 
      ? this.z(coerce).string({ required_error: strify.parseString(MESSAGE.MESSAGE_REQUIRED, name) })
      : this.z(coerce).string();

    if (min > 0) {
      schema = schema.min(min, strify.parseString(MESSAGE.MESSAGE_MIN_LENGTH, name, min));
    }

    if (max > 0) {
      schema = schema.max(max, strify.parseString(MESSAGE.MESSAGE_MAX_LENGTH, name, max));
    }

    if (email) {
      schema = schema.email(strify.parseString(MESSAGE.MESSAGE_INVALID_FORMAT, name));
    }

    return schema;
  }

  static number(config: ValidatorNumberProp, options: ValidateOptions) {
    const { coerce, oneOf, create, update, name, int: _int, min, max } = config;

    if (oneOf?.length) {
      return z.union(oneOf.map((v) => z.literal(v)) as any);
    }

    const required = options.update ? update : create;
    let schema: z.ZodNumber = required 
      ? this.z(coerce).number({ required_error: strify.parseString(MESSAGE.MESSAGE_REQUIRED, name) })
      : this.z(coerce).number();

    if (_int) {
      schema = schema.int(MESSAGE.MESSAGE_MUST_INTEGER);
    }

    if (min) {
      schema = schema.min(min, strify.parseString(MESSAGE.MESSAGE_MIN_VALUE, name, min));
    }

    if (max) {
      schema = schema.min(max, strify.parseString(MESSAGE.MESSAGE_MAX_VALUE, name, max));
    }

    return schema;
  }

  static Request<Schema extends {}, RouteKey extends RouteRequest>(keys: Array<keyof RouteKey>, props: Array<keyof Schema>[], options?: ValidateOptions) {
    return (handler: ValidateHandler<RouteKey>): RouteHandler => {
      return (req, res) => {
        
        try {
          const params: Partial<Record<keyof RouteKey, any>> = {};

          keys.forEach((key, index) => {
            const prop = props[index] ?? [];
            new Validate(prop, options).request(req, key as string);
            params[key as keyof RouteKey] = req[key as keyof RouteRequest] as any;
          });
          
          handler({ ...params, req, res } as any);
        }
        catch (e) {
          new Response(res).parseError(e);
        }
      }
    }
  }

  static Body<Schema extends {}>(props: Array<keyof Schema>, options?: ValidateOptions): RouteHandler {
    return (req, res) => {
      // const vaidate = new this(props, options).body(req);
    };
  }

}