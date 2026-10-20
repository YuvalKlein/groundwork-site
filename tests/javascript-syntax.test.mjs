import test from 'node:test';
import {readdirSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';

function scripts(directory) {
  return readdirSync(directory,{withFileTypes:true}).flatMap(entry=>{
    const path=join(directory,entry.name);
    return entry.isDirectory()?scripts(path):entry.name.endsWith('.js')?[path]:[];
  });
}
test('every shipped JavaScript file parses, including pages outside Client OS',()=>{
  for(const path of ['client-os','atlas','auth','system'].flatMap(scripts)) {
    execFileSync(process.execPath,['--input-type=module','--check'],{input:readFileSync(path),stdio:['pipe','pipe','pipe']});
  }
});
