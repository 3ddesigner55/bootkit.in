type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
};

type BackendHeroBanner = {
  _id?: string;
  id?: string;
  desktopImage: string;
  mobileImage?: string;
  title: string;
  subtitle?: string;
  buttonText?: string;
  buttonLink?: string;
  displayOrder: number;
  collectionHub?: string | null;
  active: boolean;
};

export type AdminHeroBanner = {
  id: string;
  image: string;
  mobileImage: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  displayOrder: number;
  collectionHub?: string | null;
  active: boolean;
};

export type AdminHeroBannerPayload = Omit<AdminHeroBanner, "id" | "image"> & {
  desktopImage: string;
};

function getApiUrl(path: string) {
  const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(
    /\/$/,
    "",
  );

  return `${baseUrl}${path}`;
}

function toHeroBanner(banner: BackendHeroBanner): AdminHeroBanner {
  const id = banner.id || banner._id;

  if (!id) {
    throw new Error("Hero banner response is missing an identifier.");
  }

  return {
    id,
    image: banner.desktopImage,
    mobileImage: banner.mobileImage ?? "",
    title: banner.title,
    subtitle: banner.subtitle ?? "",
    buttonText: banner.buttonText ?? "",
    buttonLink: banner.buttonLink ?? "",
    displayOrder: banner.displayOrder,
    collectionHub: banner.collectionHub ?? null,
    active: banner.active,
  };
}

async function request<T>(
  path: string,
  accessToken: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(getApiUrl(path), {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...init.headers,
    },
  });
  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !payload.success || payload.data === undefined) {
    throw new Error(payload.message || "Hero banner request failed.");
  }

  return payload.data;
}

export async function getAdminHeroBanners(accessToken: string) {
  const data = await request<BackendHeroBanner[]>(
    "/admin/hero-banners",
    accessToken,
  );

  return data.map(toHeroBanner);
}

export async function createAdminHeroBanner(
  accessToken: string,
  banner: AdminHeroBannerPayload,
) {
  const data = await request<BackendHeroBanner>(
    "/admin/hero-banners",
    accessToken,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(banner),
    },
  );

  return toHeroBanner(data);
}

export async function updateAdminHeroBanner(
  accessToken: string,
  bannerId: string,
  banner: Partial<AdminHeroBannerPayload>,
) {
  const data = await request<BackendHeroBanner>(
    `/admin/hero-banners/${bannerId}`,
    accessToken,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(banner),
    },
  );

  return toHeroBanner(data);
}

export async function deleteAdminHeroBanner(
  accessToken: string,
  bannerId: string,
) {
  await request<BackendHeroBanner>(
    `/admin/hero-banners/${bannerId}`,
    accessToken,
    {
      method: "DELETE",
    },
  );
}

export async function uploadAdminHeroBannerImages(
  accessToken: string,
  files: { desktopImage?: File; mobileImage?: File },
) {
  const formData = new FormData();

  if (files.desktopImage) formData.append("desktopImage", files.desktopImage);
  if (files.mobileImage) formData.append("mobileImage", files.mobileImage);

  return request<{ desktopImage?: string; mobileImage?: string }>(
    "/admin/hero-banners/upload",
    accessToken,
    { method: "POST", body: formData },
  );
}
