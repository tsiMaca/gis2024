export function randomDouble() {
  return Math.random()
}

export function randomString(length) {
  const caracteres =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let resultado = ""
  for (let i = 0; i < length; i++) {
    const indice = Math.floor(Math.random() * caracteres.length)
    resultado += caracteres[indice]
  }
  return resultado
}
