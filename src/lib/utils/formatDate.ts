type FirestoreTimestamp = {
  toDate: () => Date;
  seconds?: number;
};

export function formatDate(
  date: Date | string | number | FirestoreTimestamp | null | undefined
): string {
  if (!date) return "—";
  try {
    let d: Date;

    if (typeof date === "object" && "toDate" in date) {
      // Firestore Timestamp
      d = date.toDate();
    } else if (typeof date === "object" && "seconds" in date && date.seconds) {
      // Firestore Timestamp without toDate
      d = new Date(Number(date.seconds) * 1000);
    } else {
      d = new Date(date as string | number | Date);
    }

    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(d);
  } catch {
    return "—";
  }
}
