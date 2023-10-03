import { $ } from 'execa'

const prestart = async () => {
  await $`git reset --hard`
  await $`git pull`
  await $`npm install`
}

prestart();