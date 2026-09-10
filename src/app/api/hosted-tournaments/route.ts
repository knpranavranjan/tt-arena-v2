import { addHosted, getHosted } from "@/lib/db/queries/hosted";

export async function GET() {
  return Response.json(await getHosted());
}

export async function POST(request: Request) {
  const b = await request.json().catch(() => null);
  const event = b?.event;
  const categories = b?.categories;
  if (!event || typeof event.id !== "string" || !Array.isArray(categories)) {
    return Response.json({ error: "event and categories[] required" }, { status: 400 });
  }
  await addHosted(event, categories);
  return Response.json(await getHosted(), { status: 201 });
}
