
let pendingFile = null

export function setImageSearchFile(file) {
  pendingFile = file
}

export function getImageSearchFile() {
  return pendingFile
}

export function clearImageSearchFile() {
  pendingFile = null
}
