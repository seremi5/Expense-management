import postgres from 'postgres'
import bcrypt from 'bcrypt'
import * as dotenv from 'dotenv'

dotenv.config()

const sql = postgres(process.env.DATABASE_URL)

async function verifyPassword() {
  try {
    const email = 'sreinami@gmail.com'
    const testPassword = 'Test1234'

    // Get user
    const users = await sql`
      SELECT id, email, name, password_hash
      FROM profiles
      WHERE email = ${email}
    `

    if (users.length === 0) {
      console.log(`❌ User not found: ${email}`)
      return
    }

    const user = users[0]
    console.log('\n📋 User found:')
    console.log(`   Email: ${user.email}`)
    console.log(`   Name: ${user.name}`)
    console.log(`   Password hash: ${user.password_hash.substring(0, 20)}...`)

    // Verify password
    const isValid = await bcrypt.compare(testPassword, user.password_hash)

    console.log(`\n🔐 Password verification:`)
    console.log(`   Testing password: ${testPassword}`)
    console.log(`   Result: ${isValid ? '✅ VALID' : '❌ INVALID'}`)

    if (!isValid) {
      console.log('\n💡 Resetting password to Test1234...')
      const newHash = await bcrypt.hash(testPassword, 10)
      await sql`
        UPDATE profiles
        SET password_hash = ${newHash}
        WHERE email = ${email}
      `
      console.log('✅ Password reset successfully!')
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await sql.end()
  }
}

verifyPassword()
