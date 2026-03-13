import api from "./api";
import { SandboxVerifyRequest } from "@/types/api";

export const bankAPI = {
  verifySandboxLink: (data: SandboxVerifyRequest) =>
    api.post("/api/bank/sandbox-verify", data),
  getSandboxProfile: (sessionToken: string) =>
    api.get("/api/bank/sandbox-balance", {
      params: { session_token: sessionToken },
    }),
};