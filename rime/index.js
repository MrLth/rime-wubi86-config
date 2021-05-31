#!/usr/bin/env node
/*
 * @Author: mrlthf11
 * @LastEditors: mrlthf11
 * @Date: 2021-04-25 09:22:54
 * @LastEditTime: 2021-04-26 14:02:41
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
  .option('-f, --filter <type>', "脚本提供「word」和「code」两个变量，让你可以使用一段 js 语句来筛选并查看词库，如「code.startsWith('kh')」")
  .option('-u, --upload', '是否在 write 后 git push')

program.parse(process.argv);

const options = program.opts();

const { word, add, top, index, delete: isDelete, open, filter, upload } = options
let { code } = options;
let pushed = false

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

if (filter) {
  const filterFn = new Function('word', 'code', `return ${filter}`)
  let head = true
  for (const [code, wordSet] of dict) {
    for (const word of wordSet) {
      if (filterFn(word, code)) {
        if (head) {
          console.log(`${code}：`.gray)
          head = false
        }
        console.log(`${code}\t${word}`)
      }
    }
    if (!head) {
      head = true
      console.log('')
    }
  }

  return
}

if (isDelete) {
  if (word) {
    if (code) {
      if (dict.has(code)) {
        const words = [...(dict.get(code) ?? [])]
        const newWords = words.filter(_word => _word !== word)

        if (newWords.length === words.length) {
          return
        }

        logCode(word, 'delete')
        logWord(code, 'delSingle')

        dict.set(code, new Set(newWords))
      }
    } else {
      const records = query(word)

      if (records.length === 0) {
        return
      }

      for (const [_code] of records) {
        logCode(word, 'delete', _code)
      }
      logWord(null, 'delWord')

      for (const [code, word] of records) {
        dict.set(code, new Set([...dict.get(code)].filter(_word => _word !== word)))
      }
    }
    write()
  } else {
    console.error('当使用「-d, --delete」时，必须指定「-w, --word」\n'.red)
  }
  return
}

if (word) {
  const generatedCode = translate(word)
  code = code ?? generatedCode

  const isAdd = add || top || index
  if (isAdd) {
    if (top || index) {
      const words = [...(dict.get(code) ?? [])].filter(_word => _word !== word)
      words.splice(top ? 0 : index, 0, word)
      dict.set(code, new Set(words))
    } else {
      dictAdd(code, word)
    }

    write()
  }

  logGenerated(generatedCode)

  logCode(word, isAdd ? 'add' : 'normal')

  logWord(code, isAdd ? 'add' : 'normal')

  if (upload) {
    push()
  }

  return
}

if (code) {
  logCode()
}

if (upload) {
  push()
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
      ? `  ${generatedCode}\t${word}\n`
      : '  none'.gray
  )
}

/**
 * @param {string} $word
 * @param {"normal"|"add"|"delete"} $status
 */
function logCode($word, $status = "normal", $code = code) {
  const words = [...(dict.get($code) ?? [])]
  console.log(`code：`.gray)
  console.log(
    (
      words.length
        ? words.map(_word => {
          const res = `${$code}\t${_word}`

          switch ($status) {
            case "add":
              return _word === $word ? `+ ${res}`.green : `  ${res}`;
            case "delete":
              return _word === $word ? `- ${res}`.red : `  ${res}`;
            case "normal":
            default:
              return `  ${res}`
          }
        }).join('\n')
        : '  none'.gray
    )
    + '\n')
}

/**
 * @param {string} $code
 * @param {"normal"|"add"|"delSingle"|"delWord"} $status
 */
function logWord($code, $status = "normal") {
  const records = query(word)
  if (add && !records.find(([_code]) => _code === $code)) {
    records.push([$code, word])
  }

  console.log(`word：`.gray)
  console.log(
    (
      records.length
        ? records.map(([_code, _word]) => {
          const res = `${_code}\t${_word}`

          switch ($status) {
            case "add":
              return _code === $code ? `+ ${res}`.green : `  ${res}`;
            case "delSingle":
              return _code === $code ? `- ${res}`.red : `  ${res}`;
            case "delWord":
              return `- ${res}`.red
            case "normal":
            default:
              return `  ${res}`
          }
        }).join('\n')
        : '  none'.gray
    )
    + '\n'
  )
}

function exec(command) {
  return new Promise((resolve, reject) => {
    console.log('exec'.yellow, '>'.gray, command)
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

  if (upload) {
    await push()
  }
}

async function push() {
  if (!pushed) {
    if (process.cwd().startsWith(dictPath)) {
      try {
        await exec(`git add "${dictPath}"`)
        await exec("git commit -m 'update dict'")
      } catch (e) {
        console.log(e)
      }
      let isSuccuss = false
      while (!isSuccuss) {
        try {
          await exec('git push')
          isSuccuss = true
          pushed = true
        } catch (error) {
          console.log(error)
        }
      }

    } else {
      console.log(`当前未处于 ${dictPath} 目录下，\n无法操作 Git 仓库\n`.gray)
    }
  }
}