export type TicketStatus = 'Open' | 'In Progress' | 'Done';
export type Difficulty = 'S' | 'M' | 'L';

export interface Ticket {
	id: string;
	orgId: string;
	title: string;
	description: string;
	acceptanceCriteria: string[];
	status: TicketStatus;
	assigneeId: string | null;
	difficulty: Difficulty;
	tags: string[];
	createdBy: string;
	createdAt: Date;
	updatedAt: Date;
}
