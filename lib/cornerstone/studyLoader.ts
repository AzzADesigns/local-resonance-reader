export interface LoadStudyResult {
  files: { name: string; path: string }[];
  imageIds: string[];
  count: number;
}

export async function loadStudyFromPath(dirPath: string): Promise<LoadStudyResult> {
  const res = await fetch("/api/study", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dirPath }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Error loading study");
  }

  return res.json();
}
