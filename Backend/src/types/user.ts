export interface GetUsersOptions {
  requesterId: string;
  page: number;
  limit: number;
  search?: string;
  role?: string;
}
