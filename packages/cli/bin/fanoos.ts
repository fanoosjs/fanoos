#!/usr/bin/env node
import { Command } from 'commander';
import { scanCommand } from '../src/commands/scan';

const program = new Command();

program
  .name('fanoos')
  .description('Illuminate the darkness of your project!')
  .version('0.0.2');

program.addCommand(scanCommand);

program.parse();
