'use strict'

import EventEmitter from 'events'
import { decode as b58Decode } from 'bs58'
import Y from 'yjs'

import parseKeys from './keys/parse'
import authToken from './auth-token'
import CRDT from './crdt'
import Auth from './auth'
import { generateSymmetrical as generateSymmetricalKey } from './keys'

class Backend extends EventEmitter {
  constructor (options) {
    super()
    this._options = options
    this.room = new EventEmitter()
    this.ipfs = options.ipfs
    this.keys = {
      generateSymmetrical: generateSymmetricalKey
    }
  }

  async start () {
    const options = this._options
    // Keys
    this._keys = await parseKeys(b58Decode(options.readKey), options.writeKey && b58Decode(options.writeKey))

    // if IPFS node is not online yet, delay the start until it is
    if (!this.ipfs.isOnline()) {
      await (new Promise((resolve, reject) => {
        this.ipfs.once('ready', () => resolve())
      }))
    }

    const token = await authToken(this.ipfs, this._keys)
    this.auth = Auth(this._keys, this.room)
    this.crdt = await CRDT(this._options.name, token, this._keys, this.ipfs, this.room, this.auth)
    this.crdt.share.access.observeDeep(this.auth.observer())

    this.auth.on('change', (peerId, newCapabilities) => {
      let capabilities = this.crdt.share.access.get(peerId)
      if (!capabilities) {
        this.crdt.share.access.set(peerId, Y.Map)
        capabilities = this.crdt.share.access.get(peerId)
      }
      if (newCapabilities) {
        Object.keys(newCapabilities).forEach((capabilityName, hasPermission) => {
          if (capabilities.get(capabilityName) !== newCapabilities[capabilityName]) {
            capabilities.set(capabilityName, hasPermission)
          }
        })
      } else {
        capabilities.delete(peerId)
      }
    })

    this.emit('started')
  }

  stop () {
    this.crdt.share.access.unobserve(this._observer)
    this._observer = null
  }
}

export default Backend
