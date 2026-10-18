import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { importMemberSchema } from "./member-import";
import { provisionImportedMember } from "./member-import.server";

export const importCompanyMember = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => importMemberSchema.parse(input))
  .handler(async ({ data }) => {
    const token = (getRequest().headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
    return provisionImportedMember(data, token);
  });