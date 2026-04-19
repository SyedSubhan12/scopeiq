export interface OembedPreview {
  provider: "figma" | "loom" | "youtube" | "vimeo" | "unknown";
  title: string | null;
  thumbnailUrl: string | null;
  authorName: string | null;
  html: string | null;
  width: number | null;
  height: number | null;
}

const PROVIDERS: Array<{
  match: RegExp;
  provider: OembedPreview["provider"];
  endpoint: (url: string) => string;
}> = [
  {
    match: /(^|\.)youtube\.com|youtu\.be/i,
    provider: "youtube",
    endpoint: (u) => `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(u)}`,
  },
  {
    match: /(^|\.)vimeo\.com/i,
    provider: "vimeo",
    endpoint: (u) => `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(u)}`,
  },
  {
    match: /(^|\.)loom\.com/i,
    provider: "loom",
    endpoint: (u) => `https://www.loom.com/v1/oembed?format=json&url=${encodeURIComponent(u)}`,
  },
  {
    match: /(^|\.)figma\.com/i,
    provider: "figma",
    endpoint: (u) => `https://www.figma.com/api/oembed?url=${encodeURIComponent(u)}`,
  },
];

export async function fetchOembedPreview(url: string): Promise<OembedPreview> {
  let host: string;
  try {
    host = new URL(url).host;
  } catch {
    return emptyPreview("unknown");
  }

  const matched = PROVIDERS.find((p) => p.match.test(host));
  if (!matched) return emptyPreview("unknown");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);
  try {
    const res = await fetch(matched.endpoint(url), {
      headers: { accept: "application/json" },
      signal: controller.signal,
    });
    if (!res.ok) return emptyPreview(matched.provider);
    const raw = (await res.json()) as Record<string, unknown>;
    return {
      provider: matched.provider,
      title: typeof raw.title === "string" ? raw.title : null,
      thumbnailUrl: typeof raw.thumbnail_url === "string" ? raw.thumbnail_url : null,
      authorName: typeof raw.author_name === "string" ? raw.author_name : null,
      html: typeof raw.html === "string" ? raw.html : null,
      width: typeof raw.width === "number" ? raw.width : null,
      height: typeof raw.height === "number" ? raw.height : null,
    };
  } catch {
    return emptyPreview(matched.provider);
  } finally {
    clearTimeout(timeout);
  }
}

function emptyPreview(provider: OembedPreview["provider"]): OembedPreview {
  return {
    provider,
    title: null,
    thumbnailUrl: null,
    authorName: null,
    html: null,
    width: null,
    height: null,
  };
}
