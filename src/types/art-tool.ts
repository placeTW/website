export interface DesignInfo {
  id: string;
  design_name: string;
  design_thumbnail: string;
  created_by: string;
  handle: string;
  rank: string;
  rank_name: string; // Ensure this property is included
  liked_by: string[];
}
