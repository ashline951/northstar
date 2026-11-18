/**
 * Demo records so the list views have something to show: 61 Ideas, Demands
 * and Projects across every state, with realistic LLUH IS titles, assignees
 * from the roster and a mix of active and inactive.
 *
 * All marked created_by = 'demo seed', so they can be removed in one statement:
 *   delete from northstar_records where created_by = 'demo seed';
 *
 * The guard at the end means re-running this inserts nothing.
 */
export const DEMO_RECORDS_SQL = `
      insert into northstar_records
        (title, lifecycle, state, assigned_to, assigned_group, is_active, suffix, created_by)
      select v.title, v.lifecycle, v.state, v.assigned_to, v.assigned_group, v.is_active,
             to_char(now(), 'YY') || lpad(nextval('northstar_record_seq')::text, 5, '0'),
             'demo seed'
      from (values
        ('Single intake form for all IS requests', 'Idea', 'Submitted', 'KRios@llu.edu', 'Business Development CH', true),
        ('Detect duplicate project requests at intake', 'Idea', 'Draft', 'CriscianeTran@llu.edu', 'Business Process Management', true),
        ('Self-service status page for requesters', 'Idea', 'Submitted', 'rashline@llu.edu', 'Business Process Management', true),
        ('Retire the shared PMO mailbox', 'Idea', 'Accepted', 'EHossain@llu.edu', 'Apps: Cardiology', true),
        ('Auto-draft business cases from a short description', 'Idea', 'Idea Closed', 'DSeverson@llu.edu', 'LLU IS Desktop Support', false),
        ('Flag projects competing for the same people', 'Idea', 'Idea Closed', 'rtinnelly@llu.edu', 'Apps: ADT/Registration', false),
        ('Benefits check-in six months after go-live', 'Idea', 'Idea Closed', 'EHossain@llu.edu', 'IS Project Management Office', true),
        ('One view of every Epic-touching project', 'Idea', 'Draft', 'eellis@llu.edu', 'Patient Safety and Reliability', true),
        ('Replace the weekly status spreadsheet', 'Idea', 'Accepted', 'eellis@llu.edu', 'Apps: ADT/Registration', true),
        ('Standard intake questions per application area', 'Idea', 'Idea Closed', 'GOngsioco@llu.edu', 'Business Process Management', false),
        ('Surface risks from similar past projects', 'Idea', 'Draft', 'AFineganredell@llu.edu', 'Business Process Management', true),
        ('Plain-language portfolio search for executives', 'Idea', 'Accepted', 'GEODiaz@llu.edu', 'Business Process Management', true),
        ('Automatic meeting notes to action items', 'Idea', 'Accepted', 'BLaurent@llu.edu', 'Apps: ADT/Registration', true),
        ('Capacity view across operations and projects', 'Idea', 'Submitted', 'dpharris@llu.edu', 'LLU IS Administrative Systems', true),
        ('Retire duplicate SharePoint project sites', 'Idea', 'Submitted', 'AFineganredell@llu.edu', 'LLU IS Desktop Support', true),
        ('Epic Beaker upgrade readiness assessment', 'Demand', 'Qualified', 'MHernand@llu.edu', 'IS Project Management Office', true),
        ('Clear Skye identity governance rollout', 'Demand', 'Submitted', 'MarissaForte@llu.edu', 'Apps: ADT/Registration', true),
        ('ServiceNow SPM module evaluation', 'Demand', 'Deferred', 'eellis@llu.edu', 'LLU IS Desktop Support', true),
        ('Ambulatory scheduling template cleanup', 'Demand', 'Screening', 'MHernand@llu.edu', 'LLU IS Desktop Support', true),
        ('Nurse call system replacement scoping', 'Demand', 'Deferred', 'KRios@llu.edu', 'LLU IS Administrative Systems', true),
        ('Imaging archive migration assessment', 'Demand', 'DMND Closed', 'DSeverson@llu.edu', 'LLU IS Desktop Support', false),
        ('Pharmacy inventory interface rebuild', 'Demand', 'Screening', 'rtinnelly@llu.edu', 'Apps: Cardiology', true),
        ('Badge access integration with Entra', 'Demand', 'Qualified', 'MarissaForte@llu.edu', 'Apps: Cardiology', true),
        ('Patient portal single sign-on', 'Demand', 'Draft', 'JKoelliker@llu.edu', 'Business Development CH', true),
        ('Lab result routing rules overhaul', 'Demand', 'Approved', 'DWilly@llu.edu', 'Apps: ADT/Registration', true),
        ('Teams telephony pilot for clinics', 'Demand', 'Screening', 'EHossain@llu.edu', 'IS Project Management Office', false),
        ('Device inventory reconciliation', 'Demand', 'Qualified', 'VJMontoya@llu.edu', 'Business Development CH', true),
        ('Downtime procedure documentation refresh', 'Demand', 'Deferred', 'rtinnelly@llu.edu', 'Apps: Cardiology', true),
        ('Research data warehouse scoping', 'Demand', 'Deferred', 'CriscianeTran@llu.edu', 'Apps: ADT/Registration', true),
        ('Credentialing workflow automation', 'Demand', 'DMND Closed', 'DWilly@llu.edu', 'LLU IS Desktop Support', false),
        ('Bed management dashboard consolidation', 'Demand', 'Qualified', 'TBrinkley@llu.edu', 'IS Project Management Office', false),
        ('Secure file transfer replacement', 'Demand', 'DMND Closed', 'AFineganredell@llu.edu', 'Business Process Management', true),
        ('Vendor remote access review', 'Demand', 'DMND Closed', 'MarissaForte@llu.edu', 'LLU IS Administrative Systems', false),
        ('Northstar portfolio management proof of concept', 'Project', 'Monitor/Control', 'dpharris@llu.edu', 'LLU IS Desktop Support', true),
        ('Central Services tracker replacement', 'Project', 'Prj Closed', 'EHossain@llu.edu', 'Business Process Management', false),
        ('Entra ID conditional access rollout', 'Project', 'Initiate', 'MHernand@llu.edu', 'LLU IS Desktop Support', true),
        ('Epic 2026 quarterly upgrade', 'Project', 'Prj Closed', 'CriscianeTran@llu.edu', 'Patient Safety and Reliability', false),
        ('Windows 11 fleet migration', 'Project', 'Execute', 'AFineganredell@llu.edu', 'LLU IS Desktop Support', false),
        ('Infusion pump interoperability', 'Project', 'Execute', 'TBrinkley@llu.edu', 'IS Project Management Office', true),
        ('Cardiology PACS refresh', 'Project', 'Initiate', 'AFineganredell@llu.edu', 'IS Project Management Office', false),
        ('Emergency department throughput dashboard', 'Project', 'Prj Closed', 'VJMontoya@llu.edu', 'LLU IS Technical Services', false),
        ('Revenue cycle denials analytics', 'Project', 'Monitor/Control', 'CriscianeTran@llu.edu', 'Business Process Management', true),
        ('Telehealth platform consolidation', 'Project', 'Monitor/Control', 'rashline@llu.edu', 'LLU IS Technical Services', true),
        ('Clinical documentation improvement rollout', 'Project', 'Plan', 'BLaurent@llu.edu', 'LLU IS Desktop Support', true),
        ('Network segmentation phase two', 'Project', 'Plan', 'rashline@llu.edu', 'Apps: ADT/Registration', true),
        ('Disaster recovery failover exercise', 'Project', 'Monitor/Control', 'DWilly@llu.edu', 'IS Project Management Office', true),
        ('Lab information system interface upgrade', 'Project', 'Monitor/Control', 'EHossain@llu.edu', 'LLU IS Technical Services', true),
        ('Specialty pharmacy workflow build', 'Project', 'Initiate', 'dpharris@llu.edu', 'Apps: Cardiology', true),
        ('Surgical scheduling optimization', 'Project', 'Monitor/Control', 'TBrinkley@llu.edu', 'Business Development CH', true),
        ('Patient transport dispatch system', 'Project', 'Execute', 'MarissaForte@llu.edu', 'LLU IS Desktop Support', true),
        ('Medical device security monitoring', 'Project', 'Execute', 'JKoelliker@llu.edu', 'LLU IS Desktop Support', true),
        ('Data loss prevention expansion', 'Project', 'Plan', 'GOngsioco@llu.edu', 'Apps: Cardiology', true),
        ('Employee onboarding automation', 'Project', 'Plan', 'TBrinkley@llu.edu', 'LLU IS Desktop Support', true),
        ('Clinic kiosk check-in pilot', 'Project', 'Initiate', 'dpharris@llu.edu', 'Business Development CH', true),
        ('Radiology dictation replacement', 'Project', 'Initiate', 'jmgrove@llu.edu', 'IS Project Management Office', true),
        ('Oncology treatment plan templates', 'Project', 'Prj Closed', 'BLaurent@llu.edu', 'LLU IS Technical Services', false),
        ('Supply chain par level automation', 'Project', 'Plan', 'jmgrove@llu.edu', 'Business Development CH', true),
        ('Enterprise imaging viewer rollout', 'Project', 'Execute', 'jmgrove@llu.edu', 'LLU IS Technical Services', true),
        ('Nursing documentation flowsheet redesign', 'Project', 'Execute', 'jmgrove@llu.edu', 'Apps: ADT/Registration', true),
        ('Population health registry build', 'Project', 'Monitor/Control', 'MHernand@llu.edu', 'LLU IS Desktop Support', false),
        ('Interpreter services scheduling', 'Project', 'Prj Closed', 'DWilly@llu.edu', 'Business Process Management', true)
      ) as v(title, lifecycle, state, assigned_to, assigned_group, is_active)
      where not exists (
        select 1 from northstar_records where created_by = 'demo seed'
      )
`;
