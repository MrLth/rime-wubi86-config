#!/usr/bin/env node
/*
 * @Author: mrlthf11
 * @LastEditors: mrlthf11
 * @Date: 2021-04-25 09:22:54
 * @LastEditTime: 2021-04-25 09:29:06
 * @Description: file content
 */
const { program } = require('commander');

program
  .option('-w, --word <type>', 'add word')

program.parse(process.argv);

const options = program.opts();
console.log(options)