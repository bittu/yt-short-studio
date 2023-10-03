const execa = require('execa');

const prestart = async () => {
  await execa('git', ['reset', '--hard'])
  await execa('git', ['pull'])
  await execa('npm', ['install'])
}

prestart();