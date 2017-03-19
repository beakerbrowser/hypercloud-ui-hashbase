const {DAT_KEY_REGEX, NotFoundError} = require('../const')

class UsersAPI {
  constructor ({cloud, config}) {
    this.cloud = cloud
    this.config = config
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
    const findFn = (DAT_KEY_REGEX.test(archivename))
      ? a => a.key === archivename
      : a => a.name === archivename
    var archive = userRecord.archives.find(findFn)
    if (!archive) throw new NotFoundError()

    var progress = await this.cloud.api.archives._getArchiveProgress(archive.key)
    var {session} = res.locals
    res.render('archive', {
      username,
      key: archive.key,
      archivename,
      progress: (progress * 100) | 0,
      isOwner: session && session.id === userRecord.id
    })
  }

  async viewUser (req, res) {
    console.log(req.params)
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

module.exports = UsersAPI

