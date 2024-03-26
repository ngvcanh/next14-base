import { ZodIssue } from "zod";
import { ApiBaseError, ApiBaseResponse, ApiErrorTrace, RouteResponse } from "@/types/api";
import { HttpStatus } from "./enums/status";
import { numify } from "@/helpers/numify";
import { HttpMessage } from "./enums/message";
import { HttpErrorCode } from "./enums/error-code";

export class Response<Data = any> {

  private _res: RouteResponse<Data>;

  private _error: ApiBaseError | null = null;

  private _status: HttpStatus = HttpStatus.ERR_INTERNAL;

  constructor(res: RouteResponse<Data>) {
    this._res = res;
  }

  static isSuccess(status: number) {
    return numify.inRangeLeft(status, 200, 400);
  }

  private initError() {
    if (!this._error) {
      this._error = {
        message: "",
        code: "",
        traces: [],
      };
    }
    return this;
  }

  get(data?: Data) {
    const isSuccess = Response.isSuccess(this._status);
    return {
      error: isSuccess ? null : { ...this._error },
      data: data ?? null,
    } as ApiBaseResponse<Data>;
  }

  error(error: ApiBaseError) {
    this._error = error;
    return this;
  }

  trace(trace: ApiErrorTrace) {
    this.initError()._error!.traces.push({...trace});
    return this;
  }

  status(status: HttpStatus) {
    this._status = status;
    return this;
  }

  message(msg: string) {
    this.initError()._error!.message = msg;
    return this;
  }

  code(code: string) {
    this.initError()._error!.code = code;
    return this;
  }

  notFound(message: string = HttpMessage.ERR_NOT_FOUND) {
    return this
      .status(HttpStatus.ERR_NOT_FOUND)
      .error({
        message,
        code: HttpErrorCode.NOT_FOUND,
        traces: [],
      });
  }

  badRequest(traces: ApiErrorTrace[] = []) {
    return this
      .status(HttpStatus.ERR_BAD_REQUEST)
      .error({
        message: HttpMessage.ERR_BAD_REQUEST,
        code: HttpErrorCode.BAD_REQUEST,
        traces: [ ...traces ],
      });
  }

  internal(message = HttpMessage.ERR_INTERNAL) {
    return this
      .status(HttpStatus.ERR_INTERNAL)
      .error({
        message,
        code: HttpErrorCode.INTERNAL,
        traces: this._error?.traces ?? [],
      });
  }

  forbidden(traces: ApiErrorTrace[] = []) {
    return this
      .status(HttpStatus.FORBIDDEN)
      .error({
        message: HttpMessage.ERR_FORBIDDEN,
        code: HttpErrorCode.FORBIDDEN,
        traces: [...traces],
      });
  }

  unauthorized(traces: ApiErrorTrace[] = []) {
    return this
      .status(HttpStatus.ERR_UNAUTHORIZED)
      .error({
        message: HttpMessage.ERR_UNAUTHORIZED,
        code: HttpErrorCode.UNAUTHORIZED,
        traces: [...traces],
      });
  }

  parseError(error: any) {
    if (Array.isArray(error?.issues)) {
      return this
        .badRequest(
          error.issues.map((issue: ZodIssue) => ({
            path: (Array.isArray(issue.path) ? issue.path : []).join("."),
            summary: issue.message,
            code: issue.code, 
          })),
        )
        .end();
    }

    console.log(error);
  
    return this
      .trace({
        code: error?.code || "",
        summary: error?.message || "",
        path: "",
      })
      .internal()
      .end();
  }

  success(data?: Data) {
    return this.status(HttpStatus.SUCCESS).end(data);
  }

  created(data?: Data) {
    return this.status(HttpStatus.CREATED).end(data);
  }

  end(data?: Data) {
    return this._res.status(this._status).json(this.get(data));
  }
}