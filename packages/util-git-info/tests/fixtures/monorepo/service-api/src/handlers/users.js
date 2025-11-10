// User management Lambda handlers

export async function get(event, context) {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'get function called'
    }),
  }
}

export async function create(event, context) {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'create function called'
    }),
  }
}

export async function update(event, context) {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'update function called'
    }),
  }
}

export async function deleteUser(event, context) {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'deleteUser function called'
    }),
  }
}
