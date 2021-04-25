#!/usr/bin/env node
/*
 * @Author: mrlthf11
 * @LastEditors: mrlthf11
 * @Date: 2021-04-25 09:22:54
 * @LastEditTime: 2021-04-25 16:24:19
 * @Description: file content
 */
const { program } = require('commander');
const { writeFile, readFileSync } = require('fs')
const childProcess = require('child_process')
const translate = require('./utils/translate')
const path = require('path')
const { dict, dictPath, query } = require('./utils/read-dict')
require("colors");


program
  .option('-w, --word <type>', '以词为查询条件，查看本地词库匹配的词')
  .option('-d, --delete', '需配合 -w 和 -c 使用, 从本地词库删除词')
  .option('-c, --code <type>', '以键码为查询条件，查看本地词库匹配的词')
  .option('-a, --add', '需配合 -w 和 -c（可选）使用，向本地词库添加词，如果不使用 -c 指定键码，将使用自动生成的键码')
  .option('-t, --top', '需配合 -a 使用，添加词至顶部（键入时第一顺位）')
  .option('-i, --index <type>', '需配合 -a 使用，添加词到指定位置，「-i 0」和「-t」造价')
  .option('-o, --open <type>', '批量添加，格式与词库保持一致，即「词\t键码」')

program.parse(process.argv);

const options = program.opts();

const { word, add, top, index, delete: isDelete, open } = options

let { code } = options;

if (open) {
  const source = readFileSync(open, { encoding: 'utf-8' })

  source.split('\n').map(line => {
    if (/(\t| +)(\w{1,4})$/.test(line)) {
      let [word, code] = line.split('\t')
      if (!code) {
        [word, code] = line.split(' ').filter(Boolean)
      }
      dictAdd(code, word)
    }
  })

  write()
  return
}

if (isDelete) {
  if (code && word) {
    if (dict.has(code)) {
      const words = [...(dict.get(code) ?? [])]

      logCode(word)
      logWord(code)

      dict.set(code, new Set(words.filter(_word => _word !== word)))
      write()
    }
  } else {
    console.error('当使用「-d, --delete」时，必须指定「-w, --word」和「-c, --code」'.red)
  }
  return
}

if (word) {
  const generatedCode = translate(word)
  code = code ?? generatedCode

  logGenerated(generatedCode)

  logCode()

  logWord()

  if (add) {
    if (top || index) {
      const words = [...(dict.get(code) ?? [])]
      words.splice(top ? 0 : index, 0, word)
      dict.set(code, new Set(words))
    } else {
      dictAdd(code, word)
    }

    write()
  }
  return
}

if (code) {
  logCode()
}

// ---------------------------------------------------------------------
function dictAdd(code, word) {
  if (dict.has(code)) {
    dict.get(code).add(word)
  } else {
    dict.set(code, new Set([word]))
  }
}
function logGenerated(generatedCode) {
  console.log(`generated：`.gray)
  console.log(
    generatedCode
      ? `${generatedCode}\t${word}\n`
      : 'none'.gray
  )
}

function logCode(word = '') {
  const words = [...dict.get(code)]
  console.log(`code：`.gray)
  console.log(
    (
      words
        ? words.map(_word => {
          const res = `${code}\t${_word}`
          return word
            ? (word === _word ? '- '.red + res.gray : `  ${res}`)
            : res
        }).join('\n')
        : 'none'.gray
    )
    + '\n')
}

function logWord(_code = '') {
  const records = query(word)

  console.log(`word：`.gray)
  console.log(
    (
      records
        ? records.map(([code, _word]) => {
          const res = `${code}\t${_word}`
          return _code
            ? (code === _code ? '- '.red + res.gray : `  ${res}`)
            : res
        }).join('\n')
        : 'none'.gray
    )
    + '\n'
  )
}

function exec(command) {
  return new Promise((resolve, reject) => {
    childProcess.exec(command, (err, stdout, stderr) => {
      if (err) {
        reject(err)
        return
      }

      if (stdout)
        console.log(stdout)

      if (stderr)
        console.error(stderr)

      resolve()
    })
  })
}

async function write() {
  const outputString = [...dict].map(
    ([code, wordSet]) =>
      [...wordSet].map(word => `${word}\t${code}`).join('\n')
  ).join('\n')


  const cfg = readFileSync(path.resolve(__dirname, '.dictconfig.cfg'), { encoding: 'utf-8' })

  await new Promise((resolve, reject) =>
    writeFile(
      path.join(dictPath, 'wubi86_jidian.dict.yaml'),
      `${cfg}\n\n${outputString}\n`,
      { encoding: 'utf-8' },
      (err) => err ? reject(err) : resolve()
    )
  )
  await exec(`git add "${dictPath}"`)
  try {
    await exec("git commit -m 'update dict'")
  } catch (e) {
    console.log(e)
  }
}