function random() {
    let value = ""
    let char = 'abcdefghijklmnopqrstuvwxyz1234567890'
    for (let i = 0; i < 32; i++) {
        value += char[Math.floor(Math.random() * char.length - .5)]
    }
    return value
}
module.exports = random