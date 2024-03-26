import { Validate } from "@/core/Validate";
import { RouteRequest, RouteResponse } from "@/types/api";

// const validate = Validate.Request(["body", "query"], [["username", "password"], ["id", "email"]]);

interface Body {
  username: string;
  password: string;
}

interface Query {
  id: number;
  email: string;
}

type Params = [Body, Query, RouteRequest, RouteResponse];

const validate: Array<keyof RouteRequest> = ["body", "query"];
const bodyFields = ["username", "password"];
const queryFields = ["id", "email"];

export const login = Validate.Request(["body", "query"], [bodyFields, queryFields])(
  ({ req, res, body, query }) => {
    res.json({ data: { message: "Done" }, error: null });
  }
);
