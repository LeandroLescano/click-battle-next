// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

export async function GET() {
  console.info("get hello");
  return Response.json({name: "John Doe Test"}, {status: 200});
}
