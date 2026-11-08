// Test the actual packaged executable with a fresh profile and a loopback-only CDP port.
const assert = require('node:assert/strict')
const { spawn } = require('node:child_process')
const { mkdirSync, mkdtempSync, existsSync, writeFileSync, readFileSync } = require('node:fs')
const path = require('node:path')
const net = require('node:net')
const manifest = require('../package.json')
const root = path.join(__dirname,'..')
const output = path.join(root,'test-results')
const executable = path.join(root,'release',manifest.version,'win-unpacked','NetAgro Colombia.exe')
if (!existsSync(executable)) throw new Error('Package the application before running this test')
mkdirSync(output,{recursive:true})
const profile = mkdtempSync(path.join(output,'packaged-profile-'))
const expected = JSON.parse(readFileSync(path.join(root,'data/processed/metadata.json'),'utf8'))
async function port() {
  const server = net.createServer()
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve))
  const number = server.address().port
  await new Promise(resolve => server.close(resolve))
  return number
}
async function run() {
  const debuggingPort = await port()
  const env = {...process.env}
  delete env.ELECTRON_RUN_AS_NODE
  delete env.VITE_DEV_SERVER_URL
  env.MAIN_VITE_GEMINI_API_KEY = ''
  const child = spawn(executable,['--smoke-test','--user-data-dir='+profile,'--remote-debugging-port='+debuggingPort,'--remote-debugging-address=127.0.0.1'],{cwd:root,env,windowsHide:true,stdio:['ignore','pipe','pipe']})
  let logs=''
  child.stderr.on('data',chunk => { logs+=chunk })
  child.on('error',error => { logs+=String(error) })
  let socket
  const timeout = setTimeout(()=>child.kill(),90000)
  try {
    let target
    for(let i=0;i<100;i++){
      if(child.exitCode !== null) throw new Error('Packaged executable exited: '+logs)
      try {
        const targets=await (await fetch('http://127.0.0.1:'+debuggingPort+'/json/list')).json()
        target=targets.find(item=>item.type==='page' && item.url.includes('index.html'))
        if(target) break
      } catch {}
      await new Promise(resolve=>setTimeout(resolve,150))
    }
    assert.ok(target,'Packaged renderer was not available: '+logs)
    socket=new WebSocket(target.webSocketDebuggerUrl)
    await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject})
    let next=0
    const pending=new Map(),errors=[],network=[]
    socket.onmessage=event=>{
      const message=JSON.parse(event.data)
      if(message.method==='Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text)
      if(message.method==='Network.requestWillBeSent' && /^https?:/.test(message.params.request.url)) network.push(message.params.request.url)
      const promise=pending.get(message.id)
      if(promise){pending.delete(message.id);message.error?promise.reject(new Error(JSON.stringify(message.error))):promise.resolve(message.result)}
    }
    socket.onclose=()=>{for(const request of pending.values())request.reject(new Error('Packaged debugger closed: '+logs));pending.clear()}
    function send(method,params={}) {
      return new Promise((resolve,reject)=>{
        const id=++next
        const deadline=setTimeout(()=>{pending.delete(id);reject(new Error('CDP timeout: '+method+' '+logs))},20000)
        pending.set(id,{resolve:value=>{clearTimeout(deadline);resolve(value)},reject:error=>{clearTimeout(deadline);reject(error)}})
        socket.send(JSON.stringify({id,method,params}))
      })
    }
    async function evaluate(expression) {
      const response=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true})
      if(response.exceptionDetails) throw new Error(JSON.stringify(response.exceptionDetails))
      return response.result.value
    }
    async function wait(expression) {
      for(let i=0;i<150;i++){
        if(await evaluate(expression)) return
        await new Promise(resolve=>setTimeout(resolve,100))
      }
      throw new Error('Timed out: '+expression)
    }
    await send('Runtime.enable')
    await send('Network.enable')
    await wait('Boolean(window.netAgro && document.querySelector(".auth-form"))')
    console.log('Packaged auth form ready')
    assert.equal(await evaluate('typeof window.require'),'undefined')
    const denied=await evaluate('window.netAgro.getCoverage()')
    assert.deepEqual(denied,{ok:false,error:'AUTH_REQUIRED'})
    const info=await evaluate('window.netAgro.getAppInfo()')
    assert.equal(info.version,manifest.version)
    const registered=await evaluate('window.netAgro.register({username:"packaged-user",password:"packaged-pass-123"})')
    assert.equal(registered.ok,true)
    console.log('Packaged registration passed')
    await send('Page.reload')
    await wait('Boolean(document.querySelector(".stats-grid"))')
    console.log('Packaged dashboard ready')
    const actual=await evaluate('(async()=>{const r=await window.netAgro.getCoverage();if(!r.ok)throw new Error(r.error);return {period:r.data.metadata.period,centers:r.data.centers.length}})()')
    assert.equal(actual.period,expected.period)
    assert.equal(actual.centers,expected.centerCount)
    await evaluate('document.querySelector(\'a[href="#/map"]\').click()')
    await wait('document.querySelector(".coverage-map")?.dataset.rendered==="true"')
    console.log('Packaged map ready')
    await evaluate('document.querySelector(".map-toolbar .action-button").click()')
    await wait('document.querySelector(".territory-panel h2")?.textContent==="NARIÑO" && document.querySelector(".coverage-map")?.dataset.rendered==="true"')
    const analysis=await evaluate('window.netAgro.analyze({territoryId:"52",layer:"4G",locale:"es",online:false})')
    assert.equal(analysis.ok,true)
    assert.equal(analysis.data.provider,'rules')
    assert.ok(analysis.data.summary.includes('NARIÑO'))
    // Visual captures use webContents.capturePage in test:smoke; CDP cannot
    // capture this hidden native window reliably. Keep this test on behavior.
    await evaluate(`[...document.querySelectorAll('.territory-list button')].find(button => button.textContent === 'PASTO').click()`)
    await wait('document.querySelector(".territory-panel h2")?.textContent==="PASTO" && document.querySelector(".coverage-map")?.dataset.rendered==="true"')
    assert.equal(await evaluate('document.querySelectorAll(".breadcrumbs button").length'),3)
    await evaluate(`document.querySelector('.breadcrumbs button').click()`)
    await wait('document.querySelector(".territory-panel h2")?.textContent==="Colombia"')
    await evaluate(`(() => { const input=document.querySelector('.search-label input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'narino');input.dispatchEvent(new Event('input',{bubbles:true})); })()`)
    await wait('Boolean(document.querySelector(".search-results button"))')
    await evaluate(`[...document.querySelectorAll('.search-results button')].find(button => button.textContent.endsWith(' · 52')).click()`)
    await wait('document.querySelector(".territory-panel h2")?.textContent==="NARIÑO"')
    assert.equal((await evaluate('window.netAgro.logout()')).ok,true)
    assert.equal((await evaluate('window.netAgro.getMaps()')).error,'AUTH_REQUIRED')
    assert.deepEqual(errors,[])
    assert.deepEqual(network,[])
    const result={passed:true,executable,version:info.version,period:actual.period,centers:actual.centers,checks:['packaged ASAR startup','bundled official data integrity','session isolation','local registration','offline MapLibre worker','Narino navigation','municipality and breadcrumbs','accent-insensitive territory search','offline diagnosis','logout blocks data','no renderer exceptions','no HTTP requests from renderer']}
    writeFileSync(path.join(output,'packaged-smoke.json'),JSON.stringify(result,null,2))
    console.log(JSON.stringify(result,null,2))
  } finally {
    clearTimeout(timeout)
    if(socket) socket.close()
    child.kill()
  }
}
run().catch(error=>{console.error(error);process.exitCode=1})
