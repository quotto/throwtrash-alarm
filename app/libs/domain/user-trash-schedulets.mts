import { TrashSchedule } from 'trash-common';
export class UserTrashSchedule {
    user_id: string;
    trash_schedules: TrashSchedule[];
    constructor(user_id: string, trash_schedules: TrashSchedule[]) {
        this.user_id = user_id;
        this.trash_schedules = trash_schedules;
    }
}