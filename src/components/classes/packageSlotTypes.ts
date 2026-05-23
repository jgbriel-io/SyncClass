export type Slot = { class_date: string; start_time: string; end_time: string };
export type ScheduleMode = "fixed" | "dynamic";
export const emptySlot: Slot = { class_date: "", start_time: "", end_time: "" };
