const { app, BrowserWindow } = require('electron')
const { spawn } = require('child_process')
const path = require('path')
const http = require('http')
const fs = require('fs')

let mainWindow

function log(msg) {
  fs.appendFileSync(path.join(app.getPath('desktop'), 'app.log'), msg + '\n')
}

function waitForReact(url, callback) {
  http.get(url, (res) => {
    callback()
  }).on('error', () => {
    setTimeout(() => waitForReact(url, callback), 1000)
  })
}

function createWindow() {
  const rootDir = 'D:\\copy-fyp-git\\fyp-new-27-02-26\\fyp'

  log('▶️ Starting Flask...')
  const flask = spawn('python', ['run.py'], {
    cwd: path.join(rootDir, 'backend'),
    shell: true,
    stdio: 'pipe'
  })
  flask.stdout.on('data', (d) => log('Flask: ' + d))
  flask.stderr.on('data', (d) => log('Flask ERROR: ' + d))
  flask.on('error', (e) => log('Flask failed: ' + e.message))

  log('▶️ Starting React...')
  const react = spawn('C:\\Windows\\System32\\cmd.exe', ['/c', 'npm start'], {
    cwd: path.join(rootDir, 'frontend', 'helmet_frontend'),
    env: { ...process.env, BROWSER: 'none' }, // ✅ Fixed!
    stdio: 'pipe'
  })
  react.stdout.on('data', (d) => log('React: ' + d))
  react.stderr.on('data', (d) => log('React ERROR: ' + d))
  react.on('error', (e) => log('React failed: ' + e.message))

  log('⏳ Waiting for React...')

  waitForReact('http://localhost:3000', () => {
    log('✅ Opening window!')

    mainWindow = new BrowserWindow({
      width: 1280,
      height: 800,
      webPreferences: {
        nodeIntegration: true
      }
    })

    mainWindow.loadURL('http://localhost:3000')
    mainWindow.on('closed', () => { mainWindow = null })
  })
}

app.on('ready', createWindow)
app.on('window-all-closed', () => app.quit())