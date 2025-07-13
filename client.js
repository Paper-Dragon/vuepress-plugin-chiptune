import { defineClientConfig } from '@vuepress/client'
import Chiptune from './src/Chiptune.vue'

export default defineClientConfig({
  enhance({ app }) {
    app.component('Chiptune', Chiptune)
  },
})