import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SupportedPm } from "../constants.ts";

// Mock the registryUrl function
vi.mock("./registry-url.ts", () => ({
  registryUrl: vi.fn(() => "https://registry.npmjs.org"),
}));

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("fetch-pm-versions", () => {
  let fetchPmVersions: (pm: SupportedPm) => Promise<string[]> = async () =>
    await Promise.resolve([]);

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    // Dynamically import the module to get a fresh instance with cleared cache
    const module = await import("./fetch-pm-versions.ts");
    fetchPmVersions = module.fetchPmVersions;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch npm versions successfully", async () => {
    const mockVersions = {
      versions: {
        "1.0.0": {},
        "1.1.0": {},
        "2.0.0": {},
      },
    };

    mockFetch.mockResolvedValueOnce({
      json: vi.fn().mockResolvedValue(mockVersions),
    });

    const versions = await fetchPmVersions("npm");

    expect(mockFetch).toHaveBeenCalledWith("https://registry.npmjs.org/npm");
    expect(versions).toEqual(["1.0.0", "1.1.0", "2.0.0"]);
  });

  it("should fetch pnpm versions successfully", async () => {
    const mockVersions = {
      versions: {
        "6.0.0": {},
        "7.0.0": {},
        "8.0.0": {},
      },
    };

    mockFetch.mockResolvedValueOnce({
      json: vi.fn().mockResolvedValue(mockVersions),
    });

    const versions = await fetchPmVersions("pnpm");

    expect(mockFetch).toHaveBeenCalledWith("https://registry.npmjs.org/pnpm");
    expect(versions).toEqual(["6.0.0", "7.0.0", "8.0.0"]);
  });

  it("should fetch yarn versions with @yarnpkg/cli versions", async () => {
    const mockYarnVersions = {
      versions: {
        "1.22.0": {},
        "1.22.1": {},
      },
    };

    const mockYarnpkgCliVersions = {
      versions: {
        "3.0.0": {},
        "4.0.0": {},
      },
    };

    mockFetch
      .mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue(mockYarnVersions),
      })
      .mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue(mockYarnpkgCliVersions),
      });

    const versions = await fetchPmVersions("yarn");

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      "https://registry.npmjs.org/yarn",
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      "https://registry.npmjs.org/@yarnpkg/cli",
    );
    expect(versions).toEqual(["1.22.0", "1.22.1", "3.0.0", "4.0.0"]);
  });

  it("should use cached versions on subsequent calls", async () => {
    const mockVersions = {
      versions: {
        "1.0.0": {},
        "2.0.0": {},
      },
    };

    mockFetch.mockResolvedValueOnce({
      json: vi.fn().mockResolvedValue(mockVersions),
    });

    // First call
    const versions1 = await fetchPmVersions("npm");
    // Second call should use cache
    const versions2 = await fetchPmVersions("npm");

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(versions1).toEqual(versions2);
    expect(versions1).toEqual(["1.0.0", "2.0.0"]);
  });

  it("should throw error when response is not an object", async () => {
    mockFetch.mockResolvedValueOnce({
      json: vi.fn().mockResolvedValue("invalid response"),
    });

    await expect(fetchPmVersions("npm")).rejects.toThrow(
      "Failed to fetch npm info from https://registry.npmjs.org/npm.",
    );
  });

  it("should throw error when response does not have versions property", async () => {
    mockFetch.mockResolvedValueOnce({
      json: vi.fn().mockResolvedValue({ name: "npm" }),
    });

    await expect(fetchPmVersions("npm")).rejects.toThrow(
      "Failed to fetch npm info from https://registry.npmjs.org/npm.",
    );
  });

  it("should throw error when versions property is not an object", async () => {
    mockFetch.mockResolvedValueOnce({
      json: vi.fn().mockResolvedValue({ versions: "invalid" }),
    });

    await expect(fetchPmVersions("npm")).rejects.toThrow(
      "Failed to fetch npm info from https://registry.npmjs.org/npm.",
    );
  });

  it("should handle fetch failure", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    await expect(fetchPmVersions("npm")).rejects.toThrow("Network error");
  });

  const supportedPms: SupportedPm[] = ["npm", "pnpm", "yarn"];

  supportedPms.forEach((pm) => {
    if (pm !== "yarn") {
      it(`should fetch ${pm} versions with single registry call`, async () => {
        const mockVersions = {
          versions: {
            "1.0.0": {},
            "2.0.0": {},
          },
        };

        mockFetch.mockResolvedValueOnce({
          json: vi.fn().mockResolvedValue(mockVersions),
        });

        const versions = await fetchPmVersions(pm);

        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(mockFetch).toHaveBeenCalledWith(
          `https://registry.npmjs.org/${pm}`,
        );
        expect(versions).toEqual(["1.0.0", "2.0.0"]);
      });
    }
  });
});
