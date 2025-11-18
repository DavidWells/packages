// Authentication Lambda handlers
import authDep from './utils/auth-dep'

export async function authenticate(event, context) {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'authenticate function called ' + authDep
    }),
  }
}
