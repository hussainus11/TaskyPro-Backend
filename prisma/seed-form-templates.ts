import { PrismaClient } from "../generated/prisma/client";

type SeedOption = { label: string; value: string };

type SeedField = {
  id: string;
  sectionId: string;
  type: string;
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  defaultValue?: string;
  width?: "full" | "half" | "third" | "quarter";
  options?: SeedOption[];
};

type SeedSection = {
  id: string;
  title: string;
  description?: string;
  order: number;
};

type SeedTemplate = {
  name: string;
  description: string;
  entityType: "LEAD" | "DEAL" | "CONTACT" | "TASK" | "CUSTOMER";
  sections: SeedSection[];
  fields: SeedField[];
};

const SOURCE_OPTIONS: SeedOption[] = [
  { label: "Website", value: "Website" },
  { label: "Referral", value: "Referral" },
  { label: "Social Media", value: "Social Media" },
  { label: "Cold Call", value: "Cold Call" },
  { label: "Email Campaign", value: "Email Campaign" },
  { label: "Trade Show", value: "Trade Show" },
  { label: "Advertisement", value: "Advertisement" },
  { label: "Other", value: "Other" }
];

const TEMPLATES: SeedTemplate[] = [
  {
    name: "Lead Capture Form",
    description: "Default template used to capture new leads.",
    entityType: "LEAD",
    sections: [{ id: "lead-details", title: "Lead Information", order: 0 }],
    fields: [
      { id: "lead-name", sectionId: "lead-details", type: "text", label: "Full Name", name: "name", placeholder: "Jane Doe", required: true, width: "full" },
      { id: "lead-email", sectionId: "lead-details", type: "email", label: "Email", name: "email", placeholder: "jane@company.com", required: true, width: "half" },
      { id: "lead-phone", sectionId: "lead-details", type: "phone", label: "Phone", name: "phone", placeholder: "+1 555 000 0000", width: "half" },
      { id: "lead-company", sectionId: "lead-details", type: "text", label: "Company", name: "company", placeholder: "Acme Inc.", width: "half" },
      { id: "lead-job-title", sectionId: "lead-details", type: "text", label: "Job Title", name: "jobTitle", width: "half" },
      { id: "lead-source", sectionId: "lead-details", type: "select", label: "Lead Source", name: "source", width: "half", options: SOURCE_OPTIONS },
      {
        id: "lead-status",
        sectionId: "lead-details",
        type: "select",
        label: "Status",
        name: "status",
        width: "half",
        defaultValue: "New",
        options: [
          { label: "New", value: "New" },
          { label: "Contacted", value: "Contacted" },
          { label: "Qualified", value: "Qualified" },
          { label: "Unqualified", value: "Unqualified" },
          { label: "Converted", value: "Converted" }
        ]
      },
      { id: "lead-value", sectionId: "lead-details", type: "number", label: "Estimated Value", name: "value", placeholder: "0.00", width: "half" },
      { id: "lead-notes", sectionId: "lead-details", type: "textarea", label: "Notes", name: "notes", width: "full" }
    ]
  },
  {
    name: "Deal Form",
    description: "Default template used to create and track deals.",
    entityType: "DEAL",
    sections: [{ id: "deal-details", title: "Deal Information", order: 0 }],
    fields: [
      { id: "deal-name", sectionId: "deal-details", type: "text", label: "Deal Name", name: "name", placeholder: "Enterprise license renewal", required: true, width: "full" },
      { id: "deal-company", sectionId: "deal-details", type: "text", label: "Company", name: "company", width: "half" },
      { id: "deal-contact-name", sectionId: "deal-details", type: "text", label: "Primary Contact", name: "contactName", width: "half" },
      { id: "deal-value", sectionId: "deal-details", type: "number", label: "Deal Value", name: "value", placeholder: "0.00", required: true, width: "half" },
      {
        id: "deal-currency",
        sectionId: "deal-details",
        type: "select",
        label: "Currency",
        name: "currency",
        width: "half",
        defaultValue: "USD",
        options: [
          { label: "USD", value: "USD" },
          { label: "EUR", value: "EUR" },
          { label: "GBP", value: "GBP" },
          { label: "PKR", value: "PKR" }
        ]
      },
      {
        id: "deal-status",
        sectionId: "deal-details",
        type: "select",
        label: "Stage",
        name: "status",
        width: "half",
        defaultValue: "Prospecting",
        options: [
          { label: "Prospecting", value: "Prospecting" },
          { label: "Qualification", value: "Qualification" },
          { label: "Proposal Sent", value: "Proposal Sent" },
          { label: "Negotiation", value: "Negotiation" },
          { label: "Closed Won", value: "Closed Won" },
          { label: "Closed Lost", value: "Closed Lost" }
        ]
      },
      { id: "deal-probability", sectionId: "deal-details", type: "number", label: "Win Probability (%)", name: "probability", placeholder: "50", width: "half" },
      { id: "deal-close-date", sectionId: "deal-details", type: "date", label: "Expected Close Date", name: "closeDate", width: "half" },
      { id: "deal-source", sectionId: "deal-details", type: "select", label: "Deal Source", name: "source", width: "half", options: SOURCE_OPTIONS },
      { id: "deal-notes", sectionId: "deal-details", type: "textarea", label: "Notes", name: "notes", width: "full" }
    ]
  },
  {
    name: "Contact Capture Form",
    description: "Default template used to capture new contacts.",
    entityType: "CONTACT",
    sections: [{ id: "contact-details", title: "Contact Information", order: 0 }],
    fields: [
      { id: "contact-name", sectionId: "contact-details", type: "text", label: "Full Name", name: "name", placeholder: "Jane Doe", required: true, width: "full" },
      { id: "contact-email", sectionId: "contact-details", type: "email", label: "Email", name: "email", placeholder: "jane@company.com", required: true, width: "half" },
      { id: "contact-phone", sectionId: "contact-details", type: "phone", label: "Phone", name: "phone", placeholder: "+1 555 000 0000", width: "half" },
      { id: "contact-company", sectionId: "contact-details", type: "text", label: "Company", name: "company", width: "half" },
      { id: "contact-job-title", sectionId: "contact-details", type: "text", label: "Job Title", name: "jobTitle", width: "half" },
      {
        id: "contact-type",
        sectionId: "contact-details",
        type: "select",
        label: "Contact Type",
        name: "type",
        width: "half",
        options: [
          { label: "Customer", value: "Customer" },
          { label: "Partner", value: "Partner" },
          { label: "Vendor", value: "Vendor" },
          { label: "Prospect", value: "Prospect" },
          { label: "Other", value: "Other" }
        ]
      },
      { id: "contact-address", sectionId: "contact-details", type: "text", label: "Address", name: "address", width: "half" },
      { id: "contact-notes", sectionId: "contact-details", type: "textarea", label: "Notes", name: "notes", width: "full" }
    ]
  },
  {
    name: "Customer Form",
    description: "Default template used to add new customers.",
    entityType: "CUSTOMER",
    sections: [{ id: "customer-details", title: "Customer Information", order: 0 }],
    fields: [
      { id: "customer-name", sectionId: "customer-details", type: "text", label: "Full Name", name: "name", placeholder: "Jane Doe", required: true, width: "full" },
      { id: "customer-email", sectionId: "customer-details", type: "email", label: "Email", name: "email", placeholder: "jane@company.com", width: "half" },
      { id: "customer-phone", sectionId: "customer-details", type: "phone", label: "Phone", name: "phone", placeholder: "+1 555 000 0000", width: "half" },
      { id: "customer-address", sectionId: "customer-details", type: "text", label: "Address", name: "address", width: "full" },
      { id: "customer-city", sectionId: "customer-details", type: "text", label: "City", name: "city", width: "third" },
      { id: "customer-state", sectionId: "customer-details", type: "text", label: "State", name: "state", width: "third" },
      { id: "customer-postal-code", sectionId: "customer-details", type: "text", label: "Postal Code", name: "postalCode", width: "third" },
      { id: "customer-country", sectionId: "customer-details", type: "text", label: "Country", name: "country", placeholder: "United States", width: "half" }
    ]
  },
  {
    name: "Task Form",
    description: "Default template used to create and track tasks.",
    entityType: "TASK",
    sections: [{ id: "task-details", title: "Task Information", order: 0 }],
    fields: [
      { id: "task-title", sectionId: "task-details", type: "text", label: "Task Title", name: "title", placeholder: "Follow up with client", required: true, width: "full" },
      { id: "task-description", sectionId: "task-details", type: "textarea", label: "Description", name: "description", width: "full" },
      {
        id: "task-status",
        sectionId: "task-details",
        type: "select",
        label: "Status",
        name: "status",
        width: "half",
        defaultValue: "To Do",
        options: [
          { label: "To Do", value: "To Do" },
          { label: "In Progress", value: "In Progress" },
          { label: "In Review", value: "In Review" },
          { label: "Done", value: "Done" },
          { label: "Blocked", value: "Blocked" }
        ]
      },
      {
        id: "task-priority",
        sectionId: "task-details",
        type: "select",
        label: "Priority",
        name: "priority",
        width: "half",
        defaultValue: "Medium",
        options: [
          { label: "Low", value: "Low" },
          { label: "Medium", value: "Medium" },
          { label: "High", value: "High" },
          { label: "Urgent", value: "Urgent" }
        ]
      },
      { id: "task-due-date", sectionId: "task-details", type: "date", label: "Due Date", name: "dueDate", width: "half" },
      { id: "task-assignee", sectionId: "task-details", type: "text", label: "Assigned To", name: "assignee", width: "half" },
      { id: "task-tags", sectionId: "task-details", type: "tags", label: "Tags", name: "tags", width: "half" }
    ]
  }
];

function toFormFields(fields: SeedField[]) {
  return fields.map(({ id, sectionId, type, label, name, placeholder, required, defaultValue, width, options }) => ({
    id,
    sectionId,
    type,
    label,
    name,
    ...(placeholder ? { placeholder } : {}),
    ...(required ? { required } : {}),
    ...(defaultValue ? { defaultValue } : {}),
    ...(width ? { width } : {}),
    ...(options ? { options } : {})
  }));
}

// Master templates have companyId = null / branchId = null. New companies get
// their own copy cloned by createDefaultTemplates() in companyController.ts
// at creation time - this seed only needs to run once per environment.
export async function seedFormTemplates(prisma: PrismaClient) {
  for (const template of TEMPLATES) {
    const existing = await prisma.formTemplate.findFirst({
      where: { name: template.name, companyId: null, branchId: null }
    });

    if (existing) {
      console.log(`Master template "${template.name}" already exists, skipping.`);
      continue;
    }

    await prisma.formTemplate.create({
      data: {
        name: template.name,
        description: template.description,
        entityType: template.entityType,
        formFields: toFormFields(template.fields),
        settings: { sections: template.sections },
        isActive: true,
        companyId: null,
        branchId: null
      }
    });

    console.log(`Created master template "${template.name}" (${template.entityType}).`);
  }
}
