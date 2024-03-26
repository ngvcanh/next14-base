import { NextApiRequest, NextApiResponse } from "next";
import { ZodIssueCode } from "zod";

export interface ApiErrorTrace {
  path: string;
  summary: string;
  code: ZodIssueCode;
}

export interface ApiBaseError {
  message: string;
  code: string;
  traces: ApiErrorTrace[];
}

export interface ApiErrorResponse {
  error: ApiBaseError;
  data: null;
}

export interface ApiSuccessResponse<Data = any> {
  error: null;
  data: Data;
}

export type ApiBaseResponse<Data = any> = ApiErrorResponse | ApiSuccessResponse<Data>;

export type RouteRequest<User = any> = NextApiRequest & {
  user?: User;
  roles: Record<string, boolean>;
};

export type RouteResponse<Data = any> = NextApiResponse<ApiBaseResponse<Data>>;

export interface RouteHandler<Data = any, User = any> {
  (req: RouteRequest<User>, res: RouteResponse<Data>): any;
};

export interface RouteErrorHandler {
  (error: ApiBaseError): void;
}
