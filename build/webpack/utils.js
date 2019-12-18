module.exports = {
  hasArgument: function(name) {
    for (const it of process.argv) {
      if (it === `-${name}`) {
        return true;
      }
    }
    return false;
  }
}