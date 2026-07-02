export interface StudyData {
  imageIds: string[];
  patientName: string;
  studyDescription: string;
  numImages: number;
  firstFileName: string;
}

let currentStudy: StudyData | null = null;

export function setStudyData(data: StudyData) {
  if (currentStudy) {
    currentStudy.imageIds.forEach((id) => {
      try { URL.revokeObjectURL(id.replace("wadouri:", "")); } catch (_) {}
    });
  }
  currentStudy = data;
}

export function getStudyData(): StudyData | null {
  return currentStudy;
}

export function clearStudyData() {
  if (currentStudy) {
    currentStudy.imageIds.forEach((id) => {
      try { URL.revokeObjectURL(id.replace("wadouri:", "")); } catch (_) {}
    });
  }
  currentStudy = null;
}
