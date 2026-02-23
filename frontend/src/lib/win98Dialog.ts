function createDialogShell(title: string, body: string) {
  const overlay = document.createElement('div')
  overlay.style.position = 'fixed'
  overlay.style.inset = '0'
  overlay.style.background = 'rgba(0,0,0,0.45)'
  overlay.style.display = 'flex'
  overlay.style.alignItems = 'center'
  overlay.style.justifyContent = 'center'
  overlay.style.zIndex = '9999'
  overlay.style.padding = '16px'

  const dialog = document.createElement('div')
  dialog.className = 'win-window'
  dialog.style.width = '100%'
  dialog.style.maxWidth = '420px'

  dialog.innerHTML = `
    <div class="win-titlebar">
      <div class="win-title">
        <span class="win-title-icon"></span>
        <span>${title}</span>
      </div>
      <div class="win-controls">
        <button type="button" class="win-control-btn" data-close="1">X</button>
      </div>
    </div>
    <div class="p-3">
      <div class="win-inset p-3" style="display:flex;gap:10px;align-items:flex-start;">
        <div style="width:24px;height:24px;border:1px solid #000;background:#ffffe1;display:flex;align-items:center;justify-content:center;font-weight:700;">!</div>
        <div style="font-size:12px;line-height:1.3">${body}</div>
      </div>
      <div class="mt-3 flex justify-end gap-2" data-actions="1"></div>
    </div>
  `

  overlay.appendChild(dialog)
  document.body.appendChild(overlay)
  return { overlay, dialog }
}

export function confirmWin98(message: string, title = 'Confirmacion'): Promise<boolean> {
  return new Promise((resolve) => {
    const { overlay, dialog } = createDialogShell(title, message)
    const actions = dialog.querySelector('[data-actions="1"]') as HTMLDivElement
    const closeBtn = dialog.querySelector('[data-close="1"]') as HTMLButtonElement
    const accept = document.createElement('button')
    const cancel = document.createElement('button')

    accept.className = 'win-btn'
    cancel.className = 'win-btn'
    accept.textContent = 'Aceptar'
    cancel.textContent = 'Cancelar'
    actions.appendChild(cancel)
    actions.appendChild(accept)

    const cleanup = (value: boolean) => {
      overlay.remove()
      resolve(value)
    }

    accept.onclick = () => cleanup(true)
    cancel.onclick = () => cleanup(false)
    closeBtn.onclick = () => cleanup(false)
    overlay.onclick = (e) => {
      if (e.target === overlay) cleanup(false)
    }
  })
}

export function alertWin98(message: string, title = 'Aviso'): Promise<void> {
  return new Promise((resolve) => {
    const { overlay, dialog } = createDialogShell(title, message)
    const actions = dialog.querySelector('[data-actions="1"]') as HTMLDivElement
    const closeBtn = dialog.querySelector('[data-close="1"]') as HTMLButtonElement
    const ok = document.createElement('button')
    ok.className = 'win-btn'
    ok.textContent = 'Aceptar'
    actions.appendChild(ok)

    const cleanup = () => {
      overlay.remove()
      resolve()
    }

    ok.onclick = cleanup
    closeBtn.onclick = cleanup
    overlay.onclick = (e) => {
      if (e.target === overlay) cleanup()
    }
  })
}
