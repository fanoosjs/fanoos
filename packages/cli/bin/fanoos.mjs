#!/usr/bin/env node
/* global process */

import { runCli } from '../dist/index.js'

process.exitCode = await runCli(process.argv.slice(2))
