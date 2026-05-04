export interface NationalIntensity {
  from: string;
  to: string;
  forecast: number | null;
  actual: number | null;
  index: string;
}

export interface RegionalIntensity {
  regionid: number;
  dnoregion: string;
  shortname: string;
  forecast: number;
  index: string;
}

export async function fetchNationalIntensity(): Promise<NationalIntensity | null> {
  try {
    const res = await fetch("https://api.carbonintensity.org.uk/intensity");
    if (!res.ok) return null;
    const json = await res.json() as { data?: Array<{
      from: string; to: string;
      intensity: { forecast: number | null; actual: number | null; index: string }
    }> };
    const d = json.data?.[0];
    if (!d) return null;
    return {
      from: d.from,
      to: d.to,
      forecast: d.intensity.forecast,
      actual: d.intensity.actual,
      index: d.intensity.index,
    };
  } catch {
    return null;
  }
}

// outwardCode: first part of postcode, e.g. "EC1A" or "OX1"
export async function fetchRegionalIntensityByPostcode(
  outwardCode: string
): Promise<RegionalIntensity | null> {
  const code = outwardCode.trim().toUpperCase().replace(/\s/g, "");
  try {
    const res = await fetch(
      `https://api.carbonintensity.org.uk/regional/postcode/${encodeURIComponent(code)}`
    );
    if (!res.ok) return null;
    const json = await res.json() as { data?: Array<{
      regionid: number; dnoregion: string; shortname: string;
      data: Array<{ intensity: { forecast: number; index: string } }>
    }> };
    const region = json.data?.[0];
    if (!region) return null;
    const intensity = region.data?.[0]?.intensity;
    if (!intensity) return null;
    return {
      regionid: region.regionid,
      dnoregion: region.dnoregion,
      shortname: region.shortname,
      forecast: intensity.forecast,
      index: intensity.index,
    };
  } catch {
    return null;
  }
}

export function intensityLabel(gco2kwh: number): string {
  if (gco2kwh <= 50)  return "very low";
  if (gco2kwh <= 100) return "low";
  if (gco2kwh <= 200) return "moderate";
  if (gco2kwh <= 300) return "high";
  return "very high";
}
