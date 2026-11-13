export type LogoCapability = "cad-validated" | "logo-sourced-cad-pending" | "source-pending";
export interface LogoFeatureRegion {
 id: string;
 construction: string;
 crown_height_mm: number | null;
 bevel_width_mm: number | null;
 mesh_group: "body" | "accent";
 approval: "pending" | "validated-reference";
}
/** Independent source, technical and rights states. No generic extrusion implies readiness. */
export interface AutomotiveLogoDefinition {
 id: string;
 name: string;
 asset?: string;
 source_url: string;
 original_sha256: string;
 sanitized_sha256?: string;
 artwork_license: string;
 trademark_authorization: string;
 commercially_authorized: boolean;
 capability: LogoCapability;
 production_ready: boolean;
 target_box_mm: number[];
 minimum_feature_mm: number;
 feature_regions: LogoFeatureRegion[];
 profile_parameters: Record<string, number | null>;
 local_corrections: unknown[];
 mesh_grouping: string[];
 validation_required: string[];
 profile_plan: string;
}
