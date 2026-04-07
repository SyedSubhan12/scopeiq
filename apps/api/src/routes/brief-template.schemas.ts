import { z } from "zod";

const briefTemplateBrandingSchema = z.object({
  logoUrl: z.string().url().nullable().optional(),
  accentColor: z.string().max(32).nullable().optional(),
  introMessage: z.string().max(4000).nullable().optional(),
  successMessage: z.string().max(4000).nullable().optional(),
  supportEmail: z.string().email().nullable().optional(),
});

const templateFieldSchema = z.object({
  key: z.string().min(1).max(100),
  label: z.string().min(1).max(255),
  type: z
    .enum([
      "text",
      "textarea",
      "single_choice",
      "multi_choice",
      "date",
      "file_upload",
      "number",
      "select",
      "multiselect",
      "boolean",
    ])
    .optional(),
  required: z.boolean().optional(),
  options: z.array(z.string()).optional(),
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
  conditions: z
    .array(
      z.object({
        field_key: z.string().min(1).max(100),
        operator: z.enum(["equals", "not_equals", "contains"]),
        value: z.string(),
      }),
    )
    .optional(),
  order: z.number().int().min(0).optional(),
});

export const createBriefTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  fieldsJson: z.array(templateFieldSchema).optional(),
  brandingJson: briefTemplateBrandingSchema.optional(),
  isDefault: z.boolean().optional(),
});

export const updateBriefTemplateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  fieldsJson: z.array(templateFieldSchema).optional(),
  brandingJson: briefTemplateBrandingSchema.optional(),
  isDefault: z.boolean().optional(),
});

export const restoreBriefTemplateVersionSchema = z.object({
  versionId: z.string().uuid(),
});
