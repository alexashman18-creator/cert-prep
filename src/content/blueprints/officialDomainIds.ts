/**
 * Official domain ids from verified blueprints.
 * Used when a Coming Soon catalog entry still has an empty domains array,
 * so production questions can be validated without enabling the exam.
 */
export const OFFICIAL_BLUEPRINT_DOMAIN_IDS: Record<string, readonly string[]> = {
  az900: ['cloud_concepts', 'architecture_services', 'management_governance'],
  dp900: [
    'describe_core_data_concepts',
    'identify_considerations_for_relational_data_on_azure',
    'describe_considerations_for_working_with_non_relational_data_on_azure',
    'describe_an_analytics_workload_on_azure',
  ],
  ai901: ['identify_ai_concepts_and_capabilities', 'implement_ai_solutions_by_using_microsoft_foundry'],
  az104: [
    'manage_azure_identities_and_governance',
    'implement_and_manage_storage',
    'deploy_and_manage_azure_compute_resources',
    'implement_and_manage_virtual_networking',
    'monitor_and_maintain_azure_resources',
  ],
  ai200: [
    'develop_containerized_solutions_on_azure',
    'develop_ai_solutions_by_using_azure_data_management_services',
    'connect_to_and_consume_azure_services',
    'secure_monitor_and_troubleshoot_azure_solutions',
  ],
  sc500: [
    'manage_identity_access_and_governance',
    'secure_storage_databases_and_networking',
    'secure_compute',
    'manage_and_monitor_security_posture',
  ],
  dp300: [
    'plan_and_implement_data_platform_resources',
    'implement_a_secure_environment',
    'monitor_configure_and_optimize_database_resources',
    'configure_and_manage_automation_of_tasks',
    'plan_and_configure_a_high_availability_and_disaster_recovery_ha_dr_envir',
  ],
  dp700: [
    'implement_and_manage_an_analytics_solution',
    'ingest_and_transform_data',
    'monitor_and_optimize_an_analytics_solution',
  ],
  ai103: [
    'plan_and_manage_an_azure_ai_solution',
    'implement_generative_ai_and_agentic_solutions',
    'implement_computer_vision_solutions',
    'implement_text_analysis_solutions',
    'implement_information_extraction_solutions',
  ],
  az305: [
    'design_identity_governance_and_monitoring_solutions',
    'design_data_storage_solutions',
    'design_business_continuity_solutions',
    'design_infrastructure_solutions',
  ],
  az400: [
    'design_and_implement_processes_and_communications',
    'design_and_implement_a_source_control_strategy',
    'design_and_implement_build_and_release_pipelines',
    'develop_a_security_and_compliance_plan',
    'implement_an_instrumentation_strategy',
  ],
};

export function officialDomainIdsFor(certificationId: string | undefined): readonly string[] {
  if (!certificationId) {
    return [];
  }
  return OFFICIAL_BLUEPRINT_DOMAIN_IDS[certificationId] ?? [];
}
