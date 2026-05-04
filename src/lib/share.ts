export type ShareMethod = "native" | "clipboard";

export async function shareOrCopy(
  title: string,
  text: string,
  url: string,
): Promise<ShareMethod> {
  if (typeof navigator !== "undefined" && navigator.share) {
    await navigator.share({ title, text, url });
    return "native";
  }
  await navigator.clipboard.writeText(text);
  return "clipboard";
}
