import { RouteHandler, RouteRequest, RouteResponse } from "@/types/api";
import { PTR, ParseOptions, Path, TokensToRegexpOptions } from "./PTR";
import { strify } from "@/helpers/strify";

export class RouteLayer {

  private keys: any[] = [];

  private regex: RegExp;

  private handler: RouteHandler;

  private name: string;

  private params: any;

  private path?: Path;

  private fastStar: boolean;

  private fastSlash: boolean;

  constructor(pathname: Path, handler: RouteHandler, options?: TokensToRegexpOptions & ParseOptions) {
    this.regex = PTR.pathToRegex(pathname, this.keys, {});
    this.handler = handler;
    this.name = handler.name || '<anonymous>';
    this.params = undefined;
    this.path = undefined;

    this.fastStar = strify.is(pathname as string, "*");
    this.fastSlash = strify.is(pathname as string, "/") && options?.end === false;
  }

  match(path: string) {
    let match
  
    if (path != null) {
      if (this.fastSlash) {
        this.params = {}
        this.path = ''
        return true
      }
  
      if (this.fastStar) {
        this.params = {'0': RouteLayer.decode(path)}
        this.path = path;
        return true
      }

      match = this.regex.exec(path)
    }
  
    if (!match) {
      this.params = undefined;
      this.path = undefined;
      return false;
    }
  
    this.params = {};
    this.path = match[0]
  
    var keys = this.keys;
    var params = this.params;
  
    for (var i = 1; i < match.length; i++) {
      var key = keys[i - 1];
      var prop = key.name;
      var val = RouteLayer.decode(match[i])
  
      if (val !== undefined || !(Object.hasOwnProperty.call(params, prop))) {
        params[prop] = val;
      }
    }
  
    return true;
  }

  handle(path: string, req: RouteRequest, res: RouteResponse) {
    console.log(this.match(path));
    this.match(path) && this.handler?.(req, res);
  }

  static decode(value: string) {
    if (typeof value !== 'string' || value.length === 0) {
      return value;
    }
  
    try {
      return decodeURIComponent(value);
    } 
    catch (err) {
      if (err instanceof URIError) {
        err.message = 'Failed to decode param \'' + value + '\'';
        (err as any).status = (err as any).statusCode = 400;
      }
  
      throw err;
    }
  }
}


// export class RouteLayer {

//   handle: any;

//   name: string;

//   pathname: PathStatic | undefined;

//   regexp: PathToRegex

//   keys: any;

//   params: Record<string, string> | undefined = {};

//   constructor(pathname: PathStatic, options?: PathToRegexOptions, fn?: any) {
//     this.handle = fn;
//     this.name = fn?.name || '<anonymous>';
//     this.pathname = undefined;
//     this.regexp = new PathToRegex(pathname, options);

//     this.regexp.fast_star = pathname === '*';
//     this.regexp.fast_slash = pathname === '/' && options?.toEnd === false;
//   }

//   handleError<Data = any, User = any>(error: any, req: RouteRequest<User>, res: RouteResponse<Data>, handler: Function) {
//     if (this.handle?.length !== 4) {
//       return handler(error);
//     }
  
//     try {
//       this.handle?.(error, req, res, handler);
//     } catch (err) {
//       handler(err);
//     }
//   }

//   handleRequest<Data = any, User = any>(req: RouteRequest<User>, res: RouteResponse<Data>, handler: Function) {
//     if (this.handle?.length > 3) {
//       return handler();
//     }
  
//     try {
//       this.handle?.(req, res, handler);
//     } catch (err) {
//       handler(err);
//     }
//   }

//   match(pathname: string) {
//     let match
  
//     if (pathname != null) {
//       if (this.regexp.fast_slash) {
//         this.params = {}
//         this.pathname = '';
//         return true
//       }
  
//       if (this.regexp.fast_star) {
//         this.params = {'0': RouteLayer.decodeParam(pathname)}
//         this.pathname = pathname;
//         return true
//       }
  
//       match = this.regexp.exec(pathname);
//     }
  
//     if (!match) {
//       this.params = undefined;
//       this.pathname = undefined;
//       return false;
//     }
  
//     this.params = {};
//     this.pathname = match[0]
  
//     var keys = this.keys;
//     var params = this.params;
  
//     for (var i = 1; i < match.length; i++) {
//       var key = keys[i - 1];
//       var prop = key.name;
//       var val = RouteLayer.decodeParam(match[i])
  
//       if (val !== undefined || !(Object.hasOwnProperty.call(params, prop))) {
//         params[prop] = val;
//       }
//     }
  
//     return true;
//   }

//   static decodeParam(val: any) {
//     if (typeof val !== 'string' || val.length === 0) {
//       return val;
//     }
  
//     try {
//       return decodeURIComponent(val);
//     } catch (err) {
//       if (err instanceof URIError) {
//         err.message = 'Failed to decode param \'' + val + '\'';
//         (err as any).status = (err as any).statusCode = 400;
//       }
  
//       throw err;
//     }
//   }
// }