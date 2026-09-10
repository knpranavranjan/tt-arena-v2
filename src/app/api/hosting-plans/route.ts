import { listHostingPlans, setHostingPlanPrice } from "@/lib/db/queries/hosting-plans";

export async function GET() {
  return Response.json(await listHostingPlans());
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null);
  const id = body?.id;
  const price = body?.price;
  if (typeof id !== "string" || typeof price !== "number" || !Number.isFinite(price)) {
    return Response.json({ error: "id (string) and price (number) required" }, { status: 400 });
  }
  await setHostingPlanPrice(id, Math.max(0, Math.round(price)));
  return Response.json(await listHostingPlans());
}
