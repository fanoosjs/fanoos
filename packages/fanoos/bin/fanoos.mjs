#!/usr/bin/env node
/* global process */

import { runCli } from '@fanoosjs/cli'

process.exitCode = await runCli(process.argv.slice(2))
