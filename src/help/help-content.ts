/**
 * Central Help Content for the DLPP Land Case Management System.
 *
 * This file is the single source of truth for:
 *  - Help articles (one per module/topic)
 *  - Role-based guidance
 *  - Guided walkthrough tours
 *  - Route -> Help topic mapping
 *
 * It contains NO React. It can be imported anywhere (server or client).
 */

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type HelpRole =
  | 'System Administrator'
  | 'Executive Management'
  | 'Manager'
  | 'Lawyer / Legal Officer'
  | 'Officer / Registry Clerk';

export const HELP_ROLES: HelpRole[] = [
  'System Administrator',
  'Executive Management',
  'Manager',
  'Lawyer / Legal Officer',
  'Officer / Registry Clerk',
];

export type HelpCategory =
  | 'Getting Started'
  | 'Cases'
  | 'Case Workflow'
  | 'Communications'
  | 'Compliance & Closure'
  | 'Reports'
  | 'Administration';

export const HELP_CATEGORIES: HelpCategory[] = [
  'Getting Started',
  'Cases',
  'Case Workflow',
  'Communications',
  'Compliance & Closure',
  'Reports',
  'Administration',
];

export interface HelpField {
  name: string;
  required: boolean;
  description: string;
}

export interface HelpTourStep {
  /** CSS selector for the element to highlight. Omit for a centred step. */
  element?: string;
  title: string;
  description: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
}

export interface HelpTour {
  id: string;
  title: string;
  /** Help topic this tour belongs to (omitted for standalone tours like the welcome tour). */
  topicId?: string;
  steps: HelpTourStep[];
}

export interface HelpTopic {
  id: string;
  title: string;
  category: HelpCategory;
  /** lucide-react icon name */
  icon: string;
  /** One line shown on cards and in search results. */
  summary: string;
  keywords: string[];
  /** Roles this topic is most relevant to. */
  roles: HelpRole[];
  purpose: string;
  whoShouldUse: string;
  steps: string[];
  requiredFields?: HelpField[];
  commonMistakes: string[];
  bestPractices: string[];
  afterSaving: string[];
  /** Extra guidance shown when a specific role is selected. */
  roleNotes?: Partial<Record<HelpRole, string>>;
  /** Related topic ids shown at the bottom of the article. */
  related: string[];
  /** Optional guided tour id. */
  tourId?: string;
}

/* ------------------------------------------------------------------ */
/* Help Topics                                                         */
/* ------------------------------------------------------------------ */

export const HELP_TOPICS: HelpTopic[] = [
  /* ---------------------------- GETTING STARTED --------------------- */
  {
    id: 'login',
    title: 'Signing In',
    category: 'Getting Started',
    icon: 'LogIn',
    summary: 'How to sign in to the DLPP Legal Case Management System.',
    keywords: ['login', 'sign in', 'password', 'access', 'account', 'log on'],
    roles: HELP_ROLES,
    purpose:
      'The sign-in page is the front door to the system. It confirms who you are and loads only the menus and records your role is allowed to see.',
    whoShouldUse: 'Every staff member with a registered account.',
    steps: [
      'Open the system link provided by your administrator.',
      'Type your official DLPP email address (for example, name@dlpp.gov.pg).',
      'Type your password. Passwords are case sensitive.',
      'Click "Sign In".',
      'You will be taken to your Dashboard or Cases list depending on your role.',
    ],
    requiredFields: [
      { name: 'Email', required: true, description: 'Your official work email address.' },
      { name: 'Password', required: true, description: 'The password created by your administrator or reset by you.' },
    ],
    commonMistakes: [
      'Using a personal email instead of your official DLPP email.',
      'Leaving CAPS LOCK on when typing the password.',
      'Sharing your password with another officer.',
    ],
    bestPractices: [
      'Never share your login. Every action is recorded against the signed-in user.',
      'Log out when you leave your desk, especially on shared computers.',
      'Ask the administrator for a reset if you forget your password rather than guessing repeatedly.',
    ],
    afterSaving: [
      'The system checks your role and permissions.',
      'Your personal menu loads, showing only the modules you may use.',
      'Your sign-in is written to the audit trail.',
    ],
    roleNotes: {
      'System Administrator':
        'If a user cannot sign in, check that their account exists and is assigned to at least one group under User Management.',
    },
    related: ['dashboard', 'user-role-management', 'global-search'],
  },
  {
    id: 'dashboard',
    title: 'Dashboard',
    category: 'Getting Started',
    icon: 'LayoutDashboard',
    summary: 'Read the key numbers, charts and alerts for your cases at a glance.',
    keywords: ['dashboard', 'overview', 'home', 'statistics', 'charts', 'metrics', 'kpi', 'alerts'],
    roles: ['Executive Management', 'Manager', 'Lawyer / Legal Officer', 'System Administrator'],
    purpose:
      'The Dashboard gives a live summary of the whole caseload — how many cases are open, their status, region spread, upcoming deadlines and litigation costs — so you can make decisions quickly.',
    whoShouldUse:
      'Managers and executives who monitor performance, and legal officers who want a quick overview of their work.',
    steps: [
      'Open "Dashboard" from the top of the menu.',
      'Read the metric cards along the top: total cases, active cases, closed cases and urgent items.',
      'Use the status and region charts to see where cases are concentrated.',
      'Check the Alerts card for deadlines and overdue items that need attention.',
      'Click any chart segment or card to jump to the matching list of cases.',
    ],
    commonMistakes: [
      'Thinking the numbers are old — the Dashboard refreshes from live data each time it opens.',
      'Ignoring the Alerts card, which highlights approaching court dates and compliance deadlines.',
    ],
    bestPractices: [
      'Start each day on the Dashboard to see what needs attention first.',
      'Use the year-comparison cards to explain trends in management meetings.',
    ],
    afterSaving: [
      'The Dashboard is read-only, so nothing is saved here.',
      'Clicking a figure filters the Cases list so you can act on those records.',
    ],
    roleNotes: {
      'Executive Management':
        'Focus on the trend and comparison cards for reporting to senior management. Detail is one click away in Reports.',
      'Manager':
        'Use the Alerts and workflow-progress cards to spot cases that are stuck at one stage.',
    },
    related: ['reports', 'cases-list', 'global-search'],
    tourId: 'dashboard',
  },
  {
    id: 'global-search',
    title: 'Global Search',
    category: 'Getting Started',
    icon: 'Search',
    summary: 'Find any case, party, document or task from anywhere in the system.',
    keywords: ['search', 'find', 'lookup', 'global', 'quick find', 'case number'],
    roles: HELP_ROLES,
    purpose:
      'Global Search lets you jump straight to a record without opening menus. It looks across cases, parties, documents, tasks and more.',
    whoShouldUse: 'Everyone. It is the fastest way to open a known record.',
    steps: [
      'Click the search box in the top header, or press the keyboard shortcut shown inside it.',
      'Type a case number, party name, land reference or a few words from a title.',
      'Results appear grouped by type as you type.',
      'Click a result, or use the arrow keys and press Enter, to open it.',
    ],
    commonMistakes: [
      'Typing too many words. A case number or a single clear keyword works best.',
      'Expecting results for records you do not have permission to view.',
    ],
    bestPractices: [
      'Search by case number when you have it — it is the most exact match.',
      'Learn the keyboard shortcut to save time during busy periods.',
    ],
    afterSaving: [
      'Selecting a result opens that record directly.',
      'Search does not change any data.',
    ],
    related: ['cases-list', 'dashboard', 'case-details'],
  },

  /* ---------------------------- CASES ------------------------------ */
  {
    id: 'cases-list',
    title: 'Cases List',
    category: 'Cases',
    icon: 'FolderOpen',
    summary: 'Browse, filter, search and export all land cases in the register.',
    keywords: ['cases', 'list', 'register', 'filter', 'export', 'search cases', 'all cases', 'my cases'],
    roles: HELP_ROLES,
    purpose:
      'The Cases List is the central register of every land case. From here you can search, filter, open, edit and export cases.',
    whoShouldUse:
      'All staff. Registry clerks maintain it, officers work their assigned cases, and managers review the whole list.',
    steps: [
      'Open "All Cases" (or "My Cases" to see only cases assigned to you).',
      'Use the search box to find a case by number, title or party.',
      'Use the Status, Type, Region and Priority filters to narrow the list.',
      'Set a date range to see cases registered within a period.',
      'Click the eye icon to open a case, the pencil to edit, or the bin to delete (if allowed).',
      'Use the Export buttons to download the filtered list to Excel or PDF.',
    ],
    requiredFields: [],
    commonMistakes: [
      'Forgetting that the "Active" filter hides closed cases — switch to "All" or tick "Show closed" to see everything.',
      'Deleting a case instead of closing it. Deletion removes the record; closure keeps the history.',
      'Exporting the full register when only a filtered set is needed.',
    ],
    bestPractices: [
      'Save the filters you use often so you can reapply them in one click.',
      'Use "My Cases" to focus on your own workload.',
      'Export a filtered view for meetings rather than printing the whole register.',
    ],
    afterSaving: [
      'Any edit or new case appears in the list immediately (the list updates live).',
      'Exports are generated on your device and do not change the records.',
    ],
    roleNotes: {
      'Officer / Registry Clerk':
        'Use "My Cases" to see what has been assigned to you and keep each case up to date.',
      'Manager':
        'Filter by officer or region to check how work is spread across the team.',
    },
    related: ['register-new-case', 'minimal-case-creation', 'case-details', 'reports'],
    tourId: 'cases-list',
  },
  {
    id: 'minimal-case-creation',
    title: 'Minimal Case Creation',
    category: 'Cases',
    icon: 'FilePlus2',
    summary: 'Quickly open a case with only the essential details when time is short.',
    keywords: ['minimal', 'quick case', 'fast', 'new case', 'create case', 'draft'],
    roles: ['Officer / Registry Clerk', 'Lawyer / Legal Officer', 'Manager'],
    purpose:
      'Minimal Case Creation lets you open a new case record fast, capturing only the must-have details. You can add parties, documents and other information later.',
    whoShouldUse:
      'Registry clerks and officers who need to record a matter immediately — for example when a walk-in or urgent document arrives — and will complete the details afterwards.',
    steps: [
      'Choose the quick "Minimal" case entry option.',
      'Enter a short, clear case title.',
      'Choose the case type.',
      'Save to generate a case number.',
      'Open the new case later to add parties, documents, land parcels and other details.',
    ],
    requiredFields: [
      { name: 'Case title', required: true, description: 'A short description so the case can be recognised.' },
      { name: 'Case type', required: true, description: 'The category of matter (dispute, court matter, title claim, etc.).' },
    ],
    commonMistakes: [
      'Leaving the title vague, such as "Land case", which makes the record hard to find later.',
      'Creating a minimal case and never returning to complete the missing details.',
    ],
    bestPractices: [
      'Use minimal entry only when you are short of time, then complete the case the same day.',
      'Write a title that includes a name or location so others can recognise it.',
    ],
    afterSaving: [
      'A unique case number is generated automatically.',
      'The case appears in the Cases List with a status that shows it is new.',
      'You can open it at any time to add the remaining information.',
    ],
    related: ['register-new-case', 'cases-list', 'case-details', 'add-parties'],
  },
  {
    id: 'register-new-case',
    title: 'Register New Case',
    category: 'Cases',
    icon: 'FilePlus',
    summary: 'Create a complete new land case with all its details in one form.',
    keywords: ['register', 'new case', 'create', 'open case', 'intake', 'lodge'],
    roles: ['Officer / Registry Clerk', 'Lawyer / Legal Officer', 'Manager'],
    purpose:
      'Registering a new case creates the official record for a land matter and gives it a unique case number. This is the starting point of the whole workflow.',
    whoShouldUse:
      'Registry clerks and legal officers who receive a new matter and need to place it on the register.',
    steps: [
      'Open "Register Case" from the Case Workflow menu.',
      'Enter the case title and a clear description of the matter.',
      'Select the case type, priority and region.',
      'Add the case origin and any court file number if the matter is already in court.',
      'Add the parties involved (claimant, respondent, etc.).',
      'Attach any documents you already have.',
      'Review everything, then click Save to register the case.',
    ],
    requiredFields: [
      { name: 'Case title', required: true, description: 'A short official name for the case.' },
      { name: 'Case type', required: true, description: 'The category of the matter.' },
      { name: 'Description', required: false, description: 'A fuller explanation of what the case is about.' },
      { name: 'Region', required: false, description: 'The province or region the land is in.' },
      { name: 'Priority', required: false, description: 'How urgent the case is (low, medium, high, urgent).' },
    ],
    commonMistakes: [
      'Choosing the wrong case type, which sends the case down the wrong workflow.',
      'Entering party names with spelling mistakes, making later searches fail.',
      'Registering the same matter twice — always search first to avoid duplicates.',
    ],
    bestPractices: [
      'Search the register first to make sure the case does not already exist.',
      'Use consistent spelling for party and place names.',
      'Set the correct priority so urgent matters are visible to managers.',
    ],
    afterSaving: [
      'The system generates a unique case number.',
      'The case is added to the register and appears in the Cases List.',
      'The case is ready for assignment to an action officer.',
    ],
    roleNotes: {
      'Officer / Registry Clerk':
        'You usually register the case, then it is passed to a manager for assignment.',
      'Manager':
        'After registration you can assign the case to an officer from the Assignment Inbox.',
    },
    related: ['minimal-case-creation', 'add-parties', 'upload-documents', 'registration-assignment', 'cases-list'],
    tourId: 'register-new-case',
  },
  {
    id: 'case-details',
    title: 'Case Details',
    category: 'Cases',
    icon: 'FileText',
    summary: 'The full record of one case with all its tabs and actions.',
    keywords: ['case details', 'case hub', 'tabs', 'case file', 'view case', 'case record'],
    roles: HELP_ROLES,
    purpose:
      'The Case Details page is the complete file for a single case. Every part of the case — parties, documents, tasks, events, land, correspondence, compliance and history — is reached from here using the tabs.',
    whoShouldUse:
      'Anyone working on a case: officers update it, lawyers act on it, and managers review it.',
    steps: [
      'Open a case from the Cases List or Global Search.',
      'Read the header for the case number, title, status and assigned officer.',
      'Use the tabs to move between Parties, Documents, Tasks, Events, Land, Filings, Compliance and History.',
      'Use the action buttons to edit the case, change its stage, or add new items.',
      'Follow the workflow stepper to see which stage the case has reached.',
    ],
    commonMistakes: [
      'Editing the wrong case because two cases have similar titles — always check the case number.',
      'Missing information that lives on another tab. Check every tab before deciding a case is incomplete.',
    ],
    bestPractices: [
      'Keep the status and stage up to date so the Dashboard and reports stay accurate.',
      'Record actions as they happen rather than in a batch at the end of the week.',
    ],
    afterSaving: [
      'Each change is saved to that case and shown in the History tab.',
      'The workflow stepper and Dashboard update to reflect the new information.',
    ],
    roleNotes: {
      'Lawyer / Legal Officer':
        'Use the tabs to record filings, directions and compliance as the matter progresses.',
      'Manager':
        'Use the stage control to move a case forward or send it back when work is incomplete.',
    },
    related: ['add-parties', 'upload-documents', 'create-tasks', 'schedule-events', 'link-land-parcels', 'case-closure'],
    tourId: 'case-details',
  },
  {
    id: 'add-parties',
    title: 'Add Parties',
    category: 'Cases',
    icon: 'Users',
    summary: 'Record the people and organisations involved in a case.',
    keywords: ['parties', 'claimant', 'respondent', 'plaintiff', 'defendant', 'people', 'add party'],
    roles: ['Officer / Registry Clerk', 'Lawyer / Legal Officer', 'Manager'],
    purpose:
      'Parties are the people and organisations connected to a case, such as the claimant, respondent, the State, or interested landowners. Recording them keeps the file complete and supports correspondence.',
    whoShouldUse: 'Officers and legal staff building or updating a case file.',
    steps: [
      'Open the case and go to the Parties tab.',
      'Click "Add Party".',
      'Enter the party name and choose the party type and role.',
      'Add contact details where known (phone, email, address).',
      'Save. Repeat for every party in the matter.',
    ],
    requiredFields: [
      { name: 'Name', required: true, description: 'Full legal name of the person or organisation.' },
      { name: 'Party type', required: true, description: 'Individual, organisation, government body, etc.' },
      { name: 'Role', required: true, description: 'Their role in the case (claimant, respondent, interested party).' },
    ],
    commonMistakes: [
      'Entering a lawyer as a party. Lawyers are recorded separately under Lawyers.',
      'Duplicating a party that is already on the case.',
      'Leaving out contact details, which slows down later correspondence.',
    ],
    bestPractices: [
      'Use the exact legal name as it appears on official documents.',
      'Record at least one contact method for each active party.',
    ],
    afterSaving: [
      'The party is listed on the Parties tab.',
      'You can select the party when logging communications or correspondence.',
    ],
    related: ['case-details', 'parties-lawyers', 'upload-documents'],
  },
  {
    id: 'upload-documents',
    title: 'Upload Documents',
    category: 'Cases',
    icon: 'Upload',
    summary: 'Attach letters, orders, evidence and other files to a case.',
    keywords: ['documents', 'upload', 'attach', 'files', 'evidence', 'scan', 'pdf'],
    roles: HELP_ROLES,
    purpose:
      'Documents are the evidence and paperwork for a case. Uploading them keeps everything in one secure place and lets the whole team see the same file.',
    whoShouldUse: 'Everyone who handles case paperwork.',
    steps: [
      'Open the case and go to the Documents tab (or open the Documents module).',
      'Click "Add Document" or "Upload".',
      'Give the document a clear title and choose its document type.',
      'Select the file from your computer and upload it.',
      'Add a short description if it helps others understand the file.',
      'Save.',
    ],
    requiredFields: [
      { name: 'Title', required: true, description: 'A clear name, for example "Court Order 12 March".' },
      { name: 'File', required: true, description: 'The file to upload (PDF, Word, image, etc.).' },
      { name: 'Document type', required: false, description: 'The category, such as order, letter, survey plan.' },
    ],
    commonMistakes: [
      'Uploading a very large or blurry scan that others cannot read.',
      'Giving files unclear names like "scan001".',
      'Uploading the same document more than once.',
    ],
    bestPractices: [
      'Name documents clearly and include the date.',
      'Scan to PDF where possible and check the scan is readable before saving.',
      'Choose the correct document type so files are easy to filter.',
    ],
    afterSaving: [
      'The document is attached to the case and listed on the Documents tab.',
      'It can be selected later when preparing filings or correspondence.',
      'The upload is recorded in the case history.',
    ],
    related: ['case-details', 'external-filings', 'create-files', 'document-reception'],
  },
  {
    id: 'create-tasks',
    title: 'Create Tasks',
    category: 'Cases',
    icon: 'ListTodo',
    summary: 'Set actions with owners and due dates so nothing is missed.',
    keywords: ['tasks', 'to do', 'action', 'assign task', 'due date', 'reminder'],
    roles: ['Manager', 'Lawyer / Legal Officer', 'Officer / Registry Clerk'],
    purpose:
      'Tasks turn "things to do" into tracked actions with an owner and a due date, so work is not forgotten.',
    whoShouldUse: 'Officers and managers who plan and assign case work.',
    steps: [
      'Open the case and go to the Tasks tab, or open the Tasks module.',
      'Click "Add Task".',
      'Write a clear task title and description.',
      'Choose who the task is assigned to.',
      'Set the due date and priority.',
      'Save. The task now appears in the owner\'s task list.',
    ],
    requiredFields: [
      { name: 'Title', required: true, description: 'What needs to be done.' },
      { name: 'Due date', required: true, description: 'When it must be finished.' },
      { name: 'Assigned to', required: false, description: 'The officer responsible for the task.' },
    ],
    commonMistakes: [
      'Setting a due date in the past.',
      'Writing a vague task like "follow up" without saying what to follow up.',
      'Not assigning the task, so nobody owns it.',
    ],
    bestPractices: [
      'Make each task a single, clear action.',
      'Set realistic due dates and review them regularly.',
      'Mark tasks complete as soon as they are done.',
    ],
    afterSaving: [
      'The task appears for the assigned officer and on the case Tasks tab.',
      'Approaching and overdue tasks are highlighted in alerts.',
    ],
    related: ['case-details', 'schedule-events', 'officer-actions'],
  },
  {
    id: 'schedule-events',
    title: 'Schedule Events',
    category: 'Cases',
    icon: 'CalendarPlus',
    summary: 'Record hearings, meetings and deadlines on the calendar.',
    keywords: ['events', 'calendar', 'hearing', 'meeting', 'schedule', 'diary', 'court date'],
    roles: ['Lawyer / Legal Officer', 'Manager', 'Officer / Registry Clerk'],
    purpose:
      'Events place important dates — hearings, mentions, meetings and deadlines — on the shared calendar so everyone can plan ahead.',
    whoShouldUse: 'Legal officers and clerks who manage court dates and case diaries.',
    steps: [
      'Open the case and go to the Events tab, or open the Calendar.',
      'Click "Add Event".',
      'Choose the event type (hearing, mention, meeting, deadline).',
      'Enter the title, date, time and location.',
      'Add a short note about what will happen.',
      'Save. The event appears on the calendar and the case.',
    ],
    requiredFields: [
      { name: 'Event type', required: true, description: 'The kind of event.' },
      { name: 'Title', required: true, description: 'A short name for the event.' },
      { name: 'Event date', required: true, description: 'The date (and time) of the event.' },
      { name: 'Location', required: false, description: 'Where the event takes place.' },
    ],
    commonMistakes: [
      'Entering the wrong date or forgetting the time zone/time.',
      'Not linking the event to the correct case.',
      'Recording a hearing but not creating a task to prepare for it.',
    ],
    bestPractices: [
      'Add court dates as soon as they are known.',
      'Create a preparation task alongside each hearing.',
      'Check the calendar at the start of each week.',
    ],
    afterSaving: [
      'The event shows on the shared Calendar and the case Events tab.',
      'It is included in upcoming-deadline alerts.',
    ],
    related: ['case-details', 'create-tasks', 'management-directions'],
  },
  {
    id: 'link-land-parcels',
    title: 'Link Land Parcels',
    category: 'Cases',
    icon: 'MapPin',
    summary: 'Attach the land parcels a case relates to, with location details.',
    keywords: ['land', 'parcel', 'portion', 'allotment', 'section', 'map', 'survey', 'coordinates'],
    roles: ['Officer / Registry Clerk', 'Lawyer / Legal Officer'],
    purpose:
      'Land parcels record exactly which pieces of land a case is about, including their reference numbers and location. This links the legal case to the physical land.',
    whoShouldUse: 'Officers and legal staff who handle the land details of a case.',
    steps: [
      'Open the case and go to the Land Parcels tab, or open the Land Parcels module.',
      'Click "Add Land Parcel".',
      'Enter the parcel number (portion, section, allotment or title reference).',
      'Add the location and area, and coordinates if available.',
      'Attach the survey plan if you have it.',
      'Save. The parcel is linked to the case and can be shown on the map.',
    ],
    requiredFields: [
      { name: 'Parcel number', required: true, description: 'The official land reference (portion/section/allotment/title).' },
      { name: 'Location', required: false, description: 'Where the land is.' },
      { name: 'Area', required: false, description: 'Size of the parcel in square metres or hectares.' },
    ],
    commonMistakes: [
      'Entering the parcel reference in the wrong format.',
      'Guessing coordinates instead of leaving them blank.',
    ],
    bestPractices: [
      'Copy the parcel reference exactly from the title or survey plan.',
      'Attach the survey plan so the location can be verified.',
    ],
    afterSaving: [
      'The parcel is linked to the case and listed on the Land Parcels tab.',
      'Where coordinates exist, the parcel can be viewed on the map.',
    ],
    related: ['case-details', 'upload-documents'],
  },

  /* ---------------------------- CASE WORKFLOW ---------------------- */
  {
    id: 'document-reception',
    title: 'Document Reception',
    category: 'Case Workflow',
    icon: 'Inbox',
    summary: 'Record incoming letters and documents as they arrive at the office.',
    keywords: ['reception', 'intake', 'incoming', 'correspondence', 'received', 'mail', 'registry'],
    roles: ['Officer / Registry Clerk', 'Manager'],
    purpose:
      'Document Reception is the first step of the workflow. It records every letter or document that arrives, gives it a reference number, and starts the paper trail.',
    whoShouldUse:
      'Registry clerks and reception officers who receive incoming mail and documents.',
    steps: [
      'Open Document Intake (Reception).',
      'Click to register a new incoming document.',
      'Enter the source (who sent it) and the date received.',
      'Choose the document type and write a clear subject.',
      'Attach a scan of the document if available.',
      'Save to generate a reference number.',
      'Send an acknowledgement to the sender if required, and record that it was sent.',
    ],
    requiredFields: [
      { name: 'Source', required: true, description: 'Who the document came from.' },
      { name: 'Received date', required: true, description: 'The date the document was received.' },
      { name: 'Document type', required: true, description: 'The kind of document received.' },
      { name: 'Subject', required: true, description: 'A short description of what it is about.' },
    ],
    commonMistakes: [
      'Recording the date you entered it instead of the date it was received.',
      'Vague subjects that make the item hard to find later.',
      'Forgetting to attach the scan.',
    ],
    bestPractices: [
      'Register documents on the day they arrive.',
      'Scan and attach the document straight away.',
      'Send and record acknowledgements promptly so senders know the item was received.',
    ],
    afterSaving: [
      'A unique reference number is created for the incoming document.',
      'The item can be linked to an existing case or used to open a new one.',
      'It moves forward to Registration & Assignment.',
    ],
    roleNotes: {
      'Officer / Registry Clerk':
        'This is usually your first daily task — clear the incoming tray into the system.',
    },
    related: ['registration-assignment', 'management-directions', 'upload-documents', 'parties-lawyers'],
    tourId: 'document-reception',
  },
  {
    id: 'management-directions',
    title: 'Management Directions',
    category: 'Case Workflow',
    icon: 'ClipboardList',
    summary: 'Capture instructions from management and court directions to be actioned.',
    keywords: ['directions', 'instructions', 'management', 'directive', 'orders', 'hearing directions'],
    roles: ['Manager', 'Executive Management', 'Lawyer / Legal Officer'],
    purpose:
      'Directions record formal instructions — from management or the court — about what must be done on a case, by whom, and by when.',
    whoShouldUse:
      'Managers and executives who issue instructions, and officers who must carry them out.',
    steps: [
      'Open Directions & Hearings, or the Directions tab on a case.',
      'Click "Add Direction".',
      'Record the source of the direction and who issued it.',
      'Enter the subject and the full instruction.',
      'Set the priority, the officer responsible, and the due date.',
      'Save. The direction is now tracked to completion.',
    ],
    requiredFields: [
      { name: 'Source', required: true, description: 'Where the direction came from (management, court, etc.).' },
      { name: 'Subject', required: true, description: 'A short title for the direction.' },
      { name: 'Instruction / content', required: true, description: 'The full instruction to be carried out.' },
      { name: 'Due date', required: false, description: 'When the direction must be completed.' },
    ],
    commonMistakes: [
      'Recording an instruction without saying who is responsible for it.',
      'Leaving out the due date, so the direction is never chased.',
    ],
    bestPractices: [
      'Write the instruction in full, exactly as given.',
      'Always name a responsible officer and a due date.',
      'Mark the direction complete once the action is finished.',
    ],
    afterSaving: [
      'The direction is tracked with a status until it is completed.',
      'It appears against the case and in the responsible officer\'s work.',
      'Approaching due dates are highlighted in alerts.',
    ],
    roleNotes: {
      'Executive Management':
        'Use directions to pass clear, recorded instructions down the chain rather than by informal messages.',
      'Manager':
        'Follow up open directions regularly and confirm completion.',
    },
    related: ['registration-assignment', 'delegate-case', 'officer-actions', 'schedule-events'],
  },
  {
    id: 'registration-assignment',
    title: 'Registration & Assignment',
    category: 'Case Workflow',
    icon: 'UserCheck',
    summary: 'Register incoming correspondence to a case and assign an action officer.',
    keywords: ['registration', 'assignment', 'assign', 'allocate', 'action officer', 'inbox', 'register correspondence'],
    roles: ['Manager', 'Officer / Registry Clerk'],
    purpose:
      'This step links registered documents to the correct case and assigns the case to an action officer who will handle it. It turns a received document into active work.',
    whoShouldUse:
      'Managers who allocate work, and registry staff who match documents to cases.',
    steps: [
      'Open the Assignment Inbox, or register correspondence from a case.',
      'Confirm the document is linked to the correct case (or create the case).',
      'Choose the action officer who will handle the case.',
      'Add any instructions for the officer.',
      'Set the priority and due date if needed.',
      'Save to assign the case.',
    ],
    requiredFields: [
      { name: 'Case', required: true, description: 'The case the document belongs to.' },
      { name: 'Action officer', required: true, description: 'The officer who will handle the case.' },
      { name: 'Instructions', required: false, description: 'Guidance for the officer.' },
    ],
    commonMistakes: [
      'Assigning a case to an officer who is overloaded or on leave.',
      'Linking a document to the wrong case because of a similar title.',
      'Assigning without any instructions, so the officer is unsure what to do.',
    ],
    bestPractices: [
      'Check the officer\'s current workload before assigning.',
      'Give short, clear instructions with each assignment.',
      'Confirm the case number before linking a document.',
    ],
    afterSaving: [
      'The case shows the assigned officer and appears in their "My Cases" and Assignment Inbox.',
      'The assignment is recorded in the case history for accountability.',
      'The case is ready for the officer to begin work.',
    ],
    roleNotes: {
      'Manager':
        'You are usually the person who assigns cases. Balance work fairly across officers.',
      'Officer / Registry Clerk':
        'Watch your Assignment Inbox for newly assigned cases.',
    },
    related: ['document-reception', 'delegate-case', 'officer-actions', 'cases-list'],
  },
  {
    id: 'create-files',
    title: 'Create Files',
    category: 'Case Workflow',
    icon: 'FolderPlus',
    summary: 'Request and track the physical or digital files needed for a case.',
    keywords: ['create files', 'file request', 'file', 'retrieve', 'custody', 'file movement', 'records'],
    roles: ['Officer / Registry Clerk', 'Lawyer / Legal Officer'],
    purpose:
      'This step records the files a case needs — such as title files or departmental records — and tracks where each file is and who holds it.',
    whoShouldUse:
      'Officers who need to gather files, and registry staff who control file movement.',
    steps: [
      'Open File Requests, or the file section on a case.',
      'Click "Add File Request".',
      'Select the case and the type of file needed.',
      'Enter the file number if known.',
      'Record who is requesting it and the date.',
      'Save. Update the status as the file is located, received and returned.',
    ],
    requiredFields: [
      { name: 'Case', required: true, description: 'The case the file is needed for.' },
      { name: 'File type', required: true, description: 'The kind of file being requested.' },
      { name: 'Requested date', required: false, description: 'When the file was requested.' },
    ],
    commonMistakes: [
      'Not updating the status when a file is received or returned.',
      'Failing to record who currently holds the file.',
    ],
    bestPractices: [
      'Record the file number wherever possible for exact tracking.',
      'Update the custody and location each time a file moves.',
    ],
    afterSaving: [
      'The file request is tracked with a status (requested, received, returned).',
      'The current location and custodian are visible to the team.',
    ],
    related: ['document-reception', 'upload-documents', 'case-details'],
  },
  {
    id: 'delegate-case',
    title: 'Delegate Case',
    category: 'Case Workflow',
    icon: 'UserPlus',
    summary: 'Hand a case to another officer with clear instructions.',
    keywords: ['delegate', 'delegation', 'reassign', 'hand over', 'transfer', 'instruct'],
    roles: ['Manager', 'Lawyer / Legal Officer'],
    purpose:
      'Delegation passes responsibility for a case, or a part of it, to another officer with recorded instructions. It keeps a clear trail of who was asked to do what.',
    whoShouldUse:
      'Managers and senior officers who share work or cover for absent staff.',
    steps: [
      'Open the case and choose Delegate.',
      'Select the officer you are delegating to.',
      'Write clear instructions on what they must do.',
      'Set a due date for the delegated work.',
      'Save. The officer is notified and the delegation is recorded.',
    ],
    requiredFields: [
      { name: 'Delegated to', required: true, description: 'The officer receiving the case.' },
      { name: 'Instructions', required: true, description: 'What the officer must do.' },
      { name: 'Due date', required: false, description: 'When the delegated work is due.' },
    ],
    commonMistakes: [
      'Delegating without instructions.',
      'Delegating to someone without the right permissions for the case.',
      'Forgetting to follow up on the delegated work.',
    ],
    bestPractices: [
      'Be specific about what you expect and by when.',
      'Delegate to officers who have capacity.',
      'Review delegated work before the due date.',
    ],
    afterSaving: [
      'The delegation is recorded against the case.',
      'The receiving officer sees the case and the instructions.',
      'The action is added to the case history.',
    ],
    related: ['registration-assignment', 'management-directions', 'officer-actions'],
  },
  {
    id: 'officer-actions',
    title: 'Officer Actions',
    category: 'Case Workflow',
    icon: 'Gavel',
    summary: 'Record the legal and administrative steps an officer takes on a case.',
    keywords: ['officer actions', 'action', 'progress', 'steps', 'work done', 'update case', 'advance'],
    roles: ['Lawyer / Legal Officer', 'Officer / Registry Clerk', 'Manager'],
    purpose:
      'Officer Actions is where the assigned officer records the work done on a case — the research, advice, drafting, filings and follow-ups that move the matter forward.',
    whoShouldUse:
      'The action officer or lawyer responsible for the case.',
    steps: [
      'Open your assigned case.',
      'Record each action you take, with the date and a clear note.',
      'Attach any documents you produced (advice, letters, drafts).',
      'Update the case status or stage as the work progresses.',
      'Create tasks or events for the next steps.',
      'Save so the record stays current.',
    ],
    requiredFields: [
      { name: 'Action / note', required: true, description: 'A clear description of what you did.' },
      { name: 'Date', required: false, description: 'When the action was taken.' },
    ],
    commonMistakes: [
      'Recording actions long after they happened, so details are lost.',
      'Advancing the stage before the work is really done.',
      'Not attaching the documents produced.',
    ],
    bestPractices: [
      'Record actions as you do them.',
      'Keep notes factual and clear enough for a colleague to follow.',
      'Only advance the stage when the work for the current stage is complete.',
    ],
    afterSaving: [
      'The action is added to the case history.',
      'The workflow stepper and Dashboard reflect the progress.',
      'Managers can see the case is moving.',
    ],
    roleNotes: {
      'Lawyer / Legal Officer':
        'Keep a clear record of advice and legal steps — this file may be reviewed later.',
    },
    related: ['case-details', 'external-filings', 'create-tasks', 'delegate-case'],
  },
  {
    id: 'external-filings',
    title: 'External Filings',
    category: 'Case Workflow',
    icon: 'FileUp',
    summary: 'Prepare and track documents filed with the court or outside bodies.',
    keywords: ['filings', 'file', 'court', 'submission', 'lodge', 'external', 'filing number'],
    roles: ['Lawyer / Legal Officer', 'Manager'],
    purpose:
      'External Filings records documents that are prepared and lodged with the court or other external bodies, and tracks their status from preparation to acceptance.',
    whoShouldUse:
      'Legal officers who prepare and lodge court documents.',
    steps: [
      'Open the case and go to the Filings tab, or open the Filings module.',
      'Click "Add Filing".',
      'Choose the filing type and give it a title.',
      'Select the case document to be filed, or upload a new one.',
      'Record who prepared it and where it is being submitted.',
      'Enter the filing number and court filing date once known.',
      'Save and update the status as it progresses.',
    ],
    requiredFields: [
      { name: 'Filing type', required: true, description: 'The kind of document being filed.' },
      { name: 'Title', required: true, description: 'A clear name for the filing.' },
      { name: 'Case', required: true, description: 'The case the filing belongs to.' },
      { name: 'Submitted to', required: false, description: 'The court or body receiving the filing.' },
    ],
    commonMistakes: [
      'Filing the wrong version of a document — check before you submit.',
      'Not recording the filing number returned by the court.',
      'Leaving the status as "prepared" after it has actually been filed.',
    ],
    bestPractices: [
      'Attach the exact document that was filed.',
      'Record the filing number and date immediately.',
      'Keep the status current so everyone knows where the filing stands.',
    ],
    afterSaving: [
      'The filing is listed on the case with its status.',
      'A submission for review may be created before final filing, depending on your process.',
      'The action is recorded in the case history.',
    ],
    related: ['upload-documents', 'officer-actions', 'court-references', 'compliance-recommendations'],
  },

  {
    id: 'search-warrants',
    title: 'Search Warrants',
    category: 'Case Workflow',
    icon: 'ShieldAlert',
    summary: 'Register and track official search warrants / investigation records linked to cases.',
    keywords: [
      'search warrant', 'warrant', 'investigation', 'police', 'crime report', 'cr number',
      'witness statement', 'return of warrant', 'respondent', 'informant', 'register',
    ],
    roles: ['Lawyer / Legal Officer', 'Officer / Registry Clerk', 'Manager', 'System Administrator'],
    purpose:
      'The Search Warrants register records official, court-authorised search warrants received by DLPP — usually from the police — and tracks the documents DLPP must provide and the witness statements required. A warrant is an investigation record; it is not a plaintiff or defendant. It is normally linked to the legal case it relates to.',
    whoShouldUse:
      'Registry officers who receive warrants, legal officers assigned to handle them, and managers who monitor them.',
    steps: [
      'Open Search Warrants from the Legal menu, or the Search Warrants tab inside a case.',
      'Click "Register Warrant" (or "Add Search Warrant" from within a case).',
      'Enter the search warrant number and, where known, the Crime Report (CR) number.',
      'Link the warrant to the related case (this is automatic when adding from inside a case).',
      'Record who it was received from, the police officer and their contact details, and the date received.',
      'Assign the DLPP lawyer in carriage and record the applicant/informant and respondent.',
      'Capture the land description, legal issue, land and title file references, documents to provide and witness statement status.',
      'Set the status and save. Attach scanned documents from the warrant\'s detail view.',
    ],
    requiredFields: [
      { name: 'Search Warrant No.', required: true, description: 'The official warrant number — the main identifier.' },
      { name: 'Crime Report (CR) No.', required: false, description: 'The police CR number the warrant relates to.' },
      { name: 'Linked Case', required: false, description: 'The legal case the warrant relates to (recommended).' },
      { name: 'Respondent', required: false, description: 'Who the warrant is directed at (e.g., Registrar of Titles).' },
      { name: 'Status of Matter', required: true, description: 'Where the warrant is in the workflow.' },
    ],
    commonMistakes: [
      'Treating the warrant as a plaintiff or defendant — it is an investigation record, not a party.',
      'Recording the entry date instead of the actual date the warrant was received.',
      'Not linking the warrant to a case, so its documents do not appear in the case file.',
      'Forgetting to attach the scanned warrant and the return of warrant.',
    ],
    bestPractices: [
      'Register warrants the day they arrive and assign a lawyer promptly.',
      'Always link the warrant to the case so documents flow into the case file.',
      'Keep the status current — it drives the dashboard counts and the register report.',
      'Attach every relevant document (warrant, affidavit, police request, file documents, witness statement, return of warrant).',
    ],
    afterSaving: [
      'The warrant appears in the Search Warrants register and on the linked case\'s Search Warrants tab.',
      'Documents you attach are also linked to the case and show in the case document list.',
      'Create, update, status change, lawyer assignment and document upload are all written to the audit trail.',
      'Dashboard counts (open, urgent, awaiting witness, pending documents) update automatically.',
    ],
    roleNotes: {
      'Officer / Registry Clerk':
        'You usually register the warrant and attach the scanned copy, then it is assigned to a lawyer.',
      'Lawyer / Legal Officer':
        'You handle the warrant — gather the requested documents, arrange witness statements and prepare the return of warrant.',
      'System Administrator':
        'Only Admin and Manager roles can delete a warrant. Everyone else can create, update and upload as their role allows.',
    },
    related: ['case-details', 'upload-documents', 'external-filings', 'reports'],
    tourId: 'search-warrants',
  },

  {
    id: 'section5-notices',
    title: 'Section 5 Notice Register',
    category: 'Case Workflow',
    icon: 'FileWarning',
    summary: 'Register and track official Section 5 Notices, from receipt to advice, case linking and closure.',
    keywords: [
      'section 5', 's5', 'notice', 'register', 'claim', 'ilg', 'incorporated land group',
      'customary land', 'state lease', 'ownership', 'claimant', 'legal advice', 'intake',
    ],
    roles: ['Officer / Registry Clerk', 'Lawyer / Legal Officer', 'Manager', 'System Administrator'],
    purpose:
      'The Section 5 Notice Register records every official Section 5 Notice the Department receives — relating to land claims, Incorporated Land Groups (ILGs), customary land, State leases and ownership claims. It is a legal registry (not a plaintiff/defendant table). A notice moves through a fixed workflow and can create or link to a legal case, which may then progress to advice, mediation, litigation, a search warrant, court proceedings, appeals or settlement.',
    whoShouldUse:
      'Registry officers who receive and register notices, legal officers assigned to review them and issue advice, and managers who monitor the register.',
    steps: [
      'Open Registry → Section 5 Notices, or the Section 5 Notices tab inside a case.',
      'Click "Register Notice" (or "Add Section 5 Notice" from within a case).',
      'Enter the Section 5 Notice number, the date received and the claimant name and type.',
      'If the claimant is an Incorporated Land Group, record the ILG name and registration number.',
      'Capture the land description, file/title/survey references and the province, district, LLG and ward.',
      'Assign the DLPP lawyer and record the file opened and assigned dates.',
      'Describe the legal issue and write a short notice summary.',
      'Set the status and save. Attach documents and follow the timeline from the notice’s detail view.',
      'Link the notice to a case (existing or newly created) so its documents flow into the case file.',
    ],
    requiredFields: [
      { name: 'Section 5 Notice No.', required: true, description: 'The official notice number — the main identifier for the register entry.' },
      { name: 'Claimant Name', required: true, description: 'The person or entity making the claim.' },
      { name: 'Claimant Type', required: false, description: 'Individual, Incorporated Land Group, Company, Government, Clan or Community.' },
      { name: 'Date Received', required: false, description: 'The actual date the Department received the notice.' },
      { name: 'ILG Registration Number', required: false, description: 'Required in practice when the claimant type is Incorporated Land Group.' },
      { name: 'Status', required: true, description: 'Where the notice is in the workflow.' },
      { name: 'Linked Case', required: false, description: 'The legal case the notice relates to (can be linked at any time).' },
    ],
    commonMistakes: [
      'Treating the notice as a plaintiff or defendant — it is a registry entry, not a party.',
      'Recording the entry date instead of the actual date the notice was received.',
      'Choosing Incorporated Land Group but leaving the ILG name and registration number blank.',
      'Skipping workflow steps — the status can only move to the next step (or Closed).',
      'Not linking the notice to a case, so its documents do not appear in the case file.',
    ],
    bestPractices: [
      'Register notices the day they arrive and assign a lawyer promptly.',
      'Follow the workflow in order: Draft → Received → File Opened → Assigned to Lawyer → Legal Review → Awaiting Advice → Advice Issued → Matter Created → Referred to Court → Closed.',
      'Link the notice to a case as soon as one exists so documents and history stay together.',
      'Attach every relevant document (the notice, claim documents, ILG registration, survey plans, titles, correspondence, advice, maps, affidavits and court documents).',
      'Keep the status current — it drives the dashboard counts and the register report.',
    ],
    afterSaving: [
      'The notice appears in the Section 5 Notice Register and, when linked, on the case’s Section 5 Notices tab.',
      'Documents you attach are also linked to the case and show in the case document list.',
      'Creation, status changes, lawyer assignment, case linking and document uploads are all written to the audit trail and shown on the notice’s Timeline.',
      'Dashboard counts (pending assignment, under review, awaiting advice, linked to cases, closed) update automatically.',
    ],
    roleNotes: {
      'Officer / Registry Clerk':
        'You usually register the notice and attach the scanned copy, then it is assigned to a lawyer.',
      'Lawyer / Legal Officer':
        'You review the notice, issue advice, and — where needed — create the matter and refer it to court.',
      'System Administrator':
        'Only Admin and Manager roles can delete a notice. Everyone else can create, update and upload as their role allows.',
    },
    related: ['case-details', 'upload-documents', 'search-warrants', 'reports'],
    tourId: 'section5-notices',
  },

  {
    id: 'section-160',
    title: 'Section 160(2) Application Register',
    category: 'Case Workflow',
    icon: 'Landmark',
    summary: 'Register and track Section 160(2) applications under the Land Registration Act 1981.',
    keywords: [
      'section 160', '160(2)', 'land registration act', 'registrar of titles', 'title dispute',
      'summons', 'fraud', 'consent', 'rectification', 'court file', 'defendant', 'application',
    ],
    roles: ['Officer / Registry Clerk', 'Lawyer / Legal Officer', 'Manager', 'System Administrator'],
    purpose:
      'The Section 160(2) Application Register records applications under the Land Registration Act 1981 — matters involving title disputes, the Registrar of Titles, summons, fraud allegations, consent issues, title rectification and court-related land registration matters. It is a legal registry (not a plaintiff/defendant table). An application can create a new legal case or be linked to an existing one.',
    whoShouldUse:
      'Registry officers who receive applications, legal officers assigned to act on them, and managers who monitor the register.',
    steps: [
      'Open Registry → Section 160(2) Applications, or the Section 160(2) tab inside a case.',
      'Click "Register Application" (or "Add Application" from within a case).',
      'Enter the application year and date received, the applicant (usually Registrar of Titles) and the defendant.',
      'Assign the DLPP lawyer in carriage (choose a system user so they are alerted) and record any Solicitor General, private firm or defendant’s lawyer.',
      'Capture the land description, title file reference, summons dates, consignment note, grounds for the application and court file reference.',
      'Set the status of the matter and save. Attach documents and follow the timeline from the application’s detail view.',
      'Link the application to a case (existing or new) so its documents flow into the case file.',
    ],
    requiredFields: [
      { name: 'Defendant', required: true, description: 'The defendant / respondent — a key identifier and search field.' },
      { name: 'Application Year', required: false, description: 'Auto-filled from the date received; can be overridden.' },
      { name: 'Date Received', required: false, description: 'The actual date the application was received.' },
      { name: 'Applicant — Registrar of Titles', required: false, description: 'The applicant, usually the Registrar of Titles.' },
      { name: 'Title File Reference', required: false, description: 'The Registrar of Titles file reference for the relevant title.' },
      { name: 'Status of the Matter', required: true, description: 'Where the matter currently stands.' },
      { name: 'Linked Case', required: false, description: 'The legal case the application relates to (can be linked at any time).' },
    ],
    commonMistakes: [
      'Treating the application as a plaintiff or defendant record — it is a registry entry.',
      'Recording the entry date instead of the date the application was actually received.',
      'Leaving the defendant blank, which makes the entry hard to find.',
      'Not recording the court file reference once the matter is before the court.',
      'Not linking the application to a case, so its documents do not appear in the case file.',
    ],
    bestPractices: [
      'Register applications promptly and assign a DLPP lawyer with a linked user account so alerts are received.',
      'Keep the status current — it drives the dashboard counts (pending review, awaiting summons, in court, director response, closed, rejected).',
      'Record summons dates and the consignment note as soon as they are known.',
      'Attach every relevant document (the application, letter of summons, consignment note, court documents, registrar correspondence, title extracts, legal opinion, director response and court orders).',
      'Link the application to a case so documents and history stay together.',
    ],
    afterSaving: [
      'The application appears in the Section 160(2) Register and, when linked, on the case’s Section 160(2) tab.',
      'Documents you attach are also linked to the case and show in the case document list.',
      'Creation, lawyer assignment, status changes, court file updates, case linking and document uploads are written to the audit trail and shown on the Timeline.',
      'The assigned lawyer is alerted when the application is assigned to them and when its status changes.',
    ],
    roleNotes: {
      'Officer / Registry Clerk':
        'You usually register the application and attach the scanned documents, then it is assigned to a lawyer.',
      'Lawyer / Legal Officer':
        'You act on the application — respond to summons, prepare legal responses and director responses, and progress it through court.',
      'System Administrator':
        'Only Admin and Manager roles can delete an application. Everyone else can create, update and upload as their role allows.',
    },
    related: ['case-details', 'upload-documents', 'section5-notices', 'search-warrants', 'reports'],
    tourId: 'section-160',
  },

  /* ---------------------------- COMPLIANCE & CLOSURE --------------- */
  {
    id: 'compliance-recommendations',
    title: 'Compliance Recommendations',
    category: 'Compliance & Closure',
    icon: 'CheckSquare',
    summary: 'Track court orders and recommendations that the department must comply with.',
    keywords: ['compliance', 'court order', 'recommendation', 'deadline', 'memo', 'implement', 'follow up'],
    roles: ['Manager', 'Lawyer / Legal Officer', 'Executive Management'],
    purpose:
      'Compliance tracking makes sure the department carries out court orders and recommendations on time. It records what must be done, who is responsible, and whether it has been completed.',
    whoShouldUse:
      'Managers and legal officers responsible for making sure orders are implemented.',
    steps: [
      'Open Compliance, or the Compliance tab on a case.',
      'Click to add a compliance item.',
      'Enter the court order reference and its date.',
      'Describe what must be complied with.',
      'Set the compliance deadline and the responsible division.',
      'Record the memo sent to the responsible division.',
      'Save and update the status until it is completed.',
    ],
    requiredFields: [
      { name: 'Court order description', required: true, description: 'What the order or recommendation requires.' },
      { name: 'Responsible division', required: true, description: 'The division that must carry it out.' },
      { name: 'Compliance deadline', required: false, description: 'The date by which it must be done.' },
    ],
    commonMistakes: [
      'Recording the order but not setting a deadline.',
      'Not naming the division responsible for acting.',
      'Marking an item complete before it is actually done.',
    ],
    bestPractices: [
      'Log court orders for compliance as soon as they are received.',
      'Send and record the memo to the responsible division quickly.',
      'Review open compliance items regularly against their deadlines.',
    ],
    afterSaving: [
      'The compliance item is tracked with a status and deadline.',
      'Approaching deadlines appear in alerts.',
      'The item can be linked to a recommendation and reported on.',
    ],
    roleNotes: {
      'Executive Management':
        'Use compliance reports to confirm court orders are being implemented across divisions.',
    },
    related: ['management-directions', 'external-filings', 'court-references', 'case-closure'],
  },
  {
    id: 'case-closure',
    title: 'Case Closure',
    category: 'Compliance & Closure',
    icon: 'CheckCircle2',
    summary: 'Close a case properly with the outcome and closing notes.',
    keywords: ['closure', 'close', 'complete', 'finish', 'outcome', 'settled', 'judgment', 'archive'],
    roles: ['Manager', 'Lawyer / Legal Officer'],
    purpose:
      'Closing a case records how it ended, keeps the full history, and removes it from the active workload. Closure is different from deletion — the record is kept.',
    whoShouldUse:
      'Managers and senior officers who confirm a case is finished.',
    steps: [
      'Open the case and choose Close Case.',
      'Choose the closure type (settled, judgment, withdrawn, etc.).',
      'Enter the closure date.',
      'Write closing notes explaining the outcome.',
      'Confirm that outstanding tasks, filings and compliance items are handled.',
      'Save to close the case.',
    ],
    requiredFields: [
      { name: 'Closure type', required: true, description: 'How the case ended.' },
      { name: 'Closure date', required: true, description: 'The date the case was closed.' },
      { name: 'Closure notes', required: false, description: 'A short explanation of the outcome.' },
    ],
    commonMistakes: [
      'Closing a case that still has open compliance items or tasks.',
      'Deleting instead of closing, which loses the history.',
      'Leaving the closure notes blank, so the outcome is unclear.',
    ],
    bestPractices: [
      'Check all tabs and clear outstanding items before closing.',
      'Record a clear outcome in the closure notes.',
      'Use closure, never deletion, for finished cases.',
    ],
    afterSaving: [
      'The case status changes to closed and it leaves the active list.',
      'The full history is kept and can be reopened or reported on.',
      'Dashboard and reports update to reflect the closure.',
    ],
    roleNotes: {
      'Manager':
        'Closure is usually a management decision. Confirm the matter is truly finished before closing.',
    },
    related: ['case-details', 'compliance-recommendations', 'reports'],
  },

  /* ---------------------------- COMMUNICATIONS -------------------- */
  {
    id: 'parties-lawyers',
    title: 'Parties & Lawyers Communications',
    category: 'Communications',
    icon: 'MessageSquare',
    summary: 'Log letters, calls and emails with parties and external lawyers.',
    keywords: ['communications', 'correspondence', 'lawyers', 'parties', 'letter', 'email', 'call', 'contact'],
    roles: ['Lawyer / Legal Officer', 'Officer / Registry Clerk', 'Manager'],
    purpose:
      'This area keeps a record of every communication with parties and external lawyers — incoming and outgoing — so the case has a complete contact history.',
    whoShouldUse:
      'Legal officers and clerks who correspond with parties and lawyers.',
    steps: [
      'Open the case, or the Communications / Correspondence module.',
      'Click "Add Communication" or "Add Correspondence".',
      'Choose the type (letter, email, phone) and the direction (incoming or outgoing).',
      'Select the party or lawyer involved.',
      'Enter the subject, date and content or summary.',
      'Attach any related document.',
      'Save. Set a response deadline if a reply is required.',
    ],
    requiredFields: [
      { name: 'Communication type', required: true, description: 'Letter, email, phone call, etc.' },
      { name: 'Direction', required: true, description: 'Whether it is incoming or outgoing.' },
      { name: 'Subject', required: true, description: 'What the communication is about.' },
      { name: 'Date', required: true, description: 'When it happened.' },
    ],
    commonMistakes: [
      'Recording the party name in the wrong field.',
      'Not attaching the actual letter or email.',
      'Forgetting to set a response deadline when a reply is needed.',
    ],
    bestPractices: [
      'Log communications as they happen so the history stays complete.',
      'Attach the actual document for outgoing and incoming letters.',
      'Use response deadlines to make sure replies are chased.',
    ],
    afterSaving: [
      'The communication is added to the case contact history.',
      'If a response is required, it is tracked to its deadline.',
    ],
    related: ['add-parties', 'document-reception', 'external-filings', 'court-references'],
  },
  {
    id: 'court-references',
    title: 'Court References',
    category: 'Communications',
    icon: 'Scale',
    summary: 'Record court file numbers and reassignments between courts.',
    keywords: ['court', 'reference', 'court file number', 'reassignment', 'registry', 'proceedings'],
    roles: ['Lawyer / Legal Officer', 'Manager'],
    purpose:
      'Court References keep the link between your case and the court proceedings, including the court file number and any change of court or reference.',
    whoShouldUse:
      'Legal officers managing matters that are before the courts.',
    steps: [
      'Open the case.',
      'Record the court file number for the matter.',
      'If the matter moves to a different court or reference, record the reassignment with the reason and date.',
      'Attach any court document that confirms the reference.',
      'Save so the court link stays accurate.',
    ],
    requiredFields: [
      { name: 'Court file number', required: true, description: 'The reference the court uses for the matter.' },
      { name: 'Reason (for reassignment)', required: false, description: 'Why the reference changed.' },
    ],
    commonMistakes: [
      'Typing the court file number incorrectly.',
      'Not recording a change when a matter moves between courts.',
    ],
    bestPractices: [
      'Copy the court file number exactly from a court document.',
      'Record reassignments with the date and reason so the trail is clear.',
    ],
    afterSaving: [
      'The court reference is stored against the case.',
      'Reassignment history is kept for audit purposes.',
    ],
    related: ['external-filings', 'parties-lawyers', 'compliance-recommendations'],
  },

  /* ---------------------------- REPORTS -------------------------- */
  {
    id: 'reports',
    title: 'Reports and Analytics',
    category: 'Reports',
    icon: 'BarChart3',
    summary: 'Produce reports on cases, performance, compliance and costs.',
    keywords: ['reports', 'analytics', 'statistics', 'export', 'performance', 'summary', 'charts', 'costs'],
    roles: ['Executive Management', 'Manager', 'System Administrator'],
    purpose:
      'Reports turn the data in the system into summaries and charts for management, oversight and decision-making, and can be exported to Excel or PDF.',
    whoShouldUse:
      'Managers and executives who need summaries, and administrators who prepare returns.',
    steps: [
      'Open Reports from the menu.',
      'Choose the report you need (case load, status, region, compliance, costs, etc.).',
      'Set the filters and date range.',
      'Review the on-screen tables and charts.',
      'Export to Excel or PDF, or print, to share the report.',
    ],
    commonMistakes: [
      'Running a report without setting the date range, giving too much data.',
      'Reading a filtered report as if it covered everything.',
    ],
    bestPractices: [
      'Set clear filters and date ranges before exporting.',
      'Label exported reports with the period they cover.',
      'Use scheduled exports for reports you produce regularly.',
    ],
    afterSaving: [
      'Reports are generated from live data and can be exported or printed.',
      'Exporting does not change any records.',
    ],
    roleNotes: {
      'Executive Management':
        'Use the summary and trend reports for board and management reporting.',
    },
    related: ['dashboard', 'cases-list', 'compliance-recommendations'],
    tourId: 'reports',
  },

  /* ---------------------------- ADMINISTRATION ------------------- */
  {
    id: 'user-role-management',
    title: 'User and Role Management',
    category: 'Administration',
    icon: 'UserCog',
    summary: 'Create users, assign them to groups, and control what each role can do.',
    keywords: ['admin', 'users', 'roles', 'groups', 'permissions', 'access', 'rbac', 'user management'],
    roles: ['System Administrator'],
    purpose:
      'User and Role Management controls who can access the system and what each person can do. Permissions are given to groups, and users inherit permissions from the groups they belong to.',
    whoShouldUse: 'System administrators only.',
    steps: [
      'Open the Admin Panel, then User Management.',
      'To add a user, click "Add User" and enter their name, email and details.',
      'Assign the user to one or more groups (for example Manager or Officer).',
      'Open Groups to set what each group can create, read, update, delete, print, approve and export per module.',
      'Save. The user\'s menu and access follow the groups they are in.',
    ],
    requiredFields: [
      { name: 'Full name', required: true, description: 'The user\'s name.' },
      { name: 'Email', required: true, description: 'Their official work email, used to sign in.' },
      { name: 'Group', required: true, description: 'At least one group to grant access.' },
    ],
    commonMistakes: [
      'Creating a user but not assigning any group, so they can see nothing.',
      'Giving a group more power than the role needs.',
      'Deleting a user who has case history instead of deactivating them.',
    ],
    bestPractices: [
      'Give each role the least access it needs to do its job.',
      'Use groups to manage access, not one-off changes per user.',
      'Review group permissions when duties change.',
    ],
    afterSaving: [
      'The user can sign in and sees only what their groups allow.',
      'Changes take effect the next time the user\'s permissions load.',
      'The change is recorded in the audit trail.',
    ],
    roleNotes: {
      'System Administrator':
        'You are the only role that should manage users and permissions. Handle this carefully — it controls the whole system.',
    },
    related: ['audit-trail', 'login', 'dashboard'],
    tourId: 'user-role-management',
  },
  {
    id: 'audit-trail',
    title: 'Audit Trail',
    category: 'Administration',
    icon: 'History',
    summary: 'See a record of who did what and when across the system.',
    keywords: ['audit', 'trail', 'log', 'history', 'accountability', 'who did', 'tracking'],
    roles: ['System Administrator', 'Executive Management', 'Manager'],
    purpose:
      'The audit trail is a record of important actions in the system — who created, changed, or deleted records, and when. It supports accountability and investigations.',
    whoShouldUse:
      'Administrators and managers who need to check what happened to a record.',
    steps: [
      'Open the audit trail (in the Admin area or on a record\'s History tab).',
      'Filter by user, action, date or record type.',
      'Read each entry to see who did what and when.',
      'Open the linked record for the full context if needed.',
    ],
    commonMistakes: [
      'Assuming the audit trail can be edited — it is a permanent record.',
      'Looking only at one case\'s history when a system-wide view is needed.',
    ],
    bestPractices: [
      'Use the audit trail to resolve "who changed this?" questions with facts.',
      'Review it periodically as part of good governance.',
    ],
    afterSaving: [
      'The audit trail is read-only; you cannot change it.',
      'Every important action anywhere in the system adds a new entry automatically.',
    ],
    roleNotes: {
      'System Administrator':
        'The audit trail is your main tool for investigating access and data-change questions.',
    },
    related: ['user-role-management', 'case-details'],
  },
];

/* ------------------------------------------------------------------ */
/* Guided Tours                                                        */
/* ------------------------------------------------------------------ */

/** Shown automatically the first time a user reaches the app after signing in. */
export const WELCOME_TOUR_ID = 'welcome';

export const HELP_TOURS: HelpTour[] = [
  {
    id: WELCOME_TOUR_ID,
    title: 'Welcome Tour',
    steps: [
      {
        title: 'Welcome to the DLPP Legal Case Management System',
        description:
          'This quick tour shows you around. It takes less than a minute. You can skip it at any time and reopen it later from the Help Centre.',
      },
      {
        element: '[data-tour="app-sidebar"]',
        title: 'Main Menu',
        description:
          'Use this menu to move between modules — cases, calendar, documents, compliance, reports and more. You only see the modules your role is allowed to use.',
        side: 'right',
      },
      {
        element: '[data-tour="app-search"]',
        title: 'Global Search',
        description:
          'Find any case, party, document or task from anywhere by searching a case number or a keyword.',
        side: 'bottom',
      },
      {
        element: '[data-tour="help-button"]',
        title: 'Help is always one click away',
        description:
          'Click this button on any page to open help for the screen you are on, start a guided tour, or open the full Help Centre.',
        side: 'left',
      },
      {
        title: 'You are ready to go',
        description:
          'Look for the small "?" icons beside fields for quick tips, and use "Start Guided Tour" inside Help on each page. Enjoy using the system!',
      },
    ],
  },
  {
    id: 'dashboard',
    title: 'Dashboard Tour',
    topicId: 'dashboard',
    steps: [
      {
        title: 'Welcome to the Dashboard',
        description:
          'This short tour shows the main parts of the Dashboard. Use the Next button to continue.',
      },
      {
        element: '[data-tour="dashboard-metrics"]',
        title: 'Key Metrics',
        description: 'These cards show the total, active and closed cases and any urgent items at a glance.',
      },
      {
        element: '[data-tour="dashboard-charts"]',
        title: 'Charts',
        description: 'Charts show how cases are spread by status and region. Click a segment to drill into those cases.',
      },
      {
        element: '[data-tour="dashboard-alerts"]',
        title: 'Alerts',
        description: 'Deadlines and overdue items appear here. Check this first each day.',
      },
      {
        element: '[data-tour="help-button"]',
        title: 'Help is always here',
        description: 'Click this button on any page to open help for the screen you are on, or to start a tour.',
        side: 'left',
      },
    ],
  },
  {
    id: 'cases-list',
    title: 'Cases List Tour',
    topicId: 'cases-list',
    steps: [
      {
        title: 'The Cases Register',
        description: 'This is the central list of all land cases. Let us look at the main controls.',
      },
      {
        element: '[data-tour="cases-search"]',
        title: 'Search',
        description: 'Search by case number, title or party to find a case quickly.',
      },
      {
        element: '[data-tour="cases-filters"]',
        title: 'Filters',
        description: 'Narrow the list by status, type, region, priority and date.',
      },
      {
        element: '[data-tour="cases-new"]',
        title: 'Register a Case',
        description: 'Click here to open a brand new case.',
        side: 'left',
      },
      {
        element: '[data-tour="cases-export"]',
        title: 'Export',
        description: 'Download the current, filtered list to Excel or PDF for reports and meetings.',
        side: 'left',
      },
      {
        element: '[data-tour="cases-table"]',
        title: 'The Case List',
        description: 'Each row is a case. Use the icons to view, edit or remove a case.',
      },
    ],
  },
  {
    id: 'register-new-case',
    title: 'Register New Case Tour',
    topicId: 'register-new-case',
    steps: [
      {
        title: 'Registering a Case',
        description: 'This tour walks through opening a new case. Fill each part in order.',
      },
      {
        element: '[data-tour="newcase-form"]',
        title: 'Case Details',
        description: 'Enter the title, type, priority and region. Fields marked with a red star are required.',
      },
      {
        element: '[data-tour="newcase-save"]',
        title: 'Save the Case',
        description: 'When the details are complete, save to generate the case number and add it to the register.',
        side: 'top',
      },
    ],
  },
  {
    id: 'case-details',
    title: 'Case Details Tour',
    topicId: 'case-details',
    steps: [
      {
        title: 'The Case File',
        description: 'Everything about one case lives here. This tour points out the main areas.',
      },
      {
        element: '[data-tour="case-header"]',
        title: 'Case Header',
        description: 'The top of the page shows the case title, case number and current status.',
        side: 'bottom',
      },
      {
        element: '[data-tour="case-edit"]',
        title: 'Edit the Case',
        description: 'Open this to change the case details, such as title, type, priority or region.',
        side: 'left',
      },
      {
        element: '[data-tour="case-workflow"]',
        title: 'Workflow Progress',
        description: 'The stepper shows which stage the case has reached and what comes next.',
        side: 'top',
      },
      {
        element: '[data-tour="case-stage"]',
        title: 'Update the Stage',
        description:
          'Move the case forward when the current stage is complete. Final closure is done in the Closure tab.',
        side: 'top',
      },
      {
        element: '[data-tour="case-tabs"]',
        title: 'Tabs',
        description:
          'Use the tabs to move between Parties, Documents, Tasks, Events, Land, Filings, Compliance and History.',
        side: 'bottom',
      },
    ],
  },
  {
    id: 'document-reception',
    title: 'Document Reception Tour',
    topicId: 'document-reception',
    steps: [
      {
        title: 'Receiving Documents',
        description: 'This is where incoming letters and documents are registered. Here are the key steps.',
      },
      {
        title: 'Register an Item',
        description: 'Record the source, the date received, the document type and a clear subject.',
      },
      {
        title: 'Attach the Scan',
        description: 'Upload a scan of the document so the full item is on file.',
      },
      {
        title: 'Acknowledge and Assign',
        description:
          'Send an acknowledgement if required, then move the item on to Registration & Assignment.',
      },
    ],
  },
  {
    id: 'management-directions',
    title: 'Management Directions Tour',
    topicId: 'management-directions',
    steps: [
      {
        title: 'Directions',
        description: 'Directions record formal instructions to be carried out. Here is how they work.',
      },
      {
        title: 'Record the Instruction',
        description: 'Enter the source, the subject and the full instruction exactly as given.',
      },
      {
        title: 'Assign and Set a Due Date',
        description: 'Name the responsible officer and set a due date so the direction can be tracked.',
      },
      {
        title: 'Complete',
        description: 'Mark the direction complete once the action has been done.',
      },
    ],
  },
  {
    id: 'registration-assignment',
    title: 'Registration & Assignment Tour',
    topicId: 'registration-assignment',
    steps: [
      {
        title: 'Assigning Work',
        description: 'This step links a document to a case and assigns an officer. Here is the flow.',
      },
      {
        title: 'Confirm the Case',
        description: 'Make sure the document is linked to the correct case, or create the case.',
      },
      {
        title: 'Choose the Officer',
        description: 'Select the action officer and add clear instructions.',
      },
      {
        title: 'Save',
        description: 'The case appears in the officer\'s inbox and the assignment is recorded.',
      },
    ],
  },
  {
    id: 'create-files',
    title: 'Create Files Tour',
    topicId: 'create-files',
    steps: [
      {
        title: 'File Requests',
        description: 'Track the files a case needs and where they are. Here is how.',
      },
      {
        title: 'Request a File',
        description: 'Select the case and file type, and record the file number if known.',
      },
      {
        title: 'Track Movement',
        description: 'Update the status and location as the file is received and returned.',
      },
    ],
  },
  {
    id: 'delegate-case',
    title: 'Delegate Case Tour',
    topicId: 'delegate-case',
    steps: [
      {
        title: 'Delegation',
        description: 'Hand a case to another officer with recorded instructions. Here are the steps.',
      },
      {
        title: 'Choose the Officer',
        description: 'Select who you are delegating to.',
      },
      {
        title: 'Give Instructions',
        description: 'Write clear instructions and set a due date, then save.',
      },
    ],
  },
  {
    id: 'officer-actions',
    title: 'Officer Actions Tour',
    topicId: 'officer-actions',
    steps: [
      {
        title: 'Working a Case',
        description: 'Record the work you do on your assigned case. Here is the routine.',
      },
      {
        title: 'Record Each Action',
        description: 'Add a dated note for each action, and attach documents you produce.',
      },
      {
        title: 'Advance the Stage',
        description: 'Update the status or stage only when the work for the current stage is done.',
      },
    ],
  },
  {
    id: 'external-filings',
    title: 'External Filings Tour',
    topicId: 'external-filings',
    steps: [
      {
        title: 'Court Filings',
        description: 'Prepare and track documents lodged with the court. Here is how.',
      },
      {
        title: 'Create the Filing',
        description: 'Choose the filing type, attach the exact document, and record where it is submitted.',
      },
      {
        title: 'Record the Result',
        description: 'Enter the filing number and date, and keep the status current.',
      },
    ],
  },
  {
    id: 'search-warrants',
    title: 'Search Warrants Tour',
    topicId: 'search-warrants',
    steps: [
      {
        title: 'Search Warrants Register',
        description:
          'This register holds official search warrants received by DLPP and links them to cases. A warrant is an investigation record — not a plaintiff or defendant.',
      },
      {
        title: 'Register a Warrant',
        description:
          'Use "Register Warrant" to add the warrant number, CR number, police details, respondent and the documents to provide.',
      },
      {
        title: 'Link to a Case',
        description:
          'Link each warrant to its case. You can also add warrants from the Search Warrants tab inside a case, where the case is filled in automatically.',
      },
      {
        title: 'Attach Documents',
        description:
          'Open a warrant to attach the scanned warrant, affidavit, file documents, witness statement and return of warrant. These also appear in the case document list.',
      },
      {
        title: 'Track and Report',
        description:
          'Keep the status current, watch the dashboard counts, and export the full Search Warrant Register to Excel or PDF.',
      },
    ],
  },
  {
    id: 'section5-notices',
    title: 'Section 5 Notice Register Tour',
    topicId: 'section5-notices',
    steps: [
      {
        title: 'Section 5 Notice Register',
        description:
          'This register holds official Section 5 Notices received by the Department and links them to cases. A notice is a registry entry — not a plaintiff or defendant.',
      },
      {
        title: 'Register a Notice',
        description:
          'Use "Register Notice" to add the notice number, date received, claimant name and type. For an ILG, record the ILG name and registration number.',
      },
      {
        title: 'Follow the Workflow',
        description:
          'A notice moves in order: Draft → Received → File Opened → Assigned to Lawyer → Legal Review → Awaiting Advice → Advice Issued → Matter Created → Referred to Court → Closed. The status can only move to the next step, or straight to Closed.',
      },
      {
        title: 'Assign, Link and Attach',
        description:
          'Assign the DLPP lawyer, link the notice to an existing or new case, and attach the notice, claim documents, ILG registration, surveys, titles and correspondence from the notice’s detail view.',
      },
      {
        title: 'Dashboard, Timeline and Reports',
        description:
          'Watch the dashboard cards, follow each notice’s Timeline and audit trail, and export the full register or the analytical reports (by month, province, lawyer, ILG, status, linked, outstanding and closed).',
      },
    ],
  },
  {
    id: 'section-160',
    title: 'Section 160(2) Application Register Tour',
    topicId: 'section-160',
    steps: [
      {
        title: 'Section 160(2) Application Register',
        description:
          'This register records applications under the Land Registration Act 1981 — title disputes, Registrar of Titles matters, summons, fraud, consent and rectification — and links them to cases.',
      },
      {
        title: 'Register an Application',
        description:
          'Use "Register Application" to add the year, date received, applicant (Registrar of Titles), defendant, land and title references, summons dates, grounds and court file reference.',
      },
      {
        title: 'Assign a Lawyer & Set Status',
        description:
          'Assign the DLPP lawyer in carriage (choose a system user to enable alerts) and set the status of the matter. Both are recorded in the audit trail.',
      },
      {
        title: 'Link, Attach and Track',
        description:
          'Link the application to an existing or new case, attach the application, summons, consignment note, court documents and legal opinions, and follow the Timeline.',
      },
      {
        title: 'Dashboard and Reports',
        description:
          'Watch the dashboard cards and export the full register or the analytical reports (by year, lawyer, status, land, title file, court file, outstanding and closed).',
      },
    ],
  },
  {
    id: 'compliance-recommendations',
    title: 'Compliance Tour',
    topicId: 'compliance-recommendations',
    steps: [
      {
        title: 'Compliance',
        description: 'Make sure court orders are carried out on time. Here is the process.',
      },
      {
        title: 'Log the Order',
        description: 'Record the court order, what it requires, and the responsible division.',
      },
      {
        title: 'Set the Deadline',
        description: 'Set the compliance deadline and send the memo to the division.',
      },
      {
        title: 'Complete',
        description: 'Update the status until the order is fully complied with.',
      },
    ],
  },
  {
    id: 'case-closure',
    title: 'Case Closure Tour',
    topicId: 'case-closure',
    steps: [
      {
        title: 'Closing a Case',
        description: 'Close a finished case properly while keeping its history. Here is how.',
      },
      {
        title: 'Choose the Outcome',
        description: 'Select the closure type and date, and write closing notes.',
      },
      {
        title: 'Clear Outstanding Items',
        description: 'Confirm tasks, filings and compliance items are handled, then save to close.',
      },
    ],
  },
  {
    id: 'parties-lawyers',
    title: 'Parties & Lawyers Tour',
    topicId: 'parties-lawyers',
    steps: [
      {
        title: 'Communications',
        description: 'Keep a full record of contact with parties and lawyers. Here is how.',
      },
      {
        title: 'Log a Communication',
        description: 'Choose the type and direction, select the party or lawyer, and enter the details.',
      },
      {
        title: 'Track Responses',
        description: 'Attach the document and set a response deadline if a reply is needed.',
      },
    ],
  },
  {
    id: 'reports',
    title: 'Reports Tour',
    topicId: 'reports',
    steps: [
      {
        title: 'Reports and Analytics',
        description: 'Turn case data into reports for management. Here is how.',
      },
      {
        title: 'Choose and Filter',
        description: 'Pick a report, then set the filters and date range.',
      },
      {
        title: 'Export',
        description: 'Export to Excel or PDF, or print, to share the report.',
      },
    ],
  },
  {
    id: 'user-role-management',
    title: 'User Management Tour',
    topicId: 'user-role-management',
    steps: [
      {
        title: 'User and Role Management',
        description: 'Control who can access the system and what they can do. Here is the process.',
      },
      {
        title: 'Add Users',
        description: 'Create a user with their name and email, then assign them to groups.',
      },
      {
        title: 'Set Group Permissions',
        description: 'Use Groups to decide what each role can do per module. Users inherit these permissions.',
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Route -> Topic mapping                                              */
/* ------------------------------------------------------------------ */

/**
 * Ordered rules. The FIRST matching rule wins, so more specific routes
 * are listed before more general ones.
 */
const ROUTE_RULES: { pattern: RegExp; topicId: string }[] = [
  { pattern: /^\/login/, topicId: 'login' },
  { pattern: /^\/dashboard/, topicId: 'dashboard' },

  // Case sub-routes (must come before /cases/[id] and /cases)
  { pattern: /^\/cases\/create-minimal/, topicId: 'minimal-case-creation' },
  { pattern: /^\/cases\/new/, topicId: 'register-new-case' },
  { pattern: /^\/cases\/assignments/, topicId: 'registration-assignment' },
  { pattern: /^\/cases\/[^/]+\/reception/, topicId: 'document-reception' },
  { pattern: /^\/cases\/[^/]+\/directions/, topicId: 'management-directions' },
  { pattern: /^\/cases\/[^/]+\/register-correspondence/, topicId: 'registration-assignment' },
  { pattern: /^\/cases\/[^/]+\/create-files/, topicId: 'create-files' },
  { pattern: /^\/cases\/[^/]+\/delegate/, topicId: 'delegate-case' },
  { pattern: /^\/cases\/[^/]+\/officer-actions/, topicId: 'officer-actions' },
  { pattern: /^\/cases\/[^/]+\/external-filings/, topicId: 'external-filings' },
  { pattern: /^\/cases\/[^/]+\/compliance/, topicId: 'compliance-recommendations' },
  { pattern: /^\/cases\/[^/]+\/closure/, topicId: 'case-closure' },
  { pattern: /^\/cases\/[^/]+\/parties-lawyers/, topicId: 'parties-lawyers' },
  { pattern: /^\/cases\/[^/]+/, topicId: 'case-details' }, // /cases/[id]
  { pattern: /^\/cases/, topicId: 'cases-list' },

  // Other top-level modules
  { pattern: /^\/reports/, topicId: 'reports' },
  { pattern: /^\/settings\/exports/, topicId: 'reports' },
  { pattern: /^\/admin\/users/, topicId: 'user-role-management' },
  { pattern: /^\/admin\/groups/, topicId: 'user-role-management' },
  { pattern: /^\/admin\/modules/, topicId: 'user-role-management' },
  { pattern: /^\/admin/, topicId: 'user-role-management' },
  { pattern: /^\/audit/, topicId: 'audit-trail' },
  { pattern: /^\/calendar/, topicId: 'schedule-events' },
  { pattern: /^\/documents/, topicId: 'upload-documents' },
  { pattern: /^\/tasks/, topicId: 'create-tasks' },
  { pattern: /^\/land-parcels/, topicId: 'link-land-parcels' },
  { pattern: /^\/compliance/, topicId: 'compliance-recommendations' },
  { pattern: /^\/directions/, topicId: 'management-directions' },
  { pattern: /^\/reception/, topicId: 'document-reception' },
  { pattern: /^\/correspondence/, topicId: 'parties-lawyers' },
  { pattern: /^\/communications/, topicId: 'parties-lawyers' },
  { pattern: /^\/lawyers/, topicId: 'parties-lawyers' },
  { pattern: /^\/filings/, topicId: 'external-filings' },
  { pattern: /^\/section5-notices/, topicId: 'section5-notices' },
  { pattern: /^\/section-160/, topicId: 'section-160' },
  { pattern: /^\/search-warrants/, topicId: 'search-warrants' },
  { pattern: /^\/litigation-costs/, topicId: 'reports' },
  { pattern: /^\/file-requests/, topicId: 'create-files' },
  { pattern: /^\/notifications/, topicId: 'dashboard' },
];

/* ------------------------------------------------------------------ */
/* Helper functions                                                    */
/* ------------------------------------------------------------------ */

export function getTopicById(id: string | null | undefined): HelpTopic | undefined {
  if (!id) return undefined;
  return HELP_TOPICS.find((t) => t.id === id);
}

/**
 * Returns the help topic id that best matches a pathname.
 * Returns null when the route is unknown (caller should show the Help Centre home).
 */
export function getTopicIdForRoute(pathname: string | null | undefined): string | null {
  if (!pathname) return null;
  // strip query string / hash just in case
  const clean = pathname.split('?')[0].split('#')[0];
  for (const rule of ROUTE_RULES) {
    if (rule.pattern.test(clean)) return rule.topicId;
  }
  return null;
}

export function getTopicForRoute(pathname: string | null | undefined): HelpTopic | null {
  const id = getTopicIdForRoute(pathname);
  return id ? getTopicById(id) ?? null : null;
}

export function getTourById(id: string | null | undefined): HelpTour | undefined {
  if (!id) return undefined;
  return HELP_TOURS.find((t) => t.id === id);
}

export function getTourForTopic(topicId: string): HelpTour | undefined {
  const topic = getTopicById(topicId);
  if (!topic?.tourId) return undefined;
  return getTourById(topic.tourId);
}

export function getRelatedTopics(topic: HelpTopic): HelpTopic[] {
  return topic.related
    .map((id) => getTopicById(id))
    .filter((t): t is HelpTopic => Boolean(t));
}

export function getTopicsByCategory(category: HelpCategory): HelpTopic[] {
  return HELP_TOPICS.filter((t) => t.category === category);
}

/**
 * Simple keyword search across title, summary, keywords, category and body text.
 * Optionally filter by role.
 */
export function searchTopics(query: string, role?: HelpRole | 'all'): HelpTopic[] {
  const q = query.trim().toLowerCase();
  let topics = HELP_TOPICS;
  if (role && role !== 'all') {
    topics = topics.filter((t) => t.roles.includes(role));
  }
  if (!q) return topics;

  const terms = q.split(/\s+/).filter(Boolean);
  const scored = topics
    .map((t) => {
      const haystack = [
        t.title,
        t.summary,
        t.category,
        t.purpose,
        t.whoShouldUse,
        ...t.keywords,
        ...t.steps,
      ]
        .join(' ')
        .toLowerCase();
      let score = 0;
      for (const term of terms) {
        if (t.title.toLowerCase().includes(term)) score += 5;
        if (t.keywords.some((k) => k.toLowerCase().includes(term))) score += 3;
        if (haystack.includes(term)) score += 1;
      }
      return { t, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.map((s) => s.t);
}
