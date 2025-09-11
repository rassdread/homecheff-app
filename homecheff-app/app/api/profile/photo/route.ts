import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return new Response("Unauthorized", { status: 401 });

  const { url } = await req.json();
  if (!url) return new Response("Missing url", { status: 400 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return new Response("User not found", { status: 404 });

  await prisma.user.update({
    where: { email: session.user.email },
    data: { image: url },
  });

  return Response.json({ ok: true });
}
