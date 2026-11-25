import { env } from './config/env.js'
import { createApp } from './app.js'

const app = createApp()

app.listen(env.PORT, () => {
  console.log(`FITCOACH API escuchando en http://localhost:${env.PORT}`)
})
