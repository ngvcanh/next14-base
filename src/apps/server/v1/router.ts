import { Router } from "@/core/Router";
import { login } from "./users/login";

const v1 = new Router("/api/v1");

v1.post("/users/login", login);

export { v1 };
