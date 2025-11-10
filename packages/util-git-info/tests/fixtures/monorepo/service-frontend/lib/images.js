// Image optimization Lambda handler

export async function optimize(event, context) {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'optimize function called'
    }),
  }
}
