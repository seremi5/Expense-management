import postgres from 'postgres'
import bcrypt from 'bcrypt'
import * as dotenv from 'dotenv'

dotenv.config()

const sql = postgres(process.env.DATABASE_URL)

async function resetPassword() {
  try {
    const email = 'sreinami@gmail.com'
    const newPassword = 'Test1234'

    // Check if user exists
    const users = await sql`
      SELECT id, email, name
      FROM profiles
      WHERE email = ${email}
    `

    if (users.length === 0) {
      console.log(`❌ User not found: ${email}`)
      return
    }

    console.log('\n📋 User found:')
    console.log(`   Email: ${users[0].email}`)
    console.log(`   Name: ${users[0].name}`)
    console.log(`   ID: ${users[0].id}`)

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update password
    await sql`
      UPDATE profiles
      SET password_hash = ${hashedPassword}
      WHERE email = ${email}
    `

    console.log('\n✅ Password reset successfully!')
    console.log(`   New password: ${newPassword}`)
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await sql.end()
  }
}

resetPassword()
