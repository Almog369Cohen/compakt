import { NextResponse } from "next/server";
import { z, ZodSchema, ZodError } from "zod";

/**
 * Parse and validate request body against a Zod schema.
 * Returns parsed data on success, or a 400 NextResponse on failure.
 */
export async function validateBody<T>(
  request: Request,
  schema: ZodSchema<T>
): Promise<{ data: T } | { error: NextResponse }> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return {
      error: NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      ),
    };
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    return {
      error: NextResponse.json(
        {
          error: "Validation failed",
          details: formatZodErrors(result.error),
        },
        { status: 400 }
      ),
    };
  }

  return { data: result.data };
}

/**
 * Parse and validate query params against a Zod schema.
 */
export function validateQuery<T>(
  url: string,
  schema: ZodSchema<T>
): { data: T } | { error: NextResponse } {
  const { searchParams } = new URL(url);
  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });

  const result = schema.safeParse(params);
  if (!result.success) {
    return {
      error: NextResponse.json(
        {
          error: "Invalid query parameters",
          details: formatZodErrors(result.error),
        },
        { status: 400 }
      ),
    };
  }

  return { data: result.data };
}

/** Type guard for validation results */
export function isValidationError<T>(
  result: { data: T } | { error: NextResponse }
): result is { error: NextResponse } {
  return "error" in result;
}

/** Format Zod errors into a clean array */
function formatZodErrors(error: ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.length > 0 ? `${issue.path.join(".")}: ` : "";
    return `${path}${issue.message}`;
  });
}

// ─── Common Schemas ───────────────────────────────────────────

export const emailSchema = z.string().email("Invalid email address").transform((v) => v.toLowerCase().trim());

export const otpSchema = z.string().length(6, "OTP must be 6 digits").regex(/^\d{6}$/, "OTP must be numeric");

export const uuidSchema = z.string().uuid("Invalid UUID format");

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const planKeySchema = z.enum(["starter", "pro", "premium", "enterprise"]);
