export interface AnalysisMetadata {
    num_of_components: number;
    num_of_modules: number;
    num_of_exports: number;
    num_of_dependencies: number;
    num_of_commits?: number;
    num_of_deltas?: number;
    analyze_duration_msec?: number;
    parse_duration_msec?: number;
    date_extraction_msec?: number;
    duration_msec: number;
    cli_version?: string;
    cli_params?: Record<string, unknown>;
    cli_config?: unknown;
    argv?: string;
    node_version?: string;
    device_info?: {
        os: string;
        arch: string;
        version: string;
    };
    ci_vendor?: string;
    mem_usages?: {
        before_scan_rss: number;
        after_file_dates_rss: number;
        after_project_setup_rss: number;
        after_parse_rss: number;
        after_analyze_rss: number;
    };
}
