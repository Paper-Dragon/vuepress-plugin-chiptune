import { path } from '@vuepress/utils'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const chiptune = {
  name: 'vuepress-plugin-chiptune',
  clientConfigFile: path.resolve(__dirname, './client.js'),
}