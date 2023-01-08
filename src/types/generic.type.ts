import { SortOrder } from 'mongoose';

export type EntityMongoProjections<T> = Partial<Record<keyof T, 0 | 1 | true | false>>;

export interface EntityInput<FilterType, EntityType> {
  filters: FilterType;
  projection?: EntityMongoProjections<EntityType>;
  sortQuery?: Record<string, SortOrder>;
  limit?: number;
  offset?: number;
}
