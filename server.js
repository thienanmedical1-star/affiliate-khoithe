const { execSync } = require('child_process')
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

// Run db push on startup
try {
  console.log('Running prisma db push...')
  execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' })
  console.log('Database ready!')
  
  // Seed admin if needed
  execSync('node prisma/seed.js', { stdio: 'inherit' })
} catch (e) {
  console.log('DB setup note:', e.message)
}

app.prepare().then(() => {
  const port = process.env.PORT || 3000
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true)
    handle(req, res, parsedUrl)
  }).listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`)
  })
})
