const input = document.getElementById('input')
const source = document.getElementById('source')
const target = document.getElementById('target')
const output = document.getElementById('output')
const translateButton = document.getElementById('translate')
const swapButton = document.getElementById('swap')
const clearButton = document.getElementById('clear')
const copyButton = document.getElementById('copy')
const statusText = document.getElementById('status')
const charCount = document.getElementById('charCount')
const languagePair = document.getElementById('languagePair')

const languageNames = {
  en: 'English',
  fr: 'French',
  am: 'Amharic',
  ti: 'Tigrinya',
  es: 'Spanish',
}

function setOutput(message, state = 'empty') {
  output.textContent = message
  output.dataset.state = state
  output.classList.toggle('empty', state === 'empty')
}

function updateMeta() {
  const length = input.value.length
  charCount.textContent = `${length} character${length === 1 ? '' : 's'}`
  languagePair.textContent = `${languageNames[source.value]} to ${languageNames[target.value]}`
}

async function translateTxt() {
  const text = input.value.trim()

  if (!text) {
    setOutput('Give me a sentence first.', 'error')
    statusText.textContent = 'Waiting'
    input.focus()
    return
  }

  if (source.value === target.value) {
    setOutput(text, 'ready')
    statusText.textContent = 'Same language'
    return
  }

  translateButton.disabled = true
  statusText.textContent = 'Translating'
  setOutput('Working on it...', 'loading')

  try {
    const url = new URL('https://api.mymemory.translated.net/get')
    url.searchParams.set('q', text)
    url.searchParams.set('langpair', `${source.value}|${target.value}`)

    const res = await fetch(url)

    if (!res.ok) {
      throw new Error(`Translation request failed with status ${res.status}`)
    }

    const data = await res.json()
    const translatedText = data?.responseData?.translatedText

    if (!translatedText) {
      throw new Error('No translated text returned')
    }

    setOutput(translatedText, 'ready')
    statusText.textContent = 'Done'
  } catch (error) {
    console.error(error)
    setOutput('The translation service did not answer cleanly. Try again in a moment.', 'error')
    statusText.textContent = 'Error'
  } finally {
    translateButton.disabled = false
  }
}

function clearText() {
  input.value = ''
  setOutput('Your translation will appear here.', 'empty')
  statusText.textContent = 'Ready'
  updateMeta()
  input.focus()
}

function swapLanguages() {
  const previousSource = source.value
  source.value = target.value
  target.value = previousSource

  if (output.dataset.state === 'ready') {
    const previousInput = input.value
    input.value = output.textContent
    setOutput(previousInput || 'Your translation will appear here.', previousInput ? 'ready' : 'empty')
  }

  updateMeta()
}

async function copyTranslation() {
  const text = output.dataset.state === 'ready' ? output.textContent : ''

  if (!text) {
    statusText.textContent = 'Nothing to copy'
    return
  }

  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const fallback = document.createElement('textarea')
    fallback.value = text
    fallback.style.position = 'fixed'
    fallback.style.opacity = '0'
    document.body.appendChild(fallback)
    fallback.select()
    document.execCommand('copy')
    fallback.remove()
  }

  statusText.textContent = 'Copied'
}

translateButton.addEventListener('click', translateTxt)
swapButton.addEventListener('click', swapLanguages)
clearButton.addEventListener('click', clearText)
copyButton.addEventListener('click', copyTranslation)
input.addEventListener('input', updateMeta)
source.addEventListener('change', updateMeta)
target.addEventListener('change', updateMeta)

input.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    translateTxt()
  }
})

updateMeta()
