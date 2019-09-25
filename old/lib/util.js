/* global __ */

exports.epochToTimeFormatter = function (epoch) {
  if (epoch == null) {
    epoch = new Date().getTime()
  }
  return (new Date(epoch)).toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, '$1')
}
