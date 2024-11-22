export interface Entity {
  type: string;
  id: IdType;
  lang: string;
  parentId?: string;
}

export type IdType = string | number;
