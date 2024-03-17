import { TrashSchedule } from "trash-common";

export interface TrashScheduleRepository {
  findTrashScheduleByUserId(user_id: string): Promise<TrashSchedule | null>;
}