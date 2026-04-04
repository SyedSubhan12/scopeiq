import { z } from "zod";

const templateFieldSchema = z.object({
  key: z.string().min(1).max(100),
  label: z.string().min(1).max(255),
  type: z.enum(["text", "textarea", "number", "date", "select", "multiselect", "boolean"]).optional(),
  required: z.boolean().optional(),
  options: z.array(z.string()).optional(),
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
});

export const createBriefTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  fieldsJson: z.array(templateFieldSchema).optional(),
  isDefault: z.boolean().optional(),
});

export const updateBriefTemplateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  fieldsJson: z.array(templateFieldSchema).optional(),
  isDefault: z.boolean().optional(),
});
