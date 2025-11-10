// Sitemap generation Lambda handler

export async function generate(event, context) {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'generate function called'
    }),
  }
}
