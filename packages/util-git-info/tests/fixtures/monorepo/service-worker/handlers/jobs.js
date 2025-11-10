// Job processing Lambda handlers

export async function process(event, context) {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'process function called'
    }),
  }
}

export async function schedule(event, context) {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'schedule function called'
    }),
  }
}
