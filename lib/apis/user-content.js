const {NotFoundError} = require('../const')

class UserContentAPI {
  constructor (cloud, hashbase) {
    this.cloud = cloud
    this.config = cloud.config
  }

  async viewArchive (req, res) {
    // validate & sanitize input
    req.checkParams('username').isAlphanumeric().isLength({ min: 3, max: 16 })
    req.checkParams('archivename').isDatName().isLength({ min: 3, max: 64 })
    ;(await req.getValidationResult()).throw()
    var {username, archivename} = req.params

    // lookup user
    var userRecord = await this.cloud.usersDB.getByUsername(username)
    if (!userRecord) throw new NotFoundError()

    // lookup archive
    var archive = userRecord.archives.find(a => a.name === archivename)
    if (!archive) throw new NotFoundError()

    // figure out url
    var niceUrl = archivename === username
      ? `${username}.${this.config.hostname}/`
      : `${archivename}.${username}.${this.config.hostname}/`

    var progress = await this.cloud.api.archives._getArchiveProgress(archive.key)
    var {session} = res.locals
    res.render('archive', {
      username,
      key: archive.key,
      archivename,
      niceUrl,
      rawUrl: `dat://${archive.key}/`,
      progress: (progress * 100) | 0,
      isOwner: session && session.id === userRecord.id
    })
  }

  async viewUser (req, res) {
    // validate & sanitize input
    req.checkParams('username').isAlphanumeric().isLength({ min: 3, max: 16 })
    ;(await req.getValidationResult()).throw()
    var {username} = req.params

    // lookup user
    var userRecord = await this.cloud.usersDB.getByUsername(username)
    if (!userRecord) throw new NotFoundError()

    res.render('user', {userRecord})
  }
}

module.exports = UserContentAPI

