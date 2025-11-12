import postgres from 'postgres'
import * as dotenv from 'dotenv'

dotenv.config()

const sql = postgres(process.env.DATABASE_URL)

async function grantAdmin() {
  try {
    // Check current user
    const users = await sql`
      SELECT id, email, name, role
      FROM profiles
      WHERE email = 'sreinami@gmail.com'
    `

    if (users.length === 0) {
      console.log('❌ User not found: sreinami@gmail.com')
      return
    }

    console.log('\n📋 Current user details:')
    console.log(users[0])

    if (users[0].role === 'admin') {
      console.log('\n✅ User is already an admin!')
      return
    }

    // Grant admin role
    await sql`
      UPDATE profiles
      SET role = 'admin'
      WHERE email = 'sreinami@gmail.com'
    `

    console.log('\n✅ Successfully granted admin role!')

    // Verify
    const updated = await sql`
      SELECT id, email, name, role
      FROM profiles
      WHERE email = 'sreinami@gmail.com'
    `
    console.log('\n📋 Updated user details:')
    console.log(updated[0])
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await sql.end()
  }
}

grantAdmin()
