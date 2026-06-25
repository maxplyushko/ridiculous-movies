export interface WatchlistMovie {
  id: string;
  title: string;
  description: string;
  rating: number | null;
  watched: boolean;
  createdAt: string;
  updatedAt: string;
}
