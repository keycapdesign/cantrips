import type { Session } from "./lib/auth";

export type AppVariables = {
  user: Session["user"];
  session: Session["session"];
};
