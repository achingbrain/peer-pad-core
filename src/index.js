'use strict'

import EventEmitter from 'events'

import generateRandomKeys from './backend/keys/generate'
import parseSymmetricalKey from './backend/keys/parse-symm-key'

import Backend from './backend'
import Auth from './auth'
import Access from './access'
import Peers from './peers'
import Network from './network'
import Document from './document'
import History from './history'
import Attachments from './attachments'
import Snapshots from './snapshots'

const TYPES = ['markdown', 'richtext']

export default createPeerpad
export { generateRandomKeys, parseSymmetricalKey }

class Peerpad extends EventEmitter {
  constructor (options) {
    super()

    validateOptions(options)

    const backend = this._backend = new Backend(options)

    this.auth = new Auth(options, backend)
    this.access = new Access(options, backend)
    this.peers = new Peers(options, backend)
    this.network = new Network(options, backend)
    this.document = new Document(options, backend)
    this.history = new History(options, backend)
    this.attachments = new Attachments(options, backend)
    this.snapshots = new Snapshots(options, backend)
  }

  async start () {
    await this._backend.start()
    this.emit('started')
  }
}

function createPeerpad (options) {
  return new Peerpad(options)
}

function validateOptions (options) {
  if (!options) {
    throw new Error('peerpad needs options')
  }

  if (!options.name) {
    throw new Error('peerpad needs name')
  }

  if (!options.type) {
    throw new Error('peerpad needs type')
  }

  if (TYPES.indexOf(options.type) < 0) {
    throw new Error('unknown peerpad type: ' + options.type)
  }

  if (!options.readKey) {
    throw new Error('peerpad needs a read key')
  }

  if (!options.docViewer) {
    throw new Error('peerpad needs a doc viewer react component class')
  }
}
