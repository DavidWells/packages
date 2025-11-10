// Page rendering Lambda handler

export async function page(event, context) {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'page function called'
    }),
  }
}
