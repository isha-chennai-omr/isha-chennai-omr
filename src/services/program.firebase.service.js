import { addDoc, collection, doc, getDoc, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

import commonUtil from "../utils/common-util";

const programCollection = "programs";

class ProgramFirebaseService {
  async listPrograms() {
    try {
      const snapshot = await getDocs(collection(db, programCollection));
      const programs = await Promise.all(
        snapshot.docs.map(async (programSnapshot) => {
          const program = { id: programSnapshot.id, ...programSnapshot.data() };
          if (!program.link && program.linkRef) {
            const linkSnapshot = await getDoc(doc(db, "link-ref", program.linkRef));
            program.destination = linkSnapshot.exists() ? linkSnapshot.data().link || "" : "";
          } else {
            program.destination = program.link || "";
          }
          return program;
        }),
      );
      programs.sort((first, second) =>
        String(first.startDate || first.date || "").localeCompare(String(second.startDate || second.date || "")),
      );
      return { success: true, programs, error: null };
    } catch (error) {
      return { success: false, programs: [], error: error.message || "Unable to load programs." };
    }
  }

  async createProgram({ name, startDate, endDate, startTime, endTime, description, link, linkRef }) {
    const cleanName = String(name || "").trim();
    const cleanStartDate = String(startDate || "").trim();
    const cleanEndDate = String(endDate || "").trim();
    const cleanStartTime = String(startTime || "").trim();
    const cleanEndTime = String(endTime || "").trim();
    const cleanDescription = String(description || "").trim();
    const cleanLink = String(link || "").trim();
    const cleanLinkRef = String(linkRef || "").trim();

    if (!cleanName) return { success: false, error: "Enter a program name." };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanStartDate) || !/^\d{4}-\d{2}-\d{2}$/.test(cleanEndDate))
      return { success: false, error: "Choose valid start and end dates." };
    if (cleanEndDate < cleanStartDate) return { success: false, error: "End date must be on or after the start date." };
    if (!/^\d{2}:\d{2}$/.test(cleanStartTime) || !/^\d{2}:\d{2}$/.test(cleanEndTime))
      return { success: false, error: "Choose valid start and end times." };
    if (cleanEndDate === cleanStartDate && cleanEndTime < cleanStartTime)
      return { success: false, error: "End time must be after the start time." };
    if (cleanLink && !commonUtil.validateUrl(cleanLink)) return { success: false, error: "Enter a valid http/https program link." };
    if (cleanLinkRef && !commonUtil.slugIsValid(cleanLinkRef)) return { success: false, error: "Enter a valid linked link ending." };

    try {
      const reference = await addDoc(collection(db, programCollection), {
        name: cleanName,
        startDate: cleanStartDate,
        endDate: cleanEndDate,
        startTime: cleanStartTime,
        endTime: cleanEndTime,
        description: cleanDescription,
        link: cleanLink,
        linkRef: cleanLinkRef,
        createdAt: serverTimestamp(),
      });
      return { success: true, id: reference.id, error: null };
    } catch (error) {
      console.error(error);
      return { success: false, error: error.message || "Unable to create program." };
    }
  }
}

const programFirebaseService = new ProgramFirebaseService();
export default programFirebaseService;
