import { TrashSchedule } from 'trash-common';
export class UserTrashSchedule {
    userId: string;
    trashSchedules: TrashSchedule[];
    constructor(userId: string, trashSchedules: TrashSchedule[]) {
        this.userId = userId;
        this.trashSchedules = trashSchedules;
    }
}