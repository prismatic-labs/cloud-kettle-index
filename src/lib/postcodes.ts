export interface PostcodeResult {
  postcode: string;
  country: string;
  region: string;
  adminDistrict: string;
  itl1Code: string;
  outwardCode: string;
}

export type PostcodeError =
  | "invalid"
  | "northern-ireland"
  | "unsupported-territory"
  | "not-found"
  | "network";

const SUPPORTED_COUNTRIES = new Set(["England", "Scotland", "Wales"]);

function extractOutwardCode(postcode: string): string {
  return postcode.trim().toUpperCase().split(/\s+/)[0] ?? postcode.trim().toUpperCase();
}

// Extract ITL1 prefix from a codes.nuts value (e.g. "TLI32" → "TLI")
export function itl1FromNuts(nuts: string | null | undefined): string | null {
  if (!nuts || nuts.length < 3) return null;
  return nuts.slice(0, 3);
}

export async function lookupPostcode(
  postcode: string
): Promise<{ result: PostcodeResult } | { error: PostcodeError }> {
  const normalised = postcode.trim().replace(/\s+/g, " ").toUpperCase();

  try {
    const res = await fetch(
      `https://api.postcodes.io/postcodes/${encodeURIComponent(normalised)}`
    );

    if (res.status === 404) return { error: "not-found" };
    if (!res.ok)            return { error: "network" };

    const json = await res.json() as {
      status: number;
      result: {
        postcode: string;
        country: string;
        region: string;
        admin_district: string;
        outcode: string;
        codes: { nuts: string };
      }
    };

    if (json.status !== 200 || !json.result) return { error: "not-found" };

    const r = json.result;

    if (r.country === "Northern Ireland") {
      return { error: "northern-ireland" };
    }

    if (!SUPPORTED_COUNTRIES.has(r.country)) {
      return { error: "unsupported-territory" };
    }

    const itl1Code = itl1FromNuts(r.codes?.nuts);
    if (!itl1Code) return { error: "invalid" };

    return {
      result: {
        postcode: r.postcode,
        country: r.country,
        region: r.region,
        adminDistrict: r.admin_district,
        itl1Code,
        outwardCode: r.outcode,
      },
    };
  } catch {
    return { error: "network" };
  }
}

export function postcodeErrorMessage(error: PostcodeError): string {
  switch (error) {
    case "northern-ireland":
      return "This site covers Great Britain only. Northern Ireland's electricity system is operated by SONI and is not included.";
    case "unsupported-territory":
      return "This postcode is outside the area covered by this site (England, Scotland, and Wales only).";
    case "not-found":
      return "Postcode not found. Please check the postcode and try again.";
    case "invalid":
      return "Could not determine the region for this postcode. Please try a different postcode.";
    case "network":
      return "Could not reach the postcode lookup service. Please try again shortly.";
  }
}
