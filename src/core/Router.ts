import { RouteErrorHandler, RouteHandler, RouteRequest, RouteResponse } from "@/types/api";
import { HttpMethod } from "./enums/method";
import { RouteLayer } from "./Layer";
import { Path } from "./PTR";

export class Router {

  private _request!: RouteRequest;

  private _response!: RouteResponse;

  private _routes: string[] = [];

  private _errorHandlers: RouteErrorHandler[] = [];

  private _endpoints: Partial<Record<HttpMethod | "All", RouteLayer[]>> = {};

  private _prefix: string = "";

  private stacks: Array<RouteHandler[]> = [];

  constructor(prefix = "") {
    this._prefix = prefix;
  }

  private setRequest(res: RouteRequest<any>) {
    this._request = res;
    return this;
  }

  private setResponse(res: RouteResponse) {
    this._response = res;
    return this;
  }

  private start() {
    if (!this._request.query.routes) {
      throw new Error("API Routes file incorrect. Please change file is \"[[...routes]].ts\"");
    }

    const routeMethod = this._request.method as HttpMethod;
    let url = this._request.url;

    if (this._prefix && !url?.startsWith(this._prefix)) {
      return;
    }

    if (this._prefix) {
      url = url?.replace(this._prefix, "");
    }

    console.log({ url })

    this._endpoints[routeMethod]?.forEach((layer) => {
      console.log(layer);
      layer.handle(url!, this._request, this._response);
    });
  }

  private addRoute<Data = any, User = any>(method: HttpMethod | "All", pathname: Path, handler: RouteHandler<Data, User>) {
    if (!this._endpoints[method]) {
      this._endpoints[method] = [];
    }

    this._endpoints[method]!.push(new RouteLayer(pathname, handler));
    return this;
  }

  private dispatch(req: RouteRequest, res: RouteResponse, done: Function) {
    let idx = 0;
    let sync = 0;

    const stacks = this.stacks;

  }

  use() {

  }

  prefix(prefix: string) {
    this._prefix = prefix;
    return this;
  }

  get<Pathname extends Path, Data = any, User = any>(pathname: Pathname, handler: RouteHandler<Data, User>) {
    return this.addRoute(HttpMethod.GET, pathname, handler);
  }

  post<Pathname extends Path, Data = any, User = any>(pathname: Pathname, handler: RouteHandler<Data, User>) {
    return this.addRoute(HttpMethod.POST, pathname, handler);
  }

  put<Pathname extends Path, Data = any, User = any>(pathname: Pathname, handler: RouteHandler<Data, User>) {
    return this.addRoute(HttpMethod.PUT, pathname, handler);
  }

  patch<Pathname extends Path, Data = any, User = any>(pathname: Pathname, handler: RouteHandler<Data, User>) {
    return this.addRoute(HttpMethod.PATCH, pathname, handler);
  }

  options<Pathname extends Path, Data = any, User = any>(pathname: Pathname, handler: RouteHandler<Data, User>) {
    return this.addRoute(HttpMethod.OPTIONS, pathname, handler);
  }

  delete<Pathname extends Path, Data = any, User = any>(pathname: Pathname, handler: RouteHandler<Data, User>) {
    return this.addRoute(HttpMethod.DELETE, pathname, handler);
  }

  connect<Pathname extends Path, Data = any, User = any>(pathname: Pathname, handler: RouteHandler<Data, User>) {
    return this.addRoute(HttpMethod.CONNECT, pathname, handler);
  }

  trace<Pathname extends Path, Data = any, User = any>(pathname: Pathname, handler: RouteHandler<Data, User>) {
    return this.addRoute(HttpMethod.TRACE, pathname, handler);
  }

  head<Pathname extends Path, Data = any, User = any>(pathname: Pathname, handler: RouteHandler<Data, User>) {
    return this.addRoute(HttpMethod.HEAD, pathname, handler);
  }

  all<Pathname extends Path, Data = any, User = any>(pathname: Pathname, handler: RouteHandler<Data, User>) {
    return this.addRoute("All", pathname, handler);
  }

  listen(): RouteHandler {
    return (req, res) => this.setRequest(req).setResponse(res).start();
  }

}