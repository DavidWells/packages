// Notification Lambda handler

export async function send(event, context) {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'send function called'
    }),
  }
}
