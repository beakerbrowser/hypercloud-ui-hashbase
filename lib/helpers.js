exports.pluralize = function (num, base, suffix = 's') {
  if (num === 1) {
    return base
  }
  return base + suffix
}

exports.makeSafe = function (str) {
  return str.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/&/g, '&amp;').replace(/"/g, '')
}

exports.ucfirst = function (str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
