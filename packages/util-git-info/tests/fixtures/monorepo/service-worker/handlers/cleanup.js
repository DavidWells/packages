// Cleanup Lambda handler

export async function run(event, context) {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'run function called'
    }),
  }
}
