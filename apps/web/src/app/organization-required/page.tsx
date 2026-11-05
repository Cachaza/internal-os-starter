import { redirect } from "next/navigation";
export default function OrganizationRequiredPage() {
	redirect("/organizations");
}
