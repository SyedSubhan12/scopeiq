import { redirect } from "next/navigation";

export default function EditBriefTemplatePage({
  params,
}: {
  params: { id: string };
}) {
  redirect(`/briefs/templates/${params.id}`);
}
